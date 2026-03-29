
def is_within_bounds(pos, rows=12, cols=12):
    """Check if a position (row, col) is within the board bounds."""
    r, c = pos
    return 0 <= r < rows and 0 <= c < cols

def is_valid_move_distance(sr, sc, er, ec):
    """Check if the move is a valid diagonal step or jump."""
    dr, dc = er - sr, ec - sc
    return ((abs(dr), abs(dc)) in [(1, 1), (2, 2)]) and not (sr == er and sc == ec)

def get_moving_piece(board, sr, sc):
    """Return the top piece at the start position, or None if empty."""
    stack = board[sr][sc]
    if not stack:
        return None
    return stack[-1]

def is_king(piece):
    """Return True if the piece is a king (3 or 4)."""
    return piece in (3, 4)

def own_pieces(piece):
    """Return the tuple of piece values that belong to the same player (normal, king)."""
    return (1, 3) if piece in (1, 3) else (2, 4)

def is_forward_move(piece, sr, er):
    """Check if a non-king piece moves forward (white: increasing row, brown: decreasing row)."""
    if piece == 1:
        return er > sr
    if piece == 2:
        return er < sr
    return True  # kings can move any direction

def is_kinged(piece, er):
    """Return True if this move would king the piece."""
    if is_king(piece):
        return False
    return (piece == 1 and er == 11) or (piece == 2 and er == 0)

def is_normal_move_valid(board, er, ec):
    """Normal move (distance 1): destination must be empty."""
    return not board[er][ec]

def is_jump_move_valid(board, sr, sc, er, ec, own_piece_types):
    """
    Jump move (distance 2):
      - There must be a piece to jump over (middle square not empty)
      - The piece jumped over must be an opponent
      - Destination must be empty
    """
    mr, mc = sr + (er - sr) // 2, sc + (ec - sc) // 2
    middle_stack = board[mr][mc]
    if not middle_stack:
        return False, "No piece to jump over"
    middle_piece = middle_stack[-1]
    if middle_piece in own_piece_types:
        return False, "Cannot jump over own piece"
    if board[er][ec]:
        return False, "Jump destination must be empty"
    return True, "Valid jump"

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
    sr, sc = start_pos
    er, ec = end_pos

    # 1. Check bounds
    if not (is_within_bounds((sr, sc)) and is_within_bounds((er, ec))):
        return False, "Position out of bounds", False

    # 2. Check move distance
    if not is_valid_move_distance(sr, sc, er, ec):
        return False, "Invalid move distance", False

    # 3. Check start stack
    moving_piece = get_moving_piece(board, sr, sc)
    if moving_piece is None:
        return False, "No stack at start position", False

    # 4. Only top piece can move (redundant with above, but explicit)
    if len(board[sr][sc]) == 0:
        return False, "Empty start stack", False

    # 5. Determine piece type
    king = is_king(moving_piece)
    own_piece_types = own_pieces(moving_piece)

    dr, dc = er - sr, ec - sc

    # 7. Normal move (distance 1): non-kings restricted to forward direction
    if (abs(dr), abs(dc)) == (1, 1):
        if not king and not is_forward_move(moving_piece, sr, er):
            if moving_piece == 1:
                return False, "White must move forward", False
            if moving_piece == 2:
                return False, "Brown must move forward", False
        if not is_normal_move_valid(board, er, ec):
            return False, "Destination must be empty for a normal move", False
        return True, "Valid move to empty cell", is_kinged(moving_piece, er)

    # 8. Jump move (distance 2): non-kings restricted to forward direction
    if (abs(dr), abs(dc)) == (2, 2):
        if not king and not is_forward_move(moving_piece, sr, er):
            if moving_piece == 1:
                return False, "White must jump forward", False
            if moving_piece == 2:
                return False, "Brown must jump forward", False
        valid, reason = is_jump_move_valid(board, sr, sc, er, ec, own_piece_types)
        if not valid:
            return False, reason, False
        return True, reason, is_kinged(moving_piece, er)

    # 9. Unknown move type
    return False, "Unknown move type", False

# Win conditions are not checked here; this function only validates a single move.
