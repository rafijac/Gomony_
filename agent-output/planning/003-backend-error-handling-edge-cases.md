# Planner: Backend Error Handling & Edge Cases

## Objectives
- Audit all FastAPI endpoints for error responses
- Refactor to use correct HTTP status codes (401/403/410) for auth/session issues
- Identify and handle edge cases (reconnect, expired/invalid tokens, abandoned games)
- Ensure backend returns clear, actionable error messages for these cases
- Update or add backend tests to verify correct status codes and edge case handling

## Deliverables
- Refactored backend code (main.py, shared/validate_move.py, etc.)
- Updated backend tests (shared/test_*.py)
- Documentation of error codes/messages

## File Boundaries
- main.py
- shared/validate_move.py
- shared/test_*.py
