# 📜 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-14

### Added
- **Atomic Modular CSS Subsystem:** Deconstructed monolithic 1,700+ line `style.css` into 10 atomic, functional stylesheets in `css/`:
  - `tokens.css`: Design tokens, executive Obsidian and Cobalt palette, typography, shadows, and radii.
  - `base.css`: CSS reset, body layout, `.bb-icon` SVG rules, buttons, inputs, badges, and utility classes.
  - `header.css`: Executive corporate top header, brand logo, pulse status badges, and metrics bar.
  - `nav.css`: Segmented tab navigation strip, tab counter badges, and panel fade animations.
  - `journal.css`: Work journal quick capture form, project tag chips, filter search bar, and chronological timeline.
  - `kanban.css`: 4-column delivery board, dropzones, draggable task cards, and status shift controls.
  - `meetings.css`: Live meeting session controller, timer, audio controls, waveform canvas, notulen stream, and action items checklist.
  - `review.css`: Career accomplishment review generator and preformatted output preview.
  - `modals.css`: Native `<dialog>` styling, blurred backdrops, and modal footers.
  - `responsive.css`: Tablet (1024px) and mobile/side-panel (640px) responsive layout breakpoints.
- **Enterprise Corporate ERP Aesthetic:**
  - Executive dark slate palette (`#080c16`, `#0e1526`, `#2563eb`) with high-contrast text hierarchy.
  - Modern typography pairing: `Inter` for UI layout and `JetBrains Mono` for tabular metrics and timestamps.
  - Replaced generic/toy emojis with 22+ professional inline SVG vector icons via `BragBook.Icons`.
- **Live Meeting Session & Voice Notulen Copilot:**
  - One-click "Start Meeting" session lifecycle with digital elapsed session timer (`00:00:00`).
  - Real-time microphone audio recording via native browser `MediaRecorder` API.
  - Real-time dynamic audio waveform visualizer rendered on HTML5 canvas via Web Audio `AudioContext` and `AnalyserNode`.
  - Auto-timestamped live notulen entry bar capturing exact session elapsed time tokens (e.g. `[00:04:12]`).
  - Categorization badges (`Decision`, `Action`, `Risk`, `Note`) syncing to both a chronological stream feed and full Markdown workspace.
  - Post-meeting audio player with base64 audio persistence.

### Fixed
- Fixed Chromium `null origin CORS` console error when loading `manifest.json` over `file:///` protocol by conditionally injecting `<link rel="manifest">` only on HTTP/S protocols.
- Updated `eslint.config.mjs` with browser globals for `MediaRecorder`, `AudioContext`, and animation frames.
- Updated `package.json` formatting scripts to include `css/**/*.css`.

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
