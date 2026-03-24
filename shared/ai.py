# --- Added from main.py ---
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
"""
ai.py - Gomony AI for PC mode
Implements move generation and a simple minimax algorithm for the backend.
"""
try:
    from shared.validate_move import validate_move
except ImportError:
    # Allow running from shared/ as script
    from validate_move import validate_move
import copy

BOARD_SIZE = 12

# Utility: enumerate all valid moves for the current player.
# Enforces mandatory jump rule: if any jump is available, only jump moves are returned.
def enumerate_valid_moves(board, player):
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

# Simple evaluation: piece count + king bonus + stack height
# (Can be improved for stronger AI)
def evaluate_board(board, player):
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

# Minimax with depth limit (no alpha-beta for now)
def minimax(board, player, depth, maximizing):
    if depth == 0:
        return evaluate_board(board, player), None
    moves = enumerate_valid_moves(board, player if maximizing else (2 if player == 1 else 1))
    if not moves:
        return evaluate_board(board, player), None
    best_score = float('-inf') if maximizing else float('inf')
    best_move = None
    for move in moves:
        new_board = copy.deepcopy(board)
        sr, sc = move[0]
        er, ec = move[1]
        # Apply move
        valid, _, kinged = validate_move(new_board, (sr, sc), (er, ec))
        if not valid:
            continue
        dr, dc = er - sr, ec - sc
        # Remove jumped piece if jump move
        if (abs(dr), abs(dc)) == (2, 2):
            mr, mc = sr + dr // 2, sc + dc // 2
            new_board[mr][mc] = []
        moving_stack = new_board[sr][sc][:]
        new_board[er][ec] = new_board[er][ec] + moving_stack
        new_board[sr][sc] = []
        if kinged:
            if new_board[er][ec]:
                if new_board[er][ec][-1] == 1:
                    new_board[er][ec][-1] = 3
                elif new_board[er][ec][-1] == 2:
                    new_board[er][ec][-1] = 4
        score, _ = minimax(new_board, player, depth - 1, not maximizing)
        if maximizing:
            if score > best_score:
                best_score = score
                best_move = move
        else:
            if score < best_score:
                best_score = score
                best_move = move
    return best_score, best_move

# Main AI entry point
def choose_ai_move(board, player, depth=2):
    """
    Returns the best move for the given player using minimax.
    Returns: (start_pos, end_pos) or None if no moves.
    """
    _, move = minimax(board, player, depth, True)
    return move
