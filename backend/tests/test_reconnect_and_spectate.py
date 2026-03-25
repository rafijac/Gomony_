import unittest
import requests

BASE_URL = "http://localhost:8001"

def _create_and_join():
    r1 = requests.post(f"{BASE_URL}/game/create")
    d1 = r1.json()
    game_id = d1["game_id"]
    p1_token = d1["session_token"]
    r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
    p2_token = r2.json()["session_token"]
    return game_id, p1_token, p2_token

class TestReconnectAndSpectate(unittest.TestCase):
    def setUp(self):
        requests.post(f"{BASE_URL}/reset")

    def test_reconnect_existing_user(self):
        """Reconnect endpoint should restore session and board state for a user."""
        game_id, p1_token, p2_token = _create_and_join()
        # Simulate disconnect: lose token, reconnect with game_id and player_number
        r = requests.post(f"{BASE_URL}/game/reconnect", json={
            "game_id": game_id, "player_number": 1
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("session_token", data)
        self.assertIn("board", data)
        self.assertIn("player_number", data)
        self.assertEqual(data["player_number"], 1)

    def test_spectate_game(self):
        """Spectate endpoint should return board state, no session token, and read-only flag."""
        game_id, p1_token, p2_token = _create_and_join()
        r = requests.get(f"{BASE_URL}/game/spectate/{game_id}")
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("board", data)
        self.assertIn("read_only", data)
        self.assertTrue(data["read_only"])
        self.assertNotIn("session_token", data)

if __name__ == "__main__":
    unittest.main()
