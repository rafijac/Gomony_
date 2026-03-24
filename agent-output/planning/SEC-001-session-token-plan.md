# Session Token Security Plan

## Scope
Design secure session token scheme for Gomony multiplayer sessions.

## Requirements
- Token type: cryptographically secure random (hex or base64)
- Length: >= 128 bits entropy
- Expiration: configurable (default 1 hour), rolling on activity
- Invalidation: on game end, player leave, or manual logout
- Storage: in-memory (current), consider persistent for scaling
- Rotation: on suspicious activity or at join
- Validation: constant-time compare

## Implementation Targets
- main.py (GameSession class, token creation/validation)
- Add expiration/invalidation logic

## Open Questions
- Should tokens persist across reconnects?
- Should we support token refresh?
