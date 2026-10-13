/**
 * BragBook — General Utility Functions
 * @module Utils
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.Utils = {
    generateId() {
      return typeof crypto !== 'undefined' && crypto.randomUUID
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
})();
