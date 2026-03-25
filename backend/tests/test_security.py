# test_security.py
import time
from security import SecurityMiddleware

def test_rate_limiting_allows_within_limit():
    sec = SecurityMiddleware(max_requests=3, window_seconds=2)
    user = "user1"
    assert sec.allow_request(user)
    assert sec.allow_request(user)
    assert sec.allow_request(user)
    # 4th request should be blocked
    assert not sec.allow_request(user)

def test_rate_limiting_resets_after_window():
    sec = SecurityMiddleware(max_requests=2, window_seconds=1)
    user = "user2"
    assert sec.allow_request(user)
    assert sec.allow_request(user)
    assert not sec.allow_request(user)
    time.sleep(1.1)
    assert sec.allow_request(user)


def test_rate_limiting_blocks_brute_force():
    sec = SecurityMiddleware(max_requests=3, window_seconds=2)
    user = "brute"
    for i in range(3):
        assert sec.allow_request(user)
    # 4th and 5th should be blocked
    assert not sec.allow_request(user)
    assert not sec.allow_request(user)

def test_replay_protection_token_expiry():
    from session_token_helpers import create_session_token, validate_session_token
    token = create_session_token(expires_in=0.2)
    assert validate_session_token(token)
    time.sleep(0.3)
    assert not validate_session_token(token)
