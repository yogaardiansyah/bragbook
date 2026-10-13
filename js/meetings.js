/**
 * BragBook — Live Meeting Notes & Timestamping Controller
 * @module MeetingController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.MeetingController = {
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
          if (!BragBook.State.activeMeetingId) return;
          if (confirm('Delete this meeting and all its notes?')) {
            BragBook.State.meetings = BragBook.State.meetings.filter(
              m => m.id !== BragBook.State.activeMeetingId
            );
            BragBook.State.activeMeetingId = BragBook.State.meetings.length
              ? BragBook.State.meetings[0].id
              : null;
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
            this.renderActiveMeeting();
            BragBook.MetricsController.updateCounters();
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
        textarea.addEventListener('keydown', e => {
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
            BragBook.StorageManager.saveMeetings();
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
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const dateInput = document.getElementById('meeting-date-input');
      if (dateInput) {
        dateInput.addEventListener('change', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.date = e.target.value;
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const projectInput = document.getElementById('meeting-project-input');
      if (projectInput) {
        projectInput.addEventListener('input', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.project = e.target.value.trim() || 'General';
            BragBook.StorageManager.saveMeetings();
          }
        });
      }

      const attendeesInput = document.getElementById('meeting-attendees-input');
      if (attendeesInput) {
        attendeesInput.addEventListener('input', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.participants = e.target.value;
            BragBook.StorageManager.saveMeetings();
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
          id: BragBook.Utils.generateId(),
          text,
          isCompleted: false,
          syncedToKanban: false
        });
        BragBook.StorageManager.saveMeetings();
        newActionInput.value = '';
        this.renderActionItems();
      };

      if (addActionBtn) addActionBtn.addEventListener('click', addAction);
      if (newActionInput) {
        newActionInput.addEventListener('keydown', e => {
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
      if (BragBook.State.meetings.length && !BragBook.State.activeMeetingId) {
        BragBook.State.activeMeetingId = BragBook.State.meetings[0].id;
      }
      this.renderMeetingsList();
      this.renderActiveMeeting();
    },

    getActiveMeeting() {
      return BragBook.State.meetings.find(m => m.id === BragBook.State.activeMeetingId);
    },

    createNewMeeting() {
      const newMeeting = {
        id: BragBook.Utils.generateId(),
        title: 'New Meeting',
        date: BragBook.Utils.getTodayDateString(),
        project: 'General',
        participants: '',
        notes: '',
        actionItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      BragBook.State.meetings.unshift(newMeeting);
      BragBook.State.activeMeetingId = newMeeting.id;
      BragBook.StorageManager.saveMeetings();
      this.renderMeetingsList();
      this.renderActiveMeeting();
      BragBook.MetricsController.updateCounters();
      const titleInput = document.getElementById('meeting-title-input');
      if (titleInput) titleInput.focus();
    },

    insertTimestamp() {
      const textarea = document.getElementById('meeting-notes-textarea');
      if (!textarea || textarea.disabled) return;
      const timeStr = BragBook.Utils.getCurrentTimeString();
      const token = `[${timeStr}] `;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const prefix = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
      const insertion = prefix + token;

      textarea.value = text.substring(0, start) + insertion + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      textarea.focus();

      textarea.dispatchEvent(new Event('input'));
    },

    renderMeetingsList() {
      const listContainer = document.getElementById('meetings-list');
      if (!listContainer) return;

      if (!BragBook.State.meetings.length) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 0.85rem;">
            No meetings yet.<br>Click "+ New Meeting" above.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = BragBook.State.meetings
        .map(m => {
          const isActive = m.id === BragBook.State.activeMeetingId;
          const activeClass = isActive ? 'active' : '';
          const actionCount = (m.actionItems || []).length;
          return `
          <div class="meeting-item ${activeClass}" data-id="${m.id}">
            <strong style="display: block; font-size: 0.9rem; color: var(--text-main); margin-bottom: 2px;">${BragBook.Utils.escapeHtml(m.title || 'Untitled Meeting')}</strong>
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim);">
              <span>${BragBook.Utils.formatDateDisplay(m.date)}</span>
              <span>${actionCount ? `⚡ ${actionCount} actions` : ''}</span>
            </div>
          </div>
        `;
        })
        .join('');

      listContainer.querySelectorAll('.meeting-item').forEach(item => {
        item.addEventListener('click', () => {
          BragBook.State.activeMeetingId = item.dataset.id;
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
        if (titleInput) {
          titleInput.value = '';
          titleInput.disabled = true;
        }
        if (dateInput) {
          dateInput.value = '';
          dateInput.disabled = true;
        }
        if (projectInput) {
          projectInput.value = '';
          projectInput.disabled = true;
        }
        if (attendeesInput) {
          attendeesInput.value = '';
          attendeesInput.disabled = true;
        }
        if (textarea) {
          textarea.value =
            'Select a meeting from the left sidebar or create a new one to begin taking notes.';
          textarea.disabled = true;
        }
        const actionBox = document.getElementById('action-items-container');
        if (actionBox) actionBox.innerHTML = '';
        return;
      }

      if (titleInput) {
        titleInput.disabled = false;
        titleInput.value = meeting.title || '';
      }
      if (dateInput) {
        dateInput.disabled = false;
        dateInput.value = meeting.date || BragBook.Utils.getTodayDateString();
      }
      if (projectInput) {
        projectInput.disabled = false;
        projectInput.value = meeting.project || '';
      }
      if (attendeesInput) {
        attendeesInput.disabled = false;
        attendeesInput.value = meeting.participants || '';
      }
      if (textarea) {
        textarea.disabled = false;
        textarea.value = meeting.notes || '';
      }

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

      container.innerHTML = items
        .map(
          (item, idx) => `
        <div class="action-item-row" data-id="${item.id}">
          <input type="checkbox" id="action-chk-${item.id}" ${item.isCompleted ? 'checked' : ''} style="accent-color: var(--primary-500); cursor: pointer;">
          <label for="action-chk-${item.id}" style="flex: 1; cursor: pointer; text-decoration: ${item.isCompleted ? 'line-through' : 'none'}; color: ${item.isCompleted ? 'var(--text-dim)' : 'var(--text-main)'}; font-size: 0.88rem;">
            ${BragBook.Utils.escapeHtml(item.text)}
          </label>
          ${item.syncedToKanban ? '<span class="badge" style="background: rgba(16,185,129,0.15); color: #34d399; font-size: 0.7rem;">Synced 📋</span>' : ''}
          <button type="button" class="btn btn-ghost btn-sm btn-delete-action" data-idx="${idx}" style="color: #f43f5e; padding: 2px 6px;">✕</button>
        </div>
      `
        )
        .join('');

      // Checkbox toggles
      container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
          const row = chk.closest('.action-item-row');
          const id = row.dataset.id;
          const action = meeting.actionItems.find(a => a.id === id);
          if (action) {
            action.isCompleted = chk.checked;
            BragBook.StorageManager.saveMeetings();
            this.renderActionItems();
          }
        });
      });

      // Delete action item
      container.querySelectorAll('.btn-delete-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          meeting.actionItems.splice(idx, 1);
          BragBook.StorageManager.saveMeetings();
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
            id: BragBook.Utils.generateId(),
            title: `[Action] ${item.text}`,
            project: meeting.project || 'Meeting Actions',
            tags: ['#meeting', '#action-item'],
            impact: 'medium',
            status: item.isCompleted ? 'done' : 'in_progress',
            createdAt: new Date().toISOString(),
            completedAt: item.isCompleted ? new Date().toISOString() : null,
            blockerNotes: ''
          };
          BragBook.State.entries.unshift(newEntry);
          item.syncedToKanban = true;
          count++;
        }
      });

      if (count > 0) {
        BragBook.StorageManager.saveEntries();
        BragBook.StorageManager.saveMeetings();
        if (BragBook.JournalController) {
          BragBook.JournalController.updateProjectFilterOptions();
          BragBook.JournalController.renderTimeline();
        }
        if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
        if (BragBook.MetricsController) BragBook.MetricsController.updateCounters();
        this.renderActionItems();
        alert(`Successfully synced ${count} action items directly to your Kanban Board!`);
      } else {
        alert('All action items are already synced to Kanban.');
      }
    }
  };
})();
