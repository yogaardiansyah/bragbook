/**
 * BragBook — Standup Copilot Controller
 * @module StandupController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.StandupController = {
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
          navigator.clipboard
            .writeText(text)
            .then(() => {
              const originalText = btnCopy.textContent;
              btnCopy.textContent = '✅ Copied to Clipboard!';
              setTimeout(() => {
                btnCopy.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text:', err);
            });
        });
      }
    },

    open() {
      const output = document.getElementById('standup-output-text');
      if (output) output.textContent = this.generateDraft();
      if (this.modal && this.modal.showModal) this.modal.showModal();
    },

    generateDraft() {
      const Utils = BragBook.Utils;
      const State = BragBook.State;

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
      const finalDone = doneItems.length
        ? doneItems
        : State.entries.filter(e => e.status === 'done').slice(0, 5);

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
})();
