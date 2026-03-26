"""
test_board_state.py
-------------------
Comprehensive tests for Gomony board state and API endpoints.

Run from the project root:
    .venv\\Scripts\\python.exe -m pytest shared/test_board_state.py -v

NOTE ON FAILING TESTS
---------------------
Tests 7-9 (test_get_state_endpoint, test_health_endpoint, test_reset_endpoint)
are expected to FAIL with the current main.py because those endpoints have not
been implemented yet.  They serve as a specification / TODO for the backend.
"""


import pytest
from fastapi.testclient import TestClient
from main import app


# ─────────────────────────────────────────────────────────────────────────────
# TDD: End-state API contract and triggers
# ─────────────────────────────────────────────────────────────────────────────
def test_end_state_api_contract():
    """After a win, draw, resign, timeout, disconnect, forfeit, or abandon, /state and /move must include end-state fields."""
    client = TestClient(app)
    # Simulate a win by removing all player 2 pieces
    client.post("/reset")
    # Remove all player 2 pieces
    state = client.get("/state").json()
    board = state["board"]
    for row in board:
        for cell in row:
            if cell and cell[-1] == 2:
                cell.clear()
    # Force update
    client.post("/reset")  # Reset again to ensure state
    # Simulate a move that should trigger win
    payload = {"start_pos": [3, 0], "end_pos": [4, 1]}
    move_resp = client.post("/move", json=payload)
    data = move_resp.json()
    # The response must include the new end-state fields
    assert "game_over" in data, "Missing game_over field in response"
    assert "end_reason" in data, "Missing end_reason field in response"
    assert "winner" in data, "Missing winner field in response"
    assert "loser" in data, "Missing loser field in response"
    assert "winning_move" in data, "Missing winning_move field in response"
    assert "end_time" in data, "Missing end_time field in response"
    assert "final_board" in data, "Missing final_board field in response"
    # The game_over field must be True
    assert data["game_over"] is True, "game_over should be True after win"
    # The end_reason must be 'win'
    assert data["end_reason"] == "win", f"end_reason should be 'win', got {data['end_reason']}"
    # Winner must be player 1 (since only player 1 pieces remain)
    assert data["winner"] == 1, f"winner should be 1, got {data['winner']}"
    # Loser must be player 2
    assert data["loser"] == 2, f"loser should be 2, got {data['loser']}"
    # End time must be a string (timestamp)
    assert isinstance(data["end_time"], str), "end_time should be a string timestamp"
    # Final board must be a 12x12 array
    assert isinstance(data["final_board"], list) and len(data["final_board"]) == 12, "final_board should be a 12x12 array"
    # Winning move must be present and a dict
    assert isinstance(data["winning_move"], dict) or data["winning_move"] is None, "winning_move should be a dict or None"
    # TODO: Repeat for draw, resign, timeout, disconnect, forfeit, abandon triggers (requires backend support)

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# Helper: canonical initial board
# ─────────────────────────────────────────────────────────────────────────────

def make_initial_board() -> list:
    """
    Returns the intended 12×12 starting board for Gomony:
      - Every cell is a list (stack).
      - Player 1 (value 1) occupies dark squares (row+col odd) in rows 0–3.
      - Player 2 (value 2) occupies dark squares (row+col odd) in rows 8–11.
      - Rows 4–7 are entirely empty.
    """
    board: list = [[[] for _ in range(12)] for _ in range(12)]
    for row in range(12):
        for col in range(12):
            if (row + col) % 2 == 1:          # dark square
                if row < 4:
                    board[row][col] = [1]
                elif row >= 8:
                    board[row][col] = [2]
    return board


# ─────────────────────────────────────────────────────────────────────────────
# 1. Board shape
# ─────────────────────────────────────────────────────────────────────────────

def test_initial_board_shape():
    """Board is 12×12; every cell is a list."""
    board = make_initial_board()
    assert len(board) == 12, "Board must have 12 rows"
    for row_idx, row in enumerate(board):
        assert len(row) == 12, f"Row {row_idx} must have 12 columns"
        for col_idx, cell in enumerate(row):
            assert isinstance(cell, list), (
                f"Cell ({row_idx}, {col_idx}) must be a list, got {type(cell)}"
            )


# ─────────────────────────────────────────────────────────────────────────────
# 2. Player 1 placement (rows 0–3)
# ─────────────────────────────────────────────────────────────────────────────

def test_initial_player1_placement():
    """Player 1 pieces sit on every dark square (row+col odd) in rows 0–3."""
    board = make_initial_board()
    for row in range(4):
        for col in range(12):
            cell = board[row][col]
            if (row + col) % 2 == 1:           # dark → must have [1]
                assert cell == [1], (
                    f"Expected [1] at dark square ({row},{col}), got {cell}"
                )
            else:                               # light → must be empty
                assert cell == [], (
                    f"Light square ({row},{col}) in P1 zone must be empty, got {cell}"
                )


# ─────────────────────────────────────────────────────────────────────────────
# 3. Player 2 placement (rows 8–11)
# ─────────────────────────────────────────────────────────────────────────────

def test_initial_player2_placement():
    """Player 2 pieces sit on every dark square (row+col odd) in rows 8–11."""
    board = make_initial_board()
    for row in range(8, 12):
        for col in range(12):
            cell = board[row][col]
            if (row + col) % 2 == 1:           # dark → must have [2]
                assert cell == [2], (
                    f"Expected [2] at dark square ({row},{col}), got {cell}"
                )
            else:                               # light → must be empty
                assert cell == [], (
                    f"Light square ({row},{col}) in P2 zone must be empty, got {cell}"
                )


# ─────────────────────────────────────────────────────────────────────────────
# 4. Middle rows are empty (rows 4–7)
# ─────────────────────────────────────────────────────────────────────────────

def test_initial_empty_middle():
    """Rows 4–7 must be completely empty."""
    board = make_initial_board()
    for row in range(4, 8):
        for col in range(12):
            assert board[row][col] == [], (
                f"Middle ({row},{col}) should be empty, got {board[row][col]}"
            )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Piece count
# ─────────────────────────────────────────────────────────────────────────────

def test_piece_count():
    """Player 1 and Player 2 each start with exactly 24 pieces."""
    board = make_initial_board()
    # Count cells where the top-of-stack belongs to each player
    p1_count = sum(
        1 for row in board for cell in row if cell and cell[-1] == 1
    )
    p2_count = sum(
        1 for row in board for cell in row if cell and cell[-1] == 2
    )
    assert p1_count == 24, f"Player 1 should have 24 pieces, found {p1_count}"
    assert p2_count == 24, f"Player 2 should have 24 pieces, found {p2_count}"


# ─────────────────────────────────────────────────────────────────────────────
# 6. Dark squares only
# ─────────────────────────────────────────────────────────────────────────────

def test_dark_squares_only():
    """No piece should appear on a light square (row+col even)."""
    board = make_initial_board()
    for row in range(12):
        for col in range(12):
            if (row + col) % 2 == 0:           # light square
                assert board[row][col] == [], (
                    f"Light square ({row},{col}) must be empty, got {board[row][col]}"
                )


# ─────────────────────────────────────────────────────────────────────────────
# 7. GET /state endpoint
#    Expected to FAIL until the endpoint is implemented.
# ─────────────────────────────────────────────────────────────────────────────

def test_get_state_endpoint():
    """GET /state returns 200 with 'board' and 'current_player'."""
    response = client.get("/state")
    assert response.status_code == 200, (
        f"GET /state returned {response.status_code}. "
        "NOTE: This endpoint is not yet implemented in main.py."
    )
    data = response.json()
    assert "board" in data, "'board' key missing from /state response"
    assert "current_player" in data, "'current_player' key missing from /state response"
    # Board must be a 12×12 nested list
    assert len(data["board"]) == 12
    for row in data["board"]:
        assert len(row) == 12


# ─────────────────────────────────────────────────────────────────────────────
# 8. GET /health endpoint
#    Expected to FAIL until the endpoint is implemented.
# ─────────────────────────────────────────────────────────────────────────────

def test_health_endpoint():
    """GET /health returns HTTP 200 and {"status": "ok"}."""
    response = client.get("/health")
    assert response.status_code == 200, (
        f"GET /health returned {response.status_code}. "
        "NOTE: This endpoint is not yet implemented in main.py."
    )
    assert response.json() == {"status": "ok"}, (
        f'Expected {{"status": "ok"}}, got {response.json()}'
    )


# ─────────────────────────────────────────────────────────────────────────────
# 9. POST /reset endpoint
#    Expected to FAIL until the endpoint is implemented.
# ─────────────────────────────────────────────────────────────────────────────

def test_reset_endpoint():
    """POST /reset returns 200 and a fresh board in the response."""
    response = client.post("/reset")
    assert response.status_code == 200, (
        f"POST /reset returned {response.status_code}. "
        "NOTE: This endpoint is not yet implemented in main.py."
    )
    data = response.json()
    assert "board" in data, "'board' key missing from /reset response"
    # The returned board should be the initial state
    returned_board = data["board"]
    assert len(returned_board) == 12
    for row in returned_board:
        assert len(row) == 12


# ─────────────────────────────────────────────────────────────────────────────
# 10. Valid move → correct board transformation
# ─────────────────────────────────────────────────────────────────────────────

def test_valid_move_updates_board():
    """
    A valid move via POST /move should:
      a) return valid=True with reason 'Valid move to empty cell'
      b) return the updated board in the response body with the piece moved

    The server now manages board state authoritatively via _state.
    We reset first so we start from a known position, then move a player-1
    piece from row 3 into the empty middle zone (rows 4-7).
      (3,0): dark square (3+0=3, odd), row < 4 → holds player-1 piece
      (4,1): dark square (4+1=5, odd), row in 4-7 → empty
    """
    # Ensure a clean board state
    reset_resp = client.post("/reset")
    assert reset_resp.status_code == 200

    payload = {
        "start_pos": [3, 0],
        "end_pos": [4, 1],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True, (
        f"Expected valid=True for empty-cell move, got: {data}"
    )
    assert data["reason"] == "Valid move to empty cell"

    # Verify the server-side board state reflects the move
    board = data["board"]
    assert board[3][0] == [], "Origin (3,0) should be empty after the move"
    assert board[4][1] == [1], "Destination (4,1) should hold the player-1 piece"


# ─────────────────────────────────────────────────────────────────────────────
# Bonus: capture and stack-merge via the /move endpoint
# ─────────────────────────────────────────────────────────────────────────────

def test_move_validates_capture_logic():
    """
    validate_move (unit test) correctly identifies a jump (capture) move.
    """
    from shared.validate_move import validate_move
    board = [[[] for _ in range(12)] for _ in range(12)]
    board[2][0] = [1]   # player 1 at (2,0)
    board[3][1] = [2]   # player 2 at (3,1) — diagonal, to be jumped over
    # Player 1 jumps over player 2 from (2,0) to (4,2)
    valid, reason, kinged = validate_move(board, (2, 0), (4, 2))
    assert valid is True
    assert reason == "Valid jump"


def test_move_endpoint_valid_normal_move():
    """
    POST /move on the initial board: player 1 makes a valid diagonal move.
    """
    client.post("/reset")
    # (3,0) has player-1 piece; (4,1) is empty at game start
    payload = {
        "start_pos": [3, 0],
        "end_pos": [4, 1],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["reason"] == "Valid move to empty cell"


def test_move_endpoint_out_of_bounds():
    """POST /move rejects moves with out-of-bounds coordinates."""
    board = [[[] for _ in range(12)] for _ in range(12)]
    board[0][1] = [1]
    payload = {
        "current_state": board,
        "start_pos": [0, 1],
        "end_pos": [12, 12],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["reason"] == "Position out of bounds"


def test_move_endpoint_no_piece_at_start():
    """POST /move rejects moves from an empty cell."""
    client.post("/reset")
    # (4,1) is empty at game start (mid-board, no pieces)
    payload = {
        "start_pos": [4, 1],
        "end_pos": [5, 2],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["reason"] == "No stack at start position"
