/**
 * BragBook — LocalStorage Persistence Layer
 * @module StorageManager
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.StorageManager = {
    load() {
      const { STORAGE_KEYS, DEFAULT_SETTINGS } = BragBook.Constants;
      const State = BragBook.State;

      try {
        const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
        State.entries = rawEntries ? JSON.parse(rawEntries) : [];

        const rawMeetings = localStorage.getItem(STORAGE_KEYS.MEETINGS);
        State.meetings = rawMeetings ? JSON.parse(rawMeetings) : [];

        const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        State.settings = rawSettings
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) }
          : { ...DEFAULT_SETTINGS };
      } catch (err) {
        console.error('Failed to parse localStorage state:', err);
        State.entries = [];
        State.meetings = [];
        State.settings = { ...DEFAULT_SETTINGS };
      }
    },

    saveEntries() {
      try {
        localStorage.setItem(
          BragBook.Constants.STORAGE_KEYS.ENTRIES,
          JSON.stringify(BragBook.State.entries)
        );
      } catch (err) {
        console.error('Error saving entries to localStorage:', err);
      }
    },

    saveMeetings() {
      try {
        localStorage.setItem(
          BragBook.Constants.STORAGE_KEYS.MEETINGS,
          JSON.stringify(BragBook.State.meetings)
        );
      } catch (err) {
        console.error('Error saving meetings to localStorage:', err);
      }
    },

    saveSettings() {
      try {
        localStorage.setItem(
          BragBook.Constants.STORAGE_KEYS.SETTINGS,
          JSON.stringify(BragBook.State.settings)
        );
      } catch (err) {
        console.error('Error saving settings to localStorage:', err);
      }
    }
  };
})();
