# Quick Start Guide

Want to get translating fast? Follow these steps. For technical details, customization, and troubleshooting, see the main `README.md`.

---

## Step 1: Start Your AI

1. Open your local AI program (e.g. **LM Studio**).
2. Load a model (we recommend `Qwen2.5-3B-Instruct`).
3. Start the **Local Server** (default port: `1234`).

## Step 2: Open the Tool

You can't double-click `index.html` directly — it needs a simple server to load its config files.

1. Open a terminal in the folder where you downloaded this tool.
2. Run:
   ```bash
   python3 -m http.server 8000
   ```
   *(No Python? Any static server works — `npx http-server`, VS Code Live Server, etc.)*
3. Open your browser and go to: `http://localhost:8000/index.html`

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

Click **Export** / **Save File** to download the translated script files.

---

## Line-by-Line Mode (Optional)

Want more control? Enable **Manual Review** in the Debug menu (gear icon) to translate one chunk at a time. After each chunk you can:
- Edit the translation directly in the right text area.
- Adjust context settings and click **Re-Translate** to try again.
- Click **Continue** to accept and move to the next chunk.

---

*For features, setup details, preset customization, debugging, and troubleshooting, see `README.md`.*
