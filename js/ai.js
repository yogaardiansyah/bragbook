/**
 * BragBook — Dual-Engine AI Service (Local Ollama & Google Gemini BYOK)
 * @module AIService
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.AIService = {
    async testConnection(provider, config) {
      if (provider === 'ollama') {
        const url = `${config.ollamaBaseUrl.replace(/\/+$/, '')}/chat/completions`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: config.ollamaModel || 'llama3.2',
              messages: [{ role: 'user', content: 'respond with pong' }],
              max_tokens: 5
            })
          });
          if (res.ok) {
            return { ok: true, msg: '✅ Successfully connected to Ollama!' };
          }
          return { ok: false, msg: `❌ Ollama error: HTTP ${res.status}` };
        } catch {
          return {
            ok: false,
            msg: '❌ Connection failed. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set (See GUIDEBOOK.md).'
          };
        }
      }

      if (provider === 'gemini') {
        if (!config.geminiApiKey) {
          return { ok: false, msg: '❌ Please enter a Gemini API Key first.' };
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${config.geminiApiKey}`;
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'respond with pong' }] }]
            })
          });
          if (res.ok) {
            return { ok: true, msg: '✅ Successfully connected to Gemini API!' };
          }
          const data = await res.json().catch(() => ({}));
          const errMsg = data?.error?.message || `HTTP ${res.status}`;
          return { ok: false, msg: `❌ Gemini Error: ${errMsg}` };
        } catch (err) {
          return { ok: false, msg: `❌ Network error connecting to Gemini: ${err.message}` };
        }
      }

      return { ok: true, msg: '⚪ Offline template mode active (no connection needed).' };
    },

    async generateReview(entries, periodLabel) {
      const settings = BragBook.State.settings;

      if (settings.aiProvider === 'none') {
        if (BragBook.ReviewController) BragBook.ReviewController.generateOfflineReport();
        return;
      }

      const entrySummary = entries
        .map(e => {
          const impact = e.impact ? `[${e.impact.toUpperCase()}]` : '';
          const tags = (e.tags || []).join(', ');
          return `• Project: ${e.project || 'General'} | ${impact} Task: ${e.title} | Tags: ${tags}`;
        })
        .join('\n');

      const systemPrompt = `You are an elite Silicon Valley executive coach, engineering VP, and resume polisher.
Your job is to transform a professional's raw work accomplishment logs into high-impact performance review bullet points.
Strictly adhere to:
1. Google's XYZ Formula: "Accomplished [X] as measured by [Y], by doing [Z]".
2. The STAR method (Situation, Task, Action, Result).
3. Group accomplishments logically by Project.
4. Bold active verbs and quantify impact wherever implied.
5. Format strictly in clean GitHub Flavored Markdown with appropriate headers.`;

      const userPrompt = `Here are the accomplishments completed during ${periodLabel}:
${entrySummary}

Please generate an impactful Executive Performance Review and Resume Bullet summary.`;

      // Provider 1: Local Ollama
      if (settings.aiProvider === 'ollama') {
        const url = `${settings.ollamaBaseUrl.replace(/\/+$/, '')}/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.ollamaModel || 'llama3.2',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
          })
        });

        if (!res.ok) {
          throw new Error(`Ollama returned status ${res.status}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content || 'No response generated.';
      }

      // Provider 2: Google Gemini
      if (settings.aiProvider === 'gemini') {
        if (!settings.geminiApiKey) {
          throw new Error('Google Gemini API Key is missing. Open Settings to configure.');
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${settings.geminiApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `Gemini returned HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
      }
    }
  };
})();
