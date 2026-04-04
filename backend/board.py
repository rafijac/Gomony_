
"""
Board helpers: board construction, move application, jump detection, and stack management.
"""
from typing import List, Tuple
from shared.validate_move import validate_move


def make_initial_board() -> List[List[List[int]]]:
    """
    Create the initial 12x12 Gomony board.
    Player 1 (1) occupies dark squares in rows 0-3, Player 2 (2) in rows 8-11.
    Each cell is a stack (list) of pieces, bottom→top.
    """
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


def player_side_label(player_number: int) -> str:
    """Human-readable side for rules copy (aligned with validate_move White/Brown wording)."""
    return "White" if player_number == 1 else "Brown"


def get_jumps_from(board: List[List[List[int]]], pos: Tuple[int, int]) -> List[Tuple[int, int]]:
    """
    Return a list of valid jump destinations from a given position.
    Only considers jumps (distance 2 diagonals).
    """
    r, c = pos
    result = []
    for dr, dc in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < 12 and 0 <= nc < 12:
            valid, _, _ = validate_move(board, (r, c), (nr, nc))
            if valid:
                result.append((nr, nc))
    return result


def get_all_jumps(board: List[List[List[int]]], player: int) -> bool:
    """
    Return True if the player has any available jumps on the board.
    """
    own = (1, 3) if player == 1 else (2, 4)
    for r in range(12):
        for c in range(12):
            stack = board[r][c]
            if stack and stack[-1] in own:
                if get_jumps_from(board, (r, c)):
                    return True
    return False



def move_stack(board: List[List[List[int]]], sr: int, sc: int, er: int, ec: int) -> None:
    """
    Move the entire stack from (sr, sc) to (er, ec).
    """
    board[er][ec] = board[sr][sc][:]
    board[sr][sc] = []

def capture_stack(board: List[List[List[int]]], sr: int, sc: int, er: int, ec: int) -> None:
    """
    Perform a jump: move stack from (sr, sc) to (er, ec), capturing the top of the jumped stack.
    """
    dr, dc = er - sr, ec - sc
    mr, mc = sr + dr // 2, sc + dc // 2
    captured_top = board[mr][mc].pop()
    moving_stack = board[sr][sc][:]
    board[er][ec] = [captured_top] + moving_stack
    board[sr][sc] = []

def maybe_king_top(board: List[List[List[int]]], er: int, ec: int) -> None:
    """
    If the top piece at (er, ec) is eligible, king it (1→3, 2→4).
    """
    if not board[er][ec]:
        return
    top = board[er][ec][-1]
    if top == 1:
        board[er][ec][-1] = 3
    elif top == 2:
        board[er][ec][-1] = 4

def apply_move(board: List[List[List[int]]], sr: int, sc: int, er: int, ec: int, kinged: bool) -> None:
    """
    Apply a move to the board, handling jumps, stack movement, and kinging.
    Args:
        board: The 12x12 board (in-place modification)
        sr, sc: Start row, col
        er, ec: End row, col
        kinged: Whether the move results in kinging
    """
    dr, dc = er - sr, ec - sc
    if abs(dr) == 2:
        capture_stack(board, sr, sc, er, ec)
    else:
        move_stack(board, sr, sc, er, ec)
    if kinged:
        maybe_king_top(board, er, ec)
