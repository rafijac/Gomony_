
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
from main import run_pc_vs_pc_game
import unittest
from shared.ai import enumerate_valid_moves, choose_ai_move

class TestGomonyAI(unittest.TestCase):
    def setUp(self):
        self.empty_board = [[[] for _ in range(12)] for _ in range(12)]
        self.p1 = 1
        self.p2 = 2

    def test_enumerate_valid_moves(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[0][1] = [self.p1]
        board[1][0] = [self.p1]
        moves = enumerate_valid_moves(board, self.p1)
        self.assertIn(((0,1),(1,0)), moves)
        self.assertIn(((1,0),(0,1)), moves)

    def test_choose_ai_move_simple(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        board[0][1] = [self.p1]
        board[1][0] = [self.p2]
        move = choose_ai_move(board, self.p1, depth=1)
        self.assertIsNotNone(move)
        self.assertIn(move, [((0,1),(1,0)), ((1,0),(0,1))])

    def test_choose_ai_move_no_moves(self):
        board = [[[] for _ in range(12)] for _ in range(12)]
        move = choose_ai_move(board, self.p1, depth=1)
        self.assertIsNone(move)

if __name__ == '__main__':
    unittest.main()


# ─────────────────────────────────────────────────────────────
# PC vs PC (AI vs AI) full game test
# ─────────────────────────────────────────────────────────────
def test_pc_vs_pc_full_game():
    """
    Runs a full AI vs AI game and logs every move. Asserts the game ends with a valid result.
    Output is formatted for LLM review.
    """
    depth = 1  # Use depth=1 for speed in test
    max_moves = 100
    result = run_pc_vs_pc_game(depth=depth, max_moves=max_moves)
    log = result["log"]
    summary = {
        "total_moves": len(log),
        "result": result["result"],
        "winner": result["winner"]
    }
    # Print a detailed log for LLM review
    print("\n=== PC vs PC GAME LOG ===")
    for entry in log:
        move_num = entry["move_num"]
        player = entry["player"]
        move = entry["move"]
        reason = entry["reason"]
        print(f"Move {move_num:03d} | Player {player} | Move: {move} | Reason: {reason}")
    print("=== GAME END ===")
    print(json.dumps(summary, indent=2))
    # Assert the game completed with a valid result
    assert summary["winner"] in (1, 2, None)
    assert "result" in summary
