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
    MetricsController.updateCounters();
  });
})();
