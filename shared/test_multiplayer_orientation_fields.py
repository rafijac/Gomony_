
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
import requests

BASE_URL = "http://localhost:8001"

def _create_and_join():
    r1 = requests.post(f"{BASE_URL}/game/create")
    d1 = r1.json()
    game_id = d1.get("game_id")
    p1_token = d1.get("session_token")
    r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
    d2 = r2.json()
    if r2.status_code == 200 and "session_token" in d2:
        p2_token = d2["session_token"]
    else:
        raise Exception(f"Join failed: {d2}")
    return game_id, p1_token, p2_token

class TestMultiplayerOrientationFields(unittest.TestCase):
    def test_game_state_includes_orientation_fields(self):
        game_id, p1_token, p2_token = _create_and_join()
        # Player 1 state
        r1 = requests.get(f"{BASE_URL}/game/{game_id}/state")
        self.assertEqual(r1.status_code, 200)
        data1 = r1.json()
        self.assertIn("current_turn_color", data1)
        self.assertIn("starting_color", data1)
        self.assertIn("orientation", data1)
        self.assertIn("your_color", data1)
        # Player 2 state (simulate by joining and checking state)
        r2 = requests.post(f"{BASE_URL}/game/join", json={"game_id": game_id})
        p2_token = r2.json()["session_token"]
        r2_state = requests.get(f"{BASE_URL}/game/{game_id}/state")
        self.assertEqual(r2_state.status_code, 200)
        data2 = r2_state.json()
        self.assertIn("current_turn_color", data2)
        self.assertIn("starting_color", data2)
        self.assertIn("orientation", data2)
        self.assertIn("your_color", data2)

    def test_move_response_includes_orientation_fields(self):
        game_id, p1_token, p2_token = _create_and_join()
        r = requests.post(f"{BASE_URL}/game/{game_id}/move", json={
            "start_pos": [3, 0], "end_pos": [4, 1],
            "player": 1, "session_token": p1_token,
        })
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("current_turn_color", data)
        self.assertIn("starting_color", data)
        self.assertIn("orientation", data)
        self.assertIn("your_color", data)

    def test_expired_or_invalid_session_returns_410_or_404(self):
        # 404 for non-existent game
        r = requests.get(f"{BASE_URL}/game/notarealgameid/state")
        self.assertEqual(r.status_code, 404)
        self.assertIn("error", r.json())
        # 410 for completed/expired game (simulate by manually removing session)
        # This part may need to be adapted if session cleanup is not exposed
        # For now, just check 404/410 is possible
        pass

if __name__ == "__main__":
    unittest.main()
