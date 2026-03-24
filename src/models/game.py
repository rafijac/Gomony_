# src/models/game.py
from typing import List, Dict, Optional
import threading
from src.utils.session_token_helpers import create_session_token

class GameSession:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.board = self.make_initial_board()
        self.current_player = 1
        self.move_count = 0
        self.pending_jump = None
        self.players = [1]
        self.completed = False
        self.lock = threading.Lock()
        self.session_tokens: Dict[int, str] = {1: create_session_token()}
        self.orientations: Dict[int, str] = {1: "south"}

    @staticmethod
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

    def add_player(self, player_number: int) -> str:
        self.players.append(player_number)
        token = create_session_token()
        self.session_tokens[player_number] = token
        self.orientations[player_number] = "north" if player_number == 2 else "south"
        return token

    def get_player_by_token(self, token: str) -> Optional[int]:
        for num, tok in self.session_tokens.items():
            if tok == token:
                return num
        return None

    def to_dict(self, player_number: Optional[int] = None):
        color_map = {1: "white", 2: "brown"}
        starting_color = color_map[1]
        d = {
            "game_id": self.game_id,
            "board": self.board,
            "current_player": self.current_player,
            "move_count": self.move_count,
            "pending_jump": self.pending_jump,
            "current_turn_color": color_map.get(self.current_player, None),
            "starting_color": starting_color,
        }
        if player_number:
            d["player_number"] = player_number
            d["orientation"] = self.orientations.get(player_number)
            d["your_color"] = color_map.get(player_number, None)
        return d
