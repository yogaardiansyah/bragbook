# 📖 BragBook Developer & AI Agent Guidebook

This guidebook provides technical instructions for developers and autonomous AI agents working with, extending, or testing **BragBook**.

---

## 1. Zero-Server Local Development

### Opening Directly via File System
BragBook is engineered to run directly from disk:
1. Navigate to the `bragbook/` folder in your terminal or file manager.
2. Double-click `index.html` or open it with your browser:
   ```bash
   # Linux
   xdg-open bragbook/index.html

   # macOS
   open bragbook/index.html

   # Windows
   start bragbook/index.html
   ```

### Optional Static Preview Server
If you prefer running via a local HTTP origin (useful for testing PWA service workers):
```bash
# Using Python built-in server
python3 -m http.server 8080 --directory bragbook/

# Or using Node npx
npx serve bragbook/
```

---

## 2. Setting Up Local LLM (Ollama) with CORS

When a browser makes an HTTP request to `http://localhost:11434`, browser security policies enforce Cross-Origin Resource Sharing (CORS). By default, Ollama only accepts requests from its own origin unless configured to allow external origins.

### Enabling CORS in Ollama

#### On Linux (systemd service)
1. Edit the Ollama service configuration:
   ```bash
   sudo systemctl edit ollama.service
   ```
2. Add the following lines under `[Service]`:
   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```
3. Reload and restart the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   ```

#### On macOS / Direct CLI execution
Start Ollama with the environment variable:
```bash
OLLAMA_ORIGINS="*" ollama serve
```

#### On Windows
1. Open **System Properties** > **Environment Variables**.
2. Add a new User/System Variable:
   * Variable name: `OLLAMA_ORIGINS`
   * Variable value: `*`
3. Restart the Ollama desktop application from the system tray.

### Verifying Ollama Connectivity
You can test the endpoint directly via cURL:
```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2",
    "messages": [{"role": "user", "content": "Say hello!"}]
  }'
```

---

## 3. Running as a Chrome Side Panel Extension

BragBook includes a Manifest V3 `manifest.json` configured specifically for the Chrome Side Panel API.

### Installation Steps
1. Open Google Chrome (or Brave, Edge, Chromium).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle located at the top-right corner).
4. Click the **Load unpacked** button.
5. Select the `/bragbook` folder.
6. Click the extension icon in Chrome's toolbar or open the **Side Panel** dropdown and select **BragBook**.

BragBook will now render seamlessly in your browser's persistent side panel while you code, browse GitHub, or attend meetings!

---

## 4. Architectural Rules for AI Agents

When modifying or expanding the codebase:
1. **Never introduce bundlers (Webpack, Vite, Rollup) unless requested:** The application must remain operable simply by viewing `index.html`.
2. **Never import external scripts via unpinned CDNs:** External dependencies create points of failure and break offline guarantees.
3. **Always write clean, semantic HTML and standard CSS Variables:** Use the design system tokens defined in `style.css`.
4. **Maintain `localStorage` safety:** Wrap storage writes with `try/catch` to handle browser quota exceptions gracefully.
