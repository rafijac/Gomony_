"""
Player info management for GameSession.
Handles player display names, avatars, and edit locking.
"""
from typing import Dict

class LockedPlayerDict(dict):
    """
    Dictionary for a single player's info that enforces edit lock after game start.
    """
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
    """
    Dictionary of all players' info, with edit lock enforcement and auto-wrapping.
    """
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
