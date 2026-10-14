# 📖 BragBook

> **Executive Corporate Work Journal, 4-Column Kanban & Live Meeting Copilot — 100% Local-First & Zero-Server.**

BragBook is an open-source productivity workstation designed for engineers, tech leads, and remote professionals. It runs **purely in your browser without requiring installation, build steps, or backend servers**, safeguarding your NDA and proprietary data.

---

## ⚡ Key Highlights

* 🔒 **100% Local-First & Private:** All data resides in your browser (`localStorage`). Zero telemetry, zero tracking, zero third-party database leaks. Operates 100% offline.
* 💼 **Executive Corporate ERP Design:** Sleek Obsidian Slate & Royal Cobalt palette (`#080c16`, `#0e1526`, `#2563eb`), high-contrast typography (`Inter` + `JetBrains Mono`), and 22+ clean inline SVG vector icons (`BragBook.Icons`).
* 🧩 **Atomic Modular CSS Subsystem:** Organized into 10 decoupled functional stylesheets (`css/*.css`) loaded in parallel for zero-waterfall performance and easy maintainability.
* 📜 **Velocity Work Journal:** Rapidly record daily tasks, bugfixes, commit hashes, and milestones in seconds with impact ratings (`Low`, `Medium`, `High`) and interactive tag filters.
* 📋 **Interactive Kanban Board:** Organize your daily flow across `Backlog`, `In Progress`, `Done`, and `Blocked` with native drag-and-drop or single-click status shifts.
* 🎙️ **Live Meeting Session & Voice Notulen Copilot:**
  * One-click "Start Meeting" session lifecycle with digital elapsed timer (`00:00:00`).
  * Real-time microphone audio recording via native browser `MediaRecorder` API.
  * Real-time dynamic audio waveform visualizer rendered on HTML5 canvas via Web Audio `AudioContext`.
  * Quick auto-timestamped notulen entry bar with categorization badges (`Decision`, `Action`, `Risk`, `Note`).
  * Dual-pane workspace: Chronological live stream alongside synchronized full Markdown notes.
  * Immediate post-meeting audio playback with base64 storage.
* 🤖 **Dual-Engine AI Copilot:**
  * **100% Offline Local LLM:** Connect directly to your local **Ollama** or **LM Studio** (`http://localhost:11434/v1`). No data ever leaves your computer!
  * **Cloud BYOK:** Optional Google Gemini API integration for users without local GPU hardware.
  * **Deterministic Offline Formatter:** Generates clean structured reports even without any AI connected.
* 🚀 **Extension & PWA Ready:** Open directly in any browser tab, install as a standalone PWA, or load as a native **Chrome Side Panel** extension.
* 💾 **Unrestricted Data Portability:** Full JSON backup export/import and Markdown report generation.

---

## 🚀 Quickstart (Zero-Install)

### Method 1: Direct Browser Launch
Simply double-click `index.html` on your computer or open it via terminal:
```bash
# Linux
xdg-open index.html

# macOS
open index.html

# Windows
start index.html
```

### Method 2: Load as Chrome Side Panel Extension
1. Open Google Chrome and visit `chrome://extensions`.
2. Toggle on **Developer mode** in the upper-right corner.
3. Click **Load unpacked** and select this directory.
4. Access BragBook directly from Chrome's persistent Side Panel while browsing or coding!

---

## 📚 Repository Documentation Index

| Document | Purpose |
| :--- | :--- |
| [URS.md](file:///home/yoga/Documents/Prof/bragbook/URS.md) | Full User Requirements Specification (v1.2.0) |
| [ARCHITECTURE.md](file:///home/yoga/Documents/Prof/bragbook/ARCHITECTURE.md) | Technical architecture, data schemas, and Mermaid diagrams |
| [PROJECT_STRUCTURE.md](file:///home/yoga/Documents/Prof/bragbook/PROJECT_STRUCTURE.md) | Directory breakdown and coding conventions |
| [TASK_LIST.md](file:///home/yoga/Documents/Prof/bragbook/TASK_LIST.md) | Implementation roadmap & task board |
| [GUIDEBOOK.md](file:///home/yoga/Documents/Prof/bragbook/GUIDEBOOK.md) | Playbook for developers & AI agents (Ollama CORS, testing) |
| [CONTRIBUTING.md](file:///home/yoga/Documents/Prof/bragbook/CONTRIBUTING.md) | Open-source contribution guidelines & Conventional Commits |
| [AGENTS.md](file:///home/yoga/Documents/Prof/bragbook/AGENTS.md) | Operational guidelines & guardrails for autonomous AI coding agents |
| [CODE_OF_CONDUCT.md](file:///home/yoga/Documents/Prof/bragbook/CODE_OF_CONDUCT.md) | Contributor Covenant Community Standards |
| [SECURITY.md](file:///home/yoga/Documents/Prof/bragbook/SECURITY.md) | Vulnerability disclosure policy & local isolation commitments |
| [TEST_REPORT.md](file:///home/yoga/Documents/Prof/bragbook/TEST_REPORT.md) | Automated blackbox test report & Chrome Dev SDK telemetry |
| [CHANGELOG.md](file:///home/yoga/Documents/Prof/bragbook/CHANGELOG.md) | Semantic versioning change history |
| [LICENSE](file:///home/yoga/Documents/Prof/bragbook/LICENSE) | MIT Open Source License |

---

## 📄 License
This project is open-source under the [MIT License](file:///home/yoga/Documents/Prof/bragbook/LICENSE).
