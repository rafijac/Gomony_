def validate_move(current_state, start_pos, end_pos):
    """
    Validates a move in Gomony, including kinging and king movement.
    Args:
        current_state: List[List[List[int]]] - 12x12 board, each cell is a stack of PlayerIDs (bottom to top).
        start_pos: Tuple[int, int] - (row, col) of the stack to move.
        end_pos: Tuple[int, int] - (row, col) destination.
    Returns:
        Tuple[bool, str, bool]: (is_valid, reason, kinged)
    """
    board = current_state
    rows, cols = 12, 12
    sr, sc = start_pos
    er, ec = end_pos

    # Check bounds
    if not (0 <= sr < rows and 0 <= sc < cols and 0 <= er < rows and 0 <= ec < cols):
        return False, "Position out of bounds", False

    # Check move distance (allow jump of 2)
    dr, dc = er - sr, ec - sc
    if (abs(dr), abs(dc)) not in [(1, 1), (2, 2)] or (sr == er and sc == ec):
        return False, "Invalid move distance", False

    start_stack = board[sr][sc]
    end_stack = board[er][ec]
    if not start_stack:
        return False, "No stack at start position", False

    moving_piece = start_stack[-1]
    # Only top piece can move
    if len(start_stack) == 0:
        return False, "Empty start stack", False

    # Determine if piece is a king and which pieces belong to the same player
    is_king = moving_piece in (3, 4)
    own_pieces = (1, 3) if moving_piece in (1, 3) else (2, 4)

    # For non-kings, restrict movement direction
    if not is_king:
        if moving_piece == 1 and er <= sr:
            return False, "White must move forward", False
        if moving_piece == 2 and er >= sr:
            return False, "Brown must move forward", False

    # Helper: did this move king the piece?
    def _kinged():
        if is_king:
            return False
        return (moving_piece == 1 and er == 11) or (moving_piece == 2 and er == 0)

    # Normal move (distance 1): destination must be empty in standard checkers
    if (abs(dr), abs(dc)) == (1, 1):
        kinged = _kinged()
        if end_stack:
            return False, "Destination must be empty for a normal move", False
        return True, "Valid move to empty cell", kinged

    # Jump move (distance 2)
    if (abs(dr), abs(dc)) == (2, 2):
        mr, mc = sr + dr // 2, sc + dc // 2
        middle_stack = board[mr][mc]
        if not middle_stack:
            return False, "No piece to jump over", False
        middle_piece = middle_stack[-1]
        # Must jump over opponent piece only
        if middle_piece in own_pieces:
            return False, "Cannot jump over own piece", False
        # Destination must be empty
        if board[er][ec]:
            return False, "Jump destination must be empty", False
        return True, "Valid jump", _kinged()

    return False, "Unknown move type", False

# Win conditions are not checked here; this function only validates a single move.
