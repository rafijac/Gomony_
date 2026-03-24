# QA: Backend Error Handling & Edge Cases

## Test Plan
- Verify all endpoints return correct HTTP status codes for error scenarios (401/403/410)
- Test edge cases: reconnect, expired/invalid tokens, abandoned games
- Validate error messages are clear and actionable
- Ensure all backend tests in shared/test_*.py pass and cover new logic

## File Boundaries
- shared/test_*.py
