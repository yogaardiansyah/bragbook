# 📁 BragBook Project Structure & Code Conventions

This document outlines the file layout, modular responsibilities, and coding standards for **BragBook v1.2.0**.

---

## 1. Directory Layout

```text
bragbook/
├── index.html              # Main semantic UI structure & layout containers (links atomic CSS)
├── style.css               # Central CSS entry point & bundle importer (@import './css/*.css')
├── css/                    # Atomic Modular Component Stylesheets (Zero-Build, Pure CSS3)
│   ├── tokens.css          # Design tokens, executive palette, font definitions, radii & transitions
│   ├── base.css            # CSS reset, body layout, vector icon system, buttons, badges, inputs
│   ├── header.css          # Executive header, brand identity logo, pulse badges, metrics bar
│   ├── nav.css             # Segmented tab navigation strip, tab badges, panel transitions
│   ├── journal.css         # Quick capture form, tag chips, search toolbar, chronological timeline
│   ├── kanban.css          # 4-column delivery board, drag-and-drop dropzones, kanban cards
│   ├── meetings.css        # Live meeting session, audio recorder, waveform canvas, notulen stream
│   ├── review.css          # Career review copilot controls, preformatted output preview
│   ├── modals.css          # Native HTML5 <dialog>, backdrop blur, modal headers & footers
│   └── responsive.css      # Viewport media queries for tablets (1024px) and mobile/side panels (640px)
├── manifest.json           # Manifest V3 configuration for Chrome Side Panel & PWA
├── icons/                  # Web App & Extension icons
│   ├── icon-128.png
│   └── icon-512.png
├── js/                     # Modular client-side architecture (Zero-Build, Zero-Server)
│   ├── state.js            # Central State store & Constants
│   ├── utils.js            # Helpers, date/time formatting, HTML sanitizer, 22+ SVG Vector Icons
│   ├── storage.js          # LocalStorage persistence manager & audio storage
│   ├── metrics.js          # Streak & achievement counter engine
│   ├── navigation.js       # Tab navigation controller & lifecycle hooks
│   ├── journal.js          # Work Journal logger & inline entry editing
│   ├── kanban.js           # 4-column drag-and-drop Kanban controller
│   ├── meetings.js         # Live meeting session, audio recording, waveform visualizer, notulen stream
│   ├── standup.js          # Daily standup copilot synthesis & Slack export
│   ├── review.js           # Career accomplishment review & Markdown generator
│   ├── ai.js               # Dual-Engine AI (Local Ollama & Google Gemini BYOK)
│   ├── settings.js         # AI provider configuration & test connection
│   ├── backup.js           # Full JSON backup export/import & safe reset
│   └── app.js              # Modals utility & DOMContentLoaded lifecycle bootstrap
├── tests/                  # Automated Blackbox & CDP Quality Assurance Suite
│   ├── blackbox.spec.js    # Playwright & Chrome DevTools Protocol test runner
│   └── blackbox-report.json# Raw machine-readable telemetry outputs
├── .prettierrc             # Code style formatting rules (single quotes, 2-space tab)
├── .prettierignore         # Prettier exclusion paths
├── eslint.config.mjs       # ESLint 9 flat configuration & browser globals whitelist
├── package.json            # Node tooling config for test, lint, and formatting
├── TEST_REPORT.md          # Comprehensive blackbox verification report (42/42 PASS)
├── URS.md                  # User Requirements Specification v1.2.0
├── ARCHITECTURE.md         # System architecture, schemas, and Mermaid diagrams
├── PROJECT_STRUCTURE.md    # This document (layout & conventions)
├── TASK_LIST.md            # Phased implementation roadmap & task board
├── GUIDEBOOK.md            # Developer & AI Agent playbook (Ollama setup, testing)
├── CHANGELOG.md            # Complete version history & release notes
└── README.md               # User-facing project documentation
```

---

## 2. File & Module Responsibilities

### `index.html`
* Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<dialog>`).
* Directly links atomic component stylesheets from `css/` to optimize parallel asset fetching and avoid `@import` latency over `file:///` protocols.
* Dynamic PWA manifest injector (prevents CORS blocking on local filesystem URLs).
* Tab navigation containers for:
  1. `#tab-journal`: Daily logs, quick input bar, timeline cards.
  2. `#tab-kanban`: 4-column drag-and-drop Kanban board.
  3. `#tab-meetings`: Live meeting notes editor with session timer, audio recorder, canvas visualizer, notulen stream, and action items checklist.
  4. `#tab-review`: Career performance review generator & AI panel.
* Modal dialogs for Settings, Standup Copilot output, and Backup/Restore.

### `css/` Modular Atomic Directory
* **`tokens.css`**: Design tokens, high-density Slate & Cobalt palette (`#080c16`, `#0e1526`, `#2563eb`), typography tokens (`Inter`, `JetBrains Mono`), shadows, radii, and cubic-bezier transitions.
* **`base.css`**: Base CSS resets, body layout, `.bb-icon` SVG rules, `.app-layout` scaffold, common form inputs (`.form-input`, `.form-select`, `.form-textarea`), `.card-glass`, badges (`.badge-*`), buttons (`.btn-*`), and utility helpers (`.hidden`).
* **`header.css`**: Executive corporate top bar, brand logo, pulse badges, metrics pills (Streak and Wins counters), and header actions.
* **`nav.css`**: Segmented control navigation strip, active states, tab counter badges, and panel fade animations.
* **`journal.css`**: Quick capture input row, interactive project tag chips, filter search bar, chronological date-grouped timeline, accomplishment cards, and blocker warnings.
* **`kanban.css`**: 4-column Kanban board grid, column status indicators, drag-over dropzones, draggable task cards, and quick status shift controls.
* **`meetings.css`**: Live meeting controller, session elapsed timer, audio recording controls, Web Audio API canvas visualizer, audio playback box, live notulen stream bar, dual-pane workspace, and interactive action items checklist.
* **`review.css`**: Performance review sidebar options, Markdown preformatted review card, and clipboard copy feedback.
* **`modals.css`**: Native `<dialog>` styling, blurred backdrops, and modal action footers.
* **`responsive.css`**: Media queries adapting the layout for tablet screens (1024px) and mobile / Chrome Side Panel viewports (640px).

### `js/` Directory (Modular Architecture)
Each file has a single, isolated responsibility:
* `state.js` & `utils.js`: Data models, 22+ inline SVG vector icons (`BragBook.Icons`), and foundational utilities.
* `storage.js` & `metrics.js`: Persistence, audio data handling, and streak calculation logic.
* `journal.js` & `kanban.js`: Core work tracking & task orchestration.
* `meetings.js` & `standup.js`: Live meeting session controller, MediaRecorder audio capture, AudioContext visualizer, auto-timestamped notulen stream, action item sync, and standup generation.
* `ai.js`, `settings.js` & `review.js`: Dual-engine AI (Ollama + Gemini) and career review polish.
* `backup.js` & `app.js`: Data export/import and application bootstrap.

---

## 3. Coding Conventions & Standards

1. **Zero External Runtime Dependencies:** No external JavaScript frameworks or runtime CDNs. Pure, unadulterated web platform code.
2. **Vanilla JavaScript (ES6+):** Use native browser APIs (`fetch`, `crypto.randomUUID`, `MediaRecorder`, `AudioContext`, `Intl.DateTimeFormat`, `localStorage`).
3. **Atomic CSS Organization:** Keep stylesheets separated by component and function within `css/`. Use CSS custom properties from `tokens.css` for consistent corporate styling.
4. **Event Delegation:** Prefer event delegation for dynamically rendered list items (Kanban cards, timeline entries, meeting notulen items) to maintain peak performance and low memory consumption.
5. **XSS Protection:** Always sanitize user inputs or use `.textContent` when injecting user strings into the DOM.
