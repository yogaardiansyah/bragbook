/**
 * BragBook — Metrics & Streak Tracker
 * @module MetricsController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.MetricsController = {
    calculateStreak() {
      const State = BragBook.State;
      const Utils = BragBook.Utils;

      if (!State.entries.length) return 0;

      // Extract unique active work dates
      const activeDates = new Set(
        State.entries.map(e => (e.createdAt ? e.createdAt.split('T')[0] : null)).filter(Boolean)
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
      const State = BragBook.State;
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
})();
