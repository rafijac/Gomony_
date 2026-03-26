# Expert Guidance: Avatars & Analytics for Gomony Production Readiness

## Preset Avatar Images
- **Format:** SVG preferred (scalable, small), PNG (256x256 or 512x512) acceptable
- **Number:** 8–16 distinct avatars
- **Location:** frontend/public/avatars/
- **Copyright:** Use public domain or CC0/MIT/Apache 2.0 assets (e.g., OpenMoji, unDraw, Heroicons, or custom)
- **Attribution:** Attribute if required by license

## Analytics/Performance Monitoring
- **Frontend:** Plausible Analytics or Umami (open-source, privacy-first, no cookies by default)
- **Backend:** Prometheus (metrics), Grafana (visualization), or self-hosted Sentry (error monitoring)
- **Privacy:**
  - No user-level tracking or fingerprinting
  - No third-party data sharing
  - Aggregate/anonymized metrics only
  - Clear privacy policy, opt-out option
  - No IP/PII storage

## Other Best Practices
- Secure APIs, graceful error handling, accessibility, mobile responsiveness, CORS, backups, monitoring, legal docs, 100% test coverage for move validation, E2E tests, env vars for secrets, update README/help

## Status
- No other blockers. Proceed with these guidelines for avatars and analytics.
