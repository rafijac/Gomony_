# auth.py
from user import User

class AuthManager:
    def __init__(self):
        self.users = {}
        self.tokens = {}

    def register_user(self, username):
        user = User(username)
        token = user.id
        self.users[username] = user
        self.tokens[username] = token
        return token

    def login_user(self, username):
        return self.tokens.get(username)
