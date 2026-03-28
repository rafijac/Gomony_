# Copilot Workspace Instructions for Gomony

# Agent Escalation Policy

- Agents must not ask the user questions directly unless absolutely necessary.
- All blockers, ambiguities, or missing information must be escalated to the Expert subagent first.
- Only if the Expert subagent cannot resolve the issue, may the agent ask the user.
- This policy ensures minimal user interruption and leverages the Expert's problem-solving capabilities first.


## Overview
Gomony is a fullstack 2-player stacking board game app with a FastAPI backend (Python) and a React/TypeScript frontend (Vite). All move validation and game logic are backend-driven. The frontend renders the board and stacks in 3D and syncs state with the backend.

## Build & Run
- **Backend:** `python main.py` (FastAPI, port 8001)
- **Frontend:**
  - `cd frontend && npm install && npm run dev` (Vite, port 5173)
- **Fullstack (concurrently):** `npm run dev` (runs both backend and frontend)

## Test
- **Frontend:** `cd frontend && npm run test` (uses Vitest)
- **Backend:** Add Python tests in `shared/` and run with your preferred test runner (pytest, unittest, etc.)

## Key Files & Structure
- `main.py`: FastAPI backend, board state, move validation
- `shared/validate_move.py`: Move validation logic
- `frontend/src/components/GameBoard.tsx`: Board rendering, move logic
- `frontend/src/components/Stack.tsx`: Stack rendering
- `frontend/src/components/GameContext.tsx`: Board state, backend sync

## Conventions & Gotchas
- **Only dark squares** are playable (row+col odd)
- **Board state:** 12x12 array of stacks (bottom→top)
- **Frontend/backend must agree** on board orientation and stack order
- **All move validation** is backend-driven; frontend is optimistic but always updates from backend
- **CSS perspective** is set in `.board-perspective-wrapper` and `.game-board` for 3D effect
- **To extend rules:** Update `validate_move.py` and sync frontend logic if needed

## Example Prompts
- "Add a new win condition to the backend and expose it in the API."
- "Change the board size to 10x10 and update all affected logic."
- "Add a new player color and update the frontend to support 3 players."
- "Write a test for an invalid move in shared/test_validate_move.py."

## Agent Customization Ideas
- **applyTo:** Use `applyTo` patterns to target backend (Python), frontend (TypeScript), or shared logic for specialized instructions.
- **Hooks:** Add hooks for test auto-generation or API contract checks.
- **Skills:** Create a skill for board state visualization or move sequence generation.

---
For architecture, game rules, and data model, see ARCHITECTURE.md.
