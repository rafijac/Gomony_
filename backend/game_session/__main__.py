"""
GameSession model and shared sessions registry.
Delegates player info, session token, and board state logic to helpers for modularity.
"""
import threading
from typing import Dict, Optional
from game_session.player_info import LockedPlayerInfo
from game_session.session_token import create_player_token, get_player_by_token
from game_session.board_state import initialize_board

class GameSession:
    """
    Represents a single game session, including board state, player info, and session tokens.
    Delegates player info, session token, and board state logic to helpers for modularity.
    """
    def __init__(self, game_id: str):
        self.game_id = game_id
        self.board = initialize_board()
        self.current_player = 1
        self.move_count = 0
        self.pending_jump = None
        self.players = [1]
        self._player_info_locked = False
        self.player_info = LockedPlayerInfo(self, {1: {"display_name": "Player 1", "avatar_url": "/assets/avatars/avatar1.png"}})
        self.completed = False
        self.lock = threading.Lock()
        self.session_tokens: Dict[int, str] = {}
        # Create initial session token for player 1
        self.session_tokens[1] = create_player_token(self.session_tokens, 1)
        self.orientations: Dict[int, str] = {1: "south"}
        self.end_state = None  # {'outcome': 'win'|'loss'|'draw'|'resign'|'timeout'|'disconnect'|'abandoned'|'simultaneous', 'winner': 1|2|None, 'custom_message': str}

    def add_player(self, player_number: int, display_name=None, avatar_url=None) -> str:
        """
        Add a player to the session, assign orientation, and create session token.
        Player info can only be modified before the game starts.
        """
        if self._player_info_locked:
            raise Exception("Cannot add or modify player info after game start.")
        self.players.append(player_number)
        token = create_player_token(self.session_tokens, player_number)
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
        """
        Lock player info to prevent further edits after game start.
        """
        self._player_info_locked = True

    def get_player_by_token(self, token: str) -> Optional[int]:
        """
        Return the player number for a given session token, or None if not found.
        """
        return get_player_by_token(self.session_tokens, token)

    def to_dict(self, player_number: Optional[int] = None):
        """
        Return a dictionary representation of the session, including player info and board state.
        Ensures legacy fallback for missing player info.
        """
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
