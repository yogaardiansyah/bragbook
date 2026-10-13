# 🤖 Instructions for AI Coding Agents

This document defines core behavioral rules, architectural constraints, and task protocols for autonomous AI coding agents (such as Google Antigravity, Claude Code, Cursor Agent, Windsurf, Devin, etc.) operating on the **BragBook** repository.

---

## 1. Prime Directives & Constraints

1. **Never Add Build Runtimes or Bundlers:** 
   * Do not introduce Webpack, Vite, Parcel, Rollup, or Babel unless explicitly instructed by the user.
   * BragBook must remain pure Vanilla HTML5, CSS3, and ES6+ JavaScript, directly runnable via the `file:///` protocol.
2. **Never Introduce External Remote Dependencies via CDN:**
   * Do not import third-party scripts or styles that require internet access for core functionality.
   * The app must be fully functional offline.
3. **Preserve User Privacy & Local Storage:**
   * Do not add tracking, telemetry, or remote analytics.
   * State must persist in `localStorage` or `IndexedDB`.
4. **Follow Conventional Commits:**
   * All git commits and pull request descriptions must follow the [Conventional Commits](https://www.conventionalcommits.org/) standard.

---

## 2. Essential Project Files to Read First

When spawned or tasked with an issue:
1. Read [URS.md](URS.md) to understand user requirements.
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) to review data schemas and sequence flows.
3. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for code organization conventions.
4. Read [GUIDEBOOK.md](GUIDEBOOK.md) for local testing and Ollama CORS setups.
5. Check off completed items in [TASK_LIST.md](TASK_LIST.md).

---

## 3. UI & Styling Rules

* Follow modern, glassmorphic dark-mode aesthetics.
* Use CSS Custom Properties defined in `style.css`.
* Never use inline styles when a reusable class or variable is appropriate.
* Test responsive behavior on both full desktop screens and narrow side panel viewports (~400px).
