import unittest
from backend.shared.ai.enumerate_valid_moves import enumerate_valid_moves

class TestEnumerateValidMoves(unittest.TestCase):
    def test_enumerate_valid_moves_returns_moves(self):
        # TODO: Replace with actual board state and expected moves
        board_state = None
        moves = enumerate_valid_moves(board_state)
        self.assertIsInstance(moves, list)

if __name__ == '__main__':
    unittest.main()
