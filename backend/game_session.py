"""GameSession model and shared sessions registry."""
import secrets
import threading
from typing import Dict, Optional
from session_token_helpers import create_session_token
from board import make_initial_board


class LockedPlayerDict(dict):
    def __init__(self, parent, player_number, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._parent = parent
        self._player_number = player_number
    def __setitem__(self, key, value):
        if self._parent._player_info_locked:
            raise Exception("Cannot modify player info after game start.")
        super().__setitem__(key, value)
    def update(self, *args, **kwargs):
        if self._parent._player_info_locked:
            raise Exception("Cannot modify player info after game start.")
        super().update(*args, **kwargs)

class LockedPlayerInfo(dict):
    def __init__(self, parent, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._parent = parent
        # Wrap all initial dicts
        for k, v in list(self.items()):
            super().__setitem__(k, LockedPlayerDict(parent, k, **v))
    def __setitem__(self, key, value):
        if self._parent._player_info_locked:
            raise Exception("Cannot modify player info after game start.")
        # Always wrap value
        if not isinstance(value, LockedPlayerDict):
            value = LockedPlayerDict(self._parent, key, **value)
        super().__setitem__(key, value)
    def get(self, key, default=None):
        return super().get(key, default)
    def __getitem__(self, key):
        return super().__getitem__(key)

class GameSession:
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.board = make_initial_board()
        self.current_player = 1
        self.move_count = 0
        self.pending_jump = None
        self.players = [1]
        self._player_info_locked = False
        self.player_info = LockedPlayerInfo(self, {1: {"display_name": "Player 1", "avatar_url": "/assets/avatars/avatar1.png"}})
        self.completed = False
        self.lock = threading.Lock()
        self.session_tokens: Dict[int, str] = {1: create_session_token()}
        self.orientations: Dict[int, str] = {1: "south"}
        self.end_state = None  # {'outcome': 'win'|'loss'|'draw'|'resign'|'timeout'|'disconnect'|'abandoned'|'simultaneous', 'winner': 1|2|None, 'custom_message': str}

    def add_player(self, player_number: int, display_name=None, avatar_url=None) -> str:
        if self._player_info_locked:
            raise Exception("Cannot add or modify player info after game start.")
        self.players.append(player_number)
        token = create_session_token()
        self.session_tokens[player_number] = token
        self.orientations[player_number] = "north" if player_number == 2 else "south"
        # Store player info
        if display_name or avatar_url:
            self.player_info[player_number] = {
                "display_name": display_name or f"Player {player_number}",
                "avatar_url": avatar_url or f"/assets/avatars/avatar{player_number}.png"
            }
        else:
            self.player_info[player_number] = {
                "display_name": f"Player {player_number}",
                "avatar_url": f"/assets/avatars/avatar{player_number}.png"
            }
        return token

    def start_game(self):
        self._player_info_locked = True

    def get_player_by_token(self, token: str) -> Optional[int]:
        for num, tok in self.session_tokens.items():
            if secrets.compare_digest(tok, token):
                return num
        return None

    def to_dict(self, player_number: Optional[int] = None):
        color_map = {1: "white", 2: "brown"}
        # Fallback for legacy sessions: ensure player_info always present
        for num in self.players:
            if num not in self.player_info:
                self.player_info[num] = {
                    "display_name": f"Player {num}",
                    "avatar_url": f"/assets/avatars/avatar{num}.png"
                }
        d = {
            "game_id": self.game_id,
            "board": self.board,
            "current_player": self.current_player,
            "move_count": self.move_count,
            "pending_jump": self.pending_jump,
            "current_turn_color": color_map.get(self.current_player),
            "starting_color": color_map[1],
            "players": [
                {"player_number": num, **self.player_info.get(num, {})}
                for num in self.players
            ],
        }
        if player_number:
            d["player_number"] = player_number
            d["orientation"] = self.orientations.get(player_number)
            d["your_color"] = color_map.get(player_number)
        if self.completed and self.end_state:
            d["end_state"] = self.end_state
        return d


# Shared sessions registry
sessions: Dict[str, GameSession] = {}
