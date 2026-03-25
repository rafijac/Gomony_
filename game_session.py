"""GameSession model and shared sessions registry."""
import secrets
import threading
from typing import Dict, Optional
from session_token_helpers import create_session_token
from board import make_initial_board


class GameSession:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.board = make_initial_board()
        self.current_player = 1
        self.move_count = 0
        self.pending_jump = None
        self.players = [1]
        self.completed = False
        self.lock = threading.Lock()
        self.session_tokens: Dict[int, str] = {1: create_session_token()}
        self.orientations: Dict[int, str] = {1: "south"}

    def add_player(self, player_number: int) -> str:
        self.players.append(player_number)
        token = create_session_token()
        self.session_tokens[player_number] = token
        self.orientations[player_number] = "north" if player_number == 2 else "south"
        return token

    def get_player_by_token(self, token: str) -> Optional[int]:
        for num, tok in self.session_tokens.items():
            if secrets.compare_digest(tok, token):
                return num
        return None

    def to_dict(self, player_number: Optional[int] = None):
        color_map = {1: "white", 2: "brown"}
        d = {
            "game_id": self.game_id,
            "board": self.board,
            "current_player": self.current_player,
            "move_count": self.move_count,
            "pending_jump": self.pending_jump,
            "current_turn_color": color_map.get(self.current_player),
            "starting_color": color_map[1],
        }
        if player_number:
            d["player_number"] = player_number
            d["orientation"] = self.orientations.get(player_number)
            d["your_color"] = color_map.get(player_number)
        return d


# Shared sessions registry
sessions: Dict[str, GameSession] = {}
