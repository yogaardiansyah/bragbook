# 🏗️ BragBook Architecture & Technical Design

This document details the architectural specifications, data structures, and integration patterns for **BragBook**.

---

## 1. High-Level Architecture

BragBook follows an **Offline-First, Zero-Server Client Architecture**. The application executes entirely within the browser context and interacts directly with browser storage APIs and local/cloud AI endpoints.

```mermaid
graph TD
    User([User / Browser Viewport])

    subgraph Client [BragBook Client (Browser Runtime)]
        UI[Semantic UI & Glassmorphic View Layer]
        AppCore[Application Core & State Dispatcher]
        
        subgraph Modules [Feature Controllers]
            JournalCtrl[Journal Controller]
            KanbanCtrl[Kanban Controller]
            MeetingCtrl[Meeting & Notulen Controller]
            StandupGen[Standup Generator]
            ReviewGen[Review & STAR Polisher]
        end

        StorageMgr[(Local Storage Manager / IndexedDB)]
        AIService[Dual-Engine AI Client]
    end

    subgraph Storage [Zero-Server Local Persistence]
        LocalStorage[Browser localStorage / IndexedDB]
    end

    subgraph ExternalEngines [AI Endpoints (Optional)]
        OllamaLocal[Local Ollama / LM Studio (http://localhost:11434)]
        GeminiCloud[Google Gemini REST API (HTTPS)]
    end

    User --> UI
    UI --> AppCore
    AppCore --> Modules
    Modules --> StorageMgr
    StorageMgr <--> LocalStorage
    ReviewGen --> AIService
    AIService -.->|Direct Local HTTP (No Telemetry)| OllamaLocal
    AIService -.->|Client-Side HTTPS (BYOK)| GeminiCloud
```

---

## 2. Data Flow & State Lifecycle

All state transitions are deterministic and persist synchronously to browser storage.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as UI View Layer
    participant Core as Application Controller
    participant Storage as Local Storage
    participant AI as AI Engine (Ollama/Gemini)

    User->>View: Adds new task or drops card to "Done"
    View->>Core: Dispatches action (e.g. UPDATE_STATUS)
    Core->>Core: Computes timestamp, updates streak & stats
    Core->>Storage: Persists serialized state
    Storage-->>Core: Success
    Core->>View: Renders reactive UI update

    opt Generate Review / Standup with AI
        User->>View: Requests Performance Review for Quarter
        View->>Core: Collects completed entries
        Core->>AI: Sends formatted prompt (Direct to Localhost / Cloud)
        AI-->>Core: Returns STAR / XYZ impact bullets
        Core->>View: Displays editable output + Copy to Clipboard
    end
```

---

## 3. Data Schemas & Storage Design

All data is structured as JSON and keyed in `localStorage` under isolated namespaces.

### 3.1 Work Journal & Kanban Entry Schema (`bragbook_entries`)
```typescript
interface BragEntry {
  id: string;               // UUID / timestamp-based unique identifier
  title: string;            // Summary of accomplishment or task
  details?: string;         // Extended notes, commit hashes, or metrics
  project: string;          // Project or client name (e.g., "Core Infra", "Client Alpha")
  tags: string[];           // Categorization tags (e.g., ["#bugfix", "#perf"])
  impact: 'low' | 'medium' | 'high'; // Significance rating
  status: 'backlog' | 'in_progress' | 'done' | 'blocked';
  createdAt: string;        // ISO 8601 string
  completedAt?: string;     // ISO 8601 string when transitioned to 'done'
  blockerNotes?: string;    // Explanation if status is 'blocked'
}
```

### 3.2 Meeting & Live Notulen Schema (`bragbook_meetings`)
```typescript
interface ActionItem {
  id: string;
  text: string;
  isCompleted: boolean;
  syncedToKanban: boolean;  // True if already pushed into bragbook_entries
}

interface MeetingNote {
  id: string;
  title: string;            // Meeting title (e.g. "Sprint Architecture Review")
  date: string;             // ISO Date string
  project: string;
  participants: string;     // Comma-separated list of attendees
  notes: string;            // Rich Markdown content with [HH:MM] timestamps
  actionItems: ActionItem[];
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Application Settings Schema (`bragbook_settings`)
```typescript
interface AppSettings {
  aiProvider: 'none' | 'ollama' | 'gemini';
  ollamaBaseUrl: string;    // Default: "http://localhost:11434/v1"
  ollamaModel: string;      // Default: "llama3.2"
  geminiApiKey?: string;    // Client-side BYOK key
  geminiModel: string;      // Default: "gemini-1.5-flash"
  theme: 'dark' | 'light';  // Default: "dark"
}
```

---

## 4. Dual-Engine AI Integration Architecture

```mermaid
flowchart TD
    Trigger([Generate Review / Standup]) --> CheckProvider{Selected AI Provider}

    CheckProvider -->|Local Ollama / LM Studio| OllamaReq[Fetch POST to http://localhost:11434/v1/chat/completions]
    CheckProvider -->|Google Gemini BYOK| GeminiReq[Fetch POST to https://generativelanguage.googleapis.com]
    CheckProvider -->|None / Offline| TemplateEngine[Execute Local Deterministic Rule-Based Formatter]

    OllamaReq -->|Success| FormatOutput[Render STAR / Google XYZ Bullets]
    GeminiReq -->|Success| FormatOutput
    TemplateEngine --> FormatOutput

    OllamaReq -->|Connection / CORS Error| FallbackPrompt[Display CORS setup helper or switch to template]
    GeminiReq -->|API Error| FallbackPrompt
```

### 4.1 Local Ollama Protocol
BragBook talks directly to the standard OpenAI-compatible API endpoint exposed by Ollama:
* **Endpoint:** `${ollamaBaseUrl}/chat/completions`
* **Method:** `POST`
* **Header:** `Content-Type: application/json`
* **CORS Requirement:** Ollama must allow browser origin (configured via `OLLAMA_ORIGINS="*"`).

### 4.2 Google Gemini Protocol
BragBook connects directly via Google Gemini's REST API:
* **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`
* **Method:** `POST`

---

## 5. Extension & PWA Dual-Mode Deployment

BragBook is engineered with standard web technologies so that the same codebase can be consumed through three primary interfaces:

1. **Direct Browser Window:** Opened as a standard web page or via `file:///path/to/bragbook/index.html`.
2. **Progressive Web App (PWA):** Equipped with `manifest.json` enabling the "Install Application" prompt in Chromium browsers.
3. **Chrome Side Panel (Manifest V3):** Configured via `manifest.json` to be loaded as an unpacked extension that opens smoothly in Chrome's native Side Panel.
