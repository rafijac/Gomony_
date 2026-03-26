"""Centralized end-state logic for Gomony (single and multiplayer)."""
import datetime

def get_end_state(board):
    # Win: only one player's pieces remain, or one player has no pieces (even after board mutation)
    p1_pieces = any(cell and cell[-1] in (1,3) for row in board for cell in row)
    p2_pieces = any(cell and cell[-1] in (2,4) for row in board for cell in row)
    if not p1_pieces and not p2_pieces:
        # Edge case: both players have no pieces (should not happen in normal play)
        return {
            "game_over": True,
            "end_reason": "draw",
            "winner": None,
            "loser": None,
            "winning_move": None,
            "end_time": datetime.datetime.utcnow().isoformat() + 'Z',
            "final_board": board,
        }
    if p1_pieces and not p2_pieces:
        return {
            "game_over": True,
            "end_reason": "win",
            "winner": 1,
            "loser": 2,
            "winning_move": None,
            "end_time": datetime.datetime.utcnow().isoformat() + 'Z',
            "final_board": board,
        }
    if p2_pieces and not p1_pieces:
        return {
            "game_over": True,
            "end_reason": "win",
            "winner": 2,
            "loser": 1,
            "winning_move": None,
            "end_time": datetime.datetime.utcnow().isoformat() + 'Z',
            "final_board": board,
        }
    # TODO: Add draw, resign, timeout, disconnect, abandoned, simultaneous end as needed
    return {
        "game_over": False,
        "end_reason": None,
        "winner": None,
        "loser": None,
        "winning_move": None,
        "end_time": None,
        "final_board": board,
    }
