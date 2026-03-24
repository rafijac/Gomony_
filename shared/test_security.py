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
