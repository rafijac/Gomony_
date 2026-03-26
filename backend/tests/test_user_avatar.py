import pytest
from user import User

def test_user_avatar_and_display_name():
    user = User(username="alice", display_name="Alice", avatar_url="/assets/avatars/avatar2.png")
    assert user.username == "alice"
    assert user.display_name == "Alice"
    assert user.avatar_url == "/assets/avatars/avatar2.png"

def test_user_avatar_fallback():
    user = User(username="bob")
    assert user.display_name == "bob" or user.display_name == "Player"
    assert user.avatar_url is not None
