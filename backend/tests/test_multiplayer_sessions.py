# TDD: Session token helpers (main.py or helper)
try:
    from main import create_session_token, validate_session_token, expire_session_token
except ImportError:
    create_session_token = validate_session_token = expire_session_token = None
# TDD: SecurityMiddleware (security.py)
try:
    from security import SecurityMiddleware
except ImportError:
    SecurityMiddleware = None
# TDD: AuthManager class (auth.py)
try:
    from auth import AuthManager
except ImportError:
    AuthManager = None


import unittest
import requests

# TDD: User class (user.py)
import pytest
try:
    from user import User
except ImportError:
    User = None

BASE_URL = "http://localhost:8001"


def _create_and_join():
    """Helper: create a game and join as player 2. Returns (game_id, p1_token, p2_token)."""
    r1 = requests.post(f"{BASE_URL}/game/create")
    d1 = r1.json()
    game_id = d1["game_id"]
    p1_token = d1["session_token"]
    r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
    p2_token = r2.json()["session_token"]
    return game_id, p1_token, p2_token


class TestMultiplayerSessions(unittest.TestCase):

    def test_create_and_validate_session_token(self):
        """TDD: create_session_token should generate a valid token, validate_session_token should accept it, expire_session_token should invalidate it."""
        if not (create_session_token and validate_session_token and expire_session_token):
            pytest.skip("Session token helpers not implemented yet")
        token = create_session_token(expires_in=2)
        assert isinstance(token, str)
        assert validate_session_token(token) is True
        expire_session_token(token)
        assert validate_session_token(token) is False

    def test_security_middleware_rate_limit(self):
        """TDD: SecurityMiddleware should rate limit after N requests."""
        if SecurityMiddleware is None:
            pytest.skip("SecurityMiddleware not implemented yet")
        sm = SecurityMiddleware(max_requests=2, window_seconds=1)
        user_id = "testuser"
        assert sm.allow_request(user_id) is True
        assert sm.allow_request(user_id) is True
        assert sm.allow_request(user_id) is False

    def test_auth_manager_register_and_login(self):
        """TDD: AuthManager should register and login a user, returning a session token."""
        if AuthManager is None:
            pytest.skip("AuthManager not implemented yet")
        am = AuthManager()
        token = am.register_user("guest2")
        assert isinstance(token, str)
        login_token = am.login_user("guest2")
        assert login_token == token

    def test_user_creation_assigns_unique_id(self):
        """TDD: User class should assign a unique id on creation."""
        if User is None:
            pytest.skip("User class not implemented yet")
        user = User(username="guest1")
        assert hasattr(user, "id")
        assert user.username == "guest1"
        assert isinstance(user.id, str)

    # ── Create / Join ──────────────────────────────────────────────────────

    def test_create_game_returns_session_token_and_orientation(self):
        r = requests.post(f"{BASE_URL}/game/create")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("game_id", data)
        self.assertIn("player", data)
        self.assertEqual(data["player"], 1)
        self.assertIn("session_token", data)
        self.assertIn("player_number", data)
        self.assertEqual(data["player_number"], 1)
        self.assertIn("orientation", data)
        self.assertEqual(data["orientation"], "south")

    def test_join_game_returns_session_token_and_orientation(self):
        r1 = requests.post(f"{BASE_URL}/game/create")
        game_id = r1.json()["game_id"]
        r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
        self.assertEqual(r2.status_code, 200)
        data = r2.json()
        self.assertEqual(data["player"], 2)
        self.assertEqual(data["game_id"], game_id)
        self.assertIn("session_token", data)
        self.assertIn("player_number", data)
        self.assertEqual(data["player_number"], 2)
        self.assertIn("orientation", data)
        self.assertEqual(data["orientation"], "north")

    def test_join_invalid_game(self):
        r = requests.post(f"{BASE_URL}/game/join", json={"game_id": "notarealgameid"})
        self.assertEqual(r.status_code, 404)
        self.assertIn("error", r.json())

    def test_join_full_game(self):
        r1 = requests.post(f"{BASE_URL}/game/create")
        game_id = r1.json()["game_id"]
        requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
        r3 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
        self.assertEqual(r3.status_code, 409)
        self.assertIn("error", r3.json())

    # ── Session token validation ───────────────────────────────────────────

    def test_move_requires_valid_session_token(self):
        game_id, p1_token, p2_token = _create_and_join()
        # Bad token → 401
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": "badtoken",
        })
        self.assertEqual(r.status_code, 401)
        self.assertIn("error", r.json())

    def test_move_without_session_token_rejected(self):
        game_id, p1_token, p2_token = _create_and_join()
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1,
        })
        self.assertEqual(r.status_code, 401)
        self.assertIn("error", r.json())

    def test_move_with_wrong_player_token(self):
        game_id, p1_token, p2_token = _create_and_join()
        # Use p2's token but claim to be player 1
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": p2_token,
        })
        self.assertEqual(r.status_code, 401)
        self.assertIn("error", r.json())

    def test_move_with_valid_token_succeeds(self):
        game_id, p1_token, p2_token = _create_and_join()
        # Player 1 makes a valid move (row 3, dark square col 0 → row 4, col 1)
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": p1_token,
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["valid"])

    # ── Turn and state isolation ───────────────────────────────────────────

    def test_move_wrong_player_turn(self):
        game_id, p1_token, p2_token = _create_and_join()
        # Player 2 tries to move first (should fail — it is player 1's turn)
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [8, 1], "end_pos": [7, 2],
            "player": 2, "session_token": p2_token,
        })
        self.assertEqual(r.status_code, 403)
        self.assertIn("error", r.json())

    def test_game_state_is_isolated(self):
        g1, t1_g1, _ = _create_and_join()
        g2, t1_g2, _ = _create_and_join()
        # Move in g1
        r1 = requests.post(f"{BASE_URL}/game/{g1}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": t1_g1,
        })
        self.assertEqual(r1.status_code, 200)
        # Move in g2 (different square)
        r2 = requests.post(f"{BASE_URL}/game/{g2}/move", json={
            "start_pos": [3, 2], "end_pos": [4, 3],
            "player": 1, "session_token": t1_g2,
        })
        self.assertEqual(r2.status_code, 200)
        # Boards should differ
        s1 = requests.get(f"{BASE_URL}/game/{g1}/state").json()
        s2 = requests.get(f"{BASE_URL}/game/{g2}/state").json()
        self.assertNotEqual(s1["board"], s2["board"])

    # ── Cleanup ────────────────────────────────────────────────────────────


    def test_session_cleanup(self):
        # Cleanup only removes completed games; a fresh game shouldn't be removed
        r = requests.post(f"{BASE_URL}/game/create")
        game_id = r.json()["game_id"]
        requests.post(f"{BASE_URL}/game/cleanup")
        r2 = requests.get(f"{BASE_URL}/game/{game_id}/state")
        # Fresh (non-completed) game should still exist
        self.assertEqual(r2.status_code, 200)

if __name__ == "__main__":
    unittest.main()
