

"""
ai.py - Gomony AI for PC mode
Implements move generation and a simple minimax algorithm for the backend.
Refactored for modularity and documentation.
"""

import copy
try:
    from shared.validate_move import validate_move
except ImportError:
    from validate_move import validate_move
from board import make_initial_board, apply_move, get_jumps_from

BOARD_SIZE = 12

def enumerate_valid_moves(board, player):
    """
    Enumerate all valid moves for the current player.
    Enforces mandatory jump rule: if any jump is available, only jump moves are returned.
    Args:
        board: 12x12 board state (list of lists of stacks)
        player: 1 or 2
    Returns:
        List of ((start_row, start_col), (end_row, end_col)) tuples
    """
    normal_moves = []
    jump_moves = []
    for r in range(BOARD_SIZE):
        for c in range(BOARD_SIZE):
            stack = board[r][c]
            if not stack:
                continue
            top = stack[-1]
            # Only move own pieces
            if player == 1 and top not in (1, 3):
                continue
            if player == 2 and top not in (2, 4):
                continue
            # Try all diagonal moves: distance 1 (normal) and distance 2 (jump)
            for dr, dc in [(-1, -1), (-1, 1), (1, -1), (1, 1), (-2, -2), (-2, 2), (2, -2), (2, 2)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
                    valid, _, _ = validate_move(board, (r, c), (nr, nc))
                    if valid:
                        if abs(dr) == 2:
                            jump_moves.append(((r, c), (nr, nc)))
                        else:
                            normal_moves.append(((r, c), (nr, nc)))
    # Mandatory jump rule: must jump if any jump is available
    return jump_moves if jump_moves else normal_moves

def evaluate_board(board, player):
    """
    Evaluate the board for the given player.
    Simple heuristic: piece count + king bonus + stack height.
    Args:
        board: 12x12 board state
        player: 1 or 2
    Returns:
        Numeric score (higher is better for player)
    """
    score = 0
    for row in board:
        for stack in row:
            if not stack:
                continue
            top = stack[-1]
            if top in (1, 3):
                mult = 1 if player == 1 else -1
            elif top in (2, 4):
                mult = 1 if player == 2 else -1
            else:
                continue
            # King bonus
            if top in (3, 4):
                score += 3 * mult
            else:
                score += 1 * mult
            # Stack height bonus
            score += 0.2 * (len(stack) - 1) * mult
    return score

def enumerate_continuation_jumps(board, player, piece_pos):
    """
    Enumerate all valid continuation jumps from a specific piece during a multi-jump chain.
    Unlike enumerate_valid_moves, this is constrained to a single piece (the one that just jumped).
    """
    r, c = piece_pos
    stack = board[r][c]
    if not stack:
        return []
    top = stack[-1]
    if player == 1 and top not in (1, 3):
        return []
    if player == 2 and top not in (2, 4):
        return []
    moves = []
    for dr, dc in [(-2, -2), (-2, 2), (2, -2), (2, 2)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE:
            valid, _, _ = validate_move(board, (r, c), (nr, nc))
            if valid:
                moves.append(((r, c), (nr, nc)))
    return moves

def minimax(board, player, depth, maximizing, forced_piece=None):
    """
    Minimax search with depth limit.
    When forced_piece is set, only that piece may move (mid-chain continuation rule).
    Args:
        board: 12x12 board state
        player: 1 or 2 (the maximizing player)
        depth: search depth
        maximizing: True if maximizing for 'player', False for opponent
        forced_piece: (row, col) of the piece that must continue jumping, or None
    Returns:
        (score, move) where move is ((start_row, start_col), (end_row, end_col))
    """
    if depth == 0:
        return evaluate_board(board, player), None
    current = player if maximizing else (2 if player == 1 else 1)
    if forced_piece is not None:
        # Mid-chain: only the landing piece may continue jumping
        moves = enumerate_continuation_jumps(board, current, forced_piece)
        if not moves:
            # Chain is over — switch turns and continue search
            return minimax(board, player, depth, not maximizing, forced_piece=None)
    else:
        moves = enumerate_valid_moves(board, current)
    if not moves:
        return evaluate_board(board, player), None
    best_score = float('-inf') if maximizing else float('inf')
    best_move = None
    for move in moves:
        new_board = copy.deepcopy(board)
        sr, sc = move[0]
        er, ec = move[1]
        valid, _, kinged = validate_move(new_board, (sr, sc), (er, ec))
        if not valid:
            continue
        apply_move(new_board, sr, sc, er, ec, kinged)
        is_jump = abs(er - sr) == 2
        if is_jump and not kinged and get_jumps_from(new_board, (er, ec)):
            # Multi-jump continuation: same player, same piece must continue
            score, _ = minimax(new_board, player, depth - 1, maximizing, forced_piece=(er, ec))
        else:
            score, _ = minimax(new_board, player, depth - 1, not maximizing, forced_piece=None)
        if maximizing:
            if score > best_score:
                best_score = score
                best_move = move
        else:
            if score < best_score:
                best_score = score
                best_move = move
    return best_score, best_move

def board_hash(board):
    """Return a hashable representation of the board state."""
    return str(board)


def choose_ai_move(board, player, depth=2, position_history=None):
    """
    Main AI entry point. Returns the best move for the given player using minimax.
    Applies a penalty to moves that revisit recently-seen positions to prevent oscillation.
    Args:
        board: 12x12 board state
        player: 1 or 2
        depth: minimax search depth
        position_history: list of recently-seen board hashes (to avoid repetition)
    Returns:
        (start_pos, end_pos) or None if no moves
    """
    if position_history is None:
        position_history = []

    moves = enumerate_valid_moves(board, player)
    if not moves:
        return None

    best_score = float('-inf')
    best_move = None

    for move in moves:
        new_board = copy.deepcopy(board)
        sr, sc = move[0]
        er, ec = move[1]
        valid, _, kinged = validate_move(new_board, (sr, sc), (er, ec))
        if not valid:
            continue
        apply_move(new_board, sr, sc, er, ec, kinged)
        is_jump = abs(er - sr) == 2
        if is_jump and not kinged and get_jumps_from(new_board, (er, ec)):
            # Multi-jump continuation: same player, same piece must continue
            score, _ = minimax(new_board, player, depth - 1, True, forced_piece=(er, ec))
        else:
            score, _ = minimax(new_board, player, depth - 1, False)

        # Penalize moves that revisit a recent position to break oscillation loops
        if board_hash(new_board) in position_history:
            score -= 10.0

        if score > best_score:
            best_score = score
            best_move = move

    return best_move

def simulate_game(board, starting_player, depth=1, max_moves=100):
    """
    Simulate a full game between two AIs from a given board state.
    Args:
        board: initial 12x12 board state
        starting_player: 1 or 2
        depth: minimax search depth
        max_moves: maximum moves before declaring a draw
    Returns:
        dict with log, result, winner, final_board, move_count
    """
    current_player = starting_player
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
                result = f"Game over: no pieces for player {current_player}"
            elif not opponent_pieces:
                winner = current_player
                result = "Game over: opponent has no pieces"
            else:
                winner = 2 if current_player == 1 else 1
                result = f"No valid moves for player {current_player}"
            break
        sr, sc = move[0]
        er, ec = move[1]
        valid, reason, kinged = validate_move(board, (sr, sc), (er, ec))
        if not valid:
            result = f"Invalid move by AI: {move} | Reason: {reason}"
            winner = 2 if current_player == 1 else 1
            break
        apply_move(board, sr, sc, er, ec, kinged)
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

def run_pc_vs_pc_game(depth=1, max_moves=100):
    """
    Convenience wrapper: Simulate a full AI vs AI game from the initial board.
    Args:
        depth: minimax search depth
        max_moves: maximum moves before declaring a draw
    Returns:
        dict with log, result, winner, final_board, move_count
    """
    board = make_initial_board()
    return simulate_game(board, starting_player=1, depth=depth, max_moves=max_moves)
