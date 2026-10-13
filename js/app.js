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

  // --- Bootstrap Sequence ---
  document.addEventListener('DOMContentLoaded', () => {
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
  });
})();
