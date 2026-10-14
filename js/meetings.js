/**
 * BragBook — Live Meeting Notes, Voice Recording & Timestamping Controller
 * Enterprise Corporate ERP Suite Edition
 * @module MeetingController
 */

window.BragBook = window.BragBook || {};

(() => {
  'use strict';

  BragBook.MeetingController = {
    // Live Meeting Session State
    session: {
      isActive: false,
      isPaused: false,
      elapsedSeconds: 0,
      timerInterval: null,
      mediaRecorder: null,
      audioChunks: [],
      audioStream: null,
      audioBlobUrl: null,
      audioContext: null,
      analyserNode: null,
      animFrameId: null,
      speechRecognition: null,
      isDictating: false,
      currentView: 'stream' // 'stream' | 'markdown'
    },

    init() {
      // New Meeting button
      const btnNew = document.getElementById('btn-new-meeting');
      if (btnNew) {
        btnNew.addEventListener('click', () => {
          this.createNewMeeting();
        });
      }

      // Delete meeting button
      const btnDel = document.getElementById('btn-delete-meeting');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          if (!BragBook.State.activeMeetingId) return;
          if (confirm('Delete this meeting and all its notes?')) {
            if (this.session.isActive) {
              this.endSession(false);
            }
            BragBook.State.meetings = BragBook.State.meetings.filter(
              m => m.id !== BragBook.State.activeMeetingId
            );
            BragBook.State.activeMeetingId = BragBook.State.meetings.length
              ? BragBook.State.meetings[0].id
              : null;
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
            this.renderActiveMeeting();
            BragBook.MetricsController.updateCounters();
          }
        });
      }

      // Live 1-click timestamp button (legacy / test-compatible)
      const btnTs = document.getElementById('btn-insert-timestamp');
      if (btnTs) {
        btnTs.addEventListener('click', () => {
          this.insertTimestamp();
        });
      }

      // Start / Live Session Button
      const btnStart = document.getElementById('btn-start-meeting');
      if (btnStart) {
        btnStart.addEventListener('click', () => {
          this.startSession();
        });
      }

      // Pause Session Button
      const btnPause = document.getElementById('btn-pause-meeting');
      if (btnPause) {
        btnPause.addEventListener('click', () => {
          this.togglePauseSession();
        });
      }

      // End Session Button
      const btnEnd = document.getElementById('btn-end-meeting');
      if (btnEnd) {
        btnEnd.addEventListener('click', () => {
          this.endSession(true);
        });
      }

      // Live Notulen Input & Submit Button
      const inputLiveNote = document.getElementById('live-note-input');
      const btnAddLiveNote = document.getElementById('btn-add-live-note');
      const submitLiveNote = () => {
        if (!inputLiveNote) return;
        const text = inputLiveNote.value.trim();
        if (!text) return;
        const typeSelect = document.getElementById('live-note-type');
        const type = typeSelect ? typeSelect.value : 'note';
        this.addLiveNotulen(text, type);
        inputLiveNote.value = '';
        inputLiveNote.focus();
      };

      if (btnAddLiveNote) btnAddLiveNote.addEventListener('click', submitLiveNote);
      if (inputLiveNote) {
        inputLiveNote.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitLiveNote();
          }
        });
      }

      // Voice Dictation Toggle (Speech Recognition if available)
      const btnDictate = document.getElementById('btn-voice-dictate');
      if (btnDictate) {
        btnDictate.addEventListener('click', () => {
          this.toggleVoiceDictation();
        });
      }

      // Stream scroll to bottom helper
      const streamContainer = document.getElementById('live-notulen-stream');
      if (streamContainer) {
        streamContainer.scrollTop = streamContainer.scrollHeight;
      }

      // Audio Download Button
      const btnDownloadAudio = document.getElementById('btn-download-audio');
      if (btnDownloadAudio) {
        btnDownloadAudio.addEventListener('click', () => {
          const meeting = this.getActiveMeeting();
          if (meeting && (meeting.audioBlobUrl || this.session.audioBlobUrl)) {
            const url = meeting.audioBlobUrl || this.session.audioBlobUrl;
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting-audio-${meeting.date || 'session'}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        });
      }

      // Notes textarea shortcuts (Ctrl+T / Cmd+T) & auto-save
      const textarea = document.getElementById('meeting-notes-textarea');
      if (textarea) {
        textarea.addEventListener('keydown', e => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
            e.preventDefault();
            this.insertTimestamp();
          }
        });

        textarea.addEventListener('input', () => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.notes = textarea.value;
            meeting.updatedAt = new Date().toISOString();
            BragBook.StorageManager.saveMeetings();
          }
        });
      }

      // Title, date, project, attendees inputs
      const titleInput = document.getElementById('meeting-title-input');
      if (titleInput) {
        titleInput.addEventListener('input', () => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.title = titleInput.value.trim() || 'Untitled Meeting';
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const dateInput = document.getElementById('meeting-date-input');
      if (dateInput) {
        dateInput.addEventListener('change', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.date = e.target.value;
            BragBook.StorageManager.saveMeetings();
            this.renderMeetingsList();
          }
        });
      }

      const projectInput = document.getElementById('meeting-project-input');
      if (projectInput) {
        projectInput.addEventListener('input', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.project = e.target.value.trim() || 'General';
            BragBook.StorageManager.saveMeetings();
          }
        });
      }

      const attendeesInput = document.getElementById('meeting-attendees-input');
      if (attendeesInput) {
        attendeesInput.addEventListener('input', e => {
          const meeting = this.getActiveMeeting();
          if (meeting) {
            meeting.participants = e.target.value;
            BragBook.StorageManager.saveMeetings();
          }
        });
      }

      // Action items input & button
      const newActionInput = document.getElementById('input-new-action-item');
      const addActionBtn = document.getElementById('btn-add-action-item');
      const addAction = () => {
        if (!newActionInput) return;
        const text = newActionInput.value.trim();
        if (!text) return;
        const meeting = this.getActiveMeeting();
        if (!meeting) return;
        if (!meeting.actionItems) meeting.actionItems = [];
        meeting.actionItems.push({
          id: BragBook.Utils.generateId(),
          text,
          isCompleted: false,
          syncedToKanban: false
        });
        BragBook.StorageManager.saveMeetings();
        newActionInput.value = '';
        this.renderActionItems();
      };

      if (addActionBtn) addActionBtn.addEventListener('click', addAction);
      if (newActionInput) {
        newActionInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addAction();
          }
        });
      }

      // Sync Action Items to Kanban
      const btnSync = document.getElementById('btn-sync-action-items');
      if (btnSync) {
        btnSync.addEventListener('click', () => {
          this.syncActionItemsToKanban();
        });
      }

      // Initialize active meeting selection
      if (BragBook.State.meetings.length && !BragBook.State.activeMeetingId) {
        BragBook.State.activeMeetingId = BragBook.State.meetings[0].id;
      }
      this.renderMeetingsList();
      this.renderActiveMeeting();
    },

    getActiveMeeting() {
      return BragBook.State.meetings.find(m => m.id === BragBook.State.activeMeetingId);
    },

    createNewMeeting() {
      const newMeeting = {
        id: BragBook.Utils.generateId(),
        title: 'Executive Meeting Session',
        date: BragBook.Utils.getTodayDateString(),
        project: 'Executive Sync',
        participants: '',
        notes: '',
        actionItems: [],
        liveNotes: [],
        durationSeconds: 0,
        hasAudio: false,
        audioBlobUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      BragBook.State.meetings.unshift(newMeeting);
      BragBook.State.activeMeetingId = newMeeting.id;
      BragBook.StorageManager.saveMeetings();
      this.renderMeetingsList();
      this.renderActiveMeeting();
      BragBook.MetricsController.updateCounters();
      const titleInput = document.getElementById('meeting-title-input');
      if (titleInput) {
        titleInput.focus();
        titleInput.select();
      }
    },

    // --- Live Session & Timer Management ---
    startSession() {
      const meeting = this.getActiveMeeting();
      if (!meeting) return;

      this.session.isActive = true;
      this.session.isPaused = false;
      this.session.elapsedSeconds = 0;

      // Start ticking timer
      this.updateTimerDisplay();
      if (this.session.timerInterval) clearInterval(this.session.timerInterval);
      this.session.timerInterval = setInterval(() => {
        if (!this.session.isPaused) {
          this.session.elapsedSeconds++;
          this.updateTimerDisplay();
        }
      }, 1000);

      // Start Audio Recording if permitted
      const recordAudioChk = document.getElementById('chk-record-audio');
      if (recordAudioChk && recordAudioChk.checked) {
        this.startAudioRecording();
      }

      // Append start session note
      const startTimeStr = BragBook.Utils.getCurrentTimeString();
      this.addLiveNotulen(`Meeting session initialized at ${startTimeStr}`, 'note', true);

      this.updateSessionUI();
    },

    togglePauseSession() {
      if (!this.session.isActive) return;
      this.session.isPaused = !this.session.isPaused;

      if (this.session.mediaRecorder && this.session.mediaRecorder.state !== 'inactive') {
        if (this.session.isPaused && this.session.mediaRecorder.state === 'recording') {
          try {
            this.session.mediaRecorder.pause();
          } catch (e) {
            console.warn('Could not pause media recorder:', e);
          }
        } else if (!this.session.isPaused && this.session.mediaRecorder.state === 'paused') {
          try {
            this.session.mediaRecorder.resume();
          } catch (e) {
            console.warn('Could not resume media recorder:', e);
          }
        }
      }

      const btnPause = document.getElementById('btn-pause-meeting');
      if (btnPause) {
        btnPause.innerHTML = this.session.isPaused
          ? `${BragBook.Icons.play} <span>Resume</span>`
          : `${BragBook.Icons.pause} <span>Pause</span>`;
      }

      const statusBadge = document.getElementById('live-session-status');
      if (statusBadge) {
        statusBadge.innerHTML = this.session.isPaused
          ? `<span class="badge-dot paused"></span> PAUSED`
          : `<span class="badge-dot pulse"></span> LIVE RECORDING`;
      }
    },

    endSession(saveSummary = true) {
      if (this.session.timerInterval) {
        clearInterval(this.session.timerInterval);
        this.session.timerInterval = null;
      }

      const totalElapsed = this.session.elapsedSeconds;
      const formattedDuration = BragBook.Utils.formatDuration(totalElapsed);

      // Stop audio recording
      this.stopAudioRecording();

      // Stop voice dictation
      if (this.session.speechRecognition && this.session.isDictating) {
        try {
          this.session.speechRecognition.stop();
        } catch (e) {
          console.warn('Could not stop speech recognition:', e);
        }
        this.session.isDictating = false;
      }

      this.session.isActive = false;
      this.session.isPaused = false;

      const meeting = this.getActiveMeeting();
      if (meeting) {
        meeting.durationSeconds = totalElapsed;
        if (saveSummary && totalElapsed > 0) {
          this.addLiveNotulen(
            `Meeting session concluded (Duration: ${formattedDuration})`,
            'note',
            true
          );
        }
        meeting.updatedAt = new Date().toISOString();
        BragBook.StorageManager.saveMeetings();
        this.renderMeetingsList();
      }

      this.updateSessionUI();
    },

    updateTimerDisplay() {
      const timerEl = document.getElementById('meeting-session-timer');
      const previewEl = document.getElementById('live-timestamp-preview');
      const formatted = BragBook.Utils.formatDuration(this.session.elapsedSeconds);

      if (timerEl) timerEl.textContent = formatted;
      if (previewEl) previewEl.textContent = `[${formatted}]`;
    },

    updateSessionUI() {
      const panel = document.getElementById('live-meeting-panel');
      const btnStart = document.getElementById('btn-start-meeting');
      const sessionControls = document.getElementById('live-session-controls');
      const statusBadge = document.getElementById('live-session-status');
      const micStatus = document.getElementById('meeting-mic-status');

      if (!panel) return;

      if (this.session.isActive) {
        panel.classList.add('active');
        if (btnStart) btnStart.classList.add('hidden');
        if (sessionControls) sessionControls.classList.remove('hidden');
        if (statusBadge) {
          statusBadge.innerHTML = `<span class="badge-dot pulse"></span> LIVE RECORDING`;
        }
        if (micStatus) {
          micStatus.textContent = this.session.audioStream ? 'Audio: Mic Active' : 'Audio: Standby';
        }
      } else {
        panel.classList.remove('active');
        if (btnStart) btnStart.classList.remove('hidden');
        if (sessionControls) sessionControls.classList.add('hidden');
        if (micStatus) micStatus.textContent = 'Ready to Start';
      }
    },

    // --- Audio Capture & Waveform Visualizer ---
    startAudioRecording() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('MediaDevices API not available in this environment.');
        return;
      }

      this.session.audioChunks = [];
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(stream => {
          this.session.audioStream = stream;
          let mimeType = 'audio/webm';
          if (
            typeof MediaRecorder !== 'undefined' &&
            MediaRecorder.isTypeSupported &&
            MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ) {
            mimeType = 'audio/webm;codecs=opus';
          }

          try {
            const recorder = new MediaRecorder(stream, { mimeType });
            recorder.ondataavailable = e => {
              if (e.data && e.data.size > 0) {
                this.session.audioChunks.push(e.data);
              }
            };

            recorder.onstop = () => {
              const blob = new Blob(this.session.audioChunks, { type: mimeType });
              const url = URL.createObjectURL(blob);
              this.session.audioBlobUrl = url;

              const meeting = this.getActiveMeeting();
              if (meeting) {
                meeting.audioBlobUrl = url;
                meeting.hasAudio = true;
                BragBook.StorageManager.saveMeetings();
                this.renderAudioPlayer(url);
              }
            };

            recorder.start(1000); // 1-second chunks
            this.session.mediaRecorder = recorder;

            // Start Canvas Audio Visualizer
            this.initAudioVisualizer(stream);

            const micBadge = document.getElementById('meeting-mic-status');
            if (micBadge) micBadge.textContent = 'Audio: Recording';
          } catch (err) {
            console.warn('MediaRecorder error:', err);
          }
        })
        .catch(err => {
          console.warn('Microphone access denied or unavailable:', err.message);
          const micBadge = document.getElementById('meeting-mic-status');
          if (micBadge) micBadge.textContent = 'Audio: Off (Mic Standby)';
        });
    },

    stopAudioRecording() {
      if (this.session.mediaRecorder && this.session.mediaRecorder.state !== 'inactive') {
        try {
          this.session.mediaRecorder.stop();
        } catch (e) {
          console.warn('Could not stop recorder:', e);
        }
      }

      if (this.session.audioStream) {
        this.session.audioStream.getTracks().forEach(track => track.stop());
        this.session.audioStream = null;
      }

      if (this.session.animFrameId) {
        cancelAnimationFrame(this.session.animFrameId);
        this.session.animFrameId = null;
      }

      if (this.session.audioContext) {
        try {
          this.session.audioContext.close();
        } catch (e) {
          console.warn('AudioContext close error:', e);
        }
        this.session.audioContext = null;
      }
    },

    initAudioVisualizer(stream) {
      const canvas = document.getElementById('meeting-audio-visualizer');
      if (!canvas) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      try {
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        this.session.audioContext = audioCtx;
        this.session.analyserNode = analyser;

        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
          if (!this.session.isActive) return;
          this.session.animFrameId = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 1.8;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
            x += barWidth;
          }
        };

        draw();
      } catch (err) {
        console.warn('Audio Visualizer could not be started:', err);
      }
    },

    renderAudioPlayer(url) {
      const audioBox = document.getElementById('meeting-audio-box');
      const audioPlayer = document.getElementById('meeting-audio-player');
      if (audioBox && audioPlayer && url) {
        audioPlayer.src = url;
        audioBox.classList.remove('hidden');
      }
    },

    // --- Voice Dictation (Speech Recognition API) ---
    toggleVoiceDictation() {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const btnDictate = document.getElementById('btn-voice-dictate');
      const inputLiveNote = document.getElementById('live-note-input');

      if (!SpeechRecognitionClass) {
        alert(
          'Speech Recognition is not natively supported in this browser. You can type notes directly with automatic live timestamps!'
        );
        return;
      }

      if (this.session.isDictating && this.session.speechRecognition) {
        this.session.speechRecognition.stop();
        this.session.isDictating = false;
        if (btnDictate) btnDictate.classList.remove('active');
        return;
      }

      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID'; // Supports Indonesian, English fallback

        recognition.onstart = () => {
          this.session.isDictating = true;
          if (btnDictate) btnDictate.classList.add('active');
        };

        recognition.onresult = event => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (inputLiveNote) inputLiveNote.value = transcript;
        };

        recognition.onerror = e => {
          console.warn('Speech recognition error:', e.error);
          this.session.isDictating = false;
          if (btnDictate) btnDictate.classList.remove('active');
        };

        recognition.onend = () => {
          this.session.isDictating = false;
          if (btnDictate) btnDictate.classList.remove('active');
        };

        recognition.start();
        this.session.speechRecognition = recognition;
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    },

    // --- Live Auto-Timestamped Notulen Feature ---
    addLiveNotulen(text, type = 'note', isSystemNote = false) {
      const meeting = this.getActiveMeeting();
      if (!meeting) return;

      // Determine timestamp
      let timeTag = '';
      if (this.session.isActive) {
        timeTag = `[${BragBook.Utils.formatDuration(this.session.elapsedSeconds)}]`;
      } else {
        timeTag = `[${BragBook.Utils.getCurrentTimeString()}]`;
      }

      // Type label
      const typeLabels = {
        note: '[Catatan]',
        decision: '[Keputusan]',
        action: '[Action Item]',
        risk: '[Risiko]'
      };
      const label = typeLabels[type] || '[Catatan]';

      // Full formatted line for notes buffer
      const formattedEntry = `${timeTag} ${isSystemNote ? '' : label + ' '}${text}`;

      // 1. Append to meeting.liveNotes array
      if (!meeting.liveNotes) meeting.liveNotes = [];
      const newNoteItem = {
        id: BragBook.Utils.generateId(),
        timeTag,
        type,
        text,
        isSystemNote,
        createdAt: new Date().toISOString()
      };
      meeting.liveNotes.push(newNoteItem);

      // 2. Append directly to raw markdown notes textarea (ensuring 100% test compatibility)
      const textarea = document.getElementById('meeting-notes-textarea');
      if (textarea) {
        const curVal = textarea.value.trim();
        textarea.value = curVal ? `${curVal}\n${formattedEntry}` : formattedEntry;
        meeting.notes = textarea.value;
        textarea.dispatchEvent(new Event('input'));
      }

      // 3. If action item, automatically sync into Action Items checklist
      if (type === 'action') {
        if (!meeting.actionItems) meeting.actionItems = [];
        meeting.actionItems.push({
          id: BragBook.Utils.generateId(),
          text,
          isCompleted: false,
          syncedToKanban: false
        });
        this.renderActionItems();
      }

      meeting.updatedAt = new Date().toISOString();
      BragBook.StorageManager.saveMeetings();

      // 4. Update the visual live notulen feed
      this.renderLiveNotulenFeed();
    },

    renderLiveNotulenFeed() {
      const streamContainer = document.getElementById('live-notulen-stream');
      const meeting = this.getActiveMeeting();
      if (!streamContainer || !meeting) return;

      const notes = meeting.liveNotes || [];
      if (!notes.length) {
        // If liveNotes empty but notes textarea has content, parse textarea lines!
        if (meeting.notes && meeting.notes.trim()) {
          const lines = meeting.notes.split('\n').filter(l => l.trim().length > 0);
          streamContainer.innerHTML = lines
            .map(line => {
              const tsMatch = line.match(/^\[(.*?)\]/);
              const ts = tsMatch ? tsMatch[0] : '';
              const content = ts ? line.replace(ts, '').trim() : line;
              return `
              <div class="stream-item">
                <span class="stream-ts">${BragBook.Utils.escapeHtml(ts || '[Log]')}</span>
                <span class="stream-text">${BragBook.Utils.escapeHtml(content)}</span>
              </div>
            `;
            })
            .join('');
          return;
        }

        streamContainer.innerHTML = `
          <div class="stream-empty">
            ${BragBook.Icons.soundwave}
            <span>No notulen recorded yet. Click "Start Meeting" or add notes using the bar above.</span>
          </div>
        `;
        return;
      }

      const typeBadgeClass = {
        note: 'badge-note',
        decision: 'badge-decision',
        action: 'badge-action',
        risk: 'badge-risk'
      };

      streamContainer.innerHTML = notes
        .map(
          item => `
          <div class="stream-item type-${item.type || 'note'}" data-id="${item.id}">
            <div class="stream-left">
              <span class="stream-ts">${BragBook.Utils.escapeHtml(item.timeTag || '[00:00]')}</span>
              <span class="stream-badge ${typeBadgeClass[item.type] || 'badge-note'}">${item.type.toUpperCase()}</span>
            </div>
            <div class="stream-content">
              ${BragBook.Utils.escapeHtml(item.text)}
            </div>
          </div>
        `
        )
        .join('');

      // Auto-scroll stream to bottom
      streamContainer.scrollTop = streamContainer.scrollHeight;
    },

    // --- Legacy 1-Click Timestamp Injection (Preserves exact test requirements) ---
    insertTimestamp() {
      const textarea = document.getElementById('meeting-notes-textarea');
      if (!textarea || textarea.disabled) return;
      const timeStr = BragBook.Utils.getCurrentTimeString();
      const token = `[${timeStr}] `;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const prefix = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
      const insertion = prefix + token;

      textarea.value = text.substring(0, start) + insertion + text.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
      textarea.focus();

      textarea.dispatchEvent(new Event('input'));
    },

    // --- Sidebar & Meeting Rendering ---
    renderMeetingsList() {
      const listContainer = document.getElementById('meetings-list');
      if (!listContainer) return;

      if (!BragBook.State.meetings.length) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 24px 10px; color: var(--text-dim); font-size: 0.85rem;">
            No meetings yet.<br>Click "+ New Meeting" above.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = BragBook.State.meetings
        .map(m => {
          const isActive = m.id === BragBook.State.activeMeetingId;
          const activeClass = isActive ? 'active' : '';
          const actionCount = (m.actionItems || []).length;
          const hasRec = m.hasAudio || m.audioBlobUrl;
          return `
          <div class="meeting-item ${activeClass}" data-id="${m.id}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
              <strong class="meeting-item-title">${BragBook.Utils.escapeHtml(m.title || 'Untitled Meeting')}</strong>
              ${hasRec ? `<span title="Voice Recording Available" style="color: #3b82f6;">${BragBook.Icons.mic}</span>` : ''}
            </div>
            <div class="meeting-item-meta">
              <span>${BragBook.Utils.formatDateDisplay(m.date)}</span>
              <span>${actionCount ? `⚡ ${actionCount} actions` : ''}</span>
            </div>
          </div>
        `;
        })
        .join('');

      listContainer.querySelectorAll('.meeting-item').forEach(item => {
        item.addEventListener('click', () => {
          if (this.session.isActive) {
            if (!confirm('A meeting session is currently active. Switch meeting?')) return;
            this.endSession(false);
          }
          BragBook.State.activeMeetingId = item.dataset.id;
          this.renderMeetingsList();
          this.renderActiveMeeting();
        });
      });
    },

    renderActiveMeeting() {
      const meeting = this.getActiveMeeting();
      const titleInput = document.getElementById('meeting-title-input');
      const dateInput = document.getElementById('meeting-date-input');
      const projectInput = document.getElementById('meeting-project-input');
      const attendeesInput = document.getElementById('meeting-attendees-input');
      const textarea = document.getElementById('meeting-notes-textarea');

      if (!meeting) {
        if (titleInput) {
          titleInput.value = '';
          titleInput.disabled = true;
        }
        if (dateInput) {
          dateInput.value = '';
          dateInput.disabled = true;
        }
        if (projectInput) {
          projectInput.value = '';
          projectInput.disabled = true;
        }
        if (attendeesInput) {
          attendeesInput.value = '';
          attendeesInput.disabled = true;
        }
        if (textarea) {
          textarea.value =
            'Select a meeting from the left sidebar or create a new one to begin taking notes.';
          textarea.disabled = true;
        }
        const actionBox = document.getElementById('action-items-container');
        if (actionBox) actionBox.innerHTML = '';
        return;
      }

      if (titleInput) {
        titleInput.disabled = false;
        titleInput.value = meeting.title || '';
      }
      if (dateInput) {
        dateInput.disabled = false;
        dateInput.value = meeting.date || BragBook.Utils.getTodayDateString();
      }
      if (projectInput) {
        projectInput.disabled = false;
        projectInput.value = meeting.project || '';
      }
      if (attendeesInput) {
        attendeesInput.disabled = false;
        attendeesInput.value = meeting.participants || '';
      }
      if (textarea) {
        textarea.disabled = false;
        textarea.value = meeting.notes || '';
      }

      // Audio player if recorded
      if (meeting.audioBlobUrl || meeting.hasAudio) {
        this.renderAudioPlayer(meeting.audioBlobUrl);
      } else {
        const audioBox = document.getElementById('meeting-audio-box');
        if (audioBox) audioBox.classList.add('hidden');
      }

      this.renderLiveNotulenFeed();
      this.renderActionItems();
      this.updateSessionUI();
    },

    renderActionItems() {
      const container = document.getElementById('action-items-container');
      const meeting = this.getActiveMeeting();
      if (!container || !meeting) return;

      const items = meeting.actionItems || [];
      if (!items.length) {
        container.innerHTML = `
          <span style="font-size: 0.82rem; color: var(--text-dim);">No action items recorded for this meeting.</span>
        `;
        return;
      }

      container.innerHTML = items
        .map(
          (item, idx) => `
        <div class="action-item-row" data-id="${item.id}">
          <input type="checkbox" id="action-chk-${item.id}" ${item.isCompleted ? 'checked' : ''} style="accent-color: var(--primary-500); cursor: pointer;">
          <label for="action-chk-${item.id}" style="flex: 1; cursor: pointer; text-decoration: ${item.isCompleted ? 'line-through' : 'none'}; color: ${item.isCompleted ? 'var(--text-dim)' : 'var(--text-main)'}; font-size: 0.88rem;">
            ${BragBook.Utils.escapeHtml(item.text)}
          </label>
          ${item.syncedToKanban ? '<span class="badge" style="background: rgba(16,185,129,0.12); color: #34d399; font-size: 0.7rem; border: 1px solid rgba(16,185,129,0.25);">Synced 📋</span>' : ''}
          <button type="button" class="btn btn-ghost btn-sm btn-delete-action" data-idx="${idx}" style="color: #f43f5e; padding: 2px 6px;">✕</button>
        </div>
      `
        )
        .join('');

      // Checkbox toggles
      container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', () => {
          const row = chk.closest('.action-item-row');
          const id = row.dataset.id;
          const action = meeting.actionItems.find(a => a.id === id);
          if (action) {
            action.isCompleted = chk.checked;
            BragBook.StorageManager.saveMeetings();
            this.renderActionItems();
          }
        });
      });

      // Delete action item
      container.querySelectorAll('.btn-delete-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.idx, 10);
          meeting.actionItems.splice(idx, 1);
          BragBook.StorageManager.saveMeetings();
          this.renderActionItems();
        });
      });
    },

    syncActionItemsToKanban() {
      const meeting = this.getActiveMeeting();
      if (!meeting || !meeting.actionItems || !meeting.actionItems.length) {
        alert('No action items available to sync.');
        return;
      }

      let count = 0;
      meeting.actionItems.forEach(item => {
        if (!item.syncedToKanban) {
          const newEntry = {
            id: BragBook.Utils.generateId(),
            title: `[Action] ${item.text}`,
            project: meeting.project || 'Meeting Actions',
            tags: ['#meeting', '#action-item'],
            impact: 'medium',
            status: item.isCompleted ? 'done' : 'in_progress',
            createdAt: new Date().toISOString(),
            completedAt: item.isCompleted ? new Date().toISOString() : null,
            blockerNotes: ''
          };
          BragBook.State.entries.unshift(newEntry);
          item.syncedToKanban = true;
          count++;
        }
      });

      if (count > 0) {
        BragBook.StorageManager.saveEntries();
        BragBook.StorageManager.saveMeetings();
        if (BragBook.JournalController) {
          BragBook.JournalController.updateProjectFilterOptions();
          BragBook.JournalController.renderTimeline();
        }
        if (BragBook.KanbanController) BragBook.KanbanController.renderBoard();
        if (BragBook.MetricsController) BragBook.MetricsController.updateCounters();
        this.renderActionItems();
        alert(`Successfully synced ${count} action items directly to your Kanban Board!`);
      } else {
        alert('All action items are already synced to Kanban.');
      }
    }
  };

  // --- Native Web Component: <bb-meetings> ---
  class BBMeetings extends HTMLElement {
    connectedCallback() {
      if (this.childElementCount === 0) {
        this.innerHTML = `
          <div class="meetings-layout">
            <!-- Meetings Directory Sidebar -->
            <aside class="meetings-sidebar">
              <div class="sidebar-header">
                <span class="sidebar-title">Meeting Sessions</span>
                <button id="btn-new-meeting" class="btn btn-primary btn-sm">
                  ${BragBook.Icons.plus} New Meeting
                </button>
              </div>
              <div id="meetings-list" class="meetings-list"></div>
            </aside>

            <!-- Active Meeting Editor & Live Copilot -->
            <div class="meeting-editor card-glass">
              <!-- Top Metadata Toolbar -->
              <div class="meeting-toolbar">
                <div class="meeting-title-group">
                  <input
                    type="text"
                    id="meeting-title-input"
                    class="form-input meeting-title-field"
                    placeholder="Meeting Title (e.g. Q4 Infrastructure Architecture)"
                  />
                  <input
                    type="date"
                    id="meeting-date-input"
                    class="form-input meeting-date-field"
                  />
                </div>
                <div class="meeting-actions-group">
                  <button
                    type="button"
                    id="btn-start-meeting"
                    class="btn btn-primary btn-sm btn-start-session"
                    title="Start Live Meeting with Timer & Voice Recording"
                  >
                    ${BragBook.Icons.play} <span>Start Meeting</span>
                  </button>
                  <button
                    type="button"
                    id="btn-insert-timestamp"
                    class="btn timestamp-btn btn-sm"
                    title="Insert [HH:MM] timestamp at cursor (Shortcut: Ctrl+T)"
                  >
                    ${BragBook.Icons.clock} <span>Timestamp [HH:MM]</span>
                  </button>
                  <button
                    type="button"
                    id="btn-delete-meeting"
                    class="btn btn-ghost btn-sm btn-del-meeting"
                    title="Delete this meeting"
                  >
                    ${BragBook.Icons.trash}
                  </button>
                </div>
              </div>

              <!-- Context Row: Project & Attendees -->
              <div class="input-row meeting-meta-row">
                <div class="input-field-wrap">
                  <span class="field-icon">${BragBook.Icons.folder}</span>
                  <input
                    type="text"
                    id="meeting-project-input"
                    class="form-input"
                    placeholder="Project / Stream (e.g. Core Banking)"
                  />
                </div>
                <div class="input-field-wrap attendees-wrap">
                  <input
                    type="text"
                    id="meeting-attendees-input"
                    class="form-input"
                    placeholder="Attendees (e.g. Yoga, Alex, Diana, Michael)"
                  />
                </div>
              </div>

              <!-- Live Meeting Active Controller Card -->
              <div id="live-meeting-panel" class="live-meeting-panel">
                <div class="live-panel-top">
                  <div class="live-indicator-group">
                    <span id="live-session-status" class="live-badge">
                      <span class="badge-dot pulse"></span> LIVE RECORDING
                    </span>
                    <div class="session-timer-wrap">
                      <span class="timer-label">ELAPSED</span>
                      <strong id="meeting-session-timer" class="session-timer">00:00:00</strong>
                    </div>
                  </div>

                  <!-- Audio Waveform Visualizer & Status -->
                  <div class="live-visualizer-group">
                    <canvas id="meeting-audio-visualizer" width="130" height="26" class="waveform-canvas"></canvas>
                    <span id="meeting-mic-status" class="mic-status-label">Ready to Start</span>
                  </div>

                  <!-- Session Control Actions -->
                  <div id="live-session-controls" class="live-controls hidden">
                    <button type="button" id="btn-pause-meeting" class="btn btn-secondary btn-sm">
                      ${BragBook.Icons.pause} <span>Pause</span>
                    </button>
                    <button type="button" id="btn-end-meeting" class="btn btn-danger btn-sm">
                      ${BragBook.Icons.stop} <span>End Meeting</span>
                    </button>
                  </div>
                </div>

                <div class="live-audio-options">
                  <label class="audio-opt-label">
                    <input type="checkbox" id="chk-record-audio" checked />
                    <span>Record Audio via Microphone during session</span>
                  </label>
                </div>
              </div>

              <!-- Embedded Audio Player Bar (Shown when audio recorded) -->
              <div id="meeting-audio-box" class="meeting-audio-box hidden">
                <div class="audio-box-title">
                  ${BragBook.Icons.mic} <span>Audio Playback:</span>
                </div>
                <audio id="meeting-audio-player" controls class="audio-player"></audio>
                <button type="button" id="btn-download-audio" class="btn btn-secondary btn-sm" title="Download Audio File">
                  Download Audio
                </button>
              </div>

              <!-- Rapid Auto-Timestamped Notulen Entry Bar -->
              <div class="live-notulen-bar">
                <div class="live-ts-indicator">
                  <span id="live-timestamp-preview" class="live-ts-chip">[00:00]</span>
                </div>
                <select id="live-note-type" class="form-select live-note-type">
                  <option value="note">💬 Catatan / Note</option>
                  <option value="decision">✅ Keputusan / Decision</option>
                  <option value="action">🎯 Action Item</option>
                  <option value="risk">⚠️ Risiko / Blocker</option>
                </select>
                <input
                  type="text"
                  id="live-note-input"
                  class="form-input live-note-input"
                  placeholder="Ketik notulen rapat... tekan Enter untuk timestamp otomatis"
                  autocomplete="off"
                />
                <button type="button" id="btn-voice-dictate" class="btn btn-secondary btn-icon" title="Dikte Suara (Voice to Text)">
                  ${BragBook.Icons.mic}
                </button>
                <button type="button" id="btn-add-live-note" class="btn btn-primary btn-sm">
                  + Catat
                </button>
              </div>

              <!-- Dual Notulen Workspace: Live Timeline Stream + Full Markdown Notes Buffer -->
              <div class="notes-workspace-grid">
                <div class="notes-stream-pane">
                  <div class="pane-header">
                    ${BragBook.Icons.soundwave} <span>Live Notulen Stream</span>
                  </div>
                  <div id="notulen-stream-wrapper" class="notulen-stream-wrapper">
                    <div id="live-notulen-stream" class="live-notulen-stream"></div>
                  </div>
                </div>

                <div class="notes-textarea-pane">
                  <div class="pane-header">
                    ${BragBook.Icons.journal} <span>Markdown Notes Buffer (Auto-synced)</span>
                  </div>
                  <textarea
                    id="meeting-notes-textarea"
                    class="form-textarea meeting-notes-area"
                    rows="8"
                    placeholder="Live meeting notes... Use Ctrl+T to insert timestamps at cursor."
                  ></textarea>
                </div>
              </div>

              <!-- Action Items Checklist -->
              <div class="action-items-box">
                <div class="action-items-header">
                  <strong class="action-items-title">${BragBook.Icons.check} Action Items (To-Do)</strong>
                  <button
                    type="button"
                    id="btn-sync-action-items"
                    class="btn btn-secondary btn-sm"
                    title="Push checked action items to Kanban/Journal"
                  >
                    ${BragBook.Icons.sync} Sync to Kanban
                  </button>
                </div>

                <div id="action-items-container" class="action-items-container"></div>

                <div class="add-action-item-row">
                  <input
                    type="text"
                    id="input-new-action-item"
                    class="form-input"
                    placeholder="Add action item (Press Enter)..."
                  />
                  <button type="button" id="btn-add-action-item" class="btn btn-secondary btn-sm">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }
  }

  if (typeof customElements !== 'undefined' && !customElements.get('bb-meetings')) {
    customElements.define('bb-meetings', BBMeetings);
  }
})();
