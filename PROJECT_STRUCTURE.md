# 📁 BragBook Project Structure & Code Conventions

This document outlines the file layout, modular responsibilities, and coding standards for **BragBook**.

---

## 1. Directory Layout

```text
bragbook/
├── index.html              # Main semantic UI structure & layout containers
├── style.css               # Complete styling system (Dark theme tokens, glassmorphism, responsive grid)
├── manifest.json           # Manifest V3 configuration for Chrome Side Panel & PWA
├── icons/                  # Web App & Extension icons
│   ├── icon-128.png
│   └── icon-512.png
├── js/                     # Modular client-side architecture (Zero-Build, Zero-Server)
│   ├── state.js            # Central State store & Constants
│   ├── utils.js            # Helpers, date/time formatting, HTML sanitizer
│   ├── storage.js          # LocalStorage persistence manager
│   ├── metrics.js          # Streak & achievement counter engine
│   ├── navigation.js       # Tab navigation controller & lifecycle hooks
│   ├── journal.js          # Work Journal logger & inline entry editing
│   ├── kanban.js           # 4-column drag-and-drop Kanban controller
│   ├── meetings.js         # Live meeting notulen, timestamping & action sync
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
├── URS.md                  # User Requirements Specification v1.1.0
├── ARCHITECTURE.md         # System architecture, schemas, and Mermaid diagrams
├── PROJECT_STRUCTURE.md    # This document (layout & conventions)
├── TASK_LIST.md            # Phased implementation roadmap & task board
├── GUIDEBOOK.md            # Developer & AI Agent playbook (Ollama setup, testing)
└── README.md               # User-facing project documentation
```

---

## 2. File & Module Responsibilities

### `index.html`
* Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, `<section>`, `<dialog>`).
* Tab navigation containers for:
  1. `#tab-journal`: Daily logs, quick input bar, timeline cards.
  2. `#tab-kanban`: 4-column drag-and-drop Kanban board.
  3. `#tab-meetings`: Live meeting notes editor with timestamping controls.
  4. `#tab-review`: Career performance review generator & AI panel.
* Modal dialogs for Settings, Standup Copilot output, and Backup/Restore.

### `style.css`
* Pure Vanilla CSS3 with CSS Custom Properties (Variables) for design tokens:
  * Color palette: Sleek deep slate dark mode (`--bg-canvas`, `--bg-surface`, `--primary-500`, etc.).
  * Status badges: `#feat`, `#fix`, `#meeting`, and impact ratings (`low`, `medium`, `high`).
* Responsive layout system using CSS Grid and Flexbox.
* Glassmorphic cards with `backdrop-filter` and micro-animations for interactive components.
* Optimized media queries for desktop monitors, laptop screens, and narrow viewports (~400px side panel).

### `js/` Directory (Modular Architecture)
Each file has a single, isolated responsibility:
* `state.js` & `utils.js`: Data models and foundational utilities.
* `storage.js` & `metrics.js`: Persistence and calculation logic.
* `journal.js` & `kanban.js`: Core work tracking & task orchestration.
* `meetings.js` & `standup.js`: Meeting note-taking and standup generation.
* `ai.js`, `settings.js` & `review.js`: Dual-engine AI and career review polish.
* `backup.js` & `app.js`: Data export/import and application bootstrap.

### `app.js`
Structured into decoupled JavaScript modules/objects to maintain readability without requiring bundlers:
1. `State`: In-memory reactive state matching `localStorage`.
2. `StorageManager`: Local persistence, schema migrations, JSON export/import.
3. `JournalController`: Adding, editing, filtering, and rendering journal entries.
4. `KanbanController`: Card drag-and-drop, column transitions, and status updates.
5. `MeetingController`: Meeting notes editor, live timestamp injection, action item conversions.
6. `AIService`: Ollama fetch client (with CORS fallback) and Google Gemini REST client.
7. `StandupGenerator`: Compiling yesterday, today, and blockers.
8. `ReviewGenerator`: Compiling STAR / Google XYZ impact statements.

### `manifest.json`
* Manifest V3 compliant.
* Defines `side_panel: { "default_path": "index.html" }` for instant Chrome Side Panel usage.
* Defines PWA properties (`display: "standalone"`, `start_url: "index.html"`).

---

## 3. Coding Conventions & Standards

1. **Zero External Runtime Dependencies:** Do not import external JavaScript libraries via CDN unless strictly necessary and confirmed offline-safe.
2. **Vanilla JavaScript (ES6+):** Use native browser APIs (`fetch`, `crypto.randomUUID`, `Intl.DateTimeFormat`, `localStorage`).
3. **Event Delegation:** Prefer event delegation for dynamically rendered list items (Kanban cards, timeline entries) to maintain peak performance and low memory consumption.
4. **XSS Protection:** Always sanitize user inputs or use `.textContent` when injecting user strings into the DOM.
