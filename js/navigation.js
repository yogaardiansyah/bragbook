/**
 * BragBook — Tab Navigation Controller
 * @module NavigationController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.NavigationController = {
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
      BragBook.State.activeTab = tabName;

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

      // Tab specific hooks
      if (tabName === 'kanban' && BragBook.KanbanController) {
        BragBook.KanbanController.renderBoard();
      }
      if (tabName === 'meetings' && BragBook.MeetingController) {
        BragBook.MeetingController.renderMeetingsList();
        BragBook.MeetingController.renderActiveMeeting();
      }
      if (tabName === 'review' && BragBook.ReviewController) {
        BragBook.ReviewController.updateEngineStatus();
      }
    }
  };
})();
