# 📄 User Requirements Specification (URS)
## Project: BragBook — Private Work Journal, Kanban & Standup/Review Copilot

* **Document Version:** 1.1.0
* **Status:** Approved for Implementation (Open Source Specification)
* **Architecture:** 100% Local-First, Zero-Server Single Page Application (SPA) & Extension-Ready
* **Target Runtime:** Any standard web browser (Chrome, Firefox, Safari, Edge across Desktop, Tablet & Mobile)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Problem
* **Accomplishment Amnesia:** Knowledge workers, software engineers, and remote professionals routinely forget granular details of their daily achievements when quarterly reviews, daily standups, or promotion cycles arrive.
* **Confidentiality & NDA Restrictions:** Corporate security policies forbid pasting internal tasks, Jira tickets, architectural decisions, and meeting minutes into third-party cloud servers.
* **Tool Fragmentation:** Professionals juggle disparate apps for task tracking (Kanban), meeting minutes (notes), daily standups (Slack/Teams drafts), and performance evaluations.

### 1.2 The Solution
**BragBook** is a unified, offline-first workstation that runs **entirely in the user's browser without requiring a backend server or installation process**. It combines:
1. A **High-Velocity Work Journal** for logging wins, commits, and milestones in seconds.
2. A **Visual 4-Column Kanban Board** (`Backlog`, `In Progress`, `Done`, `Blocked`) to orchestrate daily workflows.
3. **Live Meeting Notes & Notulen** equipped with single-click timestamping (`[HH:MM]`) and actionable to-do extractions.
4. **Dual-Engine AI Copilot:** 
   * **100% Offline Local LLM:** Direct browser-to-local communication with Ollama or LM Studio (`http://localhost:11434/v1`). No sensitive data leaves the host machine.
   * **Cloud BYOK:** Support for Google Gemini API for users without local GPU hardware.
   * **Rule-Based Fallback:** Structured formatting templates operational without any AI connection.

---

## 2. Core Architectural Principles & Invariants

* **Zero-Server & Zero-Install:** Can be executed immediately by opening `index.html` via the `file:///` protocol or by accessing any static web host (GitHub Pages). No Node.js runtime, Python server, or Docker container is required.
* **Local-First Persistence:** All state resides in browser `localStorage` or `IndexedDB`. Zero telemetry, zero external trackers.
* **Universal Portability:** Pure web standards (HTML5, Vanilla CSS3, ES6+ JavaScript). Incorporates a standard `manifest.json` allowing immediate use as a **Chrome Side Panel / Extension** or installable **PWA**.
* **Strict Data Portability:** Seamless JSON backup export/import and Markdown document generation.

---

## 3. Target User Personas

| Persona | Core Need | Key BragBook Benefit |
| :--- | :--- | :--- |
| **Software Engineers & Tech Leads** | Track bug fixes, architecture specs, code reviews, and run local Ollama instances. | Zero NDA risk; local AI creates high-impact performance review bullets using the STAR / Google XYZ format. |
| **Remote Workers & Project Managers** | Run daily standups and take fast meeting notes with timestamps. | One-click standup compilation and instant meeting timestamp injection. |
| **Freelancers & Contractors** | Track deliverables across distinct clients without paying for SaaS tools. | Clean project filtering, no account creation, full exportability. |

---

## 4. Functional Requirements (FR)

### FR-1: Work Journal & Velocity Logging
* **FR-1.1:** Rapid capture form allowing description, project/client identifier, tags (e.g., `#feat`, `#fix`, `#review`, `#meeting`, `#infra`), and date selection (defaulting to current date).
* **FR-1.2:** Impact Level categorization: `Low` (Routine/Ops), `Medium` (Feature/Fix), `High` (Major milestone/Key business outcome).
* **FR-1.3:** Task Status lifecycle: `Backlog`, `In Progress`, `Done`, and `Blocked`.
* **FR-1.4:** Automatic completion timestamp recording whenever an item transitions to `Done`.
* **FR-1.5:** Full inline editing and deletion capabilities.

### FR-2: Interactive Kanban Board
* **FR-2.1:** Visual board providing four functional columns:
  1. 📌 **Backlog / Planning**
  2. ⚡ **In Progress / Doing**
  3. ✅ **Done / Accomplished**
  4. 🚧 **Blocked / Impeded**
* **FR-2.2:** Drag-and-drop or single-click column transitions with live status updates.
* **FR-2.3:** Filtering by project and tag directly on the Kanban view.

### FR-3: Live Meeting Notes & Notulen with Timestamping
* **FR-3.1:** Meeting document management with title, participants, project, and date.
* **FR-3.2:** **Live Timestamp Shortcut:** A dedicated button and keyboard shortcut (`Ctrl/Cmd + T` or `Alt + T`) that automatically inserts the current time token (e.g., `[14:32]`) at the cursor position.
* **FR-3.3:** **Action Items Tracker:** Interactive checklist (`[ ] Item description`) for post-meeting tasks.
* **FR-3.4:** **One-Click Task Conversion:** Ability to convert meeting action items directly into Kanban cards or journal entries with a single click.

### FR-4: Standup Copilot
* **FR-4.1:** Automated standup draft generator compiling:
  * **Yesterday / Prior Working Day:** Items marked `Done`.
  * **Today:** Items currently `In Progress`.
  * **Blockers:** Items flagged under `Blocked` along with notes on blockers.
* **FR-4.2:** Formatted outputs with one-click "Copy to Clipboard" for Slack, Microsoft Teams, and Discord.

### FR-5: Performance Review & Resume Polisher
* **FR-5.1:** Timeframe scoping: Current Week, Current Month, Current Quarter (Q1–Q4), or Custom Range.
* **FR-5.2:** AI-driven bullet transformation: Converts raw logs into impactful career metrics following the **Google XYZ Formula** (*"Accomplished [X] as measured by [Y], by doing [Z]"*).
* **FR-5.3:** Offline Rule-Based Generator: Structures accomplishments into clean Markdown categories if AI is disconnected.

### FR-6: Dual-Engine AI Integration (Local LLM + Cloud BYOK)
* **FR-6.1:** **Local LLM Engine (Ollama / LM Studio / LocalAI):**
  * Configurable Base URL (default: `http://localhost:11434/v1`).
  * Configurable Model Name (e.g., `llama3.2`, `mistral`, `qwen2.5-coder`).
  * Direct browser-to-localhost communication without proxy servers.
* **FR-6.2:** **Cloud BYOK (Google Gemini API):**
  * User-provided API Key stored securely in local browser storage.
  * Direct client-side HTTPS requests to official Google Gemini endpoints.
* **FR-6.3:** "Test Connection" diagnostic button to verify connectivity and report CORS / API status.

### FR-7: Data Management & Backup
* **FR-7.1:** **Export JSON:** Full database dump (logs, kanban status, meeting notes, settings).
* **FR-7.2:** **Import JSON:** Restore previous backups with options to overwrite or merge.
* **FR-7.3:** **Export Markdown:** Download human-readable reports and meeting minutes as `.md`.
* **FR-7.4:** **Clear/Reset Database:** Safe reset with double confirmation.

### FR-8: Extension & PWA Readiness
* **FR-8.1:** Responsive layout functional in standard desktop resolutions, mobile viewports, and narrow side panels (~400px width).
* **FR-8.2:** Inclusion of Manifest V3 (`manifest.json`) enabling direct installation as a Chrome Side Panel.

---

## 5. Non-Functional Requirements (NFR)

* **NFR-1 (Aesthetic & Polish):** Modern, dark-mode-first aesthetic with sleek glassmorphic surfaces, curated high-contrast typography (Inter/system-ui), subtle micro-animations, and distinct status color indicators.
* **NFR-2 (Performance):** Zero initial load lag (< 100ms), zero external CDN dependencies required for baseline operation, instant local search indexing.
* **NFR-3 (Confidentiality & Offline Capability):** 100% of core features (Journal, Kanban, Meeting Notes, Standup synthesis, Backup) must operate without an active internet connection.
* **NFR-4 (Compatibility):** Runs out of the box on Chrome, Edge, Safari, Firefox, Brave, and Chromium derivatives.

---

## 6. Information Architecture & Navigation

```text
┌────────────────────────────────────────────────────────────────────────┐
│  BragBook Header: Logo | Streak Tracker | AI Indicator | Settings | Backup  │
├────────────────────────────────────────────────────────────────────────┤
│  [Navigation Tabs]: [📜 Journal]  [📋 Kanban]  [🎙️ Meetings]  [🚀 Review]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [TAB 1: JOURNAL & LOG]                                                │
│  • Quick Entry Bar (Task, Tags, Project, Impact, Status)               │
│  • Filter & Search Bar                                                 │
│  • Interactive Timeline Cards + "Generate Standup" Modal               │
│                                                                        │
│  [TAB 2: KANBAN BOARD]                                                 │
│  • Columns: [📌 Backlog] [⚡ In Progress] [✅ Done] [🚧 Blocked]        │
│  • Drag-and-drop & Quick-Action Card Controls                          │
│                                                                        │
│  [TAB 3: LIVE MEETING NOTES]                                           │
│  • Meeting Directory & Note Editor                                     │
│  • Insert Timestamp [HH:MM] Button (Shortcut: Ctrl+T)                  │
│  • Action Items Checklist + "Sync to Kanban"                           │
│                                                                        │
│  [TAB 4: PERFORMANCE & AI REVIEW]                                      │
│  • Period Selector (Month / Quarter / Custom)                          │
│  • Engine: [Local Ollama] vs [Google Gemini] vs [Offline Template]     │
│  • Output: STAR / XYZ Impact Bullets -> Copy / Export Markdown         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```
