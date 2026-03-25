"""Board helpers: board construction and move application."""
from typing import List
from shared.validate_move import validate_move


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


def get_jumps_from(board, pos):
    r, c = pos
    result = []
    for dr, dc in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < 12 and 0 <= nc < 12:
            valid, _, _ = validate_move(board, (r, c), (nr, nc))
            if valid:
                result.append((nr, nc))
    return result


def get_all_jumps(board, player):
    own = (1, 3) if player == 1 else (2, 4)
    for r in range(12):
        for c in range(12):
            stack = board[r][c]
            if stack and stack[-1] in own:
                if get_jumps_from(board, (r, c)):
                    return True
    return False


def apply_move(board, sr, sc, er, ec, kinged):
    dr, dc = er - sr, ec - sc
    if abs(dr) == 2:
        mr, mc = sr + dr // 2, sc + dc // 2
        captured_top = board[mr][mc].pop()
        moving_stack = board[sr][sc][:]
        board[er][ec] = [captured_top] + moving_stack
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
