# QA: Frontend Error Handling & User Feedback

## Test Plan
- Simulate backend error codes/messages and verify user-facing notifications
- Test error boundary by forcing React errors
- Test UI for edge cases: reconnect, expired/invalid tokens, abandoned games
- Ensure all frontend tests in frontend/src/components/*.test.tsx pass and cover new logic

## File Boundaries
- frontend/src/components/*.test.tsx
