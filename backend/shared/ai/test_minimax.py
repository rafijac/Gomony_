import unittest
from backend.shared.ai.minimax import minimax

class TestMinimax(unittest.TestCase):
    def test_minimax_returns_move_and_score(self):
        # TODO: Replace with actual board state and expected output
        board_state = None
        move, score = minimax(board_state, depth=1, maximizing=True)
        self.assertIsInstance(move, (int, type(None)))
        self.assertIsInstance(score, (int, float))

if __name__ == '__main__':
    unittest.main()
