"""Single-player game state."""
from board import make_initial_board

state: dict = {
    "board": make_initial_board(),
    "current_player": 1,
    "move_count": 0,
    "pending_jump": None,
    "ai_position_history": [],
}
