/**
 * BragBook — Work Journal & Timeline Controller
 * @module JournalController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.JournalController = {
    init() {
      this.bindQuickCapture();
      this.bindFilters();
      this.bindTagChips();
      this.renderTimeline();
      this.updateProjectFilterOptions();
    },

    bindTagChips() {
      const chips = document.querySelectorAll('.quick-tags-container .tag-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const tag = chip.dataset.tag;
          if (BragBook.State.selectedQuickTags.has(tag)) {
            BragBook.State.selectedQuickTags.delete(tag);
            chip.classList.remove('active');
          } else {
            BragBook.State.selectedQuickTags.add(tag);
            chip.classList.add('active');
          }
          const hiddenInput = document.getElementById('hidden-selected-tags');
          if (hiddenInput) {
            hiddenInput.value = Array.from(BragBook.State.selectedQuickTags).join(' ');
          }
        });
      });
    },

    clearTagChips() {
      BragBook.State.selectedQuickTags.clear();
      document
        .querySelectorAll('.quick-tags-container .tag-chip')
        .forEach(c => c.classList.remove('active'));
      const hiddenInput = document.getElementById('hidden-selected-tags');
      if (hiddenInput) hiddenInput.value = '';
    },

    bindQuickCapture() {
      const form = document.getElementById('form-quick-entry');
      const dateInput = document.getElementById('input-entry-date');
      if (dateInput) dateInput.value = BragBook.Utils.getTodayDateString();

      if (!form) return;

      form.addEventListener('submit', e => {
        e.preventDefault();

        const titleInput = document.getElementById('input-entry-title');
        const projectInput = document.getElementById('input-entry-project');
        const impactSelect = document.getElementById('select-entry-impact');
        const statusSelect = document.getElementById('select-entry-status');

        const title = titleInput.value.trim();
        if (!title) return;

        const project = projectInput.value.trim() || 'General';
        const impact = impactSelect.value;
        const status = statusSelect.value;
        const entryDate = dateInput.value || BragBook.Utils.getTodayDateString();
        const tags = Array.from(BragBook.State.selectedQuickTags);

        const newEntry = {
          id: BragBook.Utils.generateId(),
          title,
          project,
          tags,
          impact,
          status,
          createdAt: entryDate + 'T' + BragBook.Utils.getCurrentTimeString() + ':00',
          completedAt: status === 'done' ? new Date().toISOString() : null,
          blockerNotes: ''
        };

        // Add to front of entries
        BragBook.State.entries.unshift(newEntry);
        BragBook.StorageManager.saveEntries();

        // Reset form
        titleInput.value = '';
        this.clearTagChips();

        // Refresh UI
        this.updateProjectFilterOptions();
        this.renderTimeline();
        if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
        BragBook.MetricsController.updateCounters();
      });
    },

    bindFilters() {
      const searchInput = document.getElementById('input-search-query');
      const projectFilter = document.getElementById('filter-project');
      const impactFilter = document.getElementById('filter-impact');
      const statusFilter = document.getElementById('filter-status');

      if (!searchInput || !projectFilter || !impactFilter || !statusFilter) return;

      const applyFilters = () => {
        BragBook.State.filters.search = searchInput.value.toLowerCase().trim();
        BragBook.State.filters.project = projectFilter.value;
        BragBook.State.filters.impact = impactFilter.value;
        BragBook.State.filters.status = statusFilter.value;
        this.renderTimeline();
      };

      searchInput.addEventListener('input', applyFilters);
      projectFilter.addEventListener('change', applyFilters);
      impactFilter.addEventListener('change', applyFilters);
      statusFilter.addEventListener('change', applyFilters);
    },

    updateProjectFilterOptions() {
      const select = document.getElementById('filter-project');
      if (!select) return;

      const currentVal = select.value;
      const projects = Array.from(
        new Set(BragBook.State.entries.map(e => e.project || 'General'))
      ).sort();

      select.innerHTML = '<option value="all">All Projects</option>';
      projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        if (p === currentVal) opt.selected = true;
        select.appendChild(opt);
      });
    },

    getFilteredEntries() {
      const { search, project, impact, status } = BragBook.State.filters;

      return BragBook.State.entries.filter(entry => {
        // Keyword Search
        if (search) {
          const matchTitle = entry.title.toLowerCase().includes(search);
          const matchProject = (entry.project || '').toLowerCase().includes(search);
          const matchTags = (entry.tags || []).some(t => t.toLowerCase().includes(search));
          if (!matchTitle && !matchProject && !matchTags) return false;
        }

        // Project filter
        if (project !== 'all' && (entry.project || 'General') !== project) {
          return false;
        }

        // Impact filter
        if (impact !== 'all' && entry.impact !== impact) {
          return false;
        }

        // Status filter
        if (status !== 'all' && entry.status !== status) {
          return false;
        }

        return true;
      });
    },

    renderTimeline() {
      const timeline = document.getElementById('journal-timeline');
      if (!timeline) return;

      const entries = this.getFilteredEntries();

      if (!entries.length) {
        timeline.innerHTML = `
          <div class="card-glass" style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
            <div style="font-size: 2.2rem; margin-bottom: 10px;">🌟</div>
            <strong style="display: block; font-size: 1.05rem; color: var(--text-main); margin-bottom: 6px;">No accomplishments logged yet</strong>
            <p style="font-size: 0.88rem;">Use the quick entry bar above to capture what you worked on today!</p>
          </div>
        `;
        return;
      }

      // Group by date
      const grouped = {};
      entries.forEach(entry => {
        const dateKey =
          (entry.createdAt || '').split('T')[0] || BragBook.Utils.getTodayDateString();
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(entry);
      });

      let html = '';
      Object.keys(grouped).forEach(dateKey => {
        const dateDisplay = BragBook.Utils.formatDateDisplay(dateKey);
        html += `
          <div style="margin-top: 8px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim);">📅 ${dateDisplay}</span>
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          </div>
        `;

        grouped[dateKey].forEach(entry => {
          const tagsHtml = (entry.tags || [])
            .map(
              t =>
                `<span class="tag-chip" style="cursor: default;">${BragBook.Utils.escapeHtml(t)}</span>`
            )
            .join('');
          const impactBadgeClass = `badge-impact-${entry.impact || 'medium'}`;
          const statusBadgeClass = `badge-status-${entry.status || 'done'}`;
          const statusLabel = (entry.status || 'done').replace('_', ' ');

          html += `
            <article class="entry-card" data-id="${entry.id}">
              <div class="entry-header">
                <div style="flex: 1;">
                  <h4 class="entry-title">${BragBook.Utils.escapeHtml(entry.title)}</h4>
                  <div class="entry-meta" style="margin-top: 6px;">
                    <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">📁 ${BragBook.Utils.escapeHtml(entry.project || 'General')}</span>
                    <span class="badge ${impactBadgeClass}">Impact: ${entry.impact}</span>
                    <span class="badge ${statusBadgeClass}">Status: ${statusLabel}</span>
                    ${tagsHtml}
                  </div>
                </div>
                <div class="entry-actions">
                  <button type="button" class="btn btn-ghost btn-sm btn-edit-entry" data-id="${entry.id}" title="Edit entry">✏️</button>
                  <button type="button" class="btn btn-ghost btn-sm btn-delete-entry" data-id="${entry.id}" style="color: #f43f5e;" title="Delete entry">🗑️</button>
                </div>
              </div>
              ${entry.blockerNotes ? `<div style="font-size: 0.82rem; color: #fb7185; background: rgba(244,63,94,0.1); padding: 4px 8px; border-radius: var(--radius-sm);">🚧 Blocker: ${BragBook.Utils.escapeHtml(entry.blockerNotes)}</div>` : ''}
            </article>
          `;
        });
      });

      timeline.innerHTML = html;
      this.bindEntryActions();
    },

    bindEntryActions() {
      // Edit buttons
      document.querySelectorAll('.btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const entry = BragBook.State.entries.find(e => e.id === id);
          if (entry && BragBook.EditEntryModal) BragBook.EditEntryModal.open(entry);
        });
      });

      // Delete buttons
      document.querySelectorAll('.btn-delete-entry').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('Are you sure you want to delete this log entry?')) {
            BragBook.State.entries = BragBook.State.entries.filter(e => e.id !== id);
            BragBook.StorageManager.saveEntries();
            this.renderTimeline();
            if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
            BragBook.MetricsController.updateCounters();
          }
        });
      });
    }
  };

  // --- Edit Entry Modal Controller ---
  BragBook.EditEntryModal = {
    modal: null,

    init() {
      this.modal = document.getElementById('modal-edit-entry');
      const form = document.getElementById('form-edit-entry');
      if (!form || !this.modal) return;

      form.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('edit-entry-id').value;
        const entry = BragBook.State.entries.find(e => e.id === id);
        if (!entry) return;

        entry.title = document.getElementById('edit-entry-title').value.trim();
        entry.project = document.getElementById('edit-entry-project').value.trim() || 'General';
        const dateVal = document.getElementById('edit-entry-date').value;
        if (dateVal) {
          const timePart = (entry.createdAt || '').split('T')[1] || '12:00:00';
          entry.createdAt = `${dateVal}T${timePart}`;
        }
        entry.impact = document.getElementById('edit-entry-impact').value;
        const newStatus = document.getElementById('edit-entry-status').value;
        if (newStatus === 'done' && entry.status !== 'done') {
          entry.completedAt = new Date().toISOString();
        }
        entry.status = newStatus;
        entry.blockerNotes = document.getElementById('edit-entry-blocker').value.trim();

        BragBook.StorageManager.saveEntries();
        BragBook.JournalController.renderTimeline();
        if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
        BragBook.MetricsController.updateCounters();
        this.close();
      });

      this.modal.querySelectorAll('.modal-close-btn').forEach(b => {
        b.addEventListener('click', () => this.close());
      });
    },

    open(entry) {
      if (!this.modal) return;
      document.getElementById('edit-entry-id').value = entry.id;
      document.getElementById('edit-entry-title').value = entry.title || '';
      document.getElementById('edit-entry-project').value = entry.project || '';
      document.getElementById('edit-entry-date').value =
        (entry.createdAt || '').split('T')[0] || BragBook.Utils.getTodayDateString();
      document.getElementById('edit-entry-impact').value = entry.impact || 'medium';
      document.getElementById('edit-entry-status').value = entry.status || 'done';
      document.getElementById('edit-entry-blocker').value = entry.blockerNotes || '';

      if (this.modal.showModal) this.modal.showModal();
    },

    close() {
      if (this.modal && this.modal.close) this.modal.close();
    }
  };
})();
