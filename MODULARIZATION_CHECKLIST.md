
# Gomony Modularization Checklist (Strict LLM-Friendly Version)

**Goal:**
- All source files should be as small and focused as possible for LLM and human maintainability.
- Any file over **200 lines** cannot be considered modularized, regardless of delegation.
- Modularized = file is under 200 lines and delegates logic to subcomponents/modules where possible.
- This checklist is auto-generated from line counts. Update as files are split or shrink.

> Line counts last measured: 2026-03-29 (script: see repo for details)

| File Path                                   | Line Count | Modularized | Documented | Notes |
|---------------------------------------------|------------|-------------|------------|-------|
| frontend/src/components/GameBoard.tsx       | 113        | [x]         | [x]        | Modularized into hooks + PlayerSidebar. |
| frontend/src/components/GameContext.tsx     | 164        | [x]         | [x]        | Modularized: types → GameContextTypes.ts, logic → useMoveStack. |
| backend/shared/ai.py                        | 213        | [ ]         | [ ]        | Too large. Needs further splitting. |
| backend/routes/single_player.py             | 158        | [ ]         | [ ]        | Split route handlers from game logic. |
| backend/routes/multiplayer.py               | 157        | [ ]         | [ ]        | Split route handlers and helpers. |
| frontend/src/components/BoardGrid.tsx       | 145        | [x]         | [x]        | Modularized and documented. |
| frontend/src/components/EndGameModal.tsx    | 133        | [x]         | [ ]        | Modularized, but review for further split. |
| frontend/src/components/PreferencesPanel.tsx| 128        | [x]         | [ ]        | Modularized, but review for further split. |
| backend/shared/validate_move.py             | 102        | [x]         | [ ]        | Modularized. |
| frontend/src/App.tsx                        | 97         | [x]         | [ ]        | Modularized. |
| backend/game_session/__main__.py            | 97         | [x]         | [ ]        | Modularized. |
| frontend/src/components/LobbyModal.tsx      | 96         | [x]         | [ ]        | Modularized. |
| frontend/src/components/FlyingPieceOverlay.tsx| 92      | [x]         | [ ]        | Modularized. |
| backend/game_session.py (deprecated)        | 90         | [x]         | [ ]        | Modularized. |
| backend/board.py                            | 90         | [x]         | [ ]        | Modularized. |
| frontend/src/components/Tooltip.tsx         | 77         | [x]         | [ ]        | Modularized. |
| backend/main.py                             | 77         | [x]         | [ ]        | Modularized. |
| frontend/src/components/Stack.tsx           | 69         | [x]         | [ ]        | Modularized. |
| frontend/src/components/HelpModal.tsx       | 60         | [x]         | [ ]        | Modularized. |
| frontend/src/components/ModeSelectModal.tsx | 57         | [x]         | [ ]        | Modularized. |
| backend/end_state.py                        | 47         | [x]         | [ ]        | Modularized. |
| frontend/src/components/AnalyticsProvider.tsx| 45        | [x]         | [ ]        | Modularized. |
| backend/game_session/player_info.py         | 42         | [x]         | [ ]        | Modularized. |
| backend/routes/auth.py                      | 40         | [x]         | [ ]        | Modularized. |
| frontend/src/api.ts                         | 37         | [x]         | [ ]        | Modularized. |
| frontend/src/components/ErrorBoundary.tsx   | 34         | [x]         | [ ]        | Modularized. |
| frontend/src/hooks/usePreferences.ts        | 32         | [x]         | [ ]        | Modularized. |
| frontend/src/components/AvatarSelector.tsx  | 31         | [x]         | [ ]        | Modularized. |
| frontend/src/components/ConfirmModal.tsx    | 25         | [x]         | [ ]        | Modularized. |
| backend/session_token_helpers.py            | 19         | [x]         | [ ]        | Modularized. |
| frontend/src/components/ReconnectSpectator.tsx| 22      | [x]         | [ ]        | Modularized. |
| backend/game_session/session_token.py       | 22         | [x]         | [ ]        | Modularized. |
| frontend/src/aiApi.ts                       | 21         | [x]         | [ ]        | Modularized. |
| frontend/src/components/PlayerInfo.tsx      | 20         | [x]         | [ ]        | Modularized. |
| backend/auth.py                             | 18         | [x]         | [ ]        | Modularized. |
| frontend/src/components/Notification.tsx    | 18         | [x]         | [ ]        | Modularized. |
| backend/security.py                         | 17         | [x]         | [ ]        | Modularized. |
| backend/models.py                           | 16         | [x]         | [ ]        | Modularized. |
| frontend/src/main.tsx                       | 12         | [x]         | [ ]        | Modularized. |
| frontend/src/hooks/useGameState.ts          | 12         | [x]         | [ ]        | Modularized. |
| frontend/src/assets/avatars/presets.ts      | 12         | [x]         | [ ]        | Modularized. |
| backend/user.py                             | 11         | [x]         | [ ]        | Modularized. |
| backend/game_session/board_state.py         | 10         | [x]         | [ ]        | Modularized. |
| backend/state.py                            | 8          | [x]         | [ ]        | Modularized. |

**Instructions:**
- Only files under 200 lines can be marked modularized ([x]).
- If a file is over 200 lines, split it further before marking as modularized.
- Documented = has clear JSDoc or docstrings for all public APIs.

---
**Next Targets for Modularization:**
- Split all files over 200 lines (see above table).
- Prioritize GameBoard.tsx, GameContext.tsx, and backend/shared/ai.py.

**Blockers & Refactoring Ideas:**
- Some prop drilling remains in frontend components; consider context or hooks for shared state.
- Review backend for tightly coupled logic in multiplayer and single_player routes.
- GameBoard.tsx and GameContext.tsx are top priorities for further split.

_Last updated: 2026-03-29_
