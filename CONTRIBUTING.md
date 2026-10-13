# 🤝 Contributing to BragBook

Thank you for your interest in contributing to **BragBook**! This is an open-source, local-first project welcoming contributions from both **human software engineers** and **autonomous AI coding agents**.

---

## 🏛️ Inviolable Architectural Rules

Every contribution to BragBook must adhere to these non-negotiable principles:

1. **100% Zero-Server & Zero-Install:** The application must run directly by double-clicking `index.html` in any browser or through static hosting (e.g. GitHub Pages). **Do not introduce build runtimes (Node.js, Vite, Webpack) or backend server requirements.**
2. **Strict Client-Side Privacy:** No external tracking scripts, telemetry, analytics beacons, or remote database connections.
3. **Local-First Persistence:** All user data must be saved to `localStorage` or `IndexedDB`.
4. **Dual-AI Support:** AI interactions must remain optional and support both Local LLMs (Ollama / LM Studio) and Cloud BYOK (Google Gemini API). If no AI is configured, the offline rule-based formatter must work smoothly.
5. **No Heavy Frameworks:** Stick to modern web standards: semantic HTML5, Vanilla CSS3 (custom properties), and ES6+ JavaScript.

---

## 📝 Commit Message Guidelines (Conventional Commits)

We strictly enforce the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

```text
<type>(<scope>): <short description in present tense>

[optional body]

[optional footer]
```

### Types
* `feat`: A new user-facing feature or enhancement (e.g., `feat(kanban): add drag and drop support`)
* `fix`: A bug fix (e.g., `fix(journal): correct date formatting in local timezone`)
* `docs`: Documentation updates only (e.g., `docs(readme): add Ollama CORS setup instructions`)
* `style`: Code styling, formatting, or CSS spacing adjustments without logic changes
* `refactor`: Internal code refactoring without altering external behavior
* `perf`: Performance optimizations
* `test`: Test cases or manual test procedures
* `chore`: Maintenance or repository configuration changes

### Scopes
Recommended scopes: `journal`, `kanban`, `meetings`, `ai`, `standup`, `storage`, `ui`, `extension`.

---

## 🤖 Instructions for AI Coding Agents

If you are an autonomous coding agent (Antigravity, Claude Code, Cursor, Windsurf, etc.):
1. **Read all `.md` files in this repository** before proposing or applying code changes (`URS.md`, `ARCHITECTURE.md`, `PROJECT_STRUCTURE.md`, `GUIDEBOOK.md`).
2. **Preserve documentation and comments:** Do not strip existing explanatory comments.
3. **Update the task list:** Check off completed items in `TASK_LIST.md` as you make progress.
4. **Test against `file:///` protocol:** Always ensure code works without assuming an `http://` server environment.

---

## 🚀 Pull Request Process

1. Fork this repository and create your feature branch:
   ```bash
   git checkout -b feat/meeting-action-item-sync
   ```
2. Verify changes locally by opening `index.html` directly in your browser.
3. Commit with Conventional Commits format.
4. Submit your Pull Request with a clear description and screenshots/recordings of the changes.
