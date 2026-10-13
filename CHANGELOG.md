# 📜 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-10-13

### Added
- Modular architecture deconstruction into 14 decoupled modules in `js/` adhering to the `window.BragBook` clean architecture.
- Automated Blackbox & Chrome DevTools Protocol (CDP) test suite in `tests/blackbox.spec.js`.
- Automated test report and CDP telemetry in `TEST_REPORT.md` (42/42 tests passing, 0 console errors, 1.57 MB JS heap).
- Prettier 3 configuration (`.prettierrc`) and ESLint 9 flat configuration (`eslint.config.mjs`) for strict code style consistency.
- Root `package.json` with `npm test`, `npm run lint`, and `npm run format` scripts.

### Fixed
- Replaced monolithic `app.js` with decoupled single-responsibility modules to maximize code maintainability for contributors.
- Ensured zero-server execution without external bundlers under `file:///` and GitHub Pages.

