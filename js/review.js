/**
 * BragBook — Performance Review & Career Report Controller
 * @module ReviewController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.ReviewController = {
    init() {
      // AI generation button
      const btnAI = document.getElementById('btn-generate-review');
      if (btnAI) {
        btnAI.addEventListener('click', async () => {
          const completedEntries = this.getEntriesForSelectedPeriod();
          const periodSelect = document.getElementById('select-review-period');
          const periodLabel = periodSelect.selectedOptions[0].text;
          const output = document.getElementById('review-output-text');

          if (!completedEntries.length) {
            output.textContent = `# 🏆 Executive Performance Review\n**Period:** ${periodLabel}\n\nNo accomplishments marked as "Done" found in this period. Please mark tasks as "Done" in the Journal or Kanban board first.`;
            return;
          }

          if (BragBook.State.settings.aiProvider === 'none') {
            this.generateOfflineReport();
            return;
          }

          const origBtnText = btnAI.textContent;
          btnAI.textContent = '✨ Generating with AI...';
          btnAI.disabled = true;
          const providerLabel =
            BragBook.State.settings.aiProvider === 'ollama' ? 'Local Ollama' : 'Google Gemini';
          output.textContent = `⏳ Communicating with AI Engine (${providerLabel})... Please wait.`;

          try {
            const aiText = await BragBook.AIService.generateReview(completedEntries, periodLabel);
            output.textContent = aiText;
          } catch (err) {
            output.textContent = `⚠️ AI Generation Failed:\n${err.message}\n\n💡 Tip: Check your connection in Settings (⚙️) or click "Generate Markdown Report (Offline)" instead.`;
          } finally {
            btnAI.textContent = origBtnText;
            btnAI.disabled = false;
          }
        });
      }

      // Offline report button
      const btnOffline = document.getElementById('btn-generate-offline-report');
      if (btnOffline) {
        btnOffline.addEventListener('click', () => {
          this.generateOfflineReport();
        });
      }

      // Copy button
      const btnCopy = document.getElementById('btn-copy-review');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
          const text = document.getElementById('review-output-text').textContent;
          navigator.clipboard.writeText(text).then(() => {
            const orig = btnCopy.textContent;
            btnCopy.textContent = '✅ Copied!';
            setTimeout(() => {
              btnCopy.textContent = orig;
            }, 2000);
          });
        });
      }

      // Download Markdown button
      const btnDownload = document.getElementById('btn-download-review-md');
      if (btnDownload) {
        btnDownload.addEventListener('click', () => {
          const content = document.getElementById('review-output-text').textContent;
          const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bragbook-review-${BragBook.Utils.getTodayDateString()}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }

      this.updateEngineStatus();
    },

    getEntriesForSelectedPeriod() {
      const period = document.getElementById('select-review-period').value;
      const now = new Date();

      return BragBook.State.entries.filter(e => {
        if (e.status !== 'done') return false; // Focus on completed wins
        const d = new Date(e.completedAt || e.createdAt || now);

        if (period === 'this_week') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          return d >= sevenDaysAgo;
        }

        if (period === 'this_month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }

        if (period === 'this_quarter') {
          const currentQuarter = Math.floor(now.getMonth() / 3);
          const entryQuarter = Math.floor(d.getMonth() / 3);
          return entryQuarter === currentQuarter && d.getFullYear() === now.getFullYear();
        }

        return true; // 'all_time'
      });
    },

    generateOfflineReport() {
      const periodSelect = document.getElementById('select-review-period');
      const periodLabel = periodSelect.selectedOptions[0].text;
      const completedEntries = this.getEntriesForSelectedPeriod();
      const output = document.getElementById('review-output-text');

      if (!completedEntries.length) {
        output.textContent = `# 🏆 Executive Accomplishment Report\n**Period:** ${periodLabel}\n\nNo completed accomplishments found for this period. Mark tasks as "Done" to include them in the review.`;
        return;
      }

      const highImpact = completedEntries.filter(e => e.impact === 'high');
      const medImpact = completedEntries.filter(e => e.impact === 'medium');

      // Group by project
      const byProject = {};
      completedEntries.forEach(e => {
        const p = e.project || 'General';
        if (!byProject[p]) byProject[p] = [];
        byProject[p].push(e);
      });

      let md = `# 🏆 Executive Accomplishment Report\n`;
      md += `**Timeframe:** ${periodLabel} | **Generated On:** ${new Date().toLocaleDateString()}\n\n`;
      md += `### 📊 Impact Metrics\n`;
      md += `* **Total Accomplishments:** ${completedEntries.length}\n`;
      md += `* **High Impact Milestones:** ${highImpact.length}\n`;
      md += `* **Medium Impact Deliverables:** ${medImpact.length}\n\n`;
      md += `### 🎯 Accomplishments by Project\n\n`;

      Object.keys(byProject)
        .sort()
        .forEach(project => {
          md += `#### 📁 Project: ${project}\n`;
          byProject[project].forEach(item => {
            const impactLabel = item.impact === 'high' ? ' [HIGH IMPACT 🔥]' : '';
            const tags = (item.tags || []).length ? ` \`${item.tags.join(' ')}\`` : '';
            const dateStr = BragBook.Utils.formatDateDisplay(
              (item.completedAt || item.createdAt || '').split('T')[0]
            );
            md += `* **${item.title}**${impactLabel}${tags} — *(${dateStr})*\n`;
          });
          md += `\n`;
        });

      output.textContent = md;
    },

    updateEngineStatus() {
      const label = document.getElementById('review-engine-label');
      const dot = document.getElementById('review-engine-dot');
      if (!label || !dot) return;

      const provider = BragBook.State.settings.aiProvider;
      if (provider === 'ollama') {
        label.textContent = `Local Ollama (${BragBook.State.settings.ollamaModel || 'llama3.2'})`;
        dot.textContent = '🟢';
      } else if (provider === 'gemini') {
        label.textContent = `Google Gemini (${BragBook.State.settings.geminiModel || 'gemini-1.5-flash'})`;
        dot.textContent = '☁️';
      } else {
        label.textContent = 'Offline Template (Deterministic)';
        dot.textContent = '⚪';
      }
    }
  };
})();
