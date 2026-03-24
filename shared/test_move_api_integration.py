import unittest
import requests

BASE_URL = "http://localhost:8001"


def _create_and_join():
    """Helper: create game + join. Returns (game_id, p1_token, p2_token)."""
    r1 = requests.post(f"{BASE_URL}/game/create")
    d1 = r1.json()
    game_id, p1_token = d1["game_id"], d1["session_token"]
    r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
    p2_token = r2.json()["session_token"]
    return game_id, p1_token, p2_token


class TestMoveAPIIntegration(unittest.TestCase):

    def setUp(self):
        # Reset single-player state before each test
        requests.post(f"{BASE_URL}/reset")

    # ── Single-player /move endpoint (no token required) ───────────────────

    def test_single_player_valid_move(self):
        """Player 1 can make a valid diagonal move on the initial board."""
        # [3,0] has a player-1 piece on a dark square; [4,1] is empty dark square
        r = requests.post(f"{BASE_URL}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["valid"])

    def test_single_player_invalid_move_empty_start(self):
        """Moving from an empty square is invalid."""
        # [4,1] is empty at game start
        r = requests.post(f"{BASE_URL}/move", json={
            "start_pos": [4, 1], "end_pos": [5, 2],
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertFalse(data["valid"])
        self.assertIn("No stack at start position", data["reason"])

    # ── Multiplayer token auth via /game/{id}/move ─────────────────────────

    def test_move_requires_valid_session_token(self):
        """Move with invalid session token should be rejected."""
        game_id, p1_token, p2_token = _create_and_join()
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": "invalid-token",
        })
        self.assertEqual(r.status_code, 401)
        self.assertIn("error", r.json())

    def test_move_with_valid_token_and_player(self):
        """Move with correct session token and player should succeed."""
        game_id, p1_token, p2_token = _create_and_join()
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": p1_token,
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data["valid"])

    def test_move_with_wrong_player_token(self):
        """Move with mismatched player and session token should be rejected."""
        game_id, p1_token, p2_token = _create_and_join()
        # Player 1's token but claiming to be player 2
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [8, 1], "end_pos": [7, 2],
            "player": 2, "session_token": p1_token,
        })
        self.assertEqual(r.status_code, 401)
        self.assertIn("error", r.json())

    def test_game_state_includes_player_number_and_orientation(self):
        """Game create response should include player_number and orientation."""
        r = requests.post(f"{BASE_URL}/game/create")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("player_number", data)
        self.assertEqual(data["player_number"], 1)
        self.assertIn("orientation", data)
        self.assertEqual(data["orientation"], "south")

if __name__ == '__main__':
    unittest.main()
