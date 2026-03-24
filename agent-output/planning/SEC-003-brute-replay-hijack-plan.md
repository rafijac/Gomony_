# Brute Force, Replay, and Hijack Protection Plan

## Scope
Define strategies to protect Gomony sessions from brute force, replay, and hijack attacks.

## Requirements
- Rate limiting on sensitive endpoints (join, move, auth)
- Token rotation on suspicious activity
- One-time tokens for critical actions (optional)
- IP-based throttling (optional)
- Logging and alerting for abuse

## Implementation Targets
- Middleware or new backend file: security.py
- Integrate with main.py endpoints

## Open Questions
- Should we block by IP or user?
- How aggressive should rate limits be?
