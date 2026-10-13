/**
 * BragBook — Settings & Preferences Controller
 * @module SettingsController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.SettingsController = {
    modal: null,

    init() {
      this.modal = document.getElementById('modal-settings');
      const btnOpen = document.getElementById('btn-open-settings');
      if (btnOpen) {
        btnOpen.addEventListener('click', () => {
          this.open();
        });
      }

      const selectProvider = document.getElementById('settings-ai-provider');
      if (selectProvider) {
        selectProvider.addEventListener('change', () => {
          this.updateSubformsVisibility(selectProvider.value);
        });
      }

      // Test Connection button
      const btnTest = document.getElementById('btn-test-connection');
      if (btnTest) {
        btnTest.addEventListener('click', async () => {
          const statusEl = document.getElementById('test-connection-status');
          statusEl.textContent = 'Testing connection...';
          statusEl.style.color = 'var(--text-muted)';

          const provider = document.getElementById('settings-ai-provider').value;
          const config = {
            ollamaBaseUrl: document.getElementById('settings-ollama-url').value.trim(),
            ollamaModel: document.getElementById('settings-ollama-model').value.trim(),
            geminiApiKey: document.getElementById('settings-gemini-key').value.trim(),
            geminiModel: document.getElementById('settings-gemini-model').value.trim()
          };

          const result = await BragBook.AIService.testConnection(provider, config);
          statusEl.textContent = result.msg;
          statusEl.style.color = result.ok ? '#34d399' : '#fb7185';
        });
      }

      // Save Settings button
      const btnSave = document.getElementById('btn-save-settings');
      if (btnSave) {
        btnSave.addEventListener('click', () => {
          const State = BragBook.State;
          State.settings.aiProvider = document.getElementById('settings-ai-provider').value;
          State.settings.ollamaBaseUrl =
            document.getElementById('settings-ollama-url').value.trim() ||
            'http://localhost:11434/v1';
          State.settings.ollamaModel =
            document.getElementById('settings-ollama-model').value.trim() || 'llama3.2';
          State.settings.geminiApiKey = document.getElementById('settings-gemini-key').value.trim();
          State.settings.geminiModel =
            document.getElementById('settings-gemini-model').value.trim() || 'gemini-1.5-flash';

          BragBook.StorageManager.saveSettings();
          if (BragBook.ReviewController) BragBook.ReviewController.updateEngineStatus();
          this.close();
        });
      }

      if (BragBook.ReviewController) BragBook.ReviewController.updateEngineStatus();
    },

    updateSubformsVisibility(provider) {
      const subOllama = document.getElementById('subform-ollama');
      const subGemini = document.getElementById('subform-gemini');
      if (subOllama) subOllama.style.display = provider === 'ollama' ? 'flex' : 'none';
      if (subGemini) subGemini.style.display = provider === 'gemini' ? 'flex' : 'none';
    },

    open() {
      const State = BragBook.State;
      const selectProvider = document.getElementById('settings-ai-provider');
      const inputOllamaUrl = document.getElementById('settings-ollama-url');
      const inputOllamaModel = document.getElementById('settings-ollama-model');
      const inputGeminiKey = document.getElementById('settings-gemini-key');
      const inputGeminiModel = document.getElementById('settings-gemini-model');
      const statusEl = document.getElementById('test-connection-status');

      if (statusEl) statusEl.textContent = '';
      if (selectProvider) selectProvider.value = State.settings.aiProvider || 'ollama';
      if (inputOllamaUrl)
        inputOllamaUrl.value = State.settings.ollamaBaseUrl || 'http://localhost:11434/v1';
      if (inputOllamaModel) inputOllamaModel.value = State.settings.ollamaModel || 'llama3.2';
      if (inputGeminiKey) inputGeminiKey.value = State.settings.geminiApiKey || '';
      if (inputGeminiModel)
        inputGeminiModel.value = State.settings.geminiModel || 'gemini-1.5-flash';

      this.updateSubformsVisibility(State.settings.aiProvider || 'ollama');

      if (this.modal && this.modal.showModal) this.modal.showModal();
    },

    close() {
      if (this.modal && this.modal.close) this.modal.close();
    }
  };
})();
