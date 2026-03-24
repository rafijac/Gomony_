# Authentication Requirements Plan

## Scope
Define user authentication requirements for Gomony.

## Options Considered
- Username/password (local accounts)
- OAuth (Google, GitHub, etc.)
- Guest mode (no auth, but unique session)

## Recommendation
- Phase 1: Guest mode with optional username
- Phase 2: Add username/password (local), consider OAuth for future

## Requirements
- Unique user/session identity
- Prevent duplicate joins
- Store minimal user info (username, session id)
- API endpoints: /auth/register, /auth/login, /auth/logout

## Implementation Targets
- New backend files: user.py, auth.py
- Minimal changes to main.py (session join checks)

## Open Questions
- Should usernames be unique?
- Email verification needed?
