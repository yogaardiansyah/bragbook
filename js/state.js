/**
 * BragBook — State & Configuration Store
 * @module State
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.Constants = {
    STORAGE_KEYS: {
      ENTRIES: 'bragbook_entries',
      MEETINGS: 'bragbook_meetings',
      SETTINGS: 'bragbook_settings'
    },
    DEFAULT_SETTINGS: {
      aiProvider: 'ollama', // 'ollama' | 'gemini' | 'none'
      ollamaBaseUrl: 'http://localhost:11434/v1',
      ollamaModel: 'llama3.2',
      geminiApiKey: '',
      geminiModel: 'gemini-1.5-flash',
      theme: 'dark'
    },
    STATUSES: ['backlog', 'in_progress', 'done', 'blocked'],
    IMPACTS: ['low', 'medium', 'high']
  };

  BragBook.State = {
    entries: [],
    meetings: [],
    activeMeetingId: null,
    settings: { ...BragBook.Constants.DEFAULT_SETTINGS },
    activeTab: 'journal',
    selectedQuickTags: new Set(),
    filters: {
      search: '',
      project: 'all',
      impact: 'all',
      status: 'all'
    }
  };
})();
