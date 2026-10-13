/**
 * BragBook — Backup, Data Portability & Database Reset Controller
 * @module BackupController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.BackupController = {
    modal: null,

    init() {
      this.modal = document.getElementById('modal-backup');
      const btnOpen = document.getElementById('btn-open-backup');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => {
          if (this.modal && this.modal.showModal) this.modal.showModal();
        });
      }

      // Export JSON
      const btnExport = document.getElementById('btn-export-json');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          const payload = {
            app: 'BragBook',
            version: '1.1.0',
            exportedAt: new Date().toISOString(),
            entries: BragBook.State.entries,
            meetings: BragBook.State.meetings,
            settings: BragBook.State.settings
          };

          const jsonStr = JSON.stringify(payload, null, 2);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bragbook-backup-${BragBook.Utils.getTodayDateString()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }

      // Import JSON
      const fileInput = document.getElementById('input-import-file');
      if (fileInput) {
        fileInput.addEventListener('change', e => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = event => {
            try {
              const data = JSON.parse(event.target.result);
              if (!Array.isArray(data.entries) && !Array.isArray(data.meetings)) {
                alert('Invalid backup file format. Must contain entries or meetings arrays.');
                return;
              }

              const replaceAll = confirm(
                `Found ${data.entries?.length || 0} entries and ${data.meetings?.length || 0} meetings in backup.\n\n` +
                  `Click OK to REPLACE current data completely.\n` +
                  `Click Cancel to MERGE with current data.`
              );

              if (replaceAll) {
                BragBook.State.entries = Array.isArray(data.entries) ? data.entries : [];
                BragBook.State.meetings = Array.isArray(data.meetings) ? data.meetings : [];
                if (data.settings)
                  BragBook.State.settings = {
                    ...BragBook.Constants.DEFAULT_SETTINGS,
                    ...data.settings
                  };
              } else {
                // Merge entries
                const existingEntryIds = new Set(BragBook.State.entries.map(e => e.id));
                (data.entries || []).forEach(e => {
                  if (!existingEntryIds.has(e.id)) {
                    BragBook.State.entries.push(e);
                    existingEntryIds.add(e.id);
                  }
                });

                // Merge meetings
                const existingMeetingIds = new Set(BragBook.State.meetings.map(m => m.id));
                (data.meetings || []).forEach(m => {
                  if (!existingMeetingIds.has(m.id)) {
                    BragBook.State.meetings.push(m);
                    existingMeetingIds.add(m.id);
                  }
                });
              }

              // Persist and refresh UI
              BragBook.StorageManager.saveEntries();
              BragBook.StorageManager.saveMeetings();
              BragBook.StorageManager.saveSettings();

              if (BragBook.JournalController) {
                BragBook.JournalController.updateProjectFilterOptions();
                BragBook.JournalController.renderTimeline();
              }
              if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
              if (BragBook.MeetingController) {
                BragBook.MeetingController.renderMeetingsList();
                BragBook.MeetingController.renderActiveMeeting();
              }
              if (BragBook.ReviewController) BragBook.ReviewController.updateEngineStatus();
              if (BragBook.MetricsController) BragBook.MetricsController.updateCounters();

              alert('Data successfully imported!');
              if (this.modal && this.modal.close) this.modal.close();
            } catch (err) {
              alert('Error reading backup file: ' + err.message);
            } finally {
              fileInput.value = '';
            }
          };
          reader.readAsText(file);
        });
      }

      // Reset Database
      const btnReset = document.getElementById('btn-reset-database');
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          const confirmation = prompt(
            'DANGER: This will permanently erase all your logs, meetings, and local settings from this browser.\n\nType "RESET" to confirm:'
          );
          if (confirmation === 'RESET') {
            const { STORAGE_KEYS, DEFAULT_SETTINGS } = BragBook.Constants;
            localStorage.removeItem(STORAGE_KEYS.ENTRIES);
            localStorage.removeItem(STORAGE_KEYS.MEETINGS);
            localStorage.removeItem(STORAGE_KEYS.SETTINGS);

            BragBook.State.entries = [];
            BragBook.State.meetings = [];
            BragBook.State.settings = { ...DEFAULT_SETTINGS };

            if (BragBook.JournalController) {
              BragBook.JournalController.updateProjectFilterOptions();
              BragBook.JournalController.renderTimeline();
            }
            if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
            if (BragBook.MeetingController) {
              BragBook.MeetingController.renderMeetingsList();
              BragBook.MeetingController.renderActiveMeeting();
            }
            if (BragBook.ReviewController) BragBook.ReviewController.updateEngineStatus();
            if (BragBook.MetricsController) BragBook.MetricsController.updateCounters();

            alert('BragBook has been completely reset to a clean state.');
            if (this.modal && this.modal.close) this.modal.close();
          }
        });
      }
    }
  };
})();
