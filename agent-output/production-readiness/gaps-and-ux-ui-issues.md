# Gomony Production Readiness Gaps & UX/UI Issues

## 1. Error Handling & User Feedback
- Inconsistent use of HTTP status codes for errors (should use 401/403/410 for auth/session issues)
- No global error boundary or user-friendly error notifications for unexpected failures
- Edge cases (reconnect, expired/invalid tokens, abandoned games) not surfaced to user

## 2. Onboarding & Help
- No onboarding, help, tooltips, or in-app instructions for new users
- No guidance on how to play, join, or create games, or what the rules are

## 3. Accessibility & Responsiveness
- Some accessibility (aria-label for king), responsive CSS exists
- No evidence of keyboard navigation, focus management, or ARIA roles for board/controls

## 4. Security & Authentication
- Session token type/expiration/invalidation not finalized
- No user authentication (anyone with code can join)
- No brute force/replay/session hijack protection

## 5. Versioning & Diagnostics
- No enforced versioning or changelog for releases
- No spectator support or reconnect flow
- No performance monitoring, analytics, or logging for diagnostics

## 6. UX/UI Gaps (Observed)
- No visual feedback for moves, errors, or invalid actions
- No loading indicators for network requests or game state changes
- Minimal use of color, animation, or sound for engagement
- No confirmation dialogs for destructive actions (e.g., restart game)
- No player avatars, names, or personalization
- No indication of game rules, win/loss, or next steps after game ends
- No mobile-specific UI optimizations (beyond basic responsiveness)
- No dark/light mode toggle (only dark theme by default)
- No settings/preferences panel

---
This list should be reviewed and prioritized for implementation before production launch. Additions welcome as new issues are discovered.