"""
Board state management for GameSession.
Handles board initialization and state access.
"""
from board import make_initial_board

def initialize_board():
    """
    Return a new initial board state.
    """
    return make_initial_board()
