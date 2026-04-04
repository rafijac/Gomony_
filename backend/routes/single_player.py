"""Single-player endpoints."""
import logging
from fastapi import APIRouter, Body

from fastapi.responses import JSONResponse
from models import MoveRequest, AIMoveRequest
from board import make_initial_board, get_jumps_from, get_all_jumps, apply_move, player_side_label
import state as _s
from shared.validate_move import validate_move
from shared.ai import choose_ai_move, board_hash
from end_state import get_end_state

router = APIRouter()
logger = logging.getLogger("gomony")


@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/state")
async def get_state():
    resp = {
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "move_count": _s.state["move_count"],
        "pending_jump": _s.state.get("pending_jump"),
    }
    end_state = get_end_state(_s.state["board"])
    resp.update(end_state)
    return resp


@router.post("/reset")
async def reset():
    _s.state["board"] = make_initial_board()
    _s.state["current_player"] = 1
    _s.state["move_count"] = 0
    _s.state["pending_jump"] = None
    _s.state["ai_position_history"] = []
    return {
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "move_count": _s.state["move_count"],
        "pending_jump": None,
    }


@router.post("/move", status_code=200)
async def move_endpoint(body: MoveRequest):
    board = _s.state["board"]
    sr, sc = body.start_pos
    er, ec = body.end_pos
    current_player = _s.state["current_player"]
    pending = _s.state.get("pending_jump")

    def resp(obj):
        return JSONResponse(content=obj, status_code=200)

    # PRE-MOVE: Check if the game is already over (e.g., board externally modified to win state)
    pre_end_state = get_end_state(board)
    if pre_end_state["game_over"]:
        move_resp = {
            "valid": False,
            "reason": "Game is already over.",
            "board": board,
            "current_player": current_player,
            "pending_jump": pending,
        }
        move_resp.update(pre_end_state)
        return resp(move_resp)

    if not (0 <= sr < 12 and 0 <= sc < 12 and 0 <= er < 12 and 0 <= ec < 12):
        return resp({"valid": False, "reason": "Position out of bounds", "board": board, "current_player": current_player, "pending_jump": pending})

    start_stack = board[sr][sc]
    if not start_stack:
        return resp({"valid": False, "reason": "No stack at start position", "board": board, "current_player": current_player, "pending_jump": pending})
    moving_piece = start_stack[-1]

    if current_player == 1 and moving_piece not in (1, 3):
        return resp({"valid": False, "reason": "It's Player 1's turn. You must move your own piece.", "board": board, "current_player": current_player, "pending_jump": pending})
    if current_player == 2 and moving_piece not in (2, 4):
        return resp({"valid": False, "reason": "It's Player 2's turn. You must move your own piece.", "board": board, "current_player": current_player, "pending_jump": pending})

    is_jump = abs(er - sr) == 2

    side = player_side_label(current_player)
    if pending:
        if [sr, sc] != pending:
            return resp({"valid": False, "reason": f"{side} must continue jumping with the highlighted piece.", "board": board, "current_player": current_player, "pending_jump": pending})
        if not is_jump:
            return resp({"valid": False, "reason": f"{side} must continue jumping.", "board": board, "current_player": current_player, "pending_jump": pending})
    else:
        if not is_jump and get_all_jumps(board, current_player):
            return resp({"valid": False, "reason": f"A jump is available — {side} must jump.", "board": board, "current_player": current_player, "pending_jump": None})

    valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
    if not valid:
        return resp({"valid": False, "reason": reason, "board": board, "current_player": current_player, "pending_jump": pending})

    apply_move(board, sr, sc, er, ec, kinged)

    if is_jump and not kinged:
        more_jumps = get_jumps_from(board, (er, ec))
        if more_jumps:
            _s.state["pending_jump"] = [er, ec]
            # Even if a jump is available, check for win before returning
            end_state = get_end_state(_s.state["board"])
            move_resp = {"valid": True, "reason": "Jump! Keep jumping.", "board": _s.state["board"], "current_player": _s.state["current_player"], "pending_jump": _s.state["pending_jump"]}
            if end_state:
                move_resp.update(end_state)
            else:
                move_resp.update({
                    "game_over": False,
                    "end_reason": None,
                    "winner": None,
                    "loser": None,
                    "winning_move": None,
                    "end_time": None,
                    "final_board": _s.state["board"],
                })
            return resp(move_resp)

    _s.state["pending_jump"] = None
    _s.state["current_player"] = 2 if current_player == 1 else 1
    _s.state["move_count"] += 1

    # Always re-evaluate board for win/draw/end-state after move
    end_state = get_end_state(_s.state["board"])
    move_resp = {"valid": True, "reason": reason, "board": _s.state["board"], "current_player": _s.state["current_player"], "pending_jump": None}
    move_resp.update(end_state)
    return resp(move_resp)

    # unreachable code removed


@router.post("/move/pc")
async def ai_move_endpoint(body: AIMoveRequest):
    """Execute the PC (AI) move, including full multi-jump chain."""
    board = _s.state["board"]
    current_player = _s.state["current_player"]
    depth = body.depth if body.depth else 2

    position_history = _s.state.get("ai_position_history", [])
    move = choose_ai_move(board, current_player, depth=depth, position_history=position_history)
    if move is None:
        end_state = get_end_state(board)
        result = {"valid": False, "reason": "No moves available for AI", "board": board, "current_player": current_player, "pending_jump": None, "moves": []}
        result.update(end_state)
        return result

    moves_done = []
    sr, sc = move[0]
    er, ec = move[1]

    while True:
        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            end_state = get_end_state(board)
            result = {"valid": False, "reason": reason, "board": board, "current_player": current_player, "pending_jump": None, "moves": moves_done}
            result.update(end_state)
            return result
        apply_move(board, sr, sc, er, ec, kinged)
        moves_done.append({"start_pos": [sr, sc], "end_pos": [er, ec]})
        is_jump = abs(er - sr) == 2
        if is_jump and not kinged:
            more_jumps = get_jumps_from(board, (er, ec))
            if more_jumps:
                next_er, next_ec = more_jumps[0]
                sr, sc = er, ec
                er, ec = next_er, next_ec
                continue
        break

    _s.state["pending_jump"] = None
    _s.state["current_player"] = 2 if current_player == 1 else 1
    _s.state["move_count"] += 1

    # Track board positions to prevent AI repetition loops (keep last 6 states)
    h = board_hash(_s.state["board"])
    history = _s.state.get("ai_position_history", [])
    history.append(h)
    _s.state["ai_position_history"] = history[-6:]

    end_state = get_end_state(_s.state["board"])
    result = {
        "valid": True,
        "move": moves_done[0] if len(moves_done) == 1 else None,
        "moves": moves_done,
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "pending_jump": None,
    }
    result.update(end_state)
    return result
