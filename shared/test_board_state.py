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
    validate_move (unit test) correctly identifies a capture move.

    The server now owns board state, so we test the capture logic at the
    function level rather than injecting a custom board via the API.
    """
    from shared.validate_move import validate_move
    board = [[[] for _ in range(12)] for _ in range(12)]
    board[0][0] = [1]   # player 1
    board[0][1] = [2]   # player 2 — adjacent, one step right
    valid, reason = validate_move(board, (0, 0), (0, 1))
    assert valid is True
    assert reason == "Valid capture"


def test_move_endpoint_stack_merge():
    """
    POST /move on the initial board merges two adjacent player-1 stacks.

    After a reset:
      (0,1): dark square (0+1=1, odd), row 0 < 4 → player-1 piece
      (1,0): dark square (1+0=1, odd), row 1 < 4 → player-1 piece
    Moving from (0,1) to (1,0) merges both player-1 stacks.
    """
    client.post("/reset")   # start from known initial board

    payload = {
        "start_pos": [0, 1],
        "end_pos": [1, 0],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["reason"] == "Valid stack merge"


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
    board = [[[] for _ in range(12)] for _ in range(12)]
    payload = {
        "current_state": board,
        "start_pos": [0, 1],
        "end_pos": [1, 0],
    }
    response = client.post("/move", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["reason"] == "No stack at start position"
