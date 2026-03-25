"""Single-player endpoints."""
import logging
from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from models import MoveRequest, AIMoveRequest
from board import make_initial_board, get_jumps_from, get_all_jumps, apply_move
import state as _s
from shared.validate_move import validate_move
from shared.ai import choose_ai_move

router = APIRouter()
logger = logging.getLogger("gomony")


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/state")
async def get_state():
    return {
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "move_count": _s.state["move_count"],
        "pending_jump": _s.state.get("pending_jump"),
    }


@router.post("/reset")
async def reset():
    _s.state["board"] = make_initial_board()
    _s.state["current_player"] = 1
    _s.state["move_count"] = 0
    _s.state["pending_jump"] = None
    return {
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "move_count": _s.state["move_count"],
        "pending_jump": None,
    }


@router.post("/move")
async def move_endpoint(body: MoveRequest):
    board = _s.state["board"]
    sr, sc = body.start_pos
    er, ec = body.end_pos
    current_player = _s.state["current_player"]
    pending = _s.state.get("pending_jump")

    if not (0 <= sr < 12 and 0 <= sc < 12 and 0 <= er < 12 and 0 <= ec < 12):
        return {"valid": False, "reason": "Position out of bounds", "board": board, "current_player": current_player, "pending_jump": pending}

    start_stack = board[sr][sc]
    if not start_stack:
        return {"valid": False, "reason": "No stack at start position", "board": board, "current_player": current_player, "pending_jump": pending}
    moving_piece = start_stack[-1]

    if current_player == 1 and moving_piece not in (1, 3):
        return {"valid": False, "reason": "It's Player 1's turn. You must move your own piece.", "board": board, "current_player": current_player, "pending_jump": pending}
    if current_player == 2 and moving_piece not in (2, 4):
        return {"valid": False, "reason": "It's Player 2's turn. You must move your own piece.", "board": board, "current_player": current_player, "pending_jump": pending}

    is_jump = abs(er - sr) == 2

    if pending:
        if [sr, sc] != pending:
            return {"valid": False, "reason": "You must continue jumping with the highlighted piece.", "board": board, "current_player": current_player, "pending_jump": pending}
        if not is_jump:
            return {"valid": False, "reason": "You must continue jumping.", "board": board, "current_player": current_player, "pending_jump": pending}
    else:
        if not is_jump and get_all_jumps(board, current_player):
            return {"valid": False, "reason": "A jump is available — you must jump.", "board": board, "current_player": current_player, "pending_jump": None}

    valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
    if not valid:
        return {"valid": False, "reason": reason, "board": board, "current_player": current_player, "pending_jump": pending}

    apply_move(board, sr, sc, er, ec, kinged)

    if is_jump and not kinged:
        more_jumps = get_jumps_from(board, (er, ec))
        if more_jumps:
            _s.state["pending_jump"] = [er, ec]
            return {"valid": True, "reason": "Jump! Keep jumping.", "board": _s.state["board"], "current_player": _s.state["current_player"], "pending_jump": _s.state["pending_jump"]}

    _s.state["pending_jump"] = None
    _s.state["current_player"] = 2 if current_player == 1 else 1
    _s.state["move_count"] += 1
    return {"valid": True, "reason": reason, "board": _s.state["board"], "current_player": _s.state["current_player"], "pending_jump": None}


@router.post("/move/pc", tags=["AI"], summary="Make an AI move for the current player")
async def move_pc_endpoint(body: AIMoveRequest = Body(default=None)):
    board = _s.state["board"]
    player = _s.state["current_player"]
    depth = body.depth if body else 2

    own = (1, 3) if player == 1 else (2, 4)
    opp = (2, 4) if player == 1 else (1, 3)
    if not any(cell[-1] in own for row in board for cell in row if cell):
        return JSONResponse(status_code=410, content={"error": "Game over: no pieces for current player", "valid": False})
    if not any(cell[-1] in opp for row in board for cell in row if cell):
        return JSONResponse(status_code=410, content={"error": "Game over: opponent has no pieces", "valid": False})

    moves_made = []
    while True:
        board = _s.state["board"]
        pending = _s.state.get("pending_jump")

        if pending:
            jumps = get_jumps_from(board, tuple(pending))
            if not jumps:
                _s.state["pending_jump"] = None
                _s.state["current_player"] = 2 if _s.state["current_player"] == 1 else 1
                _s.state["move_count"] += 1
                break
            er, ec = jumps[0]
            sr, sc = pending[0], pending[1]
        else:
            move = choose_ai_move(board, player, depth)
            if not move:
                if not moves_made:
                    return JSONResponse(status_code=400, content={"error": "No valid moves for AI", "valid": False})
                break
            sr, sc = move[0]
            er, ec = move[1]

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            if not moves_made:
                return JSONResponse(status_code=400, content={"error": reason, "valid": False})
            break

        is_jump = abs(er - sr) == 2
        apply_move(board, sr, sc, er, ec, kinged)
        moves_made.append({"start_pos": [sr, sc], "end_pos": [er, ec]})

        if is_jump and not kinged and get_jumps_from(board, (er, ec)):
            _s.state["pending_jump"] = [er, ec]
            continue

        _s.state["pending_jump"] = None
        _s.state["current_player"] = 2 if _s.state["current_player"] == 1 else 1
        _s.state["move_count"] += 1
        break

    return {
        "valid": True,
        "reason": "AI moved",
        "moves": moves_made,
        "board": _s.state["board"],
        "current_player": _s.state["current_player"],
        "pending_jump": _s.state.get("pending_jump"),
        "move": moves_made[0] if moves_made else None,
    }
