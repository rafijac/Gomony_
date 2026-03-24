# Implementer: Backend Error Handling & Edge Cases

## Tasks
- Refactor main.py and shared/validate_move.py to use correct HTTP status codes (401/403/410) for auth/session issues
- Implement clear error messages for edge cases (reconnect, expired/invalid tokens, abandoned games)
- Update/add backend tests in shared/test_*.py to verify status codes and edge case handling

## File Boundaries
- main.py
- shared/validate_move.py
- shared/test_*.py
