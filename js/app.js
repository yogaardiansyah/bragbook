/**
 * BragBook — Application Entry Point & Lifecycle Bootstrap
 * @module AppBootstrap
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  // --- Modal Utilities ---
  BragBook.Modals = {
    init() {
      document.querySelectorAll('dialog').forEach(diag => {
        diag.addEventListener('click', e => {
          if (e.target === diag && diag.close) diag.close();
        });
        diag.querySelectorAll('.modal-close-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (diag.close) diag.close();
          });
        });
      });
    }
  };

  // --- Native Web Component: <bb-modals> ---
  class BBModals extends HTMLElement {
    connectedCallback() {
      if (this.childElementCount === 0) {
        this.innerHTML = `
          <!-- Native Dialog: Settings Modal -->
          <dialog id="modal-settings">
            <div class="modal-header">
              <h3 class="modal-title">${BragBook.Icons.settings} <span>BragBook Settings</span></h3>
              <button
                type="button"
                class="btn btn-ghost btn-icon modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px">
              <div>
                <label
                  for="settings-ai-provider"
                  style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px"
                  >AI Engine Selection</label
                >
                <select id="settings-ai-provider" class="form-select">
                  <option value="ollama">
                    Local LLM — Ollama / LM Studio (100% Offline & Confidential)
                  </option>
                  <option value="gemini">Cloud BYOK — Google Gemini API (Free Tier Key)</option>
                  <option value="none">Disabled — Use Deterministic Offline Formatter Only</option>
                </select>
              </div>

              <!-- Ollama Config Subform -->
              <div
                id="subform-ollama"
                style="
                  display: flex;
                  flex-direction: column;
                  gap: 10px;
                  background: rgba(0, 0, 0, 0.2);
                  padding: 12px;
                  border-radius: var(--radius-md);
                "
              >
                <div>
                  <label
                    for="settings-ollama-url"
                    style="
                      display: block;
                      font-size: 0.8rem;
                      color: var(--text-muted);
                      margin-bottom: 4px;
                    "
                    >Ollama Endpoint URL</label
                  >
                  <input
                    type="url"
                    id="settings-ollama-url"
                    class="form-input"
                    value="http://localhost:11434/v1"
                  />
                </div>
                <div>
                  <label
                    for="settings-ollama-model"
                    style="
                      display: block;
                      font-size: 0.8rem;
                      color: var(--text-muted);
                      margin-bottom: 4px;
                    "
                    >Model Name</label
                  >
                  <input
                    type="text"
                    id="settings-ollama-model"
                    class="form-input"
                    value="llama3.2"
                    placeholder="e.g. llama3.2, mistral, qwen2.5-coder"
                  />
                </div>
              </div>

              <!-- Gemini Config Subform -->
              <div
                id="subform-gemini"
                style="
                  display: none;
                  flex-direction: column;
                  gap: 10px;
                  background: rgba(0, 0, 0, 0.2);
                  padding: 12px;
                  border-radius: var(--radius-md);
                "
              >
                <div>
                  <label
                    for="settings-gemini-key"
                    style="
                      display: block;
                      font-size: 0.8rem;
                      color: var(--text-muted);
                      margin-bottom: 4px;
                    "
                    >Google Gemini API Key</label
                  >
                  <input
                    type="password"
                    id="settings-gemini-key"
                    class="form-input"
                    placeholder="AIzaSy..."
                  />
                </div>
                <div>
                  <label
                    for="settings-gemini-model"
                    style="
                      display: block;
                      font-size: 0.8rem;
                      color: var(--text-muted);
                      margin-bottom: 4px;
                    "
                    >Model</label
                  >
                  <input
                    type="text"
                    id="settings-gemini-model"
                    class="form-input"
                    value="gemini-1.5-flash"
                  />
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between">
                <button type="button" id="btn-test-connection" class="btn btn-secondary btn-sm">
                  🔍 Test Connection
                </button>
                <span id="test-connection-status" style="font-size: 0.85rem; font-weight: 600"></span>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
              <button type="button" id="btn-save-settings" class="btn btn-primary">
                Save Settings
              </button>
            </div>
          </dialog>

          <!-- Native Dialog: Standup Copilot Modal -->
          <dialog id="modal-standup">
            <div class="modal-header">
              <h3 class="modal-title">${BragBook.Icons.standup} <span>Daily Standup Copilot</span></h3>
              <button
                type="button"
                class="btn btn-ghost btn-icon modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px">
              <p style="color: var(--text-muted); font-size: 0.88rem">
                Synthesized draft compiled from your recent accomplishments, active tasks, and blocked
                tickets.
              </p>
              <pre id="standup-output-text" class="output-pre" style="max-height: 320px"></pre>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
              <button type="button" id="btn-copy-standup-slack" class="btn btn-primary">
                ${BragBook.Icons.journal} <span>Copy for Slack / Teams</span>
              </button>
            </div>
          </dialog>

          <!-- Native Dialog: Backup & Portability Modal -->
          <dialog id="modal-backup">
            <div class="modal-header">
              <h3 class="modal-title">${BragBook.Icons.backup} <span>Data Backup & Portability</span></h3>
              <button
                type="button"
                class="btn btn-ghost btn-icon modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 16px">
              <p style="color: var(--text-muted); font-size: 0.88rem">
                All BragBook data is 100% stored in your browser. Download full backups or restore to
                another machine at any time.
              </p>

              <div style="display: flex; gap: 12px; flex-wrap: wrap">
                <button type="button" id="btn-export-json" class="btn btn-primary" style="flex: 1">
                  ${BragBook.Icons.download} <span>Export Backup (JSON)</span>
                </button>
                <label class="btn btn-secondary" style="flex: 1; cursor: pointer">
                  ${BragBook.Icons.backup} <span>Import Backup</span>
                  <input type="file" id="input-import-file" accept=".json" style="display: none" />
                </label>
              </div>

              <div
                style="border-top: 1px solid var(--border-subtle); padding-top: 16px; margin-top: 8px"
              >
                <button
                  type="button"
                  id="btn-reset-database"
                  class="btn btn-ghost"
                  style="color: #f43f5e; width: 100%"
                >
                  ${BragBook.Icons.trash} <span>Clear All Data (Reset)</span>
                </button>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary modal-close-btn">Close</button>
            </div>
          </dialog>

          <!-- Native Dialog: Edit Entry Modal -->
          <dialog id="modal-edit-entry">
            <div class="modal-header">
              <h3 class="modal-title">${BragBook.Icons.edit} <span>Edit Log Entry</span></h3>
              <button
                type="button"
                class="btn btn-ghost btn-icon modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form id="form-edit-entry" style="display: flex; flex-direction: column; gap: 12px">
              <input type="hidden" id="edit-entry-id" />
              <div>
                <label
                  for="edit-entry-title"
                  style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                  >Task / Accomplishment</label
                >
                <input type="text" id="edit-entry-title" class="form-input" required />
              </div>
              <div class="input-row">
                <div style="flex: 1">
                  <label
                    for="edit-entry-project"
                    style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                    >Project</label
                  >
                  <input type="text" id="edit-entry-project" class="form-input" />
                </div>
                <div style="flex: 1">
                  <label
                    for="edit-entry-date"
                    style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                    >Date</label
                  >
                  <input type="date" id="edit-entry-date" class="form-input" />
                </div>
              </div>
              <div class="input-row">
                <div style="flex: 1">
                  <label
                    for="edit-entry-impact"
                    style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                    >Impact</label
                  >
                  <select id="edit-entry-impact" class="form-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High 🔥</option>
                  </select>
                </div>
                <div style="flex: 1">
                  <label
                    for="edit-entry-status"
                    style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                    >Status</label
                  >
                  <select id="edit-entry-status" class="form-select">
                    <option value="backlog">Backlog 📌</option>
                    <option value="in_progress">In Progress ⚡</option>
                    <option value="done">Done ✅</option>
                    <option value="blocked">Blocked 🚧</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  for="edit-entry-blocker"
                  style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px"
                  >Blocker Notes (if blocked)</label
                >
                <input
                  type="text"
                  id="edit-entry-blocker"
                  class="form-input"
                  placeholder="e.g. Waiting on DevOps PR merge"
                />
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </dialog>
        `;
      }
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get('bb-modals')) {
    customElements.define('bb-modals', BBModals);
  }

  // --- Bootstrap Sequence ---
  const boot = () => {
    // 1. Load persistent local state
    BragBook.StorageManager.load();

    // 2. Initialize navigation and dialog handlers
    BragBook.NavigationController.init();
    BragBook.Modals.init();

    // 3. Initialize feature controllers
    BragBook.EditEntryModal.init();
    BragBook.JournalController.init();
    BragBook.KanbanController.init();
    BragBook.KanbanController.renderBoard();
    BragBook.MeetingController.init();
    BragBook.StandupController.init();
    BragBook.ReviewController.init();
    BragBook.SettingsController.init();
    BragBook.BackupController.init();

    // 4. Compute streak & metrics
    BragBook.MetricsController.updateCounters();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
