# Gomony

A 2-player stacking board game (like checkers/draughts with stacks) — fullstack app with FastAPI backend and React/TypeScript frontend.

**For architecture, game rules, and data model, see [ARCHITECTURE.md](ARCHITECTURE.md).**

## Quickstart
- Backend: `python main.py` (FastAPI, port 8001)
- Frontend: `cd frontend && npm install && npm run dev` (Vite, port 5173)

## Key Files
- `main.py` — FastAPI backend, board state, move validation
- `frontend/src/components/GameBoard.tsx` — board rendering, move logic
- `frontend/src/components/Stack.tsx` — renders all stacked pieces
- `frontend/src/components/GameContext.tsx` — board state, backend sync

## How it works
- Board is a 12×12 grid, only dark squares are playable
- Each cell is a stack (array) of player IDs, bottom→top
- **Normal move:** slide your whole stack one diagonal step to an empty square
- **Jump:** your top piece leaps over an adjacent opponent stack — the opponent's top piece is captured and placed *under* your piece at the landing square; the rest of the jumped stack stays in place
- Mandatory jumps, multi-jumps, and kinging follow standard checkers rules
- All move validation is backend-driven
- Frontend renders stacks in 3D using CSS perspective

See ARCHITECTURE.md for full rules and architecture details.