# user.py
# Minimal User class for TDD
import uuid

class User:
    def __init__(self, username: str, display_name: str = None, avatar_url: str = None):
        self.id = str(uuid.uuid4())
        self.username = username
        # Fallback: display_name defaults to username or 'Player'
        self.display_name = display_name if display_name is not None else (username if username else "Player")
        # Fallback: avatar_url defaults to preset 1
        self.avatar_url = avatar_url if avatar_url is not None else "/assets/avatars/avatar1.png"
