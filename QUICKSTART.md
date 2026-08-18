# Quick Start Guide

Want to get translating fast? Follow these steps. For technical details, customization, and troubleshooting, see the main `README.md`.

---

## Step 1: Start Your AI

1. Open your local AI program (e.g. **LM Studio**).
2. Load a model (we recommend `Qwen2.5-3B-Instruct`).
3. Start the **Local Server** (default port: `1234`).

## Step 2: Open the Tool

You can't double-click `index.html` directly — it needs an HTTP server to load its config files. Pick one of the two options:

### With AI logs (recommended)

Use the bundled `serve.py` dev server. It serves the app and adds a safe write endpoint so `js/logger.js` can save captured AI prompt/response logs to `docs/logs/`.

```bash
python3 serve.py            # http://localhost:8000
# python3 serve.py 9000     # optional: custom port
```

Open `http://localhost:8000/index.html` in your browser. (Python 3 standard library only — no extra dependencies.)

### Without logs (plain static server)

Any static HTTP server works; only disk logging is skipped (the in-memory buffer is unaffected).

```bash
python3 -m http.server 8000
# or: npx http-server, VS Code Live Server, etc.
```

Open `http://localhost:8000/index.html`.

## Step 3: Connect and Translate

1. Click **Refresh (↻)** next to the model dropdown at the top.
2. Select your AI model from the list.
3. Click **Choose Files** and upload your Japanese game script files (usually found in your game's `data/scripts/data` folder).
4. Select a script from the list on the left.
5. Set the **Summary Lines** and **Raw Lines** in the top bar if needed (defaults of 0 are fine to start — fine-tune for your model later).
6. Click **Run Translation** on the right side.

## Step 4: Review Names

When the translator hits a `<NAME_PLATE>` tag with a character name, a popup appears showing the Japanese name and a suggested English transliteration. Approve or edit it, then click confirm. The name is remembered for the rest of the session.

## Step 5: Save Your Work

Click **Save File** to save to local browser cache.
Click **Export** to download translated/updated script file.

---

## Line-by-Line Mode (Optional)

Want more control? Enable **Manual Review** in the Debug menu (gear icon) to translate one chunk at a time. After each chunk you can:
- Edit the translation directly in the right text area.
- Adjust context settings and click **Re-Translate** to try again.
- Click **Continue** to accept and move to the next chunk.

---

*For features, setup details, preset customization, debugging, and troubleshooting, see `README.md`.*
