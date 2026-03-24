# user.py
# Minimal User class for TDD
import uuid

class User:
    def __init__(self, username: str):
        self.id = str(uuid.uuid4())
        self.username = username
