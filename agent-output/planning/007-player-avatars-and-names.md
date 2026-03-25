---
ID: 007
Origin: 007
UUID: 8e2f1a3b
Status: Active
---

# Value Statement and Business Objective
As a player, I want to see player avatars and names in the Gomony UI, so that I can easily identify myself and my opponent, improving immersion and social connection.

# Objective
Enable display of player avatars and names throughout the game UI, with backend support for storing and serving this information. Ensure avatars are visible in all relevant game states (lobby, in-game, end screen) and names are consistently shown alongside avatars.

# Target Release: v0.6.3
- This feature is user-facing and enhances UX. Targeting next minor release after v0.6.2.

# Epic Alignment
- Advanced UX/UI improvements
- Multiplayer experience enhancement

# Assumptions
- Each player has a unique name (existing or to be enforced)
- Avatars are image URLs (uploaded or selected from presets)
- Backend stores avatar URL and name per player
- Game session data includes player name and avatar for both players
- No authentication changes required for MVP

# Plan
1. **Backend: Player Model & API**
   - Update player/user model to include `avatar_url` and `display_name` fields.
   - Update player creation/registration endpoints to accept/display these fields.
   - Update game session model and API responses to include both players' names and avatar URLs.
   - Update FastAPI schemas and OpenAPI docs.
   - Files: backend/user.py, backend/models.py, backend/routes/auth.py, backend/game_session.py, backend/routes/multiplayer.py, backend/shared/schema.json

2. **Frontend: State & API Integration**
   - Update API calls to fetch and store player names and avatar URLs.
   - Update game context to include avatar/name for both players.
   - Files: frontend/src/aiApi.ts, frontend/src/components/GameContext.tsx

3. **Frontend: UI Display**
   - Add avatar and name display to game lobby, in-game HUD, and end screen.
   - Update relevant components to render avatar images and names (with fallback if missing).
   - Files: frontend/src/components/GameBoard.tsx, frontend/src/components/PlayerInfo.tsx (new), frontend/src/components/Lobby.tsx, frontend/src/components/EndScreen.tsx

4. **Frontend: Avatar Selection (MVP)**
   - Add simple avatar selection (preset images) during player setup/registration.
   - Files: frontend/src/components/AvatarSelector.tsx (new), frontend/src/components/Registration.tsx or similar

5. **Validation & Error Handling**
   - Ensure backend validates avatar URL format and name uniqueness (if required).
   - Frontend handles missing/invalid avatars gracefully.

6. **Version Management**
   - Update version and CHANGELOG for v0.6.3.

# Dependencies
- None blocking, but coordination needed between backend and frontend for schema changes.

# Acceptance Criteria
- Player avatars and names are visible in all major UI states.
- Backend APIs provide avatar/name for both players in game session data.
- Avatar selection is available at registration or profile setup.
- No regressions in multiplayer or single-player flows.

# Testing Strategy
- Unit: Backend model/schema changes, API validation.
- Integration: End-to-end test of registration, lobby, in-game, and end screen with avatars/names.
- Manual: Visual check of avatar/name display in all states.

# Risks
- Image upload/storage (out of scope for MVP; use preset URLs)
- Backward compatibility for existing users/sessions
- UI layout issues with long names or missing avatars

# Version Management Milestone
- Update backend and frontend version files, CHANGELOG.md, and README.md for v0.6.3.

# Validation
- Confirm avatars/names appear in all required UI locations.
- Confirm backend API docs updated.
- Confirm no regressions in game flow.
