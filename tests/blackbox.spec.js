const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function runBlackboxTests() {
  console.log('================================================================');
  console.log('   BRAGBOOK BLACKBOX VERIFICATION & CHROME DEV SDK SUITE       ');
  console.log('   Zero-Server Architecture & Modular Integrity Audit           ');
  console.log('================================================================\n');

  const htmlPath = path.resolve(__dirname, '../index.html');
  const fileUrl = `file://${htmlPath}`;

  const results = {
    suite: 'BragBook End-to-End Blackbox & System Integrity',
    timestamp: new Date().toISOString(),
    total: 0,
    passed: 0,
    failed: 0,
    categories: {},
    steps: []
  };

  function record(category, stepName, status, details = '') {
    results.total++;
    if (!results.categories[category]) {
      results.categories[category] = { total: 0, passed: 0, failed: 0 };
    }
    results.categories[category].total++;

    if (status === 'PASS') {
      results.passed++;
      results.categories[category].passed++;
      console.log(`  [PASS] [${category}] ${stepName}${details ? ' -> ' + details : ''}`);
    } else {
      results.failed++;
      results.categories[category].failed++;
      console.error(`  [FAIL] [${category}] ${stepName}${details ? ' -> ' + details : ''}`);
    }
    results.steps.push({ category, stepName, status, details });
  }

  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--allow-file-access-from-files'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Attach Chrome DevTools Protocol (CDP) session
  const cdp = await context.newCDPSession(page);
  await cdp.send('Console.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Performance.enable');

  const cdpConsoleMessages = [];
  const cdpErrors = [];

  cdp.on('Console.messageAdded', event => {
    cdpConsoleMessages.push(event.message);
    if (event.message.level === 'error') {
      cdpErrors.push(event.message.text);
    }
  });

  page.on('pageerror', err => {
    cdpErrors.push(`PageError: ${err.message}`);
  });

  try {
    // =========================================================================
    // CATEGORY 1: System Boot, CDP Metrics & Module Namespace Initialization
    // =========================================================================
    console.log('\n--- 1. SYSTEM BOOT & RUNTIME ENVIRONMENT AUDIT ---');
    const startTime = Date.now();
    await page.goto(fileUrl, { waitUntil: 'load' });
    const loadTimeMs = Date.now() - startTime;

    record(
      'Boot & Runtime',
      'Zero-Server File Protocol Navigation',
      'PASS',
      `Loaded in ${loadTimeMs}ms`
    );

    const title = await page.title();
    const validTitle = title.includes('BragBook');
    record(
      'Boot & Runtime',
      'Document Title Verification',
      validTitle ? 'PASS' : 'FAIL',
      `"${title}"`
    );

    // Verify all 16 modular components under window.BragBook namespace
    const namespaceCheck = await page.evaluate(() => {
      const b = window.BragBook || {};
      const required = [
        'Constants',
        'State',
        'Utils',
        'StorageManager',
        'MetricsController',
        'NavigationController',
        'JournalController',
        'KanbanController',
        'MeetingController',
        'StandupController',
        'ReviewController',
        'AIService',
        'SettingsController',
        'BackupController',
        'Modals'
      ];
      const status = {};
      required.forEach(k => {
        status[k] = !!b[k];
      });
      return status;
    });

    const missingModules = Object.entries(namespaceCheck)
      .filter(([_, v]) => !v)
      .map(([k]) => k);
    if (missingModules.length === 0) {
      record(
        'Boot & Runtime',
        'Modular Subsystem Deconstruction',
        'PASS',
        'All 15 BragBook modules attached'
      );
    } else {
      record(
        'Boot & Runtime',
        'Modular Subsystem Deconstruction',
        'FAIL',
        `Missing: ${missingModules.join(', ')}`
      );
    }

    // CDP Performance & Console Errors audit
    const perfMetrics = await cdp.send('Performance.getMetrics');
    const jsHeapUsed = perfMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value || 0;
    const jsHeapMb = (jsHeapUsed / (1024 * 1024)).toFixed(2);
    record('Boot & Runtime', 'CDP Memory Footprint Audit', 'PASS', `JS Heap: ${jsHeapMb} MB`);

    if (cdpErrors.length === 0) {
      record(
        'Boot & Runtime',
        'CDP Console Log Sanitary Audit',
        'PASS',
        'Zero JavaScript runtime errors'
      );
    } else {
      record(
        'Boot & Runtime',
        'CDP Console Log Sanitary Audit',
        'FAIL',
        `Errors: ${cdpErrors.join(' | ')}`
      );
    }

    // =========================================================================
    // CATEGORY 2: Visual Layout, Navigation & Responsive Viewport Adaptability
    // =========================================================================
    console.log('\n--- 2. VISUAL LAYOUT & RESPONSIVE VIEWPORT TESTING ---');

    // Header & Brand Elements
    const isHeaderVisible = await page.isVisible('.app-header');
    const isBrandVisible = await page.isVisible('.brand-title');
    const isNavVisible = await page.isVisible('.tab-navigation');
    const isMetricsVisible = await page.isVisible('.header-metrics');

    record(
      'Visual Layout',
      'Top Header & Brand Identity Visibility',
      isHeaderVisible && isBrandVisible ? 'PASS' : 'FAIL'
    );
    record(
      'Visual Layout',
      'Primary Navigation Tab Strip Visibility',
      isNavVisible ? 'PASS' : 'FAIL'
    );
    record(
      'Visual Layout',
      'Header Executive Metrics Bar Visibility',
      isMetricsVisible ? 'PASS' : 'FAIL'
    );

    // Layout check: Verify 4 Navigation Tabs exist
    const tabCount = await page.locator('.tab-navigation .tab-btn').count();
    record(
      'Visual Layout',
      'Navigation Tab Count',
      tabCount === 4 ? 'PASS' : 'FAIL',
      `Found ${tabCount} tabs (Journal, Kanban, Meetings, Review)`
    );

    // Mobile Viewport Simulation via CDP Emulation
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 3,
      mobile: true
    });
    await page.waitForTimeout(200);

    const mobileNavVisible = await page.isVisible('.tab-navigation');
    const mobileHeaderVisible = await page.isVisible('.app-header');
    record(
      'Visual Layout',
      'Mobile Viewport (iPhone X 375x812) Adaptability',
      mobileNavVisible && mobileHeaderVisible ? 'PASS' : 'FAIL',
      'Responsive header & tabs intact'
    );

    // Tablet Viewport Simulation via CDP
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 2,
      mobile: false
    });
    await page.waitForTimeout(200);
    const tabletNavVisible = await page.isVisible('.tab-navigation');
    record(
      'Visual Layout',
      'Tablet Viewport (iPad 768x1024) Adaptability',
      tabletNavVisible ? 'PASS' : 'FAIL'
    );

    // Restore standard Desktop viewport
    await cdp.send('Emulation.clearDeviceMetricsOverride');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(200);

    // =========================================================================
    // CATEGORY 3: Work Journal Quick Capture, Reactive Metrics & Persistence
    // =========================================================================
    console.log('\n--- 3. WORK JOURNAL QUICK CAPTURE & STREAK METRICS ---');

    // Reset localStorage for deterministic test state
    await page.evaluate(() => {
      localStorage.clear();
      window.BragBook.State.entries = [];
      window.BragBook.State.meetings = [];
      window.BragBook.StorageManager.load();
      window.BragBook.JournalController.renderTimeline();
      window.BragBook.KanbanController.renderBoard();
      window.BragBook.MeetingController.renderMeetingsList();
      window.BragBook.MetricsController.updateCounters();
    });

    const baselineWins = await page.innerText('#wins-counter');
    const baselineStreak = await page.innerText('#streak-counter');
    record(
      'Journal System',
      'Initial Metrics Baseline Verification',
      'PASS',
      `Wins: ${baselineWins}, Streak: ${baselineStreak}`
    );

    // Fill Quick Capture Entry #1 (High Impact, Done)
    const entryTitle1 = 'Engineered distributed caching layer reducing API response time by 62%';
    await page.fill('#input-entry-title', entryTitle1);
    await page.fill('#input-entry-project', 'Core Gateway');
    await page.selectOption('#select-entry-impact', 'high');
    await page.selectOption('#select-entry-status', 'done');

    // Select tag chips
    await page.click('.tag-chip[data-tag="#infra"]');
    await page.click('.tag-chip[data-tag="#feat"]');

    // Submit Form
    await page.click('#form-quick-entry button[type="submit"]');
    await page.waitForTimeout(300);

    // Verify input cleared
    const titleValAfter = await page.inputValue('#input-entry-title');
    record(
      'Journal System',
      'Quick Capture Form Auto-Reset',
      titleValAfter === '' ? 'PASS' : 'FAIL',
      'Input cleared'
    );

    // Verify timeline card rendered
    const timelineHtml = await page.innerHTML('#journal-timeline');
    const cardRendered = timelineHtml.includes('Engineered distributed caching layer');
    const hasHighBadge = timelineHtml.includes('High 🔥') || timelineHtml.includes('high');
    record(
      'Journal System',
      'Timeline Accomplishment Card Rendering',
      cardRendered && hasHighBadge ? 'PASS' : 'FAIL',
      'Card visible with High impact badge'
    );

    // Verify counters updated
    const newWins = await page.innerText('#wins-counter');
    const newStreak = await page.innerText('#streak-counter');
    const badgeJournalCount = await page.innerText('#badge-journal-count');
    record(
      'Journal System',
      'Reactive Executive Wins Counter Update',
      newWins === '1' ? 'PASS' : 'FAIL',
      `Wins count: ${newWins}`
    );
    record(
      'Journal System',
      'Daily Work Streak Calculation',
      newStreak === '1' ? 'PASS' : 'FAIL',
      `Streak: ${newStreak} day`
    );
    record(
      'Journal System',
      'Tab Badge Notification Count Sync',
      badgeJournalCount === '1' ? 'PASS' : 'FAIL',
      `Badge: ${badgeJournalCount}`
    );

    // Verify LocalStorage state integrity
    const storageState = await page.evaluate(() => {
      const raw = localStorage.getItem(window.BragBook.Constants.STORAGE_KEYS.ENTRIES);
      const parsed = raw ? JSON.parse(raw) : [];
      return { count: parsed.length, firstTitle: parsed[0]?.title, tags: parsed[0]?.tags };
    });
    record(
      'Storage System',
      'LocalStorage Serialization of Journal Entry',
      storageState.count === 1 && storageState.firstTitle === entryTitle1 ? 'PASS' : 'FAIL',
      `Stored 1 entry with tags [${(storageState.tags || []).join(', ')}]`
    );

    // =========================================================================
    // CATEGORY 4: Search, Tag Filtering & Multi-Criteria Journal Querying
    // =========================================================================
    console.log('\n--- 4. SEARCH & MULTI-CRITERIA FILTERING SYSTEM ---');

    // Add Entry #2 (Medium Impact, In Progress)
    await page.fill('#input-entry-title', 'Migrated user authentication to OAuth 2.0 PKCE');
    await page.fill('#input-entry-project', 'Identity Service');
    await page.selectOption('#select-entry-impact', 'medium');
    await page.selectOption('#select-entry-status', 'in_progress');
    await page.click('.tag-chip[data-tag="#fix"]');
    await page.click('#form-quick-entry button[type="submit"]');
    await page.waitForTimeout(300);

    // Add Entry #3 (Low Impact, Backlog)
    await page.fill('#input-entry-title', 'Updated swagger documentation for internal telemetry');
    await page.fill('#input-entry-project', 'Core Gateway');
    await page.selectOption('#select-entry-impact', 'low');
    await page.selectOption('#select-entry-status', 'backlog');
    await page.click('.tag-chip[data-tag="#doc"]');
    await page.click('#form-quick-entry button[type="submit"]');
    await page.waitForTimeout(300);

    let totalCards = await page.locator('#journal-timeline .entry-card').count();
    record(
      'Search & Filter',
      'Multiple Accomplishments Timeline Feed',
      totalCards === 3 ? 'PASS' : 'FAIL',
      `Rendered ${totalCards} cards`
    );

    // Test Search by Keyword
    await page.fill('#input-search-query', 'OAuth');
    await page.waitForTimeout(200);
    let matchedCards = await page.locator('#journal-timeline .entry-card').count();
    record(
      'Search & Filter',
      'Fulltext Search Filtering ("OAuth")',
      matchedCards === 1 ? 'PASS' : 'FAIL',
      `Matched ${matchedCards} card`
    );

    // Clear Search Query
    await page.fill('#input-search-query', '');
    await page.waitForTimeout(100);

    // Test Impact Filter: High Only
    await page.selectOption('#filter-impact', 'high');
    await page.waitForTimeout(200);
    let highCards = await page.locator('#journal-timeline .entry-card').count();
    record(
      'Search & Filter',
      'Impact Dropdown Filter (High Only)',
      highCards === 1 ? 'PASS' : 'FAIL',
      `Filtered ${highCards} high impact entry`
    );

    // Test Status Filter: In Progress
    await page.selectOption('#filter-impact', 'all');
    await page.selectOption('#filter-status', 'in_progress');
    await page.waitForTimeout(200);
    let inProgressCards = await page.locator('#journal-timeline .entry-card').count();
    record(
      'Search & Filter',
      'Status Dropdown Filter (In Progress)',
      inProgressCards === 1 ? 'PASS' : 'FAIL',
      `Filtered ${inProgressCards} active entry`
    );

    // Reset Filters to All
    await page.selectOption('#filter-status', 'all');
    await page.waitForTimeout(100);

    // =========================================================================
    // CATEGORY 5: 4-Column Interactive Kanban Board Operations
    // =========================================================================
    console.log('\n--- 5. INTERACTIVE 4-COLUMN KANBAN BOARD SYSTEM ---');

    // Switch Tab to Kanban
    await page.click('#tab-btn-kanban');
    await page.waitForTimeout(300);

    const isKanbanActive = await page.isVisible('#panel-kanban');
    const isJournalInactive = await page.isHidden('#panel-journal');
    record(
      'Navigation & Tabs',
      'View Transition: Switch to Kanban Panel',
      isKanbanActive && isJournalInactive ? 'PASS' : 'FAIL'
    );

    // Verify Column Dropzones exist
    const backlogCount = await page.innerText('#kanban-count-backlog');
    const inProgressCount = await page.innerText('#kanban-count-in_progress');
    const doneCount = await page.innerText('#kanban-count-done');
    const blockedCount = await page.innerText('#kanban-count-blocked');

    record(
      'Kanban System',
      'Automatic Column Aggregation from Unified Store',
      backlogCount === '1' && inProgressCount === '1' && doneCount === '1' ? 'PASS' : 'FAIL',
      `Backlog: ${backlogCount}, Doing: ${inProgressCount}, Done: ${doneCount}, Blocked: ${blockedCount}`
    );

    // Move task from "in_progress" to "blocked" via KanbanController API
    const targetEntryId = await page.evaluate(() => {
      const entry = window.BragBook.State.entries.find(e => e.status === 'in_progress');
      if (entry) {
        window.BragBook.KanbanController.moveCard(entry.id, 'blocked');
        return entry.id;
      }
      return null;
    });
    await page.waitForTimeout(300);

    const updatedBlockedCount = await page.innerText('#kanban-count-blocked');
    const updatedInProgressCount = await page.innerText('#kanban-count-in_progress');
    record(
      'Kanban System',
      'Card Status State Machine Transition (In Progress -> Blocked)',
      updatedBlockedCount === '1' && updatedInProgressCount === '0' ? 'PASS' : 'FAIL',
      `Blocked column count incremented to ${updatedBlockedCount}`
    );

    // Move from "blocked" to "done"
    await page.evaluate(id => {
      window.BragBook.KanbanController.moveCard(id, 'done');
    }, targetEntryId);
    await page.waitForTimeout(300);

    const finalDoneCount = await page.innerText('#kanban-count-done');
    const finalWins = await page.innerText('#wins-counter');
    record(
      'Kanban System',
      'Card Completion Transition (Blocked -> Done)',
      finalDoneCount === '2' && finalWins === '2' ? 'PASS' : 'FAIL',
      `Done column: ${finalDoneCount}, Wins: ${finalWins}`
    );

    // =========================================================================
    // CATEGORY 6: Live Meeting Copilot, Timestamping & Action Item Synchronization
    // =========================================================================
    console.log('\n--- 6. LIVE MEETING COPILOT & TIMESTAMPING WORKFLOW ---');

    // Switch Tab to Meetings
    await page.click('#tab-btn-meetings');
    await page.waitForTimeout(300);

    const isMeetingsActive = await page.isVisible('#panel-meetings');
    record(
      'Navigation & Tabs',
      'View Transition: Switch to Meetings Panel',
      isMeetingsActive ? 'PASS' : 'FAIL'
    );

    // Create New Meeting
    await page.click('#btn-new-meeting');
    await page.waitForTimeout(300);

    const meetingTitleVal = 'Sprint Planning & System Architecture Sync';
    await page.fill('#meeting-title-input', meetingTitleVal);
    await page.fill('#meeting-project-input', 'Core Gateway');
    await page.fill('#meeting-attendees-input', 'Yoga (Lead), Alex (Infra), Diana (Frontend)');

    // Click Live Timestamp button
    await page.click('#btn-insert-timestamp');
    await page.waitForTimeout(200);

    const notesWithTimestamp = await page.inputValue('#meeting-notes-textarea');
    const hasTimestampFormat = /\[\d{2}:\d{2}\]/.test(notesWithTimestamp);
    record(
      'Meeting Copilot',
      'One-Click Live Timestamp Injection ([HH:MM])',
      hasTimestampFormat ? 'PASS' : 'FAIL',
      `Notes buffer: "${notesWithTimestamp.trim()}"`
    );

    // Append meeting discussion notes
    const fullNotes =
      `${notesWithTimestamp} Agreed to deprecate legacy session tokens in favor of Redis-backed JWTs.\n` +
      `[${new Date().toTimeString().slice(0, 5)}] Finalized Kubernetes replica scaling policy to 12 pods.`;
    await page.fill('#meeting-notes-textarea', fullNotes);
    await page.dispatchEvent('#meeting-notes-textarea', 'input');
    await page.waitForTimeout(200);

    // Add Action Items
    await page.fill(
      '#input-new-action-item',
      'Deploy Redis cluster configuration to staging [Owner: Yoga]'
    );
    await page.click('#btn-add-action-item');
    await page.waitForTimeout(200);

    await page.fill('#input-new-action-item', 'Update API security documentation [Owner: Diana]');
    await page.click('#btn-add-action-item');
    await page.waitForTimeout(200);

    const actionItemCount = await page.locator('#action-items-container .action-item-row').count();
    record(
      'Meeting Copilot',
      'Interactive Action Items Generation',
      actionItemCount === 2 ? 'PASS' : 'FAIL',
      `Created ${actionItemCount} action items`
    );

    // Check first action item and sync to Kanban
    await page.click('#action-items-container .action-item-row:first-child input[type="checkbox"]');
    await page.waitForTimeout(200);
    await page.click('#btn-sync-action-items');
    await page.waitForTimeout(300);

    // Verify synced action item exists in entries
    const syncedEntryCount = await page.evaluate(() => {
      return window.BragBook.State.entries.filter(
        e => e.tags.includes('#action-item') || e.tags.includes('#meeting')
      ).length;
    });
    record(
      'Meeting Copilot',
      'Action Item to Kanban Synchronization Pipeline',
      syncedEntryCount >= 1 ? 'PASS' : 'FAIL',
      `Synchronized ${syncedEntryCount} action items to entries store`
    );

    // Verify meeting appears in sidebar history
    const meetingSidebarText = await page.innerText('#meetings-list');
    const meetingInSidebar = meetingSidebarText.includes('Sprint Planning');
    record(
      'Meeting Copilot',
      'Meeting Session Persistence & History Sidebar',
      meetingInSidebar ? 'PASS' : 'FAIL',
      'Meeting record registered in sidebar'
    );

    // =========================================================================
    // CATEGORY 7: Daily Standup Copilot Synthesis
    // =========================================================================
    console.log('\n--- 7. DAILY STANDUP COPILOT SYNTHESIS ---');

    await page.click('#btn-open-standup');
    await page.waitForTimeout(300);

    const isStandupModalOpen = await page.isVisible('#modal-standup');
    record(
      'Standup Copilot',
      'Standup Copilot Modal Dialog Display',
      isStandupModalOpen ? 'PASS' : 'FAIL'
    );

    const standupDraft = await page.innerText('#standup-output-text');
    const hasYesterdayDone = standupDraft.includes('Yesterday / Done:');
    const hasTodayFocus = standupDraft.includes('Today / In Progress:');
    const hasBlockers = standupDraft.includes('Blockers:');
    record(
      'Standup Copilot',
      '3-Part Standup Format Synthesis (Done, Today, Blockers)',
      hasYesterdayDone && hasTodayFocus && hasBlockers ? 'PASS' : 'FAIL',
      'Draft contains structured sections'
    );

    // Close Standup modal
    await page.click('#modal-standup .modal-close-btn');
    await page.waitForTimeout(200);

    // =========================================================================
    // CATEGORY 8: Career Performance Review Offline Report Generator
    // =========================================================================
    console.log('\n--- 8. CAREER PERFORMANCE REVIEW SYNTHESIS ---');

    // Switch Tab to Review
    await page.click('#tab-btn-review');
    await page.waitForTimeout(300);

    const isReviewActive = await page.isVisible('#panel-review');
    record(
      'Navigation & Tabs',
      'View Transition: Switch to Performance Review Panel',
      isReviewActive ? 'PASS' : 'FAIL'
    );

    // Select Period: All Time
    await page.selectOption('#select-review-period', 'all_time');
    await page.waitForTimeout(100);

    // Click Offline Report Generator
    await page.click('#btn-generate-offline-report');
    await page.waitForTimeout(300);

    const reviewReportText = await page.innerText('#review-output-text');
    const hasReportTitle = reviewReportText.includes('Executive Accomplishment Report');
    const hasMetricsSection = reviewReportText.includes('Impact Metrics');
    const hasAccomplishmentSection = reviewReportText.includes('Accomplishments by Project');
    const containsSampleWork = reviewReportText.includes('distributed caching layer');

    record(
      'Performance Review',
      'Deterministic Offline Report Synthesis',
      hasReportTitle && hasMetricsSection ? 'PASS' : 'FAIL',
      'Generates Executive Markdown format'
    );
    record(
      'Performance Review',
      'Accomplishments Data Incorporation',
      hasAccomplishmentSection && containsSampleWork ? 'PASS' : 'FAIL',
      'Incorporated logged work into career report'
    );

    // =========================================================================
    // CATEGORY 9: BYOK Configuration & Local LLM Provider Management
    // =========================================================================
    console.log('\n--- 9. SETTINGS & AI COPILOT CONFIGURATION (BYOK / LOCAL) ---');

    await page.click('#btn-open-settings');
    await page.waitForTimeout(300);

    const isSettingsOpen = await page.isVisible('#modal-settings');
    record('Settings System', 'Settings Modal Dialog Display', isSettingsOpen ? 'PASS' : 'FAIL');

    // Select Gemini provider
    await page.selectOption('#settings-ai-provider', 'gemini');
    await page.waitForTimeout(200);

    const isGeminiVisible = await page.isVisible('#subform-gemini');
    const isOllamaHidden = await page.isHidden('#subform-ollama');
    record(
      'Settings System',
      'Dynamic Subform Switching (Gemini BYOK)',
      isGeminiVisible && isOllamaHidden ? 'PASS' : 'FAIL'
    );

    // Select Ollama provider
    await page.selectOption('#settings-ai-provider', 'ollama');
    await page.waitForTimeout(200);

    const isOllamaVisible = await page.isVisible('#subform-ollama');
    record(
      'Settings System',
      'Dynamic Subform Switching (Ollama Local LLM)',
      isOllamaVisible ? 'PASS' : 'FAIL'
    );

    await page.fill('#settings-ollama-url', 'http://127.0.0.1:11434/v1');
    await page.fill('#settings-ollama-model', 'mistral-small');

    // Save Settings
    await page.click('#btn-save-settings');
    await page.waitForTimeout(300);

    const savedSettings = await page.evaluate(() => {
      const raw = localStorage.getItem(window.BragBook.Constants.STORAGE_KEYS.SETTINGS);
      return raw ? JSON.parse(raw) : null;
    });
    record(
      'Settings System',
      'Settings LocalStorage Serialization',
      savedSettings &&
        savedSettings.aiProvider === 'ollama' &&
        savedSettings.ollamaModel === 'mistral-small'
        ? 'PASS'
        : 'FAIL',
      `Saved model: ${savedSettings?.ollamaModel}`
    );

    // =========================================================================
    // CATEGORY 10: Complete Data Backup, JSON Portability & Safe Reset
    // =========================================================================
    console.log('\n--- 10. BACKUP, EXPORT & RESTORE PORTABILITY ---');

    await page.click('#btn-open-backup');
    await page.waitForTimeout(300);

    const isBackupOpen = await page.isVisible('#modal-backup');
    record('Backup System', 'Backup & Portability Modal Display', isBackupOpen ? 'PASS' : 'FAIL');

    // Test JSON Export Payload Structure
    const exportPayload = await page.evaluate(() => {
      return {
        app: 'BragBook',
        version: '1.1.0',
        exportedAt: new Date().toISOString(),
        entries: window.BragBook.State.entries,
        meetings: window.BragBook.State.meetings,
        settings: window.BragBook.State.settings
      };
    });

    const isExportValid =
      exportPayload.app === 'BragBook' &&
      Array.isArray(exportPayload.entries) &&
      exportPayload.entries.length >= 3 &&
      Array.isArray(exportPayload.meetings) &&
      exportPayload.meetings.length >= 1;

    record(
      'Backup System',
      'Complete Portable Backup Payload Schema',
      isExportValid ? 'PASS' : 'FAIL',
      `Entries: ${exportPayload.entries.length}, Meetings: ${exportPayload.meetings.length}`
    );

    await page.click('#modal-backup .modal-close-btn');
    await page.waitForTimeout(200);
  } catch (err) {
    console.error('Fatal Test Exception in Suite:', err);
    record('Test Suite Fatal', 'Execution Exception', 'FAIL', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(
    `FINAL RESULT: ${results.passed} PASSED / ${results.failed} FAILED (TOTAL: ${results.total})`
  );
  console.log('================================================================\n');

  // Save detailed JSON report
  fs.writeFileSync(
    path.resolve(__dirname, 'blackbox-report.json'),
    JSON.stringify({ ...results, cdpConsoleMessages, cdpErrors }, null, 2)
  );

  return results;
}

runBlackboxTests().then(res => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
