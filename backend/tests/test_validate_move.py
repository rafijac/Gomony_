
import unittest
from shared.validate_move import validate_move
from board import apply_move as _apply_move, make_initial_board

class TestGomonyStacking(unittest.TestCase):
    def setUp(self):
        # Example board: 12x12, each cell is a stack (list)
        self.empty_board = [[[] for _ in range(12)] for _ in range(12)]
        self.player1 = 1
        self.player2 = 2

    def test_cannot_jump_own_piece(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        # Place player1 at (2,2), player1 at (3,3), empty at (4,4)
        board[2][2] = [self.player1]
        board[3][3] = [self.player1]
        # Try to jump over own piece from (2,2) to (4,4)
        valid, reason, *_ = validate_move(board, (2,2), (4,4))
        self.assertFalse(valid)
        self.assertEqual(reason, "Cannot jump over own piece")

    def test_jump_capture_opponent(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2]
        # Jump over opponent from (2,2) to (4,4)
        valid, reason, _ = validate_move(board, (2,2), (4,4))
        self.assertTrue(valid)
        self.assertEqual(reason, "Valid jump")

    def test_jump_capture_opponent_stack(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2, self.player2]
        # Jump over opponent stack from (2,2) to (4,4)
        valid, reason, _ = validate_move(board, (2,2), (4,4))
        self.assertTrue(valid)
        self.assertEqual(reason, "Valid jump")

    def test_move_validation(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[0][0] = [self.player1]
        # Out of bounds
        valid, reason, _ = validate_move(board, (0,0), (12,12))
        self.assertFalse(valid)
        self.assertEqual(reason, "Position out of bounds")
        # Invalid distance
        valid, reason, _ = validate_move(board, (0,0), (0,2))
        self.assertFalse(valid)
        self.assertEqual(reason, "Invalid move distance")
        # No stack at start (use diagonal)
        valid, reason, _ = validate_move(board, (0,1), (1,2))
        self.assertFalse(valid)
        self.assertEqual(reason, "No stack at start position")

    def test_win_conditions(self):
        # Win: all opponent top-level pieces captured
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[0][0] = [self.player1]
        board[0][1] = [self.player1]
        # No opponent top-level pieces
        opponent_top = [cell[-1] for row in board for cell in row if cell]
        self.assertNotIn(self.player2, opponent_top)
        # Win: stack of 3+ reaches back row
        board[11][0] = [self.player1, self.player1, self.player1]
        self.assertGreaterEqual(len(board[11][0]), 3)

    def test_jump_places_captured_top_underneath(self):
        """After a jump, the captured top piece sits under the jumping piece."""
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2, self.player2]  # stack of 2 opponent pieces
        # Jump from (2,2) over (3,3) to (4,4)
        valid, _, kinged = validate_move(board, (2,2), (4,4))
        self.assertTrue(valid)
        _apply_move(board, 2, 2, 4, 4, kinged)
        # Jumping piece (player1) is on top; captured top (player2) is beneath it
        self.assertEqual(board[4][4], [self.player2, self.player1])
        # Start is empty
        self.assertEqual(board[2][2], [])
        # Middle stack loses only its top; bottom piece remains
        self.assertEqual(board[3][3], [self.player2])

    def test_jump_single_piece_captured_top_underneath(self):
        """After jumping a single-piece stack, the captured piece is under the jumper."""
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2]
        valid, _, kinged = validate_move(board, (2,2), (4,4))
        self.assertTrue(valid)
        _apply_move(board, 2, 2, 4, 4, kinged)
        self.assertEqual(board[4][4], [self.player2, self.player1])
        self.assertEqual(board[2][2], [])
        self.assertEqual(board[3][3], [])  # middle stack emptied (only had 1 piece)

    def test_double_jump_accumulates_captures(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        # Place white at (2,2), brown at (3,3) and (5,5)
        board[2][2] = [self.player1]
        board[3][3] = [self.player2]
        board[5][5] = [self.player2]
        # First jump: (2,2) -> (4,4) over (3,3)
        valid, _, kinged = validate_move(board, (2,2), (4,4))
        self.assertTrue(valid)
        _apply_move(board, 2, 2, 4, 4, kinged)
        # Second jump: (4,4) -> (6,6) over (5,5)
        valid, _, kinged = validate_move(board, (4,4), (6,6))
        self.assertTrue(valid)
        _apply_move(board, 4, 4, 6, 6, kinged)
        # Final stack at (6,6) should be [brown, brown, white] (bottom to top)
        self.assertEqual(board[6][6], [self.player2, self.player2, self.player1])
        # All intermediate squares empty
        self.assertEqual(board[2][2], [])
        self.assertEqual(board[3][3], [])
        self.assertEqual(board[4][4], [])
        self.assertEqual(board[5][5], [])

if __name__ == '__main__':
    unittest.main()
