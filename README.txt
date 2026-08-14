# RPG Script & Scene Data Viewer, Editor & Translation Suite

A lightweight, single-file HTML5 web tool built for visual novel localizers, script editors, and AI translation researchers. It allows you to parse, compare, edit, and translate complex game script files locally using **LM Studio**.

---

## Key Features

* **Side-by-Side Dual-Pane Editor:** Load two script versions (e.g., original Japanese vs. translated English) to compare, edit, copy, and export files.
* **LM Studio Integration:** Leverages your local LLM server via OpenAI-compatible endpoints (http://127.0.0.1:1234).
* **Contextual Narrative Pipeline:**
  * **Sliding Context Window:** Keeps recent dialogue lines in memory to help the LLM maintain conversational context.
  * **Milestone Summarization:** Summarizes older context into short narrative milestones when line thresholds are exceeded.
  * **Interactive Name Plate Resolver:** Intercepts character names <NAME_PLATE> and prompts you for approved translations before continuing.
* **Stylization & Text Masking:**
  * Strips or delineates Japanese visual novel speech patterns (e.g., ！？, ――, stutters) so small LLMs aren't confused.
  * **AI Mapping Generator:** Automatically analyzes source scripts and suggests JSON key-value replacement rules.
* **Parameter Sweep & Benchmark Suite:**
  * Tests combinations of context lengths and raw limit thresholds.
  * Employs an AI grading agent to score candidate translations against a reference text for narrative flow, tone, and profanity fidelity.
* **Persistent Offline Caching:** Automatically caches loaded script files, UI selections, and settings in browser IndexedDB (ScriptParserCacheDB).

---

## Tool Dependencies & Requirements

No build tools, Node.js packages, or web servers are required to host the tool itself. It runs directly in any modern browser.

### 1. Client-Side Requirements
* **Browser:** Any modern web browser supporting ES6+, HTML5 IndexedDB, and Fetch API (e.g., Google Chrome, Brave, Microsoft Edge, Mozilla Firefox).

### 2. Local AI Server (Required for AI Features)
* **Local Inference Server:** Required for running local translation and evaluation models.
  * **Server Address:** Defaults to http://127.0.0.1:1234
  * **CORS Settings:** Ensure Cross-Origin Resource Sharing (CORS) is enabled in your server settings.
* **Alternative Local Servers:** Any local API that exposes standard OpenAI endpoints (/v1/models and /v1/chat/completions) will work.

---

## Quick Start Guide

### Step 1: Launch Local AI Server
1. Open your AI Server (e.g., LM Studio, AI Server) and load your preferred translation model.
2. Start the **Local Inference Server** (default port: 1234).

### Step 2: Open the Web Application
1. Double-click `index.html` (or drag and drop it into your web browser).
2. In the top toolbar, verify the server URL (http://127.0.0.1:1234) and click the **Refresh** button to populate your model list.
3. Select your loaded model from the dropdown.

### Step 3: Load Script Files
1. Click **Choose Files** in the top panel and upload your script files (.json or .js).
2. Select a **Script ID** from the sidebar to display source text in the left pane.

### Step 4: Translate & Edit

* Click **Run Translation** on the right pane to start auto-translating.
* **Manual Override & Review:** If "Enable Manual Review" is checked, the tool will pause after every translation block.
    * You can edit the translation directly in the text area.
    * Click **Approve Line** to save your edited version directly into the context history.
    * Click **Re-Translate** to re-run the AI, using the original source text but incorporating any custom instructions you add.
* If a new character name is encountered, a popup will ask you to confirm or edit the translation.
* Edit text directly in either pane and click **Save File** when finished.

---

## Debug & Benchmark Menu

Click **Debug & Benchmark** in the right pane to access advanced tools:

* **Page 1 (Stylization & Masking):**
  * Limit translation runs to a specific line count for fast testing.
  * Toggle stylization handling modes (Strip & Re-inject, Delineate, or Disabled).
  * Auto-generate and approve text replacement maps using the AI.
* **Page 2 (Parameter Sweep & Benchmark):**
  * Input comma-separated context values (e.g., 2, 6, 12) and raw limits (e.g., 1, 3, 5).
  * Current optimal configuration: Context 6, Raw Limit 3.
  * Paste a target ground-truth reference line.
  * Run the sweep to let an AI agent evaluate which context configuration yields the best tone and accuracy.

---

## Supported Data Formats

- Fixed model detection logic in Parser.html to support diverse API response structures.

