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
import uuid
import threading
from typing import Dict, List, Optional

from dotenv import load_dotenv
load_dotenv()

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

    def to_dict(self):
        return {
            "game_id": self.game_id,
            "board": self.board,
            "current_player": self.current_player,
            "move_count": self.move_count,
            "pending_jump": self.pending_jump,
        }

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


@app.post("/move")
async def move_endpoint(body: MoveRequest):
    board = _state["board"]
    sr, sc = body.start_pos
    er, ec = body.end_pos
    current_player = _state["current_player"]
    pending = _state.get("pending_jump")

    start_stack = board[sr][sc]
    if not start_stack:
        return {"valid": False, "reason": "No stack at start position", "pending_jump": pending}
    moving_piece = start_stack[-1]

    if current_player == 1 and moving_piece not in (1, 3):
        return {"valid": False, "reason": "It's Player 1's turn. You must move your own piece.", "pending_jump": pending}
    if current_player == 2 and moving_piece not in (2, 4):
        return {"valid": False, "reason": "It's Player 2's turn. You must move your own piece.", "pending_jump": pending}

    dr, dc = er - sr, ec - sc
    is_jump = abs(dr) == 2

    if pending:
        if [sr, sc] != pending:
            return {"valid": False, "reason": "You must continue jumping with the highlighted piece.", "pending_jump": pending}
        if not is_jump:
            return {"valid": False, "reason": "You must continue jumping.", "pending_jump": pending}
    else:
        if not is_jump and _get_all_jumps(board, current_player):
            return {"valid": False, "reason": "A jump is available — you must jump.", "pending_jump": None}

    valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
    if not valid:
        return {"valid": False, "reason": reason, "pending_jump": pending}

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
        return {"valid": False, "reason": "Game over: no pieces for current player",
                "board": board, "current_player": player, "pending_jump": None}
    if not any(cell[-1] in opp for row in board for cell in row if cell):
        return {"valid": False, "reason": "Game over: opponent has no pieces",
                "board": board, "current_player": player, "pending_jump": None}

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
                    return {"valid": False, "reason": "No valid moves for AI",
                            "board": board, "current_player": player, "pending_jump": None}
                break
            sr, sc = move[0]
            er, ec = move[1]

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            if not moves_made:
                return {"valid": False, "reason": reason,
                        "board": board, "current_player": player, "pending_jump": None}
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

    return {
        "valid": True,
        "reason": "AI moved",
        "moves": moves_made,
        "board": _state["board"],
        "current_player": _state["current_player"],
        "pending_jump": _state.get("pending_jump"),
    }

# ── Multiplayer endpoints ──────────────────────────────────────────────────────

@app.post("/game/create")
async def create_game():
    game_id = str(uuid.uuid4())[:8]
    session = GameSession(game_id)
    _sessions[game_id] = session
    return {"game_id": game_id, "player": 1}


@app.post("/game/join")
async def join_game(body: JoinGameRequest):
    session = _sessions.get(body.game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            return JSONResponse(status_code=410, content={"error": "Game is completed or abandoned"})
        if len(session.players) >= 2:
            return JSONResponse(status_code=409, content={"error": "Game is full"})
        session.players.append(2)
    return {"game_id": body.game_id, "player": 2}


@app.get("/game/{game_id}/state")
async def game_state(game_id: str):
    session = _sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    return session.to_dict()


@app.post("/game/{game_id}/move")
async def game_move(game_id: str, body: SessionMoveRequest):
    session = _sessions.get(game_id)
    if not session:
        return JSONResponse(status_code=404, content={"error": "Game not found"})
    with session.lock:
        if session.completed:
            return JSONResponse(status_code=410, content={"error": "Game is over"})
        if body.player != session.current_player:
            return JSONResponse(status_code=403, content={"error": "Not your turn"})

        board = session.board
        sr, sc = body.start_pos
        er, ec = body.end_pos

        start_stack = board[sr][sc]
        if not start_stack:
            return JSONResponse(status_code=403, content={"error": "No stack at start position"})
        moving_piece = start_stack[-1]

        own = (1, 3) if body.player == 1 else (2, 4)
        if moving_piece not in own:
            return JSONResponse(status_code=403, content={"error": "You must move your own piece."})

        dr, dc = er - sr, ec - sc
        is_jump = abs(dr) == 2
        pending = session.pending_jump

        if pending:
            if [sr, sc] != pending:
                return JSONResponse(status_code=403, content={"error": "You must continue jumping with the highlighted piece."})
            if not is_jump:
                return JSONResponse(status_code=403, content={"error": "You must continue jumping."})
        else:
            if not is_jump and _get_all_jumps(board, body.player):
                return JSONResponse(status_code=403, content={"error": "A jump is available — you must jump."})

        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            return JSONResponse(status_code=403, content={"error": reason})

        _apply_move(board, sr, sc, er, ec, kinged)

        if is_jump and not kinged:
            more_jumps = _get_jumps_from(board, (er, ec))
            if more_jumps:
                session.pending_jump = [er, ec]
                return {
                    "valid": True,
                    "reason": "Jump! Keep jumping.",
                    **session.to_dict(),
                }

        session.pending_jump = None
        session.current_player = 2 if body.player == 1 else 1
        session.move_count += 1

        # Check win: opponent has no pieces
        opp = (2, 4) if body.player == 1 else (1, 3)
        if not any(cell[-1] in opp for row in board for cell in row if cell):
            session.completed = True

        return {"valid": True, "reason": reason, **session.to_dict()}


@app.post("/game/cleanup")
async def game_cleanup():
    to_remove = [gid for gid, s in _sessions.items() if s.completed]
    for gid in to_remove:
        del _sessions[gid]
    return {"removed": len(to_remove)}

# ── PC vs PC game runner (used by tests) ──────────────────────────────────────

def run_pc_vs_pc_game(depth=1, max_moves=100):
    board = make_initial_board()
    current_player = 1
    move_count = 0
    log = []
    winner = None
    result = None
    for i in range(max_moves):
        move = choose_ai_move(board, current_player, depth=depth)
        if not move:
            player_pieces = [cell[-1] for row in board for cell in row if cell and ((current_player == 1 and cell[-1] in (1,3)) or (current_player == 2 and cell[-1] in (2,4)))]
            opponent_pieces = [cell[-1] for row in board for cell in row if cell and ((current_player == 1 and cell[-1] in (2,4)) or (current_player == 2 and cell[-1] in (1,3)))]
            if not player_pieces:
                winner = 2 if current_player == 1 else 1
                result = "Game over: no pieces for player {}".format(current_player)
            elif not opponent_pieces:
                winner = current_player
                result = "Game over: opponent has no pieces"
            else:
                winner = 2 if current_player == 1 else 1
                result = "No valid moves for player {}".format(current_player)
            break
        sr, sc = move[0]
        er, ec = move[1]
        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            result = f"Invalid move by AI: {move} | Reason: {reason}"
            winner = 2 if current_player == 1 else 1
            break
        _apply_move(board, sr, sc, er, ec, kinged)
        log.append({
            "move_num": move_count + 1,
            "player": current_player,
            "move": {"start_pos": [sr, sc], "end_pos": [er, ec]},
            "reason": reason,
            "board": copy.deepcopy(board),
        })
        move_count += 1
        opponent_pieces = [cell[-1] for row in board for cell in row if cell and ((current_player == 1 and cell[-1] in (2,4)) or (current_player == 2 and cell[-1] in (1,3)))]
        if not opponent_pieces:
            winner = current_player
            result = "Game over: opponent has no pieces"
            break
        back_row = 11 if current_player == 1 else 0
        for col in range(12):
            stack = board[back_row][col]
            if stack and stack[-1] in ((1,3) if current_player == 1 else (2,4)) and len(stack) >= 3:
                winner = current_player
                result = f"Game over: player {current_player} stack of 3+ reached back row"
                break
        if result:
            break
        current_player = 2 if current_player == 1 else 1
    if not result:
        result = "Max moves reached"
    return {
        "log": log,
        "result": result,
        "winner": winner,
        "final_board": board,
        "move_count": move_count,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
