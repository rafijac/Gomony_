# Changelog

## [1.1.0] - 2026-03-23
### Added
- Multiplayer support for cross-computer play (game sessions, create/join, per-session state)
- New backend endpoints: `/game/create`, `/game/join`, `/game/{game_id}/state`, `/game/{game_id}/move`
- Frontend lobby for creating/joining games by code
- Per-session board sync and error handling
- Session cleanup for completed/abandoned games

### Changed
- Updated backend and frontend to support multiple concurrent games
- Version bump to v1.1.0 (root and frontend)

### Fixed
- Error messages for invalid/expired game codes, full games, and turn enforcement

---
