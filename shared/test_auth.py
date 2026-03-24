# test_auth.py
import pytest
from auth import AuthManager
from user import User

def test_register_and_login_user():
    auth = AuthManager()
    token = auth.register_user("alice")
    assert token is not None
    assert auth.login_user("alice") == token

def test_duplicate_register():
    auth = AuthManager()
    auth.register_user("bob")
    token2 = auth.register_user("bob")
    # Should return same token for duplicate register
    assert token2 == auth.login_user("bob")

def test_guest_user():
    auth = AuthManager()
    guest_token = auth.register_user("")
    assert guest_token is not None
    assert auth.login_user("") == guest_token
