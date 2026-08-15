# RPG Script & Scene Data Viewer, Editor & Translation Suite

A lightweight, single-file HTML5 web tool built for visual novel localizers, script editors, and AI translation. It is a dedicated Japanese-to-English translation tool. It allows you to parse, compare, edit, and translate complex game script files locally using OpenAI-compatible local AI servers like **LM Studio**. This tool is specifically engineered and optimized for small local LLMs, and is currently being actively tested and tuned with **Qwen-3B-Instruct**. Note: To modify prompts or validation criteria, edit the JSON preset configuration files in the `default_presets/` directory.

---

## Key Features

* **Side-by-Side Dual-Pane Editor:** Load two script versions (e.g., original Japanese vs. translated English) to compare, edit, copy, and export files.
* **LM Studio & Local Server Integration:** Connects seamlessly to local inference engines via OpenAI-compatible endpoints (`/v1/models` and `/v1/chat/completions`).
* **3-Tier Contextual Summarization Engine (Optimized for Qwen2.5-3B):**
  * **Tier 1 (Raw Tail):** Feeds the most recent 2–4 dialogue lines verbatim for immediate pronoun and speaker continuity.
  * **Tier 2 (Rolling Scene Recap):** A single tight paragraph tracking active characters, tone, and immediate scene developments as lines exit the raw tail.
  * **Tier 3 (Archival Story State):** A self-updating, 1-sentence macro story recap that compresses scene recaps when they overflow, ensuring strictly bounded prompt token costs.
* **Interactive Step-by-Step Manual Review Toolbar:**
  * Displays the active source line in a dedicated header element.
  * Live context preview dropdown displaying exact context lines and summaries fed to the model.
  * In-place translation edits, line approval, and dynamic re-translation with adjustable context sliders.
* **Interactive Name Plate Resolver:** Intercepts `<NAME_PLATE>` character tags and prompts for user-approved transliterations with persistent mapping memory.
* **Romaji & Validation Failsafes:** Detects leftover Japanese characters and untranslated romaji fragments (e.g., *nani*, *watashi*, *konna*), automatically triggering retry policies.
* **Stylization & Text Masking:**
  * Strips or delineates Japanese visual novel speech patterns (e.g., ！？, ――, stutters) to prevent small LLMs from getting confused.
  * **AI Mapping Generator:** Automatically analyzes source scripts and suggests JSON key-value replacement rules.
* **Dynamic Preset System:** Auto-loads 6 pre-configured prompt presets from `default_presets/` (Main, Benchmark, Japanese-to-English, Retry Translation, Name Plate Unique, Stylization Mapping).
* **Modern Theming & Dark Mode:**
  * Full dark mode support (`[data-theme="dark"]`) with theme-aware scrollbars and low-glare, eye-strain-reducing palette tuning.
  * Clean UI typography with all emoji-only controls replaced by intuitive text and symbols.
* **Parameter Sweep & Benchmark Suite:**
  * Tests combinations of context lengths and raw limit thresholds.
  * Employs an AI grading agent to score candidate translations across gender consistency, semantic fidelity, and conversational flow.
* **Persistent Offline Caching:** Automatically caches loaded script files, UI selections, and settings in browser IndexedDB (`ScriptParserCacheDB`).

---

## Tool Dependencies & Requirements

No build tools, Node.js packages, or web servers are required to host the tool itself. It runs directly in any modern browser.

### 1. Client-Side Requirements
* **Browser:** Any modern web browser supporting ES6+, HTML5 IndexedDB, and Fetch API (e.g., Google Chrome, Brave, Microsoft Edge, Mozilla Firefox).

### 2. Local AI Server (Required for AI Features)
* **Local Inference Server:** Required for running local translation and evaluation models.
  * **Server Address:** Defaults to `http://127.0.0.1:1234`
  * **CORS Settings:** Ensure Cross-Origin Resource Sharing (CORS) is enabled in your server settings.
* **Alternative Local Servers:** Any local API that exposes standard OpenAI endpoints (`/v1/models` and `/v1/chat/completions`) will work.

---

## Quick Start Guide

### Step 1: Launch Local AI Server
1. Open your AI Server (e.g., LM Studio, Ollama, vLLM, text-generation-webui) and load your preferred translation model (e.g. `Qwen2.5-3B-Instruct`).
2. Start the **Local Inference Server** (default port: 1234).

### Step 2: Launch the Web Application (Local HTTP Server)

The tool must be served over HTTP (not opened directly as a `file://` URL) so the browser can fetch the shipped default presets in `default_presets/` and avoid browser file-access restrictions. Run any static file server from the repository root.

**Option A - From a cloned repository:**
1. Clone the repo: `git clone https://github.com/antAmaine/RPGX-Translation-Tool.git`
2. Move into the project folder: `cd RPGX-Translation-Tool`
3. Start a local server with Python 3 (no extra installs needed):
   ```bash
   python3 -m http.server 8000
   ```
4. Open `http://localhost:8000/index.html` in your browser.

**Option B - From a downloaded GitHub copy (no git):**
1. On the GitHub repo page, click **Code -> Download ZIP**, then extract it.
2. Open a terminal in the extracted folder.
3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```
   *(If Python is unavailable, any static server works, e.g. `npx http-server` or VS Code's Live Server extension.)*
4. Open `http://localhost:8000/index.html` in your browser.

Once the page is open:
1. In the top toolbar, verify the server URL (`http://127.0.0.1:1234`) and click the **Refresh (↻)** button to populate your model list.
2. Select your loaded model from the dropdown.

### Step 3: Load Script Files
1. Click **Choose Files** in the top panel and upload your script files (`.json` or `.js`) Found in data/scripts/data in the veiwer's folder.
2. Select a **Script ID** from the sidebar to display source text in the left pane.

### Step 4: Translate & Edit

* Click **Run Translation** on the right pane to start auto-translating.
* **Manual Review Mode:** When "Enable Manual Review" is checked, the dedicated review toolbar appears after each chunk:
    * View the original Japanese text in the dedicated source line box.
    * Inspect the live context window dropdown to verify what narrative history the model sees.
    * Edit translation directly in the right text area.
    * Click **Approve Line** to commit the translation to memory and proceed.
    * Click **Re-Translate** with adjusted context lines or raw limits to re-prompt the model.
* When new character names are encountered in `<NAME_PLATE>`, approve or modify transliterations in the modal dialog.
* Click **Save File** to export your completed translations.

---

## Prompt Engineering for Small Models

Small local models (like Qwen-2.5-3B) require strict prompt structures to avoid hallucinations and formatting breaks. Follow these guidelines when editing `default_presets/`:

1. **Always Use English**: Write system prompts in English, regardless of the target translation language. Open-weight models follow strict logic best in English. Instructions in other languages increase the risk of conversational drift.
2. **Rule-Bound Structure**: Avoid generic paragraphs. Establish a persona and append a numbered `RULES:` block.
3. **Negative Constraints**: Explicitly ban unwanted behaviors (e.g., `Do NOT include explanations`).
4. **Enforce JSON Rigidity**: When expecting JSON, state `Output strictly in valid JSON format` and explicitly ban markdown wrappers to prevent parsing failures.

**Example Prompt:**
> "You are a specialized Japanese-to-English game localizer. Translate the dialogue naturally while maintaining character voice and nuance. RULES: 1) Output ONLY the translated English text. 2) Do NOT include any explanations, notes, or preamble. 3) Preserve all original game tags and structural formatting exactly."

---

## Debug & Benchmark Menu

Click **Debug & Benchmark** in the right pane to access advanced research tools:

* **Page 1 (Stylization & Masking):**
  * Limit translation runs to a specific line count for rapid debugging.
  * Toggle stylization modes (Strip & Re-inject, Delineate, or Disabled).
  * Auto-generate and approve text replacement maps using the AI.
* **Page 2 (Parameter Sweep & Benchmark):**
  * Input comma-separated context values (e.g., `2, 6, 12`) and raw limits (e.g., `1, 2, 4`).
  * Run multi-dimensional parameter matrix sweeps to let an AI evaluator grade candidates against reference ground-truth text for pronoun fidelity, semantics, and narrative flow.

---

## Commit History & Development Changelog

Summary of major feature milestones merged into `main`:

* **Tiered Context Summarization Pipeline:** Replaced unbounded milestone lists with a 3-tier hierarchy (Raw Tail → Rolling Scene Recap → Self-Updating Archival Story State) bounded for 3B-parameter models.
* **Separate Source Line & Live Context Preview (PR #22):** Decoupled the active source line element and added real-time context preview dropdown updates during manual review.
* **Manual Override Source UI & Toolbar Overhaul (PR #18, #21):** Themed and repositioned the manual step toolbar with live context controls and editable textareas.
* **Romaji & Quality Validation Failsafes (PR #19, #20):** Added automated detection for untranslated romaji fragments and Japanese glyphs to trigger retry presets.
* **Logging & Execution Tracing (PR #16, #19):** Added comprehensive console traces (`[Trace:...]`) covering server requests, response cleaning, and pipeline checkpoints.
* **Proper Noun & Name Plate Fixes (PR #17):** Initialized `knownNamesMap` in global state to ensure zero crashes on first encountering character name plates.
* **Dark Mode & Eye-Strain Reduction Palette (PR #9, #10, #11, #12, #13, #14, #15):** Implemented full dark mode toggle, theme-aware custom scrollbars, and calibrated low-contrast light surfaces.
* **Model Auto-Detection (PR #7):** Hardened server connectivity parsing to support diverse local LLM API responses and surface accurate error reasons.
* **UI Streamlining (PR #5, #6):** Cleaned up Distinct Presets controls and eliminated emoji-only buttons for consistent readability.
* **Dynamic Preset System & Shipped Presets (PR #1, #2, #3, #4):** Embedded 6 default JSON presets with dynamic loading into runtime operation configs.
