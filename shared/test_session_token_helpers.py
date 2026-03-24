# test_session_token_helpers.py
import time
from session_token_helpers import create_session_token, validate_session_token, expire_session_token

def test_token_lifecycle():
    token = create_session_token(expires_in=1)
    assert validate_session_token(token)
    expire_session_token(token)
    assert not validate_session_token(token)

def test_token_expiry():
    token = create_session_token(expires_in=0.5)
    assert validate_session_token(token)
    time.sleep(0.6)
    assert not validate_session_token(token)
