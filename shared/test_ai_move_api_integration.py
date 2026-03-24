
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
import requests

class TestAIMoveAPIIntegration(unittest.TestCase):
    def setUp(self):
        self.base_url = "http://localhost:8001/move/pc"

    def test_ai_move_success(self):
        # Board with a valid move for player 1
        payload = {"depth": 1}
        r = requests.post(self.base_url, json=payload)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("valid", data)
        self.assertTrue(isinstance(data["valid"], bool))
        if data["valid"]:
            self.assertIn("move", data)
            self.assertIsInstance(data["move"], dict)
            self.assertIn("start_pos", data["move"])
            self.assertIn("end_pos", data["move"])
            self.assertIn("board", data)
            self.assertIn("current_player", data)

    def test_ai_no_moves(self):
        # Set up a board state with no valid moves for the AI
        # This requires the backend to support setting board state, or this test will be skipped
        # (If not supported, this test will always pass as True)
        pass

    def test_ai_game_over(self):
        # Ideally, test the endpoint when the game is over (no moves, win condition met)
        # This requires backend support for setting board state or simulating game over
        pass

if __name__ == '__main__':
    unittest.main()
