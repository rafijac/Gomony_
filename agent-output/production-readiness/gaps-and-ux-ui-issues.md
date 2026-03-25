# Gomony Production Readiness Gaps & UX/UI Issues

Legend: ✅ Done | ⚠️ Partial | ❌ Not done

## 1. Error Handling & User Feedback
- ✅ HTTP status codes 401/403/410 used consistently across all auth/session/game endpoints
- ✅ Global ErrorBoundary component exists (ErrorBoundary.tsx)
- ✅ Notification system exists (Notification.tsx)
- ⚠️ Edge cases (reconnect, expired tokens, abandoned games) handled in backend but not fully surfaced in frontend — GameContext.tsx has no loading/error state wired to these flows

## 2. Onboarding & Help
- ✅ HelpModal.tsx with "How to Play Gomony" content, wired into App.tsx with ❓ button
- ✅ Tooltip.tsx exists and used on board and help button
- ⚠️ Tooltip dismissal persisted via localStorage — not fully verified from browser

## 3. Accessibility & Responsiveness
- ✅ ARIA labels on help button, tooltips, HelpModal (role="dialog", aria-modal)
- ⚠️ No @media queries confirmed in GameBoard.css — mobile responsiveness is partial
- ❌ No keyboard navigation or focus management on board/cells
- ❌ No ARIA roles (role="grid", role="button") on board cells or controls

## 4. Security & Authentication
- ✅ Session tokens with TTL expiration (session_token_helpers.py)
- ✅ Token invalidation on logout (auth.py invalidate_token, wired in routes/auth.py)
- ✅ Rate limiting per identifier (security.py SecurityMiddleware)
- ✅ Replay protection — expired/invalidated tokens rejected at move and logout endpoints
- ⚠️ Join still only requires game_id — no password or invite enforcement; auth is optional not mandatory

## 5. Versioning & Diagnostics
- ✅ GET /version endpoint returns version, git commit, status
- ✅ CHANGELOG.md exists and is maintained
- ✅ Logging configured in main.py; logger.info/warning used across all routes
- ✅ POST /game/reconnect endpoint implemented
- ✅ GET /game/spectate/{game_id} endpoint implemented
- ⚠️ ReconnectSpectator.tsx component exists but not wired into GameContext.tsx game flow
- ❌ No performance monitoring or analytics

## 6. UX/UI Gaps (Observed)
- ⚠️ Notification.tsx exists but not confirmed wired to move errors in GameBoard.tsx
- ❌ No loading indicators / spinners for network requests or game state changes
- ✅ FlyingPieceOverlay.tsx exists for AI move animation
- ❌ No confirmation dialogs for destructive actions (restart, resign)
- ❌ No player avatars or names
- ❌ No win/loss/next steps UI after game ends
- ⚠️ Basic layout exists but no confirmed @media queries for mobile optimization
- ❌ No dark/light mode toggle (dark only)
- ❌ No settings/preferences panel

---
Last audited: 2026-03-25. ~14 items done or partial, ~10 items still missing.
Priority remaining: loading indicators, win/loss UI, dark/light toggle, confirmation dialogs, keyboard nav, mobile CSS, player names, settings, wire reconnect/spectate into game flow.