# RPG Script & Scene Data Viewer, Editor & Translation Suite

A lightweight, browser-based Japanese-to-English visual novel translation tool. It parses, compares, edits, and translates complex game script files locally using OpenAI-compatible local AI servers (LM Studio, Ollama, vLLM, llama.cpp). Engineered and tuned for small local LLMs, currently tested with **Qwen2.5-3B-Instruct**.

No build tools, no Node.js packages, no server-side runtime. Pure vanilla JS ES modules + a single HTML file + CSS. Serve over HTTP so the browser can fetch the shipped preset files, and it runs.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Requirements](#requirements)
4. [Setup](#setup)
5. [Loading & Translating Scripts](#loading--translating-scripts)
6. [Manual Step-by-Step Review](#manual-step-by-step-review)
7. [Stylization & Text Masking](#stylization--text-masking)
8. [Name Plate Resolution](#name-plate-resolution)
9. [Tiered Context Summarization](#tiered-context-summarization)
10. [Translation Validation Pipeline](#translation-validation-pipeline)
11. [Debug & Benchmark Menu](#debug--benchmark-menu)
12. [Preset System](#preset-system)
13. [Prompt Engineering for Small Models](#prompt-engineering-for-small-models)
14. [Debugging & Troubleshooting](#debugging--troubleshooting)

---

## Architecture

### File Structure

```
index.html              — Single-page UI; loads only js/main.js as a module
styles.css             — Full styling, light/dark theme, responsive panes
js/
  main.js              — Entry point, shared state object, window.* wiring, theme toggle
  database.js          — IndexedDB persistence (file cache + UI state cache)
  parser.js            — File/script registry, dropdown population, comparison views
  translator.js        — Translation pipeline: stylization, name-plate, main loop
  translator-presets.js — Operation preset definitions + default-preset JSON loaders
  translator-llm.js    — LLM HTTP helpers: model fetch, summarization, validation, chunk translation
  ui.js                — Debug modal, stylization-map CRUD, error banner
  ui-manual-step.js    — Name-plate + manual step-by-step override modals
  ui-layout.js         — Pure DOM layout: modal drag, resize handles, auto-number inputs
  benchmark.js         — Multi-dimensional parameter sweep benchmark with chunked grading
default_presets/        — 11 shipped JSON prompt presets (see Preset System)
docs/
  FUNCTION_MANIFEST.md — Static call-graph reference for all JS functions
```

`index.html` loads only `js/main.js` via `<script type="module">`. All other files are reached through ES module imports:
assignment in `main.js`. See `docs/FUNCTION_MANIFEST.md` for the complete static call graph.

The central `state` object exported from `main.js` holds all application state and is imported by every other module. 


---

## Features

### Core Translation
- **Side-by-Side Dual-Pane Editor:** Load two script versions (original Japanese vs. translated English) to compare, edit, copy, and export.
- **Sequential Translation Pipeline:** Line-by-line processing with dialogue buffering, name-plate resolution, stylization stripping, and tiered context window construction.
- **Multi-Check Validation Gate:** Every translation attempt is validated against Japanese character detection, romaji fragment detection, context-leak detection, and an AI quality validator before acceptance.

### Context Management
- **3-Tier Summarization Engine:** Raw Tail → Rolling Scene Recap → Archival Story State, bounded for small-model token limits.
- **Tiered Context Window Builder:** Shared between the production pipeline and the benchmark sweep so both grade under identical conditions.

### Stylization
- **Strip/Delineate/Disable Modes:** Strip rewrites JP patterns to EN equivalents before translation; Delineate prepends a note tag; Disabled passes text through unchanged.
- **AI Mapping Generator:** 3-phase analysis (Ticks → Sounds → Punctuation) discovers stylization patterns automatically.
- **Priority Override:** Reserved `__priorityOverride__` map key applies early global substitutions (e.g. `、` → `-`) before all other phases.
- **Bracket-Strip Logic:** Two checkboxes (mapper and manual-step) control whether `「」` brackets are stripped from name values during in-dialogue replacement.

### UI & UX
- **Interactive Step-by-Step Manual Review:** Per-chunk review with live context preview, editable output, re-translate with adjusted settings.
- **Interactive Name Plate Resolver:** Prompts for user-approved name transliterations with persistent mapping memory.
- **Resizable Panes:** Sidebar, source panes, and manual-step context rows are all drag-resizable.
- **Dark Mode:** Full dark/light theme toggle with theme-aware scrollbars, persisted to localStorage.
- **Persistent Offline Caching:** Loaded files, UI selections, and settings cached in IndexedDB (`ScriptParserCacheDB`).

### Benchmarking
- **Parameter Sweep Matrix:** Tests combinations of context lengths and raw limit thresholds.
- **Chunked Grading:** Splits translated output into fixed-size chunks, grades each independently via an AI auditor, then averages scores.
- **Multi-Criteria Scoring:** Pronoun/gender consistency, semantic fidelity, and conversational flow.

---

## Requirements

### Client-Side
- **Browser:** Any modern browser supporting ES6+ modules, HTML5 IndexedDB, and Fetch API (Chrome, Brave, Edge, Firefox).

### Local AI Server (required for AI features)
- Any local inference server exposing OpenAI-compatible endpoints:
  - `GET /v1/models` (or `/api/v0/models`, `/models` — all three are tried automatically)
  - `POST /v1/chat/completions`
- **Server Address:** Defaults to `http://127.0.0.1:1234`
- **CORS:** Must be enabled in your server settings.
- **Tested with:** LM Studio, Ollama, vLLM, llama.cpp
- **Recommended model:** `Qwen2.5-3B-Instruct`

---

## Setup

### Step 1: Launch Local AI Server

1. Open your AI server (LM Studio, Ollama, etc.) and load your translation model (e.g. `Qwen2.5-3B-Instruct`).
2. Start the **Local Inference Server** (default port: 1234).
3. Ensure **CORS is enabled** in your server settings.

### Step 2: Serve the Web Application

The tool must be served over HTTP (not opened as `file://`) so the browser can fetch the default presets in `default_presets/`.

**From a cloned repository:**
```bash
git clone https://github.com/taimanintrash/RPGX-Translation-Tool.git
cd RPGX-Translation-Tool
python3 -m http.server 8000
```

Open `http://localhost:8000/index.html` in your browser.

**Without git (downloaded ZIP):**
1. Download and extract the ZIP from GitHub.
2. Open a terminal in the extracted folder.
3. Run `python3 -m http.server 8000` (or any static server: `npx http-server`, VS Code Live Server).
4. Open `http://localhost:8000/index.html`.

### Step 3: Connect to AI Server

1. Verify the server URL in the top toolbar (`http://127.0.0.1:1234`).
2. Click the **Refresh (↻)** button to populate the model dropdown.
3. Select your loaded model.

If the dropdown shows "Connection Failed," see [Debugging & Troubleshooting](#debugging--troubleshooting).

---

## Loading & Translating Scripts

### Load Files
1. Click **Choose Files** in the top panel and upload script files (`.json` or `.js`), typically found in the game's `data/scripts/data` folder.
2. Select a **Script ID** from the sidebar to display source text in the left pane.
3. Optionally select a file in the right dropdown to load an existing translation for comparison.

### Configure Context
- **Summary Lines** (`contextLinesCount`): Size of the recent summary window. 0 = no summarization (raw lines only).
- **Raw Lines** (`rawContextLimit`): Number of verbatim recent lines fed to the model as the raw tail.

Both default to 0; fine-tune for your model.

### Translate
1. Select a target file in the right dropdown.
2. Click **Run Translation** on the right pane.
3. Progress displays in the loading status bar; click **Stop** to abort at any time.
4. Click **Save File** / **Export** to download the translated JSON/JS script.

---

## Manual Step-by-Step Review

Enable **Manual Review** via the Debug Menu checkbox (`manualStepModeCheckbox`) or the toolbar toggle. When active:

- After each dialogue chunk is translated, the **Manual Step Override** toolbar appears.
- The current source line shows in the **source line box** (permanently visible).
- A **live context preview** displays the exact archival summary, recent summary, raw tail, and summary source lines fed to the model.
- **Context Lines** and **Raw Limit** inputs can be adjusted per-step:
  - Changing Context Lines triggers a confirmation prompt (destructive — recomputes summaries).
  - Changing Raw Limit only reshapes the raw tail display (no recalculation).
  - Click **Apply** to recompute summaries with the new settings without retranslating.
- Edit the translation directly in the right text area.
- **Re-Translate:** Re-runs `translateChunkWithContext` with the adjusted context window and current bracket-strip setting. The strip phase re-runs on the original source lines so a toggled bracket checkbox takes effect.
- **Continue / Approve Line:** Commits the (possibly edited) translation to memory and proceeds to the next chunk.

The manual-step display block is reconstructed from the output textarea by replaying the same `filter(l !== "") + join("\n")` order, so multi-line narration entries are captured correctly.

---

## Stylization & Text Masking

Stylization handles Japanese visual novel speech patterns (stutters, ticks, sound effects, punctuation) that confuse small LLMs.

### Modes (`stylizationModeSelect`)

| Mode | Behavior |
|---|---|
| **Strip** | Replaces JP patterns with EN equivalents before sending to the AI. Lines that are entirely stylization are flushed directly without translation. |
| **Delineate** | Prepends `[Note: Contains stylized/stuttering expressions]` to the source line. |
| **Disabled** | Passes source text through unchanged. |

### Stylization Map (`heavyStylizationMap`)

A JSON object stored in `state.heavyStylizationMap`, edited via the stylization map editor textarea in the Debug Menu. Structure:

```json
{
  "__priorityOverride__": { "、": "-" },
  "凜子": "「Rinko」",
  "ッ！": "!",
  "びりびり": "bzz-bzz"
}
```

- **`__priorityOverride__`** (reserved key): Entries applied FIRST, before generation phases and the strip-phase replacement loop. Longest key first, globally. Use for early character substitutions.
- **Name entries** (values wrapped in `「」`): Applied first after priority override, sorted by key length descending.
- **Other entries**: Applied after name entries, sorted by key length descending so longer multi-character keys are applied before their substrings.
- **Empty-value entries**: Dropped automatically on save (they replace text with nothing).

### Strip Phase (`stripLine`)

For each dialogue line:
1. Apply `__priorityOverride__` pre-pass (longest key first, global replace).
2. Iterate `Object.entries(state.heavyStylizationMap)` (skipping `__priorityOverride__`), replacing patterns longest-first.
3. Strip `「」` from name values when the bracket-strip XOR decision is true.
4. If the line collapses to nothing (entirely stylization), `flushOnly=true` — the extracted stylizations are pushed directly and translation is skipped.

### Bracket-Strip XOR Logic

Two checkboxes control whether `「」` brackets are stripped from name values during in-dialogue replacement:

- **Mapper checkbox** (`mapperStripBracketsCheckbox`): Active during Generate Mapping.
- **Manual-step checkbox** (`manualStepStripBracketsCheckbox`): Active during Manual line-by-line Override retranslation.

**XOR truth table:**

| Manual checked | Mapper checked | Result |
|---|---|---|
| ✓ | ✗ | Strip brackets |
| ✗ | ✓ | Strip brackets |
| ✓ | ✓ | Keep brackets |
| ✗ | ✗ | Keep brackets |

Stripping occurs when exactly one checkbox is checked. Both checkboxes persist to/from IndexedDB.

### AI Mapping Generator (`generateStylizationMapWithAI`)

3-phase analysis of dialogue lines:
1. **Ticks** — stutters, repeated-kana ticks, gemination tick+punctuation combos.
2. **Sounds** — onomatopoeia and sound effects (3+ kana patterns).
3. **Punctuation** — Japanese punctuation marks and multi-character sequences.

Priority override is applied to dialogue lines before analysis so phases never see the original characters. Results land in `state.pendingDiscoveredMappings` for review. Discovered items are validated by `isValidMappingPair` (rejects single kana, grammar particles, sentences, pure ASCII, bracket-wrapped patterns, and kanji+hiragana word fragments).

---

## Name Plate Resolution

`resolveNamePlate` intercepts `<NAME_PLATE>` lines and:

1. Extracts the Japanese name from the plate.
2. Checks `state.knownNamesMap` for a cached resolution.
3. If not cached, transliterates via the `namePlate` preset (`translateChunkWithContext` with `presetType='namePlate'`).
4. Prompts the user (via `promptUserForNameTranslation`) unless `autoSkipNameModal` is set or benchmark mode (`autoAccept=true`).
5. Caches the resolution in `state.knownNamesMap`.
6. Merges the JP→EN name into the stylization map as `「ENname」` so in-dialogue occurrences are auto-replaced.
7. Returns `{ namePlateLine, speakerName }` where speakerName is `"Narrator"` for empty plates (denoting narration).

The resolved speaker name is passed to `translateChunkWithContext` as the `speakerName` parameter, injected into the system prompt (not inline) so the model treats it as context rather than content to echo.

---

## Tiered Context Summarization

The context window is built by `buildTieredContextWindow`, shared by the production pipeline and the benchmark sweep:

### Tier 1 — Raw Tail
The most recent `rawLimitThreshold` confirmed lines from history, fed verbatim for immediate pronoun and speaker continuity.

### Tier 2 — Rolling Scene Recap
A single tight paragraph tracking active characters, tone, and immediate scene developments. Updated via `updateRecentSummary` as lines exit the raw tail. Bounded by `maxContextLines`.

### Tier 3 — Archival Story State
A self-updating, 1-sentence macro story recap. Compressed via `updateArchivalSummary` when the recent summary overflows `maxContextLines` source lines. The recent summary is reset to cover only the remaining window lines.

### Window Assembly
Final context = `[Archival Summary] + [Recent Summary] + [Raw Tail]`, capped to `maxContextLines + rawLimitThreshold` entries.

---

## Translation Validation Pipeline

`translateChunkWithContext` runs a multi-check validation gate with retry logic (up to 5 attempts):

| Check | Method | Fail Window |
|---|---|---|
| Japanese characters | Regex `[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]` | Hard fail every attempt |
| Romaji fragment | Word-list match (`detectRomajiFragment`) | Hard fail every attempt |
| Context leak | Exact + sliding 30-char window match (`detectContextLeak`) | Hard fail every attempt |
| AI validator | LLM PASS/FAIL verdict (`assessTranslationQualityWithAI`) | Hard fail attempts 1–3, advisory (log only) attempts 4+ |

On failure, the oldest context line is dropped and the attempt retries with reduced temperature. After max retries, a fallback run with the `retry` preset and empty context produces a `[MANUAL_OVERRIDE_NEEDED]` result.

The AI validator is intentionally lenient: only a clean standalone `FAIL` verdict counts as a failure. Prose, lowercase, echoed instructions, or empty responses are treated as a pass so a flaky small model cannot stall the loop.

---

## Debug & Benchmark Menu

Click **Debug & Benchmark** in the right pane to open the draggable modal.

### Page 1 — Translation & Stylization

| Control | Purpose |
|---|---|
| Max Lines Limit | Cap translation to N lines for rapid debugging (0 = no limit) |
| Auto-Skip Name Modal | Auto-accept AI name transliterations without prompting |
| Manual Step Mode | Enable the step-by-step review toolbar |
| Stylization Mode | Strip / Delineate / Disabled |
| Mapper Strip Brackets | Bracket-strip checkbox for Generate Mapping (XOR) |
| Manual Strip Brackets | Bracket-strip checkbox for manual override (XOR) |
| Stylization Map Editor | JSON textarea — edit the map directly, Save Map to commit |
| Generate Mapping | Run the 3-phase AI stylization analysis |
| Discovered Mappings | Review/select/edit discovered patterns, Add Selected to commit |
| Save & Close | Reorder map, persist to IndexedDB, close modal |

### Page 2 — Inconsistency-Focused Benchmark Suite

| Control | Purpose |
|---|---|
| Benchmark Text | Dedicated text input (falls back to Source 1 if empty) |
| Reference File / Scene | Select a reference standard for semantic fidelity grading |
| Context Values | Comma-separated context line counts to sweep (e.g. `2, 6, 12`) |
| Raw Limit Values | Comma-separated raw limits to sweep (e.g. `1, 2, 4`) |
| Chunk Size | Lines per grading chunk (default 5) |
| Run Sweep | Execute the parameter sweep matrix |

The sweep translates each cell (context × raw-limit combination) through the full production pipeline (name-plate resolution, tiered context, translation), then grades each chunk independently via `gradeCandidateAgent` and averages the scores. The auditor sees ONLY the candidate translation — no history or prompt scaffolding is leaked.

---

## Preset System

11 JSON preset files ship in `default_presets/` and are auto-loaded into memory on startup via `loadAllDefaultPresets`. Each maps to an operation key in `operationPresets`:

| File | Operation Key | Purpose |
|---|---|---|
| `benchmark_prompt.json` | `benchmark` | AI quality auditor system prompt |
| `japanese_to_english.json` | `jpEn` | Main JP→EN translation |
| `retry_translation.json` | `retry` | Fallback after validation failure |
| `name_plate_unique.json` | `namePlate` | Name transliteration |
| `stylization_mapping.json` | `stylization` | General stylization mapper |
| `stylization_punctuation.json` | `stylizationPunctuation` | Punctuation normalization |
| `stylization_sounds.json` | `stylizationSounds` | Onomatopoeia translation |
| `stylization_ticks.json` | `stylizationTicks` | Stutter/tick normalization |
| `recent_summary.json` | `recentSummary` | Tier 2 scene recap |
| `archival_summary.json` | `archivalSummary` | Tier 3 macro story state |
| `translation_validator.json` | `validator` | QA pass/fail evaluator |

Each preset JSON contains `temperature` and `systemPrompt` (or an `operation.fields` array with `llm.prediction.temperature` and `llm.prediction.systemPrompt` keys). Custom presets can be uploaded via the Debug Menu's per-operation file inputs to override any default in memory.

To modify prompts or validation criteria, edit the JSON files in `default_presets/` or upload a custom JSON override.

---

## Prompt Engineering for Small Models

Small local models (like Qwen2.5-3B) require strict prompt structures to avoid hallucinations and formatting breaks. Follow these guidelines when editing presets:

1. **Always Use English:** Write system prompts in English, regardless of target translation language. Open-weight models follow strict logic best in English.
2. **Rule-Bound Structure:** Establish a persona and append a numbered `RULES:` block. Avoid generic paragraphs.
3. **Negative Constraints:** Explicitly ban unwanted behaviors (e.g., `Do NOT include explanations`).
4. **Enforce JSON Rigidity:** When expecting JSON, state `Output strictly in valid JSON format` and ban markdown wrappers.

**Example:**
> "You are a specialized Japanese-to-English game localizer. Translate the dialogue naturally while maintaining character voice and nuance. RULES: 1) Output ONLY the translated English text. 2) Do NOT include any explanations, notes, or preamble. 3) Preserve all original game tags and structural formatting exactly."

---

## Debugging & Troubleshooting

### Model Dropdown Shows "Connection Failed"

The app tries three endpoint variants in order: `/v1/models`, `/api/v0/models`, `/models`. If all fail:

1. **Verify the server is running:** Check that your AI server (LM Studio, Ollama) is started and a model is loaded.
2. **Check the URL:** Ensure the server address is correct (`http://127.0.0.1:1234` by default).
3. **Enable CORS:** CORS must be enabled in your server settings for the browser to make cross-origin requests.
4. **Check diagnostics:** The error banner shows which endpoints were tried and why they failed (HTTP status, CORS rejection, or unexpected JSON shape).

### Default Presets Not Loading

If the console shows `[Default Presets] Could not load any default presets`:

- The app must be served over HTTP (`python3 -m http.server`), not opened as `file://`. Browsers block `fetch()` of local files for security.

### Translation Produces `[MANUAL_OVERRIDE_NEEDED]`

This means the chunk exhausted all 5 retry attempts. Causes:
- The model consistently outputs Japanese characters, romaji fragments, or context leaks that fail validation.
- Try a different model, increase context lines, or switch stylization mode.
- Use Manual Step Mode to review and manually correct the output.

### Stylization Patterns Not Being Applied

1. Verify the stylization mode is set to **Strip** in the Debug Menu.
2. Check that the pattern exists in the stylization map editor (valid JSON).
3. Use **Save Map** after editing — changes are not applied until saved.
4. Verify the pattern key contains Japanese characters (pure-ASCII keys are rejected by `isValidMappingPair`).

### Context Leaks in Translation

If translated output contains text from prior context lines:
- The context-leak detector uses exact + sliding 30-char window matching. Very short common phrases may slip through.
- Reduce the raw context limit or context lines count.
- Check the console trace `[Trace:Translate:Detect]` for `hasOldContext=true` warnings.

### Console Trace Logging

The app uses `[Trace:Section]` prefix conventions for all major operations. Key trace prefixes:

| Prefix | Section |
|---|---|
| `[Trace:Init]` | Application boot |
| `[Trace:Models]` | Model detection |
| `[Trace:Translation]` | Main translation loop |
| `[Trace:Translate]` | Chunk translation + validation |
| `[Trace:Translate:Detect]` | Validation check results |
| `[Trace:Summary:Recent]` / `[Trace:Summary:Archival]` | Tiered summarization |
| `[Trace:NamePlate]` | Name-plate resolution |
| `[Trace:Stylization]` | Stylization map generation |
| `[Trace:UI]` | UI operations |
| `[Trace:Benchmark]` | Parameter sweep |
| `[Trace:Preset]` | Preset loading |
| `[Trace:Theme]` | Theme toggle |
| `[Trace:Files]` | File loading/parsing |

Open the browser DevTools console (F12) to view these traces during operation.
