# Plan 005: Backend Modularization for Gomony FastAPI

## Objective
Refactor the backend into a modular structure under src/, separating API routes, models, services, authentication, and utilities for maintainability and scalability.

## Scope
- Move all backend code to src/ (api/, models/, services/, auth/, utils/, config.py, main.py)
- Consolidate session/token/auth logic
- Update all imports, tests, deployment scripts, and documentation
- Remove old files after migration
- Validate with tests and manual API checks

## Deliverables
- src/ directory with modularized code
- Updated tests, scripts, and documentation
- All endpoints and features function as before

## Acceptance Criteria
- All backend tests pass
- Manual API checks succeed
- No broken imports or deployment issues
- Documentation reflects new structure

## Out of Scope
- Major new features or API changes
- Database refactor (unless required for modularization)

---
Plan approved for implementation.