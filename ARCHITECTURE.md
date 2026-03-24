# Gomony Project Architecture

## Game Overview
- **Gomony** is a 2-player abstract strategy game built on standard checkers rules, with a unique stacking twist.
- **Board:** 12×12 grid, only dark squares are used (where row+col is odd).
- **Pieces:** Player 1 (white) starts in rows 0–3, Player 2 (brown) in rows 8–11.
- **Win:** Capture all of the opponent's top-level pieces (reduce them to zero), or be the last player with valid moves.

## Rules
### Normal Move
- Move your **entire stack** one step diagonally to an **empty** dark square.
- Non-kings may only move forward (Player 1 moves toward row 11; Player 2 toward row 0).
- Destination **must** be empty — landing on any occupied square is illegal.

### Jump (Capture)
- Jump diagonally over an adjacent **opponent** stack to a **empty** square two steps away.
- Only the **top piece of your stack** makes the jump.
- The **top piece of the jumped-over stack** is captured and placed **underneath** your jumping piece at the destination. The rest of the jumped-over stack remains in place.
- So after a jump landing at `end`: `board[end] = [captured_top, your_piece]`.
- If any jump is available, the current player **must** jump (mandatory jump rule).
- Multi-jumps: if the just-landed piece can jump again from `end`, the turn continues until no more jumps are possible.

### Kinging
- A piece that reaches the opponent's back row (Player 1 reaches row 11; Player 2 reaches row 0) becomes a **king** (ID 3 or 4).
- Kings can move and jump in **all four** diagonal directions.
- A piece is kinged at the end of the move that brings it to the back row; the turn ends there even during a multi-jump.

## Backend (Python/FastAPI)
- **main.py**: FastAPI app, CORS enabled for frontend dev.
- **Board state:** `List[List[List[int]]]` (12×12 grid, each cell is a stack of player IDs, bottom→top).
- **Endpoints:**
  - `GET /state`: Returns `{ board, current_player, move_count }`
  - `POST /move`: `{ start_pos, end_pos }` → validates and updates board, returns `{ valid, reason, board, current_player }`
  - `POST /reset`: Resets game
- **Move validation:** In `shared/validate_move.py`. Checks bounds, adjacency, empty-destination rule, mandatory jump rule.
- **Move application:** `_apply_move()` in `main.py`. Normal move: whole stack slides to empty destination. Jump: only top piece of start jumps; top of jumped-over stack is captured and placed under the jumping piece.

## Frontend (React/TypeScript/Vite)
- **Key files:**
  - `frontend/src/components/GameBoard.tsx`: Renders the board grid, handles selection, drag/drop, and move logic.
  - `frontend/src/components/Stack.tsx`: Renders all pieces in a stack as layered discs, each colored by player.
  - `frontend/src/components/GameContext.tsx`: Manages board state, syncs with backend, exposes move function.
  - `frontend/src/components/GameBoard.css`: CSS for grid, angled 3D board, and disc stacking.
- **Rendering:**
  - Board is shown in an angled (isometric) 3D view using CSS perspective and rotateX.
  - Each stack is rendered as a vertical stack of discs, offset upward by 6px per piece.
  - Top piece color = owner; captured pieces are visible below.
- **State sync:** On load, frontend fetches `/state` to sync with backend.
- **Move logic:** Click or drag to select/move stacks. Backend validates all moves.

## Data Model
- **Board:** 12×12 array of arrays of arrays: `board[row][col] = [playerId, ...]` (bottom→top)
- **Stack:** Array of player IDs. Topmost controls the stack.
- **API responses:** Always include the full board and current player after a move.

## Conventions & Gotchas
- **Only dark squares** are playable; light squares are always empty.
- **Frontend and backend must agree** on board orientation and stack order (bottom→top).
- **All move validation** is done on the backend; frontend is optimistic but always updates from backend state.
- **CSS perspective** is set in `.board-perspective-wrapper` and `.game-board` for 3D effect.

## Extending/Debugging
- To add new rules, update `validate_move.py` and sync logic in frontend if needed.
- For new piece types/colors, update `playerColors` in `Stack.tsx`.
- For win conditions, add logic to backend and expose in `/state` or a new endpoint.

---

For more, see code comments in each file. This doc is kept up to date with major changes.