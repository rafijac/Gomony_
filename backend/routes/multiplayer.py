"""Multiplayer, reconnect, and spectate endpoints."""
import uuid
import logging
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from models import JoinGameRequest, SessionMoveRequest
from board import get_jumps_from, get_all_jumps, apply_move, player_side_label
from end_state import get_end_state
from game_session import GameSession, sessions
from session_token_helpers import create_session_token, validate_session_token
from shared.validate_move import validate_move

router = APIRouter()
logger = logging.getLogger("gomony")


@router.post("/game/create")
async def create_game(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    display_name = data.get("display_name") if data else None
    avatar_url = data.get("avatar_url") if data else None
    game_id = str(uuid.uuid4())[:8]
    session = GameSession(game_id)
    # Set player 1 info if provided
    session.player_info[1] = {
        "display_name": display_name or "Player 1",
        "avatar_url": avatar_url or "/assets/avatars/avatar1.png"
    }
    sessions[game_id] = session
    logger.info(f"Game created: {game_id}")
    d = session.to_dict(player_number=1)
    d["player"] = 1
    d["session_token"] = session.session_tokens[1]
    return d


@router.post("/game/join")
async def join_game(request: Request):
    data = await request.json()
    game_id = data.get("game_id")
    display_name = data.get("display_name")
    avatar_url = data.get("avatar_url")
    session = sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            return JSONResponse(status_code=410, content={"error": "Game is completed or abandoned"})
        if len(session.players) >= 2:
            return JSONResponse(status_code=409, content={"error": "Game is full"})
        token = session.add_player(2, display_name=display_name, avatar_url=avatar_url)
        logger.info(f"Player 2 joined game: {game_id}")
    d = session.to_dict(player_number=2)
    d["player"] = 2
    d["session_token"] = token
    return d


@router.get("/game/{game_id}/state")
async def game_state(game_id: str):
    session = sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    player_number = 1 if 1 in session.players else None
    d = session.to_dict(player_number=player_number)
    # Always expose end-state fields using centralized logic
    d.update(get_end_state(session.board))
    return d


@router.post("/game/{game_id}/move")
async def game_move(game_id: str, body: SessionMoveRequest):
    session = sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            return JSONResponse(status_code=410, content={"error": "Game is over"})
        if not body.session_token:
            return JSONResponse(status_code=401, content={"error": "Session token required"})
        if not validate_session_token(body.session_token):
            return JSONResponse(status_code=401, content={"error": "Session token expired"})
        token_player = session.get_player_by_token(body.session_token)
        if token_player is None:
            return JSONResponse(status_code=401, content={"error": "Invalid session token"})
        if token_player != body.player:
            return JSONResponse(status_code=401, content={"error": "Token does not match player"})
        if len(session.players) < 2:
            return JSONResponse(status_code=403, content={"error": "Waiting for another player to join."})
        if body.player != session.current_player:
            return JSONResponse(status_code=403, content={"error": "Not your turn"})

        board = session.board
        sr, sc = body.start_pos
        er, ec = body.end_pos
        start_stack = board[sr][sc]
        if not start_stack:
            return JSONResponse(status_code=400, content={"error": "No stack at start position"})
        moving_piece = start_stack[-1]
        own = (1, 3) if body.player == 1 else (2, 4)
        if moving_piece not in own:
            return JSONResponse(status_code=400, content={"error": "You must move your own piece."})

        is_jump = abs(er - sr) == 2
        pending = session.pending_jump
        side = player_side_label(body.player)
        if pending:
            if [sr, sc] != pending:
                return JSONResponse(status_code=400, content={"error": f"{side} must continue jumping with the highlighted piece."})
            if not is_jump:
                return JSONResponse(status_code=400, content={"error": f"{side} must continue jumping."})
        elif not is_jump and get_all_jumps(board, body.player):
            return JSONResponse(status_code=400, content={"error": f"A jump is available — {side} must jump."})

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            return JSONResponse(status_code=400, content={"error": reason})

        apply_move(board, sr, sc, er, ec, kinged)
        logger.info(f"Move in game {game_id}: player {body.player} {sr},{sc}->{er},{ec}")

        if is_jump and not kinged and get_jumps_from(board, (er, ec)):
            session.pending_jump = [er, ec]
            resp = {"valid": True, "reason": "Jump! Keep jumping."}
            resp.update(session.to_dict(body.player))
            return resp

        session.pending_jump = None
        session.current_player = 2 if body.player == 1 else 1
        session.move_count += 1

        # Always check and expose end-state using centralized logic
        end_state = get_end_state(session.board)
        if end_state["game_over"]:
            session.completed = True
            session.end_state = end_state
            logger.info(f"Game {game_id} completed. Winner: Player {end_state['winner']}")
        resp = {"valid": True, "reason": reason}
        resp.update(session.to_dict(body.player))
        resp.update(end_state)
        return resp


@router.post("/game/cleanup")
async def game_cleanup():
    to_remove = [gid for gid, s in sessions.items() if s.completed]
    for gid in to_remove:
        del sessions[gid]
    logger.info(f"Session cleanup: {len(to_remove)} sessions removed.")
    return {"removed": len(to_remove)}


@router.post("/game/reconnect")
async def game_reconnect(request: Request):
    data = await request.json()
    game_id = data.get("game_id")
    player_number = data.get("player_number")
    session = sessions.get(game_id)
    if not session or player_number not in session.players:
        return JSONResponse(status_code=404, content={"error": "Game or player not found"})
    with session.lock:
        token = create_session_token()
        session.session_tokens[player_number] = token
    d = session.to_dict(player_number=player_number)
    d["session_token"] = token
    return d


@router.get("/game/spectate/{game_id}")
async def spectate_game(game_id: str):
    session = sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    d = session.to_dict()
    d["read_only"] = True
    d.pop("session_token", None)
    return d
