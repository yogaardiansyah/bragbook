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
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <strong style="font-size: 0.9rem; line-height: 1.35; color: var(--text-main);">${BragBook.Utils.escapeHtml(entry.title)}</strong>
                <button type="button" class="btn btn-ghost btn-sm btn-edit-entry" data-id="${entry.id}" style="padding: 2px 4px; font-size: 0.75rem;" title="Edit">✏️</button>
              </div>

              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">📁 ${BragBook.Utils.escapeHtml(entry.project || 'General')}</span>
                <span class="badge ${impactBadgeClass}" style="font-size: 0.7rem;">${entry.impact}</span>
                ${tagsHtml}
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-dim);">${BragBook.Utils.formatDateDisplay((entry.createdAt || '').split('T')[0])}</span>
                <select class="form-select select-kanban-shift" data-id="${entry.id}" style="padding: 2px 6px; font-size: 0.75rem; width: auto;" title="Move status">
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
})();
