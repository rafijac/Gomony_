import unittest
import sys
import os
import copy

# Allow imports from the backend directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from shared.validate_move import validate_move
from board import apply_move as _apply_move, get_jumps_from
from fastapi.testclient import TestClient
from main import app
import state as _s

client = TestClient(app)


class TestMultiJumpMechanics(unittest.TestCase):
    """Tests for the core jump mechanics (validate_move + apply_move)."""

    def setUp(self):
        self.player1 = 1  # white
        self.player2 = 2  # brown

    def test_double_jump_over_single_stacks(self):
        """Jumping over two single-piece stacks accumulates captured pieces."""
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2]
        board[5][5] = [self.player2]
        valid, _, kinged = validate_move(board, (2, 2), (4, 4))
        self.assertTrue(valid)
        _apply_move(board, 2, 2, 4, 4, kinged)
        valid, _, kinged = validate_move(board, (4, 4), (6, 6))
        self.assertTrue(valid)
        _apply_move(board, 4, 4, 6, 6, kinged)
        # Only the top of each stack is captured: [captured2, captured2, jumper1]
        self.assertEqual(board[6][6], [self.player2, self.player2, self.player1])

    def test_double_jump_over_tall_opponent_stack(self):
        """Jumping over a 2-piece stack only captures the TOP piece."""
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[2][2] = [self.player1]
        board[3][3] = [self.player2, self.player2]  # 2-deep brown stack
        board[5][5] = [self.player2]
        valid, _, kinged = validate_move(board, (2, 2), (4, 4))
        self.assertTrue(valid)
        _apply_move(board, 2, 2, 4, 4, kinged)
        # (3,3) still has the bottom brown piece after the top was captured
        self.assertEqual(board[3][3], [self.player2])
        valid, _, kinged = validate_move(board, (4, 4), (6, 6))
        self.assertTrue(valid)
        _apply_move(board, 4, 4, 6, 6, kinged)
        # [captured_top_of_tall_stack, captured_single, jumper]
        self.assertEqual(board[6][6], [self.player2, self.player2, self.player1])

    def test_get_jumps_from_detects_second_jump_with_tall_stack(self):
        """
        After the first jump, get_jumps_from correctly detects the second jump
        even when the jumper now carries a captured piece (stack height > 1).
        Dark squares: (9,2) -> (7,4) over (8,3), then (7,4) -> (5,6) over (6,5).
        """
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[9][2] = [self.player2]   # brown jumper
        board[8][3] = [self.player1]   # white to be jumped first
        board[6][5] = [self.player1]   # white to be jumped second
        # (7,4) and (5,6) are the empty landing squares

        valid, _, kinged = validate_move(board, (9, 2), (7, 4))
        self.assertTrue(valid, "First jump should be valid")
        _apply_move(board, 9, 2, 7, 4, kinged)

        # After first jump, stack at (7,4) = [captured_white, brown]
        self.assertEqual(board[7][4], [self.player1, self.player2])

        # get_jumps_from must detect the second jump (stack height should NOT matter)
        second_jumps = get_jumps_from(board, (7, 4))
        self.assertIn((5, 6), second_jumps,
                      f"Second jump (7,4)->(5,6) should be detected, got: {second_jumps}")


class TestMinimaxDoubleJumpEvaluation(unittest.TestCase):
    """
    Tests that the minimax correctly values a double-jump piece over a
    single-jump piece when the double-jump piece has a clear advantage.
    These tests would FAIL with the old buggy minimax (wrong board simulation
    + no multi-jump continuation) and PASS with the fix.
    """

    def test_minimax_prefers_double_jump_over_single_jump_at_depth2(self):
        """
        Board has two brown pieces:
          - A at (9,0): can only single-jump white at (8,1)
          - B at (9,6): can double-jump whites at (8,7) and (6,9)
        At depth=2 with correct multi-jump continuation, B's double jump is
        evaluated as capturing 2 pieces, clearly better than A's 1.
        The AI must choose piece B.
        """
        from shared.ai import choose_ai_move
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[9][0] = [2]   # brown A: single-jump opportunity
        board[8][1] = [1]   # white to be jumped by A
        board[9][6] = [2]   # brown B: double-jump opportunity
        board[8][7] = [1]   # white to be jumped by B (first)
        board[6][9] = [1]   # white to be jumped by B (second)

        move = choose_ai_move(board, 2, depth=2)

        self.assertIsNotNone(move, "AI must return a move")
        self.assertEqual(
            move[0], (9, 6),
            f"AI should choose piece B at (9,6) for the double jump, got {move[0]} instead. "
            f"This indicates the minimax doesn't correctly value multi-jump continuation."
        )


class TestPCDoubleJumpEnforcement(unittest.TestCase):
    """
    Tests that the /move/pc endpoint enforces the full double-jump chain
    when the PC has a clear two-jump opportunity with no alternative moves.
    """

    def _set_minimal_board(self, board):
        """Replace the global state board for isolated testing."""
        import json, copy
        _s.state["board"] = copy.deepcopy(board)
        _s.state["current_player"] = 2   # PC is brown
        _s.state["move_count"] = 0
        _s.state["pending_jump"] = None

    def test_pc_makes_double_jump_single_piece_stacks(self):
        """
        PC (brown, player 2) has ONE piece that can double-jump two white pieces.
        The /move/pc endpoint must execute BOTH jumps in a single call.
        Dark squares: brown at (9,2), whites at (8,3) and (6,5).
        """
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[9][2] = [2]  # brown piece
        board[8][3] = [1]  # first white to jump
        board[6][5] = [1]  # second white to jump
        # (7,4) and (5,6) are empty landing squares
        self._set_minimal_board(board)

        resp = client.post("/move/pc", json={"depth": 1})
        data = resp.json()

        self.assertTrue(data.get("valid"), f"PC move should be valid: {data}")
        moves = data.get("moves", [])
        self.assertEqual(len(moves), 2,
                         f"Expected 2 moves (double jump), got {len(moves)}: {moves}")

        result_board = data["board"]
        # Each captured top piece stacks under the jumper:
        # [first_captured_white, second_captured_white, brown_jumper]
        self.assertEqual(result_board[5][6], [1, 1, 2],
                         f"Final stack at (5,6) should be [white, white, brown], got {result_board[5][6]}")
        self.assertEqual(result_board[9][2], [], "Origin (9,2) should be empty")
        self.assertEqual(result_board[8][3], [], "Jumped square (8,3) should be empty")
        self.assertEqual(result_board[7][4], [], "Mid-landing (7,4) should be empty")
        self.assertEqual(result_board[6][5], [], "Jumped square (6,5) should be empty")

    def test_pc_makes_double_jump_over_tall_stack(self):
        """
        PC (brown, player 2) double-jumps: first over a 2-piece white stack,
        then over a single white piece.  Stack height of the jumped piece
        must NOT prevent the second jump from being detected.
        Dark squares: brown at (9,2), whites at (8,3) [2-deep] and (6,5).
        """
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[9][2] = [2]       # brown piece
        board[8][3] = [1, 1]    # tall white stack (2 pieces)
        board[6][5] = [1]       # single white piece
        self._set_minimal_board(board)

        resp = client.post("/move/pc", json={"depth": 1})
        data = resp.json()

        self.assertTrue(data.get("valid"), f"PC move should be valid: {data}")
        moves = data.get("moves", [])
        self.assertEqual(len(moves), 2,
                         f"Expected 2 moves (double jump over tall stack), got {len(moves)}: {moves}")

        result_board = data["board"]
        # After first jump: top of (8,3) captured, bottom stays
        # After second jump: (6,5) captured
        # Final stack at (5,6): [captured_top_of_tall, captured_single, brown]
        self.assertEqual(result_board[8][3], [1],
                         f"One piece should remain at (8,3) after capturing only top, got {result_board[8][3]}")
        self.assertEqual(result_board[5][6], [1, 1, 2],
                         f"Final stack should be [tall_top, single, brown], got {result_board[5][6]}")


if __name__ == '__main__':
    unittest.main()
