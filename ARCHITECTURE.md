# Gomony Architecture

> Last updated: 2026-03-29

---

## 1. Game Rules

### Board
- **12×12 grid.** Only dark squares are playable — squares where `(row + col) % 2 == 1`.
- **Starting positions:** Player 1 (white) occupies dark squares in rows 0–3; Player 2 (brown) in rows 8–11.
- Each cell holds a **stack** of piece IDs, ordered bottom→top. An empty cell is `[]`.

### Piece IDs
| ID | Meaning |
|----|---------|
| 1  | Player 1 normal piece |
| 2  | Player 2 normal piece |
| 3  | Player 1 king |
| 4  | Player 2 king |

### Normal Move
- Move the **entire stack** one diagonal step to an **empty** dark square.
- Non-kings move **forward only** (P1 toward row 11, P2 toward row 0).
- The destination must be completely empty — landing on an occupied square is always illegal.

### Jump (Capture)
- Jump diagonally over an adjacent **opponent** stack to the empty square two steps away.
- **Only the top piece of your stack** makes the jump — the rest of your stack stays behind.
- **The top piece of the jumped-over stack** is captured and placed **under** your jumping piece at the destination. The remainder of the jumped-over stack stays in place.
- Post-jump state at `end`: `board[end] = [captured_top, jumping_piece]`.
- **Mandatory jump rule:** if any jump is available for the current player, they must jump. Normal moves are only legal when no jumps exist.
- **Multi-jump:** if the just-landed piece can immediately jump again, the same player continues jumping until no further jump is available.

### Kinging
- A piece that reaches the opponent's back row (P1 → row 11, P2 → row 0) becomes a **king** (ID 1→3, 2→4).
- The turn **ends immediately** on kinging, even if a multi-jump would otherwise continue.
- Kings can move and jump in all four diagonal directions.

### Win Conditions
- Reduce the opponent's top-level pieces to zero (all stacks topped by opponent IDs are gone).
- Opponent has no valid moves on their turn.
- First player to land a stack of 3+ pieces on the opponent's back row wins (stacking victory).

---

## 2. System Overview

```
Browser (React/TS/Vite)
       │  HTTP / polling
       ▼
FastAPI backend (Python 3.11+, port 8001)
   ├── routes/single_player.py   — local 2P + PC mode
   ├── routes/multiplayer.py     — session-based MP mode
   ├── routes/auth.py            — login / registration
   ├── shared/validate_move.py   — canonical move validation
   ├── shared/ai.py              — minimax AI engine
   ├── board.py                  — board construction + mutation helpers
   ├── game_session/             — GameSession model (package)
   ├── end_state.py              — win/loss/draw detection
   └── state.py                  — global singleton for local play
```

---

## 3. Backend Deep-Dive

### 3.1 Entry Point — `backend/main.py`
Minimal FastAPI app. Registers the three route modules, enables CORS for `localhost:5173`, and starts uvicorn on port 8001.

### 3.2 Shared Move Validation — `backend/shared/validate_move.py`
**The canonical source of truth for all game rules.** Called by both route handlers and the AI engine.

Returns `(valid: bool, reason: str, kinged: bool)`.

Checks in order:
1. Bounds — both positions inside 12×12
2. Dark-square rule — `(row+col) % 2 == 1`
3. Source non-empty, player owns top piece
4. Diagonal adjacency (distance 1 or 2 only)
5. Empty destination
6. Non-king forward-only direction
7. Jump legality — correct jumped-over piece, empty landing
8. Mandatory jump rule — if any jump exists for the player, only jumps are accepted
9. King eligibility — sets `kinged=True` if back row reached

### 3.3 Board Helpers — `backend/board.py`

| Function | Purpose |
|----------|---------|
| `make_initial_board()` | Returns fresh 12×12 starting position |
| `apply_move(board, sr, sc, er, ec, kinged)` | Applies a validated move in-place |
| `move_stack(board, sr, sc, er, ec)` | Slides an entire stack (normal move) |
| `capture_stack(board, sr, sc, er, ec)` | Executes a jump capture |
| `maybe_king_top(board, er, ec)` | Kings the top piece if eligible |
| `get_jumps_from(board, pos)` | Returns valid jump destinations from a cell |
| `get_all_jumps(board, player)` | Returns True if any jump exists for a player |

`apply_move` delegates to `move_stack` or `capture_stack` based on distance, then optionally calls `maybe_king_top`.

### 3.4 AI Engine — `backend/shared/ai.py`
Implements minimax (no alpha-beta) for PC mode. Depth defaults to 2.

| Function | Purpose |
|----------|---------|
| `enumerate_valid_moves(board, player)` | Returns all legal moves; enforces mandatory jump |
| `evaluate_board(board, player)` | Heuristic: piece count + king bonus (3×) + stack height (0.2×) |
| `minimax(board, player, depth, maximizing)` | Recursive minimax; handles multi-jump continuations |
| `choose_ai_move(board, player, depth=2)` | Main entry point — returns `(start_pos, end_pos)` |
| `simulate_game(board, starting_player, depth, max_moves)` | Runs a full game loop between two AIs |
| `run_pc_vs_pc_game(depth, max_moves)` | Convenience wrapper for AI vs AI from initial board |

**Multi-jump continuations in minimax:** if a jump move does not result in kinging and further jumps are available from the landing square, the same player continues (maximizing flag is not flipped).

### 3.5 Local Game State — `backend/state.py`
A simple module-level dict holding the single-session board state for local (2P/PC) mode:
```python
state = { "board": ..., "current_player": 1, "move_count": 0, "pending_jump": None }
```
**Not used for multiplayer** — each MP session has its own `GameSession` object.

### 3.6 Game Session Package — `backend/game_session/`
Used exclusively for multiplayer sessions.

| File | Responsibility |
|------|---------------|
| `__init__.py` | Re-exports `GameSession`, `sessions` |
| `__main__.py` | `GameSession` class + `sessions: Dict[str, GameSession]` registry |
| `player_info.py` | `LockedPlayerInfo` / `LockedPlayerDict` — immutable after game start |
| `session_token.py` | `create_player_token`, `get_player_by_token` — HMAC-signed tokens |
| `board_state.py` | `initialize_board()` wrapper |

**Session lifecycle:**
1. POST `/game/create` — creates `GameSession`, assigns P1 token, returns `game_id`
2. POST `/game/{id}/join` — adds P2, assigns P2 token
3. POST `/game/{id}/move` — validated with session token, applies move, updates session state
4. GET `/game/{id}/state` — polled by frontend every 2.5 seconds; returns 410 if session expired
5. Sessions expire after inactivity (timeout enforced in route handler)

**Thread safety:** every `GameSession` holds a `threading.Lock()`. Route handlers acquire it for all state-mutating operations.

### 3.7 Route Modules

**`routes/single_player.py`**
- `GET /health`, `GET /state`, `POST /reset`, `POST /move`, `POST /ai-move`
- Uses `state.py` singleton
- `/ai-move` calls `choose_ai_move()` and applies the result

**`routes/multiplayer.py`**
- `POST /game/create`, `POST /game/{id}/join`, `POST /game/{id}/move`, `GET /game/{id}/state`, `POST /game/{id}/resign`
- Validates session tokens on every mutating request
- Returns HTTP 410 Gone when a session is expired or abandoned

**`routes/auth.py`**
- `POST /register`, `POST /login`
- Password hashing via `security.py` (bcrypt)
- JWT-based auth tokens via `auth.py`

### 3.8 End State Detection — `backend/end_state.py`
`get_end_state(board)` returns a dict merged into `/state` responses:
- Checks for zero opponent pieces (capture win)
- Checks for stacking win (3+ stack on back row)
- Returns `{ game_over: bool, winner: 1|2|None, reason: str }`

---

## 4. Frontend Deep-Dive

### 4.1 Application Shell — `frontend/src/App.tsx`
Wraps the entire app in `<GameProvider>`. Renders `<ModeSelectModal>` until a game mode is chosen, then renders `<GameBoard>` with the active `<Tooltip>` overlay provider.

### 4.2 State Layer — `GameContext.tsx` + supporting files

| File | Responsibility |
|------|---------------|
| `GameContext.tsx` | React context provider; owns all game state; 164 lines |
| `GameContextTypes.ts` | All shared TypeScript types: `GameContextValue`, `MoveResult`, `MoveResponse`, `initialBoard` |
| `hooks/useMoveStack.ts` | Encapsulates both local-move and MP-move HTTP logic; shared `applyMoveResponse` helper deduplicates response handling |

**State held in `GameProvider`:**
- `board` — 12×12 `number[][][]`
- `currentPlayer`, `pendingJump` — turn state
- `gameMode` — `'2P' | 'PC' | 'MP'`
- `isThinking` — true while AI is computing
- `playerNumber`, `orientation`, `sessionToken`, `gameId` — multiplayer session
- `sessionExpired` — triggers reconnect modal
- `lastMessage` — status/error text shown to user

**Multiplayer polling:** `useEffect` in `GameProvider` polls `GET /game/{id}/state` every 2500ms while `gameMode === 'MP'`. Returns 410 → sets `sessionExpired = true`.

**On mount reset:** a `useRef` guard prevents React StrictMode double-invoke from double-resetting the board.

### 4.3 Board Rendering — `GameBoard.tsx` + hooks

`GameBoard.tsx` (113 lines) is a thin orchestrator. All logic lives in hooks:

| Hook | Responsibility |
|------|---------------|
| `useBoardSizer` | `ResizeObserver` on the board area; calculates `boardPx` with perspective math |
| `useCellSelection` | `selected` cell state; `canSelect(x,y)` enforces ownership + turn + pending-jump rules; `isPendingCell(x,y)` |
| `useAIMoveAnimation` | Fetches AI move, animates flying piece, handles multi-jump sequences with delays; sets `aiMoveAnimating`, `flyingPiece`, `aiMoveDest` |
| `useBoardDragAndDrop` | `handleDragStart` / `handleDrop`; guards against drag during AI thinking |
| `useBoardKeyboardNavigation` | Arrow key navigation between board cells via `cellRefs` |

**AI animation constants** (`AI_MOVE_ANIMATION_DURATION = 900ms`, `AI_MULTI_JUMP_DELAY = 200ms`) are exported from `GameBoard.tsx` and imported by `useAIMoveAnimation`.

### 4.4 Subcomponents

| Component | Responsibility |
|-----------|---------------|
| `BoardGrid.tsx` | Pure rendering — maps board array to `<Cell>` grid; receives all callbacks as props |
| `Stack.tsx` | Renders a single stack as layered discs; piece ID → color mapping |
| `PlayerSidebar.tsx` | Both player cards, restart button, `ConfirmModal`, status messages, "PC is thinking" indicator |
| `PlayerCard.tsx` | Single player info card with active-turn highlight |
| `FlyingPieceOverlay.tsx` | Absolutely-positioned animated piece that flies from `from` → `to` during AI moves; CSS transition driven |
| `EndGameModal.tsx` | Win/loss/draw overlay; shows winner, offers restart |
| `LobbyModal.tsx` | MP game creation and join UI |
| `ModeSelectModal.tsx` | Initial mode picker (2P / PC / MP) |
| `ReconnectSpectator.tsx` | Reconnect prompt on session expiry; spectator mode notice |
| `PreferencesPanel.tsx` | Sound, animation, display preferences |
| `HelpModal.tsx` | In-game rules reference |
| `Tooltip.tsx` | Onboarding overlay system — wraps interactive elements with contextual hints |
| `ConfirmModal.tsx` | Generic two-button confirmation dialog |

### 4.5 API Layer

| File | Responsibility |
|------|---------------|
| `frontend/src/api.ts` | Axios instance pointed at `http://localhost:8001`; `postMove`, `setSessionToken` |
| `frontend/src/aiApi.ts` | `postAIMove()` — POST `/ai-move`; returns `AIMoveResponse` typed as `{ move, board, current_player, pending_jump, reason }` |

**Important type note:** `AIMoveResponse.move` is typed as a single `{start_pos, end_pos}` object. Multi-jump sequences from the backend use `(aiResult as any).moves` (array) — cast required because the typed interface does not include it.

### 4.6 3D Board Rendering
The board is rendered in a CSS pseudo-3D perspective view:
- `.board-perspective-wrapper` applies `perspective` and `rotateX` via CSS transforms.
- Each cell is a fixed-size square. Only dark squares render `<Stack>`.
- Stack height is visualised by stacking `<div>` discs 6px apart vertically.
- `FlyingPieceOverlay` uses absolute positioning calculated from board pixel size (`boardPx`) and cell coordinates to animate the piece arc.
- Board can be **flipped** (`isFlipped = orientation === 'north'`) for the P2 perspective in multiplayer — achieved via CSS `transform: rotateY(180deg)` on the board grid.

---

## 5. Data Flows

### 5.1 Local Move (2P / PC mode)
```
User clicks cell B → useCellSelection.canSelect() → setSelected(B)
User clicks cell D → handleCellClick(D)
  → useMoveStack → POST /move {start_pos, end_pos}
  → backend: validate_move → apply_move → update state.py
  → response: { valid, board, current_player, pending_jump }
  → setBoard, setCurrentPlayer, setPendingJump
  [if PC mode and now P2's turn]
  → useAIMoveAnimation.animateAIMove()
    → POST /ai-move
    → choose_ai_move(board, 2, depth=2)
    → animate flying piece over AI_MOVE_ANIMATION_DURATION ms
    → setBoardStateFromAI(aiResult)
```

### 5.2 Multiplayer Move
```
User makes move → useMoveStack
  → POST /game/{id}/move {start_pos, end_pos, player, session_token}
  → backend: verify token → acquire session.lock → validate_move → apply_move
  → response includes new session_token (rotation)
  → frontend updates board state from response
  [opponent's browser]
  → polling GET /game/{id}/state every 2500ms
  → receives updated board + current_player
  → setBoard, setCurrentPlayer, setPendingJump
```

### 5.3 Session Expiry
```
GET /game/{id}/state → 410 Gone
  → setSessionExpired(true)
  → <ReconnectSpectator> modal shown
  → user clicks Reconnect → setSessionExpired(false) + window.location.reload()
```

---

## 6. Module Boundaries & Rules

1. **All move validation lives in `shared/validate_move.py`** — never duplicated in route handlers or frontend.
2. **Frontend never validates moves independently** — it is optimistic on click but always applies the backend response. `canSelect()` is a UX guard only.
3. **AI logic is backend-only** — never reachable from the frontend except through the `/ai-move` endpoint.
4. **`state.py` is local-only** — multiplayer routes always use `GameSession` objects from the `sessions` dict.
5. **Session tokens are rotated on every move** — the backend returns a new token, the frontend updates it via `setApiSessionToken`.
6. **`GameContextTypes.ts` owns all shared TypeScript types** — `GameContext.tsx` and `useMoveStack.ts` import from it; no inline type re-declaration.
7. **File size limit: 200 lines** — all source files must stay under 200 lines. If a file exceeds this, split it. See `MODULARIZATION_CHECKLIST.md`.

---

## 7. File Map

```
Gomony/
├── backend/
│   ├── main.py                      FastAPI app entry point
│   ├── state.py                     Local game state singleton
│   ├── board.py                     Board construction + mutation helpers
│   ├── end_state.py                 Win/loss/draw detection
│   ├── models.py                    Pydantic request models
│   ├── auth.py                      JWT auth helpers
│   ├── security.py                  Password hashing (bcrypt)
│   ├── session_token_helpers.py     HMAC session token utilities
│   ├── user.py                      User model
│   ├── game_session/
│   │   ├── __init__.py              Re-exports GameSession, sessions
│   │   ├── __main__.py              GameSession class + sessions registry
│   │   ├── player_info.py           LockedPlayerInfo / LockedPlayerDict
│   │   ├── session_token.py         Token creation + lookup
│   │   └── board_state.py           initialize_board() wrapper
│   ├── routes/
│   │   ├── single_player.py         Local 2P + PC endpoints
│   │   ├── multiplayer.py           MP session endpoints
│   │   └── auth.py                  Auth endpoints
│   ├── shared/
│   │   ├── validate_move.py         ← Canonical move validation
│   │   ├── ai.py                    ← Minimax AI engine
│   │   └── ai/                      Skeleton modules (future split)
│   └── tests/
│
└── frontend/src/
    ├── App.tsx                      App shell + provider wiring
    ├── api.ts                       Axios instance + postMove
    ├── aiApi.ts                     postAIMove
    ├── hooks/
    │   └── usePreferences.ts        User preferences (sound, animations)
    └── components/
        ├── GameContextTypes.ts      ← All shared TS types
        ├── GameContext.tsx          ← State provider
        ├── GameBoard.tsx            ← Thin orchestrator (113 lines)
        ├── BoardGrid.tsx            Pure board renderer
        ├── Stack.tsx                Single cell stack renderer
        ├── PlayerSidebar.tsx        Player cards + restart + status
        ├── PlayerCard.tsx           Single player card
        ├── FlyingPieceOverlay.tsx   AI move animation overlay
        ├── EndGameModal.tsx         Game-over screen
        ├── LobbyModal.tsx           MP lobby UI
        ├── ModeSelectModal.tsx      Mode picker
        ├── ReconnectSpectator.tsx   Session expiry / spectator
        ├── PreferencesPanel.tsx     Settings UI
        ├── HelpModal.tsx            In-game rules
        ├── Tooltip.tsx              Onboarding hints
        ├── ConfirmModal.tsx         Generic confirm dialog
        └── hooks/
            ├── useBoardSizer.ts     Dynamic board sizing
            ├── useCellSelection.ts  Selection state + canSelect
            ├── useAIMoveAnimation.ts AI fetch + flying piece animation
            ├── useBoardDragAndDrop.ts Drag/drop handlers
            ├── useBoardKeyboardNavigation.ts Arrow key focus
            ├── useMoveStack.ts      HTTP move logic (local + MP)
            ├── useMultiplayerSession.ts MP session helpers
            └── useAIMoveTrigger.ts  Trigger AI move after P1 move
```

---

## 8. Extending the System

### Add a new win condition
1. Update `backend/end_state.py` — add detection logic
2. `get_end_state()` return dict is merged into all `/state` and `/move` responses automatically
3. Update `EndGameModal.tsx` to display the new outcome

### Add a new game rule or move type
1. Update `backend/shared/validate_move.py` — single source of truth
2. Update `backend/shared/ai.py` if it affects AI move enumeration
3. `canSelect()` in `useCellSelection.ts` may need UX-guard updates

### Add a new backend endpoint
1. Add handler to the appropriate `backend/routes/*.py` file
2. Add corresponding fetch call in `frontend/src/api.ts` or `aiApi.ts`
3. Update types in `GameContextTypes.ts` if response shape changes

### Change board size
1. `BOARD_SIZE` constant in `backend/shared/ai.py` and `backend/shared/validate_move.py`
2. `make_initial_board()` in `backend/board.py`
3. `initialBoard` in `frontend/src/components/GameContextTypes.ts`
4. `cellRefs` array size in `GameBoard.tsx`

### Add a third player / new piece color
1. Add new piece IDs (5, 6 for normal/king) in `validate_move.py`
2. Update `evaluate_board` in `ai.py`
3. Add color mapping in `Stack.tsx`
4. Update `GameContextValue` player number types in `GameContextTypes.ts`