---
ID: 1
Origin: 1
UUID: 7e3a2b1c
Status: Active
---

# Plan: Multiplayer Support for Cross-Computer Play

**Target Release:** v1.1.0  
**Epic Alignment:** Multiplayer Experience  
**Status:** Active

## Value Statement and Business Objective
As a player, I want to play Gomony multiplayer with people on different computers, so that I can enjoy real-time games with friends or other users remotely.

## Objective
Enable real-time multiplayer gameplay between users on different computers, supporting matchmaking, game state synchronization, and turn-based play, while maintaining the integrity and rules of Gomony.

## Assumptions
- Current backend is single-process, in-memory state (one game at a time).
- No user authentication or persistent storage exists yet.
- All move validation and game logic remain backend-driven.
- Frontend and backend communicate via HTTP (FastAPI, REST).
- Real-time (WebSocket) is not required for MVP; polling is acceptable for turn sync.


## Plan
1. **Game Session Model**
   - Design a `GameSession` model (unique game ID, board state, players, current turn, etc.).
   - Store sessions in a backend dictionary (in-memory for MVP).
   - Acceptance: Multiple games can exist in parallel, each with its own state.

2. **API: Create/Join Game**
   - Add endpoints:
     - `POST /game/create` → returns new game ID and player assignment.
     - `POST /game/join` (with game ID) → joins as second player, returns state.
   - Acceptance:
     - Players can create and join games from different computers.
     - Error scenarios:
       - Invalid game ID: returns error, frontend displays clear message.
       - Duplicate join (game full): returns error, frontend displays clear message.
       - Attempt to join completed/abandoned game: returns error, frontend displays clear message.

3. **API: Game State and Moves**
   - Add endpoints:
     - `GET /game/{game_id}/state` → returns board, current player, etc.
     - `POST /game/{game_id}/move` → submit move for that game.
   - Acceptance:
     - Moves and state are isolated per game session.
     - Error scenarios:
       - Invalid game ID: returns error, frontend displays clear message.
       - Move by wrong player: returns error, frontend displays clear message.
       - Move after game complete: returns error, frontend displays clear message.

4. **Frontend: Game Lobby and Session Flow**
   - Add UI for creating a game, joining by code, and displaying game ID.
   - Store current game ID in frontend state.
   - Acceptance:
     - Users can start or join games and see their session code.
     - Error scenarios:
       - Invalid/expired game code: clear error message, option to retry or create new game.
       - Game full: clear error message, option to create/join another game.

5. **Frontend: Multiplayer Board Sync**
   - Poll `/game/{game_id}/state` every 2–3 seconds for opponent moves.
   - Only allow moves when it is the local player's turn.
   - Acceptance: Board updates in near real-time for both players.

6. **Turn Enforcement and Validation**
   - Backend enforces turn order and move validity per session.
   - Acceptance: Only the correct player can move; invalid moves are rejected with clear error messages.

7. **Session Cleanup Policy**
   - Define session cleanup for abandoned or completed games:
     - Completed games: remove from memory after 10 minutes.
     - Abandoned (no activity for 30+ minutes): remove from memory.
     - Manual cleanup for MVP; log removals for review.
   - Acceptance: No unbounded memory growth from stale sessions.

8. **Testing Strategy**
   - Unit: Session creation, joining, move validation, turn order, error handling.
   - Integration: Two simulated clients play a full game via API, including error cases.
   - Manual: Two browsers on different machines play a full game, including error flows.

9. **Version Management**
   - Update version to v1.1.0 in all relevant files (root and frontend `package.json`, docs, CHANGELOG).
   - Add CHANGELOG entry for multiplayer support.

## Risks
- In-memory sessions mean games are lost on server restart (acceptable for MVP).
- No authentication: anyone with game ID can join/move (address in future phase).
- Polling may not scale for many games (WebSocket upgrade possible later).
- Session cleanup is manual for MVP; risk of missed removals if not monitored.

## OPEN QUESTIONS
- Should games persist across server restarts? (MVP: no)
- Is authentication required for MVP? (MVP: no)
- Are the error messages and session cleanup policies sufficient for MVP, or should they be expanded?

---

# Multiplayer Cross-Computer MVP: Actionable Breakdown (2026-03-23)

## Acceptance Criteria for Error Cases
- Backend returns standardized JSON error responses for all error scenarios (404, 409, 410, 403).
- Frontend displays user-friendly error messages for each case (game not found, full, inactive, not your turn, etc.).

## API Error Response Format
- All errors: `{ "error": "<human-readable message>" }` with correct HTTP status code.

## Backend Tasks
1. GameSession model & in-memory session store
2. Endpoints: /game/create, /game/join, /game/{id}/state, /game/{id}/move
3. Error handling for all scenarios
4. Session cleanup (timeout/manual)
5. Unit tests for endpoints & errors

## Frontend Tasks
1. Lobby UI for create/join
2. Session state management
3. Error display logic
4. Polling for state sync
5. Manual/automated tests for flows & errors

## QA Guidance
- Validate all error scenarios, backend responses, and frontend display
- Confirm error JSON and HTTP status codes
- Test session cleanup/abandonment

---

**Next Steps:**
- Handoff to Critic for review.  
- After approval, proceed to implementation.
