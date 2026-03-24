# ── Version/Diagnostics Endpoint ─────────────────────────────────────────────
import subprocess
import os


# Session token helpers for TDD
from session_token_helpers import create_session_token, validate_session_token, expire_session_token
# Gomony FastAPI backend
#
# Endpoints:
#   GET  /health
#   GET  /state
#   POST /reset
#   POST /move
#   POST /move/pc          - AI move for current player
#   POST /game/create      - Create a new multiplayer session
#   POST /game/join        - Join an existing session as player 2
#   GET  /game/{game_id}/state
#   POST /game/{game_id}/move
#   POST /game/cleanup     - Remove abandoned/completed sessions


import copy
import secrets
import uuid
import threading
import logging
from typing import Dict, List, Optional


from dotenv import load_dotenv
load_dotenv()

# ── Diagnostics/Logging Setup ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("gomony")

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from shared.validate_move import validate_move
from shared.ai import choose_ai_move

# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/version")
async def version_info():
    try:
        commit = subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=os.path.dirname(__file__)).decode().strip()
    except Exception:
        commit = "unknown"
    return {
        "version": "1.0.0",
        "commit": commit,
        "status": "ok"
    }

# ── Board helpers ──────────────────────────────────────────────────────────────

def make_initial_board() -> List[List[List[int]]]:
    board: List[List[List[int]]] = [[[] for _ in range(12)] for _ in range(12)]
    for row in range(4):
        for col in range(12):
            if (row + col) % 2 == 1:
                board[row][col] = [1]
    for row in range(8, 12):
        for col in range(12):
            if (row + col) % 2 == 1:
                board[row][col] = [2]
    return board


def _get_jumps_from(board, pos):
    r, c = pos
    result = []
    for dr, dc in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < 12 and 0 <= nc < 12:
            valid, _, _ = validate_move(board, (r, c), (nr, nc))
            if valid:
                result.append((nr, nc))
    return result


def _get_all_jumps(board, player):
    own = (1, 3) if player == 1 else (2, 4)
    for r in range(12):
        for c in range(12):
            stack = board[r][c]
            if stack and stack[-1] in own:
                if _get_jumps_from(board, (r, c)):
                    return True
    return False


def _apply_move(board, sr, sc, er, ec, kinged):
    dr, dc = er - sr, ec - sc
    if abs(dr) == 2:
        mr, mc = sr + dr // 2, sc + dc // 2
        captured_top = board[mr][mc].pop()
        moving_stack = board[sr][sc][:]
        new_stack = [captured_top] + moving_stack
        board[er][ec] = new_stack
        board[sr][sc] = []
    else:
        board[er][ec] = board[sr][sc][:]
        board[sr][sc] = []
    if kinged:
        top = board[er][ec][-1] if board[er][ec] else None
        if top == 1:
            board[er][ec][-1] = 3
        elif top == 2:
            board[er][ec][-1] = 4

# ── Single-player state ────────────────────────────────────────────────────────

_state: dict = {
    "board": make_initial_board(),
    "current_player": 1,
    "move_count": 0,
    "pending_jump": None,
}

# ── Multiplayer session model ──────────────────────────────────────────────────

class GameSession:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.board = make_initial_board()
        self.current_player = 1
        self.move_count = 0
        self.pending_jump = None
        self.players = [1]
        self.completed = False
        self.lock = threading.Lock()
        # Session tokens: {player_number: token}
        self.session_tokens: Dict[int, str] = {1: create_session_token()}
        # Orientation: player 1 sees board "south" (their pieces at bottom)
        self.orientations: Dict[int, str] = {1: "south"}

    def add_player(self, player_number: int) -> str:
        self.players.append(player_number)
        token = create_session_token()
        self.session_tokens[player_number] = token
        self.orientations[player_number] = "north" if player_number == 2 else "south"
        return token

    def get_player_by_token(self, token: str) -> Optional[int]:
        for num, tok in self.session_tokens.items():
            if secrets.compare_digest(tok, token):
                return num
        return None

    def to_dict(self, player_number: Optional[int] = None):
        color_map = {1: "white", 2: "brown"}
        starting_color = color_map[1]
        d = {
            "game_id": self.game_id,
            "board": self.board,
            "current_player": self.current_player,
            "move_count": self.move_count,
            "pending_jump": self.pending_jump,
            "current_turn_color": color_map.get(self.current_player, None),
            "starting_color": starting_color,
        }
        if player_number:
            d["player_number"] = player_number
            d["orientation"] = self.orientations.get(player_number)
            d["your_color"] = color_map.get(player_number, None)
        return d

_sessions: Dict[str, GameSession] = {}

# ── Request models ─────────────────────────────────────────────────────────────

class MoveRequest(BaseModel):
    current_state: Optional[List[List[List[int]]]] = None
    start_pos: List[int]
    end_pos: List[int]

class AIMoveRequest(BaseModel):
    depth: Optional[int] = 2

class JoinGameRequest(BaseModel):
    game_id: str

class SessionMoveRequest(BaseModel):
    start_pos: List[int]
    end_pos: List[int]
    player: int
    session_token: Optional[str] = None

# ── Single-player endpoints ────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/state")
async def get_state():
    return {
        "board": _state["board"],
        "current_player": _state["current_player"],
        "move_count": _state["move_count"],
        "pending_jump": _state.get("pending_jump"),
    }


@app.post("/reset")
async def reset():
    _state["board"] = make_initial_board()
    _state["current_player"] = 1
    _state["move_count"] = 0
    _state["pending_jump"] = None
    return {
        "board": _state["board"],
        "current_player": _state["current_player"],
        "move_count": _state["move_count"],
        "pending_jump": None,
    }


from fastapi.responses import JSONResponse

@app.post("/move")
async def move_endpoint(body: MoveRequest):
    board = _state["board"]
    sr, sc = body.start_pos
    er, ec = body.end_pos
    current_player = _state["current_player"]
    pending = _state.get("pending_jump")

    start_stack = board[sr][sc]
    if not start_stack:
        return JSONResponse(status_code=400, content={"error": "No stack at start position", "valid": False, "pending_jump": pending})
    moving_piece = start_stack[-1]

    if current_player == 1 and moving_piece not in (1, 3):
        return JSONResponse(status_code=403, content={"error": "It's Player 1's turn. You must move your own piece.", "valid": False, "pending_jump": pending})
    if current_player == 2 and moving_piece not in (2, 4):
        return JSONResponse(status_code=403, content={"error": "It's Player 2's turn. You must move your own piece.", "valid": False, "pending_jump": pending})

    dr, dc = er - sr, ec - sc
    is_jump = abs(dr) == 2

    if pending:
        if [sr, sc] != pending:
            return JSONResponse(status_code=400, content={"error": "You must continue jumping with the highlighted piece.", "valid": False, "pending_jump": pending})
        if not is_jump:
            return JSONResponse(status_code=400, content={"error": "You must continue jumping.", "valid": False, "pending_jump": pending})
    else:
        if not is_jump and _get_all_jumps(board, current_player):
            return JSONResponse(status_code=400, content={"error": "A jump is available — you must jump.", "valid": False, "pending_jump": None})

    valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
    if not valid:
        return JSONResponse(status_code=400, content={"error": reason, "valid": False, "pending_jump": pending})

    _apply_move(board, sr, sc, er, ec, kinged)

    if is_jump and not kinged:
        more_jumps = _get_jumps_from(board, (er, ec))
        if more_jumps:
            _state["pending_jump"] = [er, ec]
            return {
                "valid": True,
                "reason": "Jump! Keep jumping.",
                "board": _state["board"],
                "current_player": _state["current_player"],
                "pending_jump": _state["pending_jump"],
            }

    _state["pending_jump"] = None
    _state["current_player"] = 2 if current_player == 1 else 1
    _state["move_count"] += 1
    return {
        "valid": True,
        "reason": reason,
        "board": _state["board"],
        "current_player": _state["current_player"],
        "pending_jump": None,
    }


@app.post("/move/pc", tags=["AI"], summary="Make an AI move for the current player")
async def move_pc_endpoint(body: AIMoveRequest = Body(default=None)):
    board = _state["board"]
    player = _state["current_player"]
    depth = body.depth if body else 2

    own = (1, 3) if player == 1 else (2, 4)
    opp = (2, 4) if player == 1 else (1, 3)
    if not any(cell[-1] in own for row in board for cell in row if cell):
        return JSONResponse(status_code=410, content={"error": "Game over: no pieces for current player", "valid": False, "board": board, "current_player": player, "pending_jump": None})
    if not any(cell[-1] in opp for row in board for cell in row if cell):
        return JSONResponse(status_code=410, content={"error": "Game over: opponent has no pieces", "valid": False, "board": board, "current_player": player, "pending_jump": None})

    moves_made = []

    while True:
        board = _state["board"]
        pending = _state.get("pending_jump")

        if pending:
            jumps = _get_jumps_from(board, tuple(pending))
            if not jumps:
                _state["pending_jump"] = None
                _state["current_player"] = 2 if _state["current_player"] == 1 else 1
                _state["move_count"] += 1
                break
            er, ec = jumps[0]
            sr, sc = pending[0], pending[1]
        else:
            move = choose_ai_move(board, player, depth)
            if not move:
                if not moves_made:
                    return JSONResponse(status_code=400, content={"error": "No valid moves for AI", "valid": False, "board": board, "current_player": player, "pending_jump": None})
                break
            sr, sc = move[0]
            er, ec = move[1]

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            if not moves_made:
                return JSONResponse(status_code=400, content={"error": reason, "valid": False, "board": board, "current_player": player, "pending_jump": None})
            break

        is_jump = abs(er - sr) == 2
        _apply_move(board, sr, sc, er, ec, kinged)
        moves_made.append({"start_pos": [sr, sc], "end_pos": [er, ec]})

        if is_jump and not kinged:
            more_jumps = _get_jumps_from(board, (er, ec))
            if more_jumps:
                _state["pending_jump"] = [er, ec]
                continue

        _state["pending_jump"] = None
        _state["current_player"] = 2 if _state["current_player"] == 1 else 1
        _state["move_count"] += 1
        break

    response = {
        "valid": True,
        "reason": "AI moved",
        "moves": moves_made,
        "board": _state["board"],
        "current_player": _state["current_player"],
        "pending_jump": _state.get("pending_jump"),
        "move": moves_made[0] if moves_made else None,
    }
    return response

# ── Multiplayer endpoints ──────────────────────────────────────────────────────

@app.post("/game/create")
async def create_game():
    game_id = str(uuid.uuid4())[:8]
    session = GameSession(game_id)
    _sessions[game_id] = session
    logger.info(f"Game created: {game_id}")
    # Always include orientation and color fields for player 1
    d = session.to_dict(player_number=1)
    d["game_id"] = game_id
    d["player"] = 1
    d["player_number"] = 1
    d["session_token"] = session.session_tokens[1]
    return d


@app.post("/game/join")
async def join_game(body: JoinGameRequest):
    session = _sessions.get(body.game_id)
    if not session:
        logger.warning(f"Join attempt failed: Game {body.game_id} not found.")
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            logger.info(f"Join attempt: Game {body.game_id} is completed or abandoned.")
            return JSONResponse(status_code=410, content={"error": "Game is completed or abandoned"})
        if len(session.players) >= 2:
            logger.info(f"Join attempt: Game {body.game_id} is full.")
            return JSONResponse(status_code=409, content={"error": "Game is full"})
        token = session.add_player(2)
        logger.info(f"Player 2 joined game: {body.game_id}")
    # Always include orientation and color fields for player 2
    d = session.to_dict(player_number=2)
    d["game_id"] = body.game_id
    d["player"] = 2
    d["player_number"] = 2
    d["session_token"] = token
    return d


@app.get("/game/{game_id}/state")
async def game_state(game_id: str):
    session = _sessions.get(game_id)
    if not session:
        logger.warning(f"Game state fetch failed: Game {game_id} not found.")
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    # Try to infer player_number from query param or session (not available in GET)
    # For now, just return state for player 1 if joined, else no player context
    player_number = 1 if 1 in session.players else None
    d = session.to_dict(player_number=player_number)
    return d


@app.post("/game/{game_id}/move")
async def game_move(game_id: str, body: SessionMoveRequest):
    session = _sessions.get(game_id)
    if not session:
        logger.warning(f"Move attempt failed: Game {game_id} not found.")
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            logger.info(f"Move attempt: Game {game_id} is over.")
            return JSONResponse(status_code=410, content={"error": "Game is over"})
        # Validate session token
        if not body.session_token:
            logger.warning(f"Move attempt: Session token required for game {game_id}.")
            return JSONResponse(status_code=401, content={"error": "Session token required"})
        # Check for expiration using validate_session_token
        if not validate_session_token(body.session_token):
            logger.warning(f"Move attempt: Expired session token for game {game_id}.")
            return JSONResponse(status_code=401, content={"error": "Session token expired"})
        token_player = session.get_player_by_token(body.session_token)
        if token_player is None:
            logger.warning(f"Move attempt: Invalid session token for game {game_id}.")
            return JSONResponse(status_code=401, content={"error": "Invalid session token"})
        if token_player != body.player:
            logger.warning(f"Move attempt: Token does not match player for game {game_id}.")
            return JSONResponse(status_code=401, content={"error": "Token does not match player"})
        # Check if both players have joined
        if len(session.players) < 2:
            logger.info(f"Move attempt: Waiting for another player to join in game {game_id}.")
            return JSONResponse(status_code=403, content={"error": "Waiting for another player to join."})
        if body.player != session.current_player:
            logger.info(f"Move attempt: Not your turn in game {game_id}.")
            return JSONResponse(status_code=403, content={"error": "Not your turn"})

        board = session.board
        sr, sc = body.start_pos
        er, ec = body.end_pos

        start_stack = board[sr][sc]
        if not start_stack:
            logger.info(f"Move attempt: No stack at start position in game {game_id}.")
            return JSONResponse(status_code=400, content={"error": "No stack at start position"})
        moving_piece = start_stack[-1]

        own = (1, 3) if body.player == 1 else (2, 4)
        if moving_piece not in own:
            logger.info(f"Move attempt: You must move your own piece in game {game_id}.")
            return JSONResponse(status_code=400, content={"error": "You must move your own piece."})

        dr, dc = er - sr, ec - sc
        is_jump = abs(dr) == 2
        pending = session.pending_jump

        if pending:
            if [sr, sc] != pending:
                logger.info(f"Move attempt: Must continue jumping with highlighted piece in game {game_id}.")
                return JSONResponse(status_code=400, content={"error": "You must continue jumping with the highlighted piece."})
            if not is_jump:
                logger.info(f"Move attempt: Must continue jumping in game {game_id}.")
                return JSONResponse(status_code=400, content={"error": "You must continue jumping."})
        else:
            if not is_jump and _get_all_jumps(board, body.player):
                logger.info(f"Move attempt: Jump available, must jump in game {game_id}.")
                return JSONResponse(status_code=400, content={"error": "A jump is available — you must jump."})

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            logger.info(f"Move attempt: Invalid move in game {game_id}: {reason}")
            return JSONResponse(status_code=400, content={"error": reason})

        _apply_move(board, sr, sc, er, ec, kinged)
        logger.info(f"Move made in game {game_id}: {body.player} {sr},{sc}->{er},{ec}")

        if is_jump and not kinged:
            more_jumps = _get_jumps_from(board, (er, ec))
            if more_jumps:
                session.pending_jump = [er, ec]
                resp = {"valid": True, "reason": "Jump! Keep jumping."}
                resp.update(session.to_dict(body.player))
                return resp

        session.pending_jump = None
        session.current_player = 2 if body.player == 1 else 1
        session.move_count += 1

        # Check win: opponent has no pieces
        opp = (2, 4) if body.player == 1 else (1, 3)
        if not any(cell[-1] in opp for row in board for cell in row if cell):
            session.completed = True
            logger.info(f"Game {game_id} completed. Winner: Player {body.player}")

        resp = {"valid": True, "reason": reason}
        resp.update(session.to_dict(body.player))
        return resp


@app.post("/game/cleanup")
async def game_cleanup():
    to_remove = [gid for gid, s in _sessions.items() if s.completed]
    for gid in to_remove:
        logger.info(f"Session cleanup: Removing completed/abandoned game {gid}")
        del _sessions[gid]
    logger.info(f"Session cleanup: {len(to_remove)} sessions removed.")
    return {"removed": len(to_remove)}

# ── PC vs PC game runner (used by tests) ──────────────────────────────────────



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
