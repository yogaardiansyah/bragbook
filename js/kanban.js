/**
 * BragBook — 4-Column Interactive Kanban Controller
 * @module KanbanController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.KanbanController = {
    draggedCardId: null,

    init() {
      const dropzones = document.querySelectorAll('.kanban-dropzone');
      dropzones.forEach(zone => {
        zone.addEventListener('dragover', e => {
          e.preventDefault();
          zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
          zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', e => {
          e.preventDefault();
          zone.classList.remove('drag-over');
          const entryId = e.dataTransfer.getData('text/plain') || this.draggedCardId;
          const targetStatus = zone.dataset.status;
          if (entryId && targetStatus) {
            this.moveCard(entryId, targetStatus);
          }
        });
      });
    },

    moveCard(entryId, newStatus) {
      const entry = BragBook.State.entries.find(e => e.id === entryId);
      if (!entry || entry.status === newStatus) return;

      if (newStatus === 'done' && entry.status !== 'done') {
        entry.completedAt = new Date().toISOString();
      }
      entry.status = newStatus;

      BragBook.StorageManager.saveEntries();
      this.renderBoard();
      if (BragBook.JournalController) BragBook.JournalController.renderTimeline();
      if (BragBook.MetricsController) BragBook.MetricsController.updateCounters();
    },

    renderBoard() {
      const statuses = BragBook.Constants.STATUSES;
      const grouped = {
        backlog: [],
        in_progress: [],
        done: [],
        blocked: []
      };

      BragBook.State.entries.forEach(entry => {
        const s = grouped[entry.status] ? entry.status : 'backlog';
        grouped[s].push(entry);
      });

      statuses.forEach(status => {
        const zone = document.getElementById(`zone-${status}`);
        const countBadge = document.getElementById(`kanban-count-${status}`);
        const items = grouped[status];

        if (countBadge) countBadge.textContent = items.length;
        if (!zone) return;

        if (!items.length) {
          zone.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; color: var(--text-dim); font-size: 0.85rem; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
              Empty column
            </div>
          `;
          return;
        }

        let html = '';
        items.forEach(entry => {
          const impactBadgeClass = `badge-impact-${entry.impact || 'medium'}`;
          const tagsHtml = (entry.tags || [])
            .map(
              t =>
                `<span class="tag-chip" style="font-size: 0.7rem; padding: 2px 6px;">${BragBook.Utils.escapeHtml(t)}</span>`
            )
            .join('');

          html += `
            <div class="kanban-card" draggable="true" data-id="${entry.id}">
              <div class="kanban-card-top">
                <strong class="kanban-card-title">${BragBook.Utils.escapeHtml(entry.title)}</strong>
                <button type="button" class="btn btn-ghost btn-sm btn-edit-entry" data-id="${entry.id}" title="Edit Task">
                  ${BragBook.Icons.edit}
                </button>
              </div>

              <div class="kanban-card-tags">
                <span class="badge badge-project">
                  ${BragBook.Icons.folder} ${BragBook.Utils.escapeHtml(entry.project || 'General')}
                </span>
                <span class="badge ${impactBadgeClass}">
                  ${entry.impact}
                </span>
                ${tagsHtml}
              </div>

              <div class="kanban-card-footer">
                <span class="kanban-card-date">
                  ${BragBook.Utils.formatDateDisplay((entry.createdAt || '').split('T')[0])}
                </span>
                <select class="form-select select-kanban-shift" data-id="${entry.id}" title="Shift status">
                  <option value="backlog" ${entry.status === 'backlog' ? 'selected' : ''}>Backlog</option>
                  <option value="in_progress" ${entry.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="done" ${entry.status === 'done' ? 'selected' : ''}>Done</option>
                  <option value="blocked" ${entry.status === 'blocked' ? 'selected' : ''}>Blocked</option>
                </select>
              </div>
            </div>
          `;
        });

        zone.innerHTML = html;
      });

      this.bindCardEvents();
    },

    bindCardEvents() {
      // Drag events
      document.querySelectorAll('.kanban-card').forEach(card => {
        card.addEventListener('dragstart', e => {
          this.draggedCardId = card.dataset.id;
          e.dataTransfer.setData('text/plain', card.dataset.id);
          card.classList.add('is-dragging');
        });

        card.addEventListener('dragend', () => {
          this.draggedCardId = null;
          card.classList.remove('is-dragging');
        });
      });

      // Quick move dropdown
      document.querySelectorAll('.select-kanban-shift').forEach(sel => {
        sel.addEventListener('change', e => {
          const entryId = sel.dataset.id;
          const newStatus = e.target.value;
          this.moveCard(entryId, newStatus);
        });
      });

      // Quick edit button on cards
      document.querySelectorAll('.kanban-card .btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = BragBook.State.entries.find(item => item.id === id);
          if (entry && BragBook.EditEntryModal) BragBook.EditEntryModal.open(entry);
        });
      });
    }
  };

  // --- Native Web Component: <bb-kanban> ---
  class BBKanban extends HTMLElement {
    connectedCallback() {
      if (this.childElementCount === 0) {
        this.innerHTML = `
          <div class="kanban-board">
            <!-- Column 1: Backlog -->
            <div class="kanban-column column-backlog" data-status="backlog">
              <div class="kanban-column-header">
                <div class="column-title-group" style="color: var(--status-backlog)">
                  <span class="col-dot dot-backlog"></span> Backlog / Planned
                </div>
                <span id="kanban-count-backlog" class="kanban-counter">0</span>
              </div>
              <div id="zone-backlog" class="kanban-dropzone" data-status="backlog"></div>
            </div>

            <!-- Column 2: In Progress -->
            <div class="kanban-column column-in_progress" data-status="in_progress">
              <div class="kanban-column-header">
                <div class="column-title-group" style="color: var(--status-in-progress)">
                  <span class="col-dot dot-in-progress"></span> In Progress / Active
                </div>
                <span id="kanban-count-in_progress" class="kanban-counter">0</span>
              </div>
              <div id="zone-in_progress" class="kanban-dropzone" data-status="in_progress"></div>
            </div>

            <!-- Column 3: Done -->
            <div class="kanban-column column-done" data-status="done">
              <div class="kanban-column-header">
                <div class="column-title-group" style="color: var(--status-done)">
                  <span class="col-dot dot-done"></span> Completed Wins
                </div>
                <span id="kanban-count-done" class="kanban-counter">0</span>
              </div>
              <div id="zone-done" class="kanban-dropzone" data-status="done"></div>
            </div>

            <!-- Column 4: Blocked -->
            <div class="kanban-column column-blocked" data-status="blocked">
              <div class="kanban-column-header">
                <div class="column-title-group" style="color: var(--status-blocked)">
                  <span class="col-dot dot-blocked"></span> Blocked / Risk
                </div>
                <span id="kanban-count-blocked" class="kanban-counter">0</span>
              </div>
              <div id="zone-blocked" class="kanban-dropzone" data-status="blocked"></div>
            </div>
          </div>
        `;
      }
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get('bb-kanban')) {
    customElements.define('bb-kanban', BBKanban);
  }
})();
