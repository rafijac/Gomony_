import unittest
from backend.shared.ai.choose_ai_move import choose_ai_move

class TestChooseAIMove(unittest.TestCase):
    def test_choose_ai_move_returns_move(self):
        # TODO: Replace with actual board state and expected move
        board_state = None
        move = choose_ai_move(board_state)
        self.assertIsInstance(move, (int, type(None)))

if __name__ == '__main__':
    unittest.main()
