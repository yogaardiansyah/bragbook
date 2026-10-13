/**
 * ============================================================================
 * BragBook — Client-Side Application Engine
 * Architecture: 100% Zero-Server, Local-First Vanilla ES6+
 * ============================================================================
 */

(() => {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEYS = {
    ENTRIES: 'bragbook_entries',
    MEETINGS: 'bragbook_meetings',
    SETTINGS: 'bragbook_settings'
  };

  const DEFAULT_SETTINGS = {
    aiProvider: 'ollama', // 'ollama' | 'gemini' | 'none'
    ollamaBaseUrl: 'http://localhost:11434/v1',
    ollamaModel: 'llama3.2',
    geminiApiKey: '',
    geminiModel: 'gemini-1.5-flash',
    theme: 'dark'
  };

  // --- Reactive Application State ---
  const State = {
    entries: [],
    meetings: [],
    activeMeetingId: null,
    settings: { ...DEFAULT_SETTINGS },
    activeTab: 'journal',
    selectedQuickTags: new Set(),
    filters: {
      search: '',
      project: 'all',
      impact: 'all',
      status: 'all'
    }
  };

  // --- Storage Manager ---
  const StorageManager = {
    load() {
      try {
        const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        State.entries = rawEntries ? JSON.parse(rawEntries) : [];

        const rawMeetings = localStorage.getItem(STORAGE_KEYS.MEETINGS);
        State.meetings = rawMeetings ? JSON.parse(rawMeetings) : [];

        const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        State.settings = rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : { ...DEFAULT_SETTINGS };
      } catch (err) {
        console.error('Failed to parse localStorage state:', err);
        State.entries = [];
        State.meetings = [];
        State.settings = { ...DEFAULT_SETTINGS };
      }
    },

    saveEntries() {
      try {
        localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(State.entries));
      } catch (err) {
        console.error('Error saving entries to localStorage:', err);
      }
    },

    saveMeetings() {
      try {
        localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(State.meetings));
      } catch (err) {
        console.error('Error saving meetings to localStorage:', err);
      }
    },

    saveSettings() {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(State.settings));
      } catch (err) {
        console.error('Error saving settings to localStorage:', err);
      }
    }
  };

  // --- Utility Functions ---
  const Utils = {
    generateId() {
      return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    },

    getTodayDateString() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },

    getCurrentTimeString() {
      const now = new Date();
      return now.toTimeString().substring(0, 5); // "HH:MM"
    },

    formatDateDisplay(dateStr) {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      const date = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(date);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';

      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      }).format(date);
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  };

  // --- Metrics & Streak Calculation ---
  const MetricsController = {
    calculateStreak() {
      if (!State.entries.length) return 0;

      // Extract unique active work dates
      const activeDates = new Set(
        State.entries
          .map(e => e.createdAt ? e.createdAt.split('T')[0] : null)
          .filter(Boolean)
      );

      const sortedDates = Array.from(activeDates).sort().reverse();
      if (!sortedDates.length) return 0;

      const todayStr = Utils.getTodayDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Streak is active if user has an entry today or yesterday
      if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
        return 0;
      }

      let streak = 0;
      let checkDate = activeDates.has(todayStr) ? new Date() : yesterday;

      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (activeDates.has(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    },

    updateCounters() {
      const winsCount = State.entries.filter(e => e.status === 'done').length;
      const streakCount = this.calculateStreak();

      const elWins = document.getElementById('wins-counter');
      const elStreak = document.getElementById('streak-counter');
      const elBadgeJournal = document.getElementById('badge-journal-count');
      const elBadgeKanban = document.getElementById('badge-kanban-count');
      const elBadgeMeetings = document.getElementById('badge-meetings-count');

      if (elWins) elWins.textContent = winsCount;
      if (elStreak) elStreak.textContent = streakCount;
      if (elBadgeJournal) elBadgeJournal.textContent = State.entries.length;
      if (elBadgeKanban) elBadgeKanban.textContent = State.entries.length;
      if (elBadgeMeetings) elBadgeMeetings.textContent = State.meetings.length;
    }
  };

  // --- Tab Navigation Controller ---
  const NavigationController = {
    init() {
      const tabButtons = document.querySelectorAll('.tab-btn');
      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.id.replace('tab-btn-', '');
          this.switchTab(targetTab);
        });
      });
    },

    switchTab(tabName) {
      State.activeTab = tabName;

      // Update button active state
      document.querySelectorAll('.tab-btn').forEach(btn => {
        const isCurrent = btn.id === `tab-btn-${tabName}`;
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });

      // Update panel visibility
      document.querySelectorAll('.tab-panel').forEach(panel => {
        const isCurrent = panel.id === `panel-${tabName}`;
        panel.classList.toggle('active', isCurrent);
      });

      if (tabName === 'kanban' && typeof KanbanController !== 'undefined') {
        KanbanController.renderBoard();
      }
      if (tabName === 'meetings' && typeof MeetingController !== 'undefined') {
        MeetingController.renderMeetingsList();
        MeetingController.renderActiveMeeting();
      }
    }
  };

  // --- Work Journal Controller ---
  const JournalController = {
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
          if (State.selectedQuickTags.has(tag)) {
            State.selectedQuickTags.delete(tag);
            chip.classList.remove('active');
          } else {
            State.selectedQuickTags.add(tag);
            chip.classList.add('active');
          }
          document.getElementById('hidden-selected-tags').value = Array.from(State.selectedQuickTags).join(' ');
        });
      });
    },

    clearTagChips() {
      State.selectedQuickTags.clear();
      document.querySelectorAll('.quick-tags-container .tag-chip').forEach(c => c.classList.remove('active'));
      document.getElementById('hidden-selected-tags').value = '';
    },

    bindQuickCapture() {
      const form = document.getElementById('form-quick-entry');
      const dateInput = document.getElementById('input-entry-date');
      if (dateInput) dateInput.value = Utils.getTodayDateString();

      form.addEventListener('submit', (e) => {
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
        const entryDate = dateInput.value || Utils.getTodayDateString();
        const tags = Array.from(State.selectedQuickTags);

        const newEntry = {
          id: Utils.generateId(),
          title,
          project,
          tags,
          impact,
          status,
          createdAt: entryDate + 'T' + Utils.getCurrentTimeString() + ':00',
          completedAt: status === 'done' ? new Date().toISOString() : null,
          blockerNotes: ''
        };

        // Add to front of list
        State.entries.unshift(newEntry);
        StorageManager.saveEntries();

        // Reset form
        titleInput.value = '';
        this.clearTagChips();

        // Refresh UI
        this.updateProjectFilterOptions();
        this.renderTimeline();
        if (typeof KanbanController !== 'undefined') KanbanController.renderBoard();
        MetricsController.updateCounters();
      });
    },

    bindFilters() {
      const searchInput = document.getElementById('input-search-query');
      const projectFilter = document.getElementById('filter-project');
      const impactFilter = document.getElementById('filter-impact');
      const statusFilter = document.getElementById('filter-status');

      const applyFilters = () => {
        State.filters.search = searchInput.value.toLowerCase().trim();
        State.filters.project = projectFilter.value;
        State.filters.impact = impactFilter.value;
        State.filters.status = statusFilter.value;
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
      const projects = Array.from(new Set(State.entries.map(e => e.project || 'General'))).sort();

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
      return State.entries.filter(entry => {
        // Keyword Search
        if (State.filters.search) {
          const matchTitle = entry.title.toLowerCase().includes(State.filters.search);
          const matchProject = (entry.project || '').toLowerCase().includes(State.filters.search);
          const matchTags = (entry.tags || []).some(t => t.toLowerCase().includes(State.filters.search));
          if (!matchTitle && !matchProject && !matchTags) return false;
        }

        // Project filter
        if (State.filters.project !== 'all' && (entry.project || 'General') !== State.filters.project) {
          return false;
        }

        // Impact filter
        if (State.filters.impact !== 'all' && entry.impact !== State.filters.impact) {
          return false;
        }

        // Status filter
        if (State.filters.status !== 'all' && entry.status !== State.filters.status) {
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
        const dateKey = (entry.createdAt || '').split('T')[0] || Utils.getTodayDateString();
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(entry);
      });

      let html = '';
      Object.keys(grouped).forEach(dateKey => {
        const dateDisplay = Utils.formatDateDisplay(dateKey);
        html += `
          <div style="margin-top: 8px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim);">📅 ${dateDisplay}</span>
            <div style="flex: 1; height: 1px; background: var(--border-subtle);"></div>
          </div>
        `;

        grouped[dateKey].forEach(entry => {
          const tagsHtml = (entry.tags || []).map(t => `<span class="tag-chip" style="cursor: default;">${Utils.escapeHtml(t)}</span>`).join('');
          const impactBadgeClass = `badge-impact-${entry.impact || 'medium'}`;
          const statusBadgeClass = `badge-status-${entry.status || 'done'}`;
          const statusLabel = (entry.status || 'done').replace('_', ' ');

          html += `
            <article class="entry-card" data-id="${entry.id}">
              <div class="entry-header">
                <div style="flex: 1;">
                  <h4 class="entry-title">${Utils.escapeHtml(entry.title)}</h4>
                  <div class="entry-meta" style="margin-top: 6px;">
                    <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">📁 ${Utils.escapeHtml(entry.project || 'General')}</span>
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
              ${entry.blockerNotes ? `<div style="font-size: 0.82rem; color: #fb7185; background: rgba(244,63,94,0.1); padding: 4px 8px; border-radius: var(--radius-sm);">🚧 Blocker: ${Utils.escapeHtml(entry.blockerNotes)}</div>` : ''}
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
          const entry = State.entries.find(e => e.id === id);
          if (entry) EditEntryModal.open(entry);
        });
      });

      // Delete buttons
      document.querySelectorAll('.btn-delete-entry').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('Are you sure you want to delete this log entry?')) {
            State.entries = State.entries.filter(e => e.id !== id);
            StorageManager.saveEntries();
            this.renderTimeline();
            if (typeof KanbanController !== 'undefined') KanbanController.renderBoard();
            MetricsController.updateCounters();
          }
        });
      });
    }
  };

  // --- Edit Entry Modal Controller ---
  const EditEntryModal = {
    modal: null,

    init() {
      this.modal = document.getElementById('modal-edit-entry');
      const form = document.getElementById('form-edit-entry');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-entry-id').value;
        const entry = State.entries.find(e => e.id === id);
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

        StorageManager.saveEntries();
        JournalController.renderTimeline();
        if (typeof KanbanController !== 'undefined') KanbanController.renderBoard();
        MetricsController.updateCounters();
        this.close();
      });

      this.modal.querySelectorAll('.modal-close-btn').forEach(b => {
        b.addEventListener('click', () => this.close());
      });
    },

    open(entry) {
      document.getElementById('edit-entry-id').value = entry.id;
      document.getElementById('edit-entry-title').value = entry.title || '';
      document.getElementById('edit-entry-project').value = entry.project || '';
      document.getElementById('edit-entry-date').value = (entry.createdAt || '').split('T')[0] || Utils.getTodayDateString();
      document.getElementById('edit-entry-impact').value = entry.impact || 'medium';
      document.getElementById('edit-entry-status').value = entry.status || 'done';
      document.getElementById('edit-entry-blocker').value = entry.blockerNotes || '';

      if (this.modal.showModal) this.modal.showModal();
    },

    close() {
      if (this.modal.close) this.modal.close();
    }
  };

  // --- Kanban Board Controller ---
  const KanbanController = {
    draggedCardId: null,

    init() {
      const dropzones = document.querySelectorAll('.kanban-dropzone');
      dropzones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
          e.preventDefault();
          zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
          zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e) => {
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
      const entry = State.entries.find(e => e.id === entryId);
      if (!entry || entry.status === newStatus) return;

      if (newStatus === 'done' && entry.status !== 'done') {
        entry.completedAt = new Date().toISOString();
      }
      entry.status = newStatus;

      StorageManager.saveEntries();
      this.renderBoard();
      JournalController.renderTimeline();
      MetricsController.updateCounters();
    },

    renderBoard() {
      const statuses = ['backlog', 'in_progress', 'done', 'blocked'];
      const grouped = {
        backlog: [],
        in_progress: [],
        done: [],
        blocked: []
      };

      State.entries.forEach(entry => {
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
          const tagsHtml = (entry.tags || []).map(t => `<span class="tag-chip" style="font-size: 0.7rem; padding: 2px 6px;">${Utils.escapeHtml(t)}</span>`).join('');

          html += `
            <div class="kanban-card" draggable="true" data-id="${entry.id}">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <strong style="font-size: 0.9rem; line-height: 1.35; color: var(--text-main);">${Utils.escapeHtml(entry.title)}</strong>
                <button type="button" class="btn btn-ghost btn-sm btn-edit-entry" data-id="${entry.id}" style="padding: 2px 4px; font-size: 0.75rem;" title="Edit">✏️</button>
              </div>

              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="badge" style="background: rgba(255,255,255,0.06); font-size: 0.7rem;">📁 ${Utils.escapeHtml(entry.project || 'General')}</span>
                <span class="badge ${impactBadgeClass}" style="font-size: 0.7rem;">${entry.impact}</span>
                ${tagsHtml}
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
                <span style="font-size: 0.72rem; color: var(--text-dim);">${Utils.formatDateDisplay((entry.createdAt || '').split('T')[0])}</span>
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
        card.addEventListener('dragstart', (e) => {
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
        sel.addEventListener('change', (e) => {
          const entryId = sel.dataset.id;
          const newStatus = e.target.value;
          this.moveCard(entryId, newStatus);
        });
      });

      // Quick edit button on cards
      document.querySelectorAll('.kanban-card .btn-edit-entry').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.id;
          const entry = State.entries.find(item => item.id === id);
          if (entry) EditEntryModal.open(entry);
        });
      });
    }
  };

  // --- Live Meeting Notes & Notulen Controller ---
  const MeetingController = {
    init() {
      // New Meeting button
      const btnNew = document.getElementById('btn-new-meeting');
      if (btnNew) {
        btnNew.addEventListener('click', () => {
          this.createNewMeeting();
        });
      }

      // Delete meeting button
      const btnDel = document.getElementById('btn-delete-meeting');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          if (!State.activeMeetingId) return;
          if (confirm('Delete this meeting and all its notes?')) {
            State.meetings = State.meetings.filter(m => m.id !== State.activeMeetingId);
            State.activeMeetingId = State.meetings.length ? State.meetings[0].id : null;
            StorageManager.saveMeetings();
            this.renderMeetingsList();
            this.renderActiveMeeting();
            MetricsController.updateCounters();
          }
        });
      }

      // Live 1-click timestamp button
      const btnTs = document.getElementById('btn-insert-timestamp');
      if (btnTs) {
        btnTs.addEventListener('click', () => {
          this.insertTimestamp();
        });
      }

      // Notes textarea shortcuts (Ctrl+T / Cmd+T) & auto-save
      const textarea = document.getElementById('meeting-notes-textarea');
      if (textarea) {
        textarea.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
            e.preventDefault();
            this.insertTimestamp();
          }
        });

        textarea.addEventListener('input', () => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.notes = textarea.value;
            meeting.updatedAt = new Date().toISOString();
            StorageManager.saveMeetings();
          }
        });
      }

      // Title, date, project, attendees inputs
      const titleInput = document.getElementById('meeting-title-input');
      if (titleInput) {
        titleInput.addEventListener('input', () => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.title = titleInput.value.trim() || 'Untitled Meeting';
            StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const dateInput = document.getElementById('meeting-date-input');
      if (dateInput) {
        dateInput.addEventListener('change', (e) => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.date = e.target.value;
            StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const projectInput = document.getElementById('meeting-project-input');
      if (projectInput) {
        projectInput.addEventListener('input', (e) => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.project = e.target.value.trim() || 'General';
            StorageManager.saveMeetings();
          }
        });
      }

      const attendeesInput = document.getElementById('meeting-attendees-input');
      if (attendeesInput) {
        attendeesInput.addEventListener('input', (e) => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.participants = e.target.value;
            StorageManager.saveMeetings();
          }
        });
      }

      // Action items input & button
      const newActionInput = document.getElementById('input-new-action-item');
      const addActionBtn = document.getElementById('btn-add-action-item');
      const addAction = () => {
        if (!newActionInput) return;
        const text = newActionInput.value.trim();
        if (!text) return;
        const meeting = this.getActiveMeeting();
        if (!meeting) return;
        if (!meeting.actionItems) meeting.actionItems = [];
        meeting.actionItems.push({
          id: Utils.generateId(),
          text,
          isCompleted: false,
          syncedToKanban: false
        });
        StorageManager.saveMeetings();
        newActionInput.value = '';
        this.renderActionItems();
      };

      if (addActionBtn) addActionBtn.addEventListener('click', addAction);
      if (newActionInput) {
        newActionInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addAction();
          }
        });
      }

      // Sync Action Items to Kanban
      const btnSync = document.getElementById('btn-sync-action-items');
      if (btnSync) {
        btnSync.addEventListener('click', () => {
          this.syncActionItemsToKanban();
        });
      }

      // Initialize active meeting selection
      if (State.meetings.length && !State.activeMeetingId) {
        State.activeMeetingId = State.meetings[0].id;
      }
      this.renderMeetingsList();
      this.renderActiveMeeting();
    },

    getActiveMeeting() {
      return State.meetings.find(m => m.id === State.activeMeetingId);
    },

    createNewMeeting() {
      const newMeeting = {
        id: Utils.generateId(),
        title: 'New Meeting',
        date: Utils.getTodayDateString(),
        project: 'General',
        participants: '',
        notes: '',
        actionItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      State.meetings.unshift(newMeeting);
      State.activeMeetingId = newMeeting.id;
      StorageManager.saveMeetings();
      this.renderMeetingsList();
      this.renderActiveMeeting();
      MetricsController.updateCounters();
      const titleInput = document.getElementById('meeting-title-input');
      if (titleInput) titleInput.focus();
    },

    insertTimestamp() {
      const textarea = document.getElementById('meeting-notes-textarea');
      if (!textarea || textarea.disabled) return;
      const timeStr = Utils.getCurrentTimeString();
      const token = `[${timeStr}] `;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const prefix = (start > 0 && text[start - 1] !== '\n') ? '\n' : '';
      const insertion = prefix + token;

      textarea.value = text.substring(0, start) + insertion + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      textarea.focus();

      textarea.dispatchEvent(new Event('input'));
    },

    renderMeetingsList() {
      const listContainer = document.getElementById('meetings-list');
      if (!listContainer) return;

      if (!State.meetings.length) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 0.85rem;">
            No meetings yet.<br>Click "+ New Meeting" above.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = State.meetings.map(m => {
        const isActive = m.id === State.activeMeetingId;
        const activeClass = isActive ? 'active' : '';
        const actionCount = (m.actionItems || []).length;
        return `
          <div class="meeting-item ${activeClass}" data-id="${m.id}">
            <strong style="display: block; font-size: 0.9rem; color: var(--text-main); margin-bottom: 2px;">${Utils.escapeHtml(m.title || 'Untitled Meeting')}</strong>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim);">
              <span>${Utils.formatDateDisplay(m.date)}</span>
              <span>${actionCount ? `⚡ ${actionCount} actions` : ''}</span>
            </div>
          </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.meeting-item').forEach(item => {
        item.addEventListener('click', () => {
          State.activeMeetingId = item.dataset.id;
          this.renderMeetingsList();
          this.renderActiveMeeting();
        });
      });
    },

    renderActiveMeeting() {
      const meeting = this.getActiveMeeting();
      const titleInput = document.getElementById('meeting-title-input');
      const dateInput = document.getElementById('meeting-date-input');
      const projectInput = document.getElementById('meeting-project-input');
      const attendeesInput = document.getElementById('meeting-attendees-input');
      const textarea = document.getElementById('meeting-notes-textarea');

      if (!meeting) {
        if (titleInput) { titleInput.value = ''; titleInput.disabled = true; }
        if (dateInput) { dateInput.value = ''; dateInput.disabled = true; }
        if (projectInput) { projectInput.value = ''; projectInput.disabled = true; }
        if (attendeesInput) { attendeesInput.value = ''; attendeesInput.disabled = true; }
        if (textarea) {
          textarea.value = 'Select a meeting from the left sidebar or create a new one to begin taking notes.';
          textarea.disabled = true;
        }
        const actionBox = document.getElementById('action-items-container');
        if (actionBox) actionBox.innerHTML = '';
        return;
      }

      if (titleInput) { titleInput.disabled = false; titleInput.value = meeting.title || ''; }
      if (dateInput) { dateInput.disabled = false; dateInput.value = meeting.date || Utils.getTodayDateString(); }
      if (projectInput) { projectInput.disabled = false; projectInput.value = meeting.project || ''; }
      if (attendeesInput) { attendeesInput.disabled = false; attendeesInput.value = meeting.participants || ''; }
      if (textarea) { textarea.disabled = false; textarea.value = meeting.notes || ''; }

      this.renderActionItems();
    },

    renderActionItems() {
      const container = document.getElementById('action-items-container');
      const meeting = this.getActiveMeeting();
      if (!container || !meeting) return;

      const items = meeting.actionItems || [];
      if (!items.length) {
        container.innerHTML = `
          <span style="font-size: 0.82rem; color: var(--text-dim);">No action items recorded for this meeting.</span>
        `;
        return;
      }

      container.innerHTML = items.map((item, idx) => `
        <div class="action-item-row" data-id="${item.id}">
          <input type="checkbox" id="action-chk-${item.id}" ${item.isCompleted ? 'checked' : ''} style="accent-color: var(--primary-500); cursor: pointer;">
          <label for="action-chk-${item.id}" style="flex: 1; cursor: pointer; text-decoration: ${item.isCompleted ? 'line-through' : 'none'}; color: ${item.isCompleted ? 'var(--text-dim)' : 'var(--text-main)'}; font-size: 0.88rem;">
            ${Utils.escapeHtml(item.text)}
          </label>
          ${item.syncedToKanban ? '<span class="badge" style="background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.7rem;">Synced 📋</span>' : ''}
          <button type="button" class="btn btn-ghost btn-sm btn-delete-action" data-idx="${idx}" style="color: #f43f5e; padding: 2px 6px;">✕</button>
        </div>
      `).join('');

      // Checkbox toggles
      container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
          const row = chk.closest('.action-item-row');
          const id = row.dataset.id;
          const action = meeting.actionItems.find(a => a.id === id);
          if (action) {
            action.isCompleted = chk.checked;
            StorageManager.saveMeetings();
            this.renderActionItems();
          }
        });
      });

      // Delete action item
      container.querySelectorAll('.btn-delete-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          meeting.actionItems.splice(idx, 1);
          StorageManager.saveMeetings();
          this.renderActionItems();
        });
      });
    },

    syncActionItemsToKanban() {
      const meeting = this.getActiveMeeting();
      if (!meeting || !meeting.actionItems || !meeting.actionItems.length) {
        alert('No action items available to sync.');
        return;
      }

      let count = 0;
      meeting.actionItems.forEach(item => {
        if (!item.syncedToKanban) {
          const newEntry = {
            id: Utils.generateId(),
            title: `[Action] ${item.text}`,
            project: meeting.project || 'Meeting Actions',
            tags: ['#meeting', '#action-item'],
            impact: 'medium',
            status: item.isCompleted ? 'done' : 'in_progress',
            createdAt: new Date().toISOString(),
            completedAt: item.isCompleted ? new Date().toISOString() : null,
            blockerNotes: ''
          };
          State.entries.unshift(newEntry);
          item.syncedToKanban = true;
          count++;
        }
      });

      if (count > 0) {
        StorageManager.saveEntries();
        StorageManager.saveMeetings();
        JournalController.updateProjectFilterOptions();
        JournalController.renderTimeline();
        KanbanController.renderBoard();
        MetricsController.updateCounters();
        this.renderActionItems();
        alert(`Successfully synced ${count} action items directly to your Kanban Board!`);
      } else {
        alert('All action items are already synced to Kanban.');
      }
    }
  };

  // --- Standup Copilot Controller ---
  const StandupController = {
    modal: null,

    init() {
      this.modal = document.getElementById('modal-standup');
      const btnOpen = document.getElementById('btn-open-standup');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => {
          this.open();
        });
      }

      const btnCopy = document.getElementById('btn-copy-standup-slack');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const text = document.getElementById('standup-output-text').textContent;
          navigator.clipboard.writeText(text).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = '✅ Copied to Clipboard!';
            setTimeout(() => { btnCopy.textContent = originalText; }, 2000);
          }).catch(err => {
            console.error('Failed to copy text:', err);
          });
        });
      }
    },

    open() {
      const output = document.getElementById('standup-output-text');
      output.textContent = this.generateDraft();
      if (this.modal.showModal) this.modal.showModal();
    },

    generateDraft() {
      const todayStr = Utils.getTodayDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Done items (done today, yesterday, or recent done)
      const doneItems = State.entries.filter(e => {
        if (e.status !== 'done') return false;
        const entryDate = (e.completedAt || e.createdAt || '').split('T')[0];
        return entryDate === todayStr || entryDate === yesterdayStr;
      });

      // If no done items today/yesterday, take up to 5 most recent done items
      const finalDone = doneItems.length ? doneItems : State.entries.filter(e => e.status === 'done').slice(0, 5);

      // In progress items
      const inProgressItems = State.entries.filter(e => e.status === 'in_progress');

      // Blocked items
      const blockedItems = State.entries.filter(e => e.status === 'blocked');

      let draft = `🚀 Daily Standup — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}\n\n`;

      draft += `✅ Yesterday / Done:\n`;
      if (finalDone.length) {
        finalDone.forEach(item => {
          const tagsStr = (item.tags || []).length ? ` (${item.tags.join(', ')})` : '';
          draft += `• [${item.project || 'General'}] ${item.title}${tagsStr}\n`;
        });
      } else {
        draft += `• No completed items recorded recently.\n`;
      }

      draft += `\n⚡ Today / In Progress:\n`;
      if (inProgressItems.length) {
        inProgressItems.forEach(item => {
          const tagsStr = (item.tags || []).length ? ` (${item.tags.join(', ')})` : '';
          draft += `• [${item.project || 'General'}] ${item.title}${tagsStr}\n`;
        });
      } else {
        draft += `• No active tasks currently in progress.\n`;
      }

      draft += `\n🚧 Blockers:\n`;
      if (blockedItems.length) {
        blockedItems.forEach(item => {
          const notes = item.blockerNotes ? `: ${item.blockerNotes}` : '';
          draft += `• [${item.project || 'General'}] ${item.title}${notes}\n`;
        });
      } else {
        draft += `• None! Smooth sailing.\n`;
      }

      return draft;
    }
  };

  // --- Performance Review Controller (Offline Generator & Foundation) ---
  const ReviewController = {
    init() {
      const btnOffline = document.getElementById('btn-generate-offline-report');
      if (btnOffline) {
        btnOffline.addEventListener('click', () => {
          this.generateOfflineReport();
        });
      }

      const btnCopy = document.getElementById('btn-copy-review');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const text = document.getElementById('review-output-text').textContent;
          navigator.clipboard.writeText(text).then(() => {
            const orig = btnCopy.textContent;
            btnCopy.textContent = '✅ Copied!';
            setTimeout(() => { btnCopy.textContent = orig; }, 2000);
          });
        });
      }

      const btnDownload = document.getElementById('btn-download-review-md');
      if (btnDownload) {
        btnDownload.addEventListener('click', () => {
          const content = document.getElementById('review-output-text').textContent;
          const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bragbook-review-${Utils.getTodayDateString()}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    },

    getEntriesForSelectedPeriod() {
      const period = document.getElementById('select-review-period').value;
      const now = new Date();

      return State.entries.filter(e => {
        if (e.status !== 'done') return false; // Focus on completed wins
        const d = new Date(e.completedAt || e.createdAt || now);

        if (period === 'this_week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return d >= sevenDaysAgo;
        }

        if (period === 'this_month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }

        if (period === 'this_quarter') {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const entryQuarter = Math.floor(d.getMonth() / 3);
          return entryQuarter === currentQuarter && d.getFullYear() === now.getFullYear();
        }

        return true; // 'all_time'
      });
    },

    generateOfflineReport() {
      const periodLabel = document.getElementById('select-review-period').selectedOptions[0].text;
      const completedEntries = this.getEntriesForSelectedPeriod();
      const output = document.getElementById('review-output-text');

      if (!completedEntries.length) {
        output.textContent = `# 🏆 Executive Accomplishment Report\n**Period:** ${periodLabel}\n\nNo completed accomplishments found for this period. Mark tasks as "Done" to include them in the review.`;
        return;
      }

      const highImpact = completedEntries.filter(e => e.impact === 'high');
      const medImpact = completedEntries.filter(e => e.impact === 'medium');

      // Group by project
      const byProject = {};
      completedEntries.forEach(e => {
        const p = e.project || 'General';
        if (!byProject[p]) byProject[p] = [];
        byProject[p].push(e);
      });

      let md = `# 🏆 Executive Accomplishment Report\n`;
      md += `**Timeframe:** ${periodLabel} | **Generated On:** ${new Date().toLocaleDateString()}\n\n`;
      md += `### 📊 Impact Metrics\n`;
      md += `* **Total Accomplishments:** ${completedEntries.length}\n`;
      md += `* **High Impact Milestones:** ${highImpact.length}\n`;
      md += `* **Medium Impact Deliverables:** ${medImpact.length}\n\n`;
      md += `### 🎯 Accomplishments by Project\n\n`;

      Object.keys(byProject).sort().forEach(project => {
        md += `#### 📁 Project: ${project}\n`;
        byProject[project].forEach(item => {
          const impactLabel = item.impact === 'high' ? ' [HIGH IMPACT 🔥]' : '';
          const tags = (item.tags || []).length ? ` \`${item.tags.join(' ')}\`` : '';
          const dateStr = Utils.formatDateDisplay((item.completedAt || item.createdAt || '').split('T')[0]);
          md += `* **${item.title}**${impactLabel}${tags} — *(${dateStr})*\n`;
        });
        md += `\n`;
      });

      output.textContent = md;
    }
  };

  // --- Modal Utilities ---
  const Modals = {
    init() {
      // General close handler for backdrop click or cancel
      document.querySelectorAll('dialog').forEach(diag => {
        diag.addEventListener('click', (e) => {
          if (e.target === diag) diag.close();
        });
        diag.querySelectorAll('.modal-close-btn').forEach(btn => {
          btn.addEventListener('click', () => diag.close());
        });
      });
    }
  };

  // --- Application Bootstrap ---
  document.addEventListener('DOMContentLoaded', () => {
    StorageManager.load();
    NavigationController.init();
    Modals.init();
    EditEntryModal.init();
    JournalController.init();
    KanbanController.init();
    KanbanController.renderBoard();
    MeetingController.init();
    StandupController.init();
    ReviewController.init();
    MetricsController.updateCounters();
  });
})();
