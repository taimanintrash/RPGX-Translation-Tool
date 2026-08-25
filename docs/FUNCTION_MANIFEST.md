# Function Manifest

This document describes every JavaScript module in the RPGX Translation Tool, the functions it exports/contains, and the static call graph between them.

**File load order:** `index.html` loads only `js/main.js` as `<script type="module">`. Every other file is reached via ES module imports. `main.js` imports from `database.js`, `ui.js`, `parser.js`, `translator.js`, and `benchmark.js`. `translator.js` re-exports symbols from `translator-presets.js` and `translator-llm.js`. `ui.js` re-exports symbols from `ui-manual-step.js` and `ui-layout.js`. `logger.js` is imported directly by `translator-llm.js`, `translator.js`, and `benchmark.js` (no re-export hub; each module imports the capture functions it needs). Log files are written to `docs/logs/<loop>/<preset>.md` at run end by the companion `serve.py` dev server (replaces `python3 -m http.server`).

**HTML event handlers:** Functions wired to `window.*` in `main.js` are invoked by inline `onclick`/`onchange` attributes in `index.html`. These are noted as "Called by: HTML event handler (via main.js window.* wiring)".

---

## js/main.js — Application entry point, shared state, theme toggle, and window.* wiring

Exports the central `state` object (imported by every other module), wires all module functions to `window.*` for HTML event handlers, restores cached UI state on DOMContentLoaded, and provides the light/dark theme toggle.

### applyTheme — Applies the given theme ('light' or 'dark') to the document root and updates the toggle button label

#### What function call it:
- js/main.js (toggleTheme, DOMContentLoaded)

#### What functions are used in it :
- js/main.js (recolorScriptSelectOptions)

### recolorScriptSelectOptions — Re-applies inline status colors to script-select options after a theme change (native option elements can't be restyled via CSS classes)

#### What function call it:
- js/main.js (applyTheme)

#### What functions are used in it :
- (none)

### toggleTheme — Toggles between light and dark themes and persists the choice to localStorage

#### What function call it:
- HTML event handler via main.js window.toggleTheme (theme toggle button)

#### What functions are used in it :
- js/main.js (applyTheme)

---

## js/database.js — IndexedDB persistence layer for cached files and UI state

Provides open/put/get operations for the IndexedDB cache storing the file registry and UI settings.

### openDatabase — Opens (or creates) the IndexedDB database and object store at version 6, resolving with the db handle

#### What function call it:
- js/database.js (saveFilesToCache, loadFilesFromCache, saveUIStateToCache, loadUIStateFromCache)

#### What functions are used in it :
- (none)

### saveFilesToCache — Persists the loaded-files registry to IndexedDB under the cachedFilesRegistry key

#### What function call it:
- js/parser.js (checkFinishedReads, removeFile, saveEditsToMemory, commitTextToRightFile)

#### What functions are used in it :
- js/database.js (openDatabase)

### loadFilesFromCache — Retrieves the cached file registry from IndexedDB

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/database.js (openDatabase)

### saveUIStateToCache — Persists the current UI settings (dropdowns, debug flags, stylization map, bracket toggles) to IndexedDB under the cachedUIState key

#### What function call it:
- js/parser.js (onSelectID, onCompareSelectionChange), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap), js/ui-manual-step.js (syncManualStepModeLive)

#### What functions are used in it :
- js/database.js (openDatabase)

### loadUIStateFromCache — Retrieves the cached UI state object from IndexedDB, returning null on failure

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/database.js (openDatabase)

---

## js/logger.js — Structured AI interaction logging (prompt/response capture by loop, written to disk)

In-memory ring buffer that captures every prompt sent to the LLM and every response received, grouped by originating loop (translation / retranslate / mapping / benchmark) and further split by preset, so each preset's prompt/response pairs land in their own file for performance tracking. Each preset buffer keeps only the latest 500 entries (rolling window). At run end the buffers are flushed to disk via the companion `serve.py` write endpoint into `docs/logs/<loopFolder>/<preset>.md` (markdown, AI-parseable). Owns no `state`-object fields; keeps its own module-scoped buffers and a single `activeLoopKind` cursor that the loops set via `beginLoop()`.

**Loop → folder mapping:** translation → `docs/logs/translation/`, retranslate → `docs/logs/manual-step/`, mapping → `docs/logs/mapping/`, benchmark → `docs/logs/benchmark/`.

**Entry schema (simplified, 6 fields):** `preset`, `sourceText`, `prompt`, `response`, `retryAttempt`, `outcome` (accepted / retried / fallback / generated / graded). `sourceText` holds the original source line before stylization strip/mapping (empty for summary/validator-only entries).

### setCaptureEnabled — Enables or disables AI-interaction capture; when disabled, logging calls are no-ops so the production pipeline pays no allocation cost

#### What function call it:
- (reserved for an optional capture toggle; defaults ON)

#### What functions are used in it :
- (none)

### isCaptureEnabled — Returns whether capture is currently enabled

#### What function call it:
- (reserved)

#### What functions are used in it :
- (none)

### beginLoop — Sets the active loop kind so subsequent LLM calls are tagged with the loop that owns them, defaulting to 'translation' for unknown kinds

#### What function call it:
- js/translator.js (translateViaAiServer, flushBuffer retranslate path, generateStylizationMapWithAI + its finally), js/benchmark.js (runParameterSweepBenchmark + its finally)

#### What functions are used in it :
- (none)

### logAIInteraction — Captures a single AI-interaction entry with the 6-field schema (preset, sourceText, prompt, response, retryAttempt, outcome), routing it to the active loop's buffer under its preset key with a rolling cap; no-op when capture is disabled

#### What function call it:
- js/translator-llm.js (translateChunkWithContext accepted/retried/fallback paths, updateRecentSummary, updateArchivalSummary, assessTranslationQualityWithAI), js/translator.js (generateStylizationMapWithAI phases), js/benchmark.js (gradeCandidateAgent)

#### What functions are used in it :
- (none)

### markSession — Appends a session-boundary marker (completed/aborted) to the active loop's buffer under the reserved __session__ preset key so run boundaries render as headers in the exported file

#### What function call it:
- js/translator.js (translateViaAiServer finally, generateStylizationMapWithAI finally), js/benchmark.js (runParameterSweepBenchmark finally)

#### What functions are used in it :
- (none)

### exportPresetAsMarkdown — Renders a loop's preset buffer as an AI-parseable markdown document with per-entry headers, metadata tags, fenced source-text/prompt/response blocks, and session-boundary headers

#### What function call it:
- js/logger.js (flushLoopToDisk)

#### What functions are used in it :
- (none)

### flushLoopToDisk — Writes every preset file for a single loop kind to disk via the serve.py POST /__write_log endpoint into docs/logs/<loopFolder>/<preset>.md, silently skipping when the write endpoint is unavailable

#### What function call it:
- js/translator.js (translateViaAiServer finally, generateStylizationMapWithAI finally), js/benchmark.js (runParameterSweepBenchmark finally)

#### What functions are used in it :
- js/logger.js (exportPresetAsMarkdown, getPresetsForLoop)

### clearAllLogs — Clears all captured logs across every loop kind and resets the entry sequence counter

#### What function call it:
- (reserved)

#### What functions are used in it :
- (none)

### getActiveLoopKind — Returns the currently active loop kind

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### getPresetsForLoop — Returns the list of preset keys that have captured entries for a loop kind, so the flush helper knows which files to write

#### What function call it:
- js/logger.js (flushLoopToDisk)

#### What functions are used in it :
- (none)

---

## js/parser.js — File/script registry, dropdown population, and comparison view rendering

Manages loading JSON script files into the registry, parsing content, populating file/script/master-ID dropdowns, rendering comparison views, and committing translated text back to the right-hand file.

### loadFiles — Handles the file-selection event via FileReader, reads each file asynchronously, parses it to JSON, and adds/updates it in the loaded-files registry

#### What function call it:
- HTML event handler via main.js window.loadFiles (HTML file input)

#### What functions are used in it :
- js/parser.js (checkFinishedReads, parseContentToJSON), js/ui.js (showError)

### checkFinishedReads — When all asynchronous file reads complete, refreshes application state and persists the file registry and UI state to cache

#### What function call it:
- js/parser.js (loadFiles)

#### What functions are used in it :
- js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache)

### removeFile — Removes a file from the loaded-files registry by name, then refreshes application state and re-caches the registry and UI state

#### What function call it:
- HTML event handler via main.js window.removeFiles (HTML remove button)

#### What functions are used in it :
- js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache), js/parser.js (updateFileListUI)

### parseContentToJSON — Parses file content into JSON, falling back to a regex extraction of the first {...} block when standard JSON.parse fails

#### What function call it:
- js/parser.js (loadFiles)

#### What functions are used in it :
- (none)

### refreshApplicationState — Refreshes all core UI elements after a file-registry change: the file list, file dropdowns, master ID list, benchmark dropdown, and comparison views

#### What function call it:
- js/parser.js (checkFinishedReads, removeFile), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, updateBenchmarkFileDropdown, updateFileDropdowns, updateFileListUI, updateMasterIDList)

### updateFileListUI — Renders the loaded-files tag list in the sidebar and toggles the global warning shown when fewer than two files are loaded

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- js/parser.js (removeFile)

### updateFileDropdowns — Populates the left/right source-file dropdowns from the loaded-files registry, restoring prior selections and avoiding identical left/right choices

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- (none)

### updateBenchmarkFileDropdown — Populates the benchmark reference-file dropdown from the loaded-files registry, restoring the prior selection, then refreshes the scene dropdown

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- js/parser.js (updateBenchmarkSceneDropdown)

### updateBenchmarkSceneDropdown — Populates the benchmark reference-scene dropdown from the keys of the selected reference file, restoring the prior scene selection

#### What function call it:
- HTML event handler via main.js window.updateBenchmarkSceneDropdown (HTML dropdown onchange)

#### What functions are used in it :
- (none)

### updateMasterIDList — Populates the master script-ID dropdown (desktop and mobile) with the unique keys across all loaded files, marking each with a completeness symbol and file count

#### What function call it:
- js/parser.js (refreshApplicationState, commitTextToRightFile)

#### What functions are used in it :
- (none)

### onSelectID — Event handler for script-ID selection: re-renders the comparison views and persists UI state

#### What function call it:
- HTML event handler via main.js window.onSelectID (HTML select onchange)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveUIStateToCache), js/parser.js (onSelectIDMobile)

### onSelectIDMobile — Event handler for mobile script-ID selection: syncs the main select element to the mobile selection and delegates to the standard ID handler

#### What function call it:
- HTML event handler via main.js window.onSelectIDMobile (HTML mobile select onchange)

#### What functions are used in it :
- js/parser.js (onSelectID)

### onCompareSelectionChange — Event handler for left/right file-selection change: re-renders the comparison views and persists UI state

#### What function call it:
- HTML event handler via main.js window.onCompareSelectionChange (HTML select onchange)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveUIStateToCache)

### renderComparisonViews — Renders the left (source) and right (target) comparison text areas for the selected script ID using the currently chosen left/right files

#### What function call it:
- js/parser.js (onSelectID, onCompareSelectionChange), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/parser.js (extractScriptText)

### updateScriptArrayFromLines — Updates an array of dialogue objects in place with translated/edited speaker names and serif texts from a flat lines array, using segment-based alignment.

#### What function call it:
- js/parser.js (commitTextToRightFile, saveEditsToMemory)

#### What functions are used in it :
- js/parser.js (assignSegment)

### assignSegment — Distributes a segment of dialogue lines to a matching segment of script objects.

#### What function call it:
- js/parser.js (updateScriptArrayFromLines)

#### What functions are used in it :
- (none)

### extractScriptText — Extracts the script text for a given key from a file data object, following the SCRIPTS.PART1.TRANSLATIONS/SCRIPT structure with array and JSON-stringification fallbacks

#### What function call it:
- js/parser.js (renderComparisonViews), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- (none)

### saveEditsToMemory — Saves manual edits from the left text area back into the corresponding script-ID entry of the selected file in the registry, then re-caches the registry

#### What function call it:
- HTML event handler via main.js window.saveEditsToMemory (HTML save button)

#### What functions are used in it :
- js/parser.js (saveFilesToCache, updateScriptArrayFromLines), js/ui.js (showError)

### commitTextToRightFile — Writes a line array into the selected script-ID entry of the target file registry object (creating the SCRIPTS/PART1/TRANSLATIONS structure if missing), then re-renders views, updates the ID list, and re-caches

#### What function call it:
- js/translator.js (translateViaAiServer)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveFilesToCache, updateMasterIDList, updateScriptArrayFromLines), js/parser.js (injectTranslationToRight)

### injectTranslationToRight — Takes the current right-hand text area content and commits it into the selected script-ID entry of the right-hand target file, creating the entry structure if missing

#### What function call it:
- HTML event handler via main.js window.injectTranslationToRight (HTML inject button)

#### What functions are used in it :
- js/parser.js (commitTextToRightFile), js/ui.js (showError)

### downloadFile — Generates a JSON Blob from the selected registry item and triggers a browser download of it as updated_<filename>

#### What function call it:
- HTML event handler via main.js window.downloadFile (HTML download button)

#### What functions are used in it :
- js/ui.js (showError)

---

## js/translator.js — Translation pipeline: stylization, name-plate resolution, and the main translation loop

Contains the stylization strip phase (stripLine, shouldStripNameBrackets, applyPriorityOverride), the 3-phase stylization map generator (generateStylizationMapWithAI), name-plate resolution (resolveNamePlate), the stop control, and the core sequential translation loop (translateViaAiServer). Re-exports all symbols from translator-presets.js and translator-llm.js.

### isValidMappingPair — Validates a candidate stylization mapping key/value pair, rejecting empty/oversized/numeric/sentence-like keys, single kana, common grammar particles, and empty or object values so only legitimate tick/punctuation patterns pass

#### What function call it:
- js/translator.js (parseMappingOutput)

#### What functions are used in it :
- (none)

### parseMappingOutput — Parses stylization mapping output from a model into key/value pairs (JSON, regex-extracted JSON, or line-by-line)

#### What function call it:
- js/translator.js (generateStylizationMapWithAI)

#### What functions are used in it :
- js/translator.js (isValidMappingPair)

### shouldStripNameBrackets — Decides whether 「」 brackets are stripped from name values during in-dialogue replacement (XOR of manual-step and mapper contexts)

#### What function call it:
- js/translator.js (stripLine)

#### What functions are used in it :
- (none)

### applyPriorityOverride — Applies the reserved __priorityOverride__ entries to source text FIRST (longest key first, globally), before the normal strip-phase replacement loop

#### What function call it:
- js/translator.js (stripLine, generateStylizationMapWithAI)

#### What functions are used in it :
- (none)

### stripLine — Strips heavy-stylization patterns from a line for AI input (with optional bracket stripping of name replacements), collecting the applied patterns for context

#### What function call it:
- js/translator.js (translateViaAiServer main loop, flushBuffer manual-step retranslate)

#### What functions are used in it :
- js/translator.js (applyPriorityOverride, shouldStripNameBrackets)

### generateStylizationMapWithAI — Analyzes source text to discover stutters/ticks/sounds/punctuation via a 3-phase AI analysis, populating state.pendingDiscoveredMappings; sets the active log loop to 'mapping' (via beginLoop), captures each phase prompt/response, and flushes to docs/logs/mapping/*.md + marks the session in its finally

#### What function call it:
- HTML event handler via main.js window.generateStylizationMapWithAI (HTML Generate Mapping button)

#### What functions are used in it :
- js/translator.js (applyPriorityOverride, parseMappingOutput), js/ui.js (clearError, renderDiscoveredMappingsUI, showError), js/logger.js (beginLoop, logAIInteraction, markSession, flushLoopToDisk)

### stopTranslation — Aborts the currently running translation by firing the active AbortController and flags it as user-initiated so the catch block surfaces a warning banner

#### What function call it:
- HTML event handler via main.js window.stopTranslation (HTML Stop button)

#### What functions are used in it :
- (none)

### resolveNamePlate — Resolves a <NAME_PLATE> line to a character name, using the known-names cache or translating via the model, optionally prompting the user, and merging the resolved name into the stylization map

#### What function call it:
- js/translator.js (translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/translator.js (translateChunkWithContext), js/ui-manual-step.js (promptUserForNameTranslation)

### makeSummaryStateAccessor — Builds an accessor object exposing gettable/settable archivalSummary, recentSummary, recentSummarySourceLines, and summarizedUpToIndex properties backed by the supplied getter/setter closures

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer)

#### What functions are used in it :
- (none)

### reconstructManualStepDisplayBlock — Reconstructs the displayed line block for a target unfiltered index from the right-hand output area, returning the matching slice or a fallback string

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer manual-step continue path)

#### What functions are used in it :
- (none)

### flattenTranslatedLines — Flattens an array of translated lines by splitting any entries containing embedded newlines into individual lines

#### What function call it:
- js/translator.js (translateViaAiServer final flatten step)

#### What functions are used in it :
- (none)

### translateViaAiServer — Drives the AI-server translation run: reads host/model and manual-override context settings, then translates the selected script lines through the configured preset and validation gate

#### What function call it:
- HTML event handler via main.js window.translateViaAiServer (HTML Translate button)

#### What functions are used in it :
- js/translator.js (flushBuffer, stripLine, resolveNamePlate, makeSummaryStateAccessor, reconstructManualStepDisplayBlock, flattenTranslatedLines), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep, setCurrentSourceLine, hideCurrentSourceLine), js/ui.js (clearError, showError), js/parser.js (commitTextToRightFile), js/logger.js (beginLoop, markSession, flushLoopToDisk)

### flushBuffer — Flushes the accumulated dialogue buffer through translateChunkWithContext, handles manual-step checkpoints, pushes result into history with speaker prefix (nested helper in translateViaAiServer)

#### What function call it:
- js/translator.js (translateViaAiServer main loop)

#### What functions are used in it :
- js/translator.js (stripLine, makeSummaryStateAccessor, reconstructManualStepDisplayBlock), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep)

---

## js/translator-presets.js — Operation preset definitions and default-preset JSON loaders

Defines the operationPresets dictionary (temperature + systemPrompt per operation tier), the defaultPresetManifest (shipped JSON files), and the loaders that apply presets from file uploads or shipped defaults. translator.js re-exports all symbols.

### mapPresetJsonQuiet — Maps a preset JSON object into the operationPresets config for an operation key (resolving temperature/systemPrompt, including operation.fields) without updating any UI display

#### What function call it:
- js/translator-presets.js (loadAllDefaultPresets)

#### What functions are used in it :
- (none)

### mapPresetJson — Maps a preset JSON object into the operationPresets config for an operation key (resolving temperature/systemPrompt, including operation.fields) and updates the preset file-input display label with the loaded file's name

#### What function call it:
- js/translator-presets.js (loadSpecificPreset, loadDefaultPreset)

#### What functions are used in it :
- js/ui.js (showError)

### loadSpecificPreset — Loads and applies a user-uploaded preset JSON file for a specified operation type via FileReader and mapPresetJson

#### What function call it:
- HTML event handler via main.js window.loadSpecificPreset (HTML file-upload onchange), js/ui.js (renderDistinctPresetControls via global window.loadSpecificPreset)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### loadDefaultPreset — Fetches and applies the registered default preset JSON file for an operation key from default_presets/, reporting an error if the fetch fails (requires HTTP serving)

#### What function call it:
- HTML event handler via main.js window.loadDefaultPreset (HTML default-preset button)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### loadAllDefaultPresets — Fetches and applies all registered default preset files via Promise.allSettled, using the quiet mapper and reporting a warning if some or all presets fail to load

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJsonQuiet)

### updatePresetDisplayText — Updates the preset file-input display label to show the loaded file's name, locating the matching display element by data-operation-key

#### What function call it:
- js/translator-presets.js (mapPresetJson)

#### What functions are used in it :
- (none)

---

## js/translator-llm.js — LLM HTTP helpers: model discovery, text cleaning, tiered summarization, validation, and chunk translation

Contains the AI server model-list fetcher, text-wrapping and output-cleaning helpers, the tiered summarization engine (recent + archival), the romaji-fragment detector, the AI quality validator, the context-leak detector, the chunk translator with retry logic, and the tiered context-window builder. translator.js re-exports all symbols.

### fetchAiModels — Queries available local AI-server model endpoints (OpenAI-compatible variants across LM Studio, Ollama, llama.cpp) and populates the model-selection dropdown, falling back across endpoints

#### What function call it:
- js/main.js (DOMContentLoaded, window.fetchAiModels wiring)

#### What functions are used in it :
- js/ui.js (clearError, showError)

### wrapTextToLines — Wraps a string of text into an array of lines, each bounded by a maximum character length, splitting on any whitespace so embedded newlines are handled correctly

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer)

#### What functions are used in it :
- (none)

### cleanModelOutput — Cleans raw LLM translation output by stripping conversational filler, explanation prefixes, code-block formatting, and surrounding quotes, returning the first non-empty line

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### cleanSummaryOutput — Cleans raw LLM summary output by stripping preamble words, role labels (Task/Rules), and surrounding quotes, joining the remaining lines into one string

#### What function call it:
- js/translator-llm.js (updateRecentSummary, updateArchivalSummary)

#### What functions are used in it :
- (none)

### updateRecentSummary — Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines, focusing on active characters, their tone/relationship, and the current action or discussion topic

#### What function call it:
- js/translator-llm.js (buildTieredContextWindow, summarizeOldContext)

#### What functions are used in it :
- js/translator-llm.js (cleanSummaryOutput), js/logger.js (logAIInteraction)

### updateArchivalSummary — Updates the Tier 3 archival summary (summary-of-summaries) by compressing an overflowing scene recap into a single sentence, preserving macro story state and key relationships when an archival summary already exists

#### What function call it:
- js/translator-llm.js (buildTieredContextWindow)

#### What functions are used in it :
- js/translator-llm.js (cleanSummaryOutput)

### summarizeOldContext — Summarizes older dialogue context lines into a single sentence by delegating to updateRecentSummary with an empty prior summary (backwards-compat wrapper)

#### What function call it:
- js/translator.js (legacy callers)

#### What functions are used in it :
- js/translator-llm.js (updateRecentSummary)

### detectRomajiFragment — Detects leftover Japanese romaji fragments in an otherwise-English translation using a curated word-boundary match list; returns the first matched fragment, or null if none found

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### assessTranslationQualityWithAI — Assesses the quality of a Japanese-to-English translation via a stringent QA prompt; returns true (pass) unless a clean standalone FAIL verdict is emitted, failing open on HTTP error so deterministic checks remain the gate

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- js/logger.js (logAIInteraction)

### detectContextLeak — Detects whether a prior context line leaked into the translation output using an exact-substring check and a sliding 30-char window match (step 5); returns {leaked, leakedLine}

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### translateChunkWithContext — Translates a text chunk with prior history context using the configured preset, running a multi-check validation gate (Japanese chars, romaji fragment, context leak, AI validator) with retry logic that degrades the AI verdict to advisory after 3 attempts so a flaky small model cannot stall; accepts an optional sourceText (the original line before strip/mapping) threaded to every logAIInteraction call

#### What function call it:
- js/translator.js (translateViaAiServer, flushBuffer, resolveNamePlate), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/translator-llm.js (assessTranslationQualityWithAI, cleanModelOutput, detectContextLeak, detectRomajiFragment), js/logger.js (logAIInteraction)

### buildTieredContextWindow — Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the production translation pipeline and the benchmark sweep, mutating and returning the summaryState object in place, with the final window capped to maxContextLines entries

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer), js/benchmark.js (runParameterSweepBenchmark), js/ui-manual-step.js (refreshStepContextPreview)

#### What functions are used in it :
- js/translator-llm.js (updateArchivalSummary, updateRecentSummary)

---

## js/ui.js — Debug modal, stylization-map CRUD, and notification banner (error/success/warning)

Manages the debug modal (open/close/page switching), the stylization map editor (save, order, commit discovered mappings, delete, copy), the discovered-mappings review UI, and the notification banner (showError red / showSuccess green / showWarning yellow, all sharing #errorBanner). Re-exports symbols from ui-manual-step.js and ui-layout.js.

### showError — Displays an error banner with the given message and logs it to the console

#### What function call it:
- js/parser.js (loadFiles, saveEditsToMemory, downloadFile, injectTranslationToRight), js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels), js/translator-presets.js (loadSpecificPreset, loadDefaultPreset), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/ui.js (setBanner)

### showSuccess — Displays a success banner with the given message and logs it to the console

#### What function call it:
- js/parser.js (saveEditsToMemory)

#### What functions are used in it :
- js/ui.js (setBanner)

### showWarning — Displays a warning banner with the given message and logs it to the console

#### What function call it:
- js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/ui.js (setBanner)

### setBanner — Displays the error/success/warning banner with a variant class, label, and message

#### What function call it:
- js/ui.js (showError, showSuccess, showWarning)

#### What functions are used in it :
- (none)

### clearError — Hides and clears the error/success/warning banner

#### What function call it:
- js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels)

#### What functions are used in it :
- (none)

### renderDistinctPresetControls — Renders one file-input row per registered default preset into the distinct-presets container, wiring each to its loadSpecificPreset handler

#### What function call it:
- js/ui.js (openDebugMenu)

#### What functions are used in it :
- js/translator-presets.js (loadSpecificPreset via global window.loadSpecificPreset)

### openDebugMenu — Opens the debug modal: resets to page 1, syncs all debug inputs from state, renders the preset controls and discovered mappings, and disables the Save Map button

#### What function call it:
- HTML event handler via main.js window.openDebugMenu (HTML Debug button)

#### What functions are used in it :
- js/ui.js (updateDebugPageDisplay, renderDistinctPresetControls, renderDiscoveredMappingsUI, setSaveMapButtonEnabled, initStylizationMapEditorSaveActivation)

### switchDebugPage — Moves the debug modal's current page by a direction delta, clamped to pages 1-2, and updates the page display

#### What function call it:
- HTML event handler via main.js window.switchDebugPage (HTML prev/next buttons)

#### What functions are used in it :
- js/ui.js (updateDebugPageDisplay)

### updateDebugPageDisplay — Shows/hides debug page 1 vs page 2 and updates the title and prev/next button visibility based on the current page

#### What function call it:
- js/ui.js (openDebugMenu, switchDebugPage)

#### What functions are used in it :
- (none)

### closeDebugMenu — Saves all debug-modal settings (limits, flags, stylization map) into state, parses and reorders the map, closes the overlay, and persists UI state to cache

#### What function call it:
- HTML event handler via main.js window.closeDebugMenu (HTML Save & Close button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, saveUIStateToCache, showError), js/ui-manual-step.js (syncManualStepUIVisibility)

### closeDebugMenuWithoutSaving — Closes the debug modal overlay without persisting any settings changes

#### What function call it:
- HTML event handler via main.js window.closeDebugMenuWithoutSaving (HTML Cancel button)

#### What functions are used in it :
- (none)

### saveStylizationMapFromView — Parses the stylization-map editor textarea, reorders it into state, refreshes the editor, persists to cache, and disables the Save Map button

#### What function call it:
- HTML event handler via main.js window.saveStylizationMapFromView (HTML Save Map button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, saveUIStateToCache, setSaveMapButtonEnabled, showError)

### setSaveMapButtonEnabled — Enables or disables the Save Map button and toggles its grayed-out style

#### What function call it:
- js/ui.js (saveStylizationMapFromView, openDebugMenu, initStylizationMapEditorSaveActivation), js/translator.js (generateStylizationMapWithAI)

#### What functions are used in it :
- (none)

### initStylizationMapEditorSaveActivation — Wires the stylization-map editor textarea to reactivate the Save Map button on input (idempotent)

#### What function call it:
- js/ui.js (openDebugMenu)

#### What functions are used in it :
- js/ui.js (setSaveMapButtonEnabled)

### renderDiscoveredMappingsUI — Renders the pending discovered stylization mappings as editable checkbox rows with Select All/Deselect All controls

#### What function call it:
- js/translator.js (generateStylizationMapWithAI), js/ui.js (openDebugMenu, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, setAllDiscoveredSelection)

#### What functions are used in it :
- js/ui.js (setAllDiscoveredSelection, toggleDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal)

### toggleDiscoveredSelection — Toggles the selected state of a pending discovered mapping at the given index

#### What function call it:
- HTML event handler via main.js window.toggleDiscoveredSelection (HTML checkbox onchange)

#### What functions are used in it :
- (none)

### setAllDiscoveredSelection — Sets the selected state of every pending discovered mapping and re-renders the list

#### What function call it:
- HTML event handler via main.js window.setAllDiscoveredSelection (HTML Select/Deselect All buttons)

#### What functions are used in it :
- js/ui.js (renderDiscoveredMappingsUI)

### updateDiscoveredKey — Updates the key string of a pending discovered mapping entry

#### What function call it:
- HTML event handler via main.js window.updateDiscoveredKey (HTML input oninput)

#### What functions are used in it :
- (none)

### updateDiscoveredVal — Updates the value string of a pending discovered mapping entry

#### What function call it:
- HTML event handler via main.js window.updateDiscoveredVal (HTML input oninput)

#### What functions are used in it :
- (none)

### orderStylizationMap — Reorders a stylization map so longer keys come first (so longer patterns match before their substrings) while preserving the reserved __priorityOverride__ entry

#### What function call it:
- js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap)

#### What functions are used in it :
- (none)

### commitApprovedMappingsToMap — Adds all selected discovered mappings into the stylization map (skipping the reserved __priorityOverride__ key and empty entries), reorders it, refreshes the editor, and disables the Save Map button

#### What function call it:
- HTML event handler via main.js window.commitApprovedMappingsToMap (HTML Add Selected button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, renderDiscoveredMappingsUI, saveUIStateToCache, showError)

### deleteSelectedDiscoveredMappings — Deletes selected items from the pending discovered mappings list

#### What function call it:
- HTML event handler via main.js window.deleteSelectedDiscoveredMappings (HTML Delete Selected button)

#### What functions are used in it :
- js/ui.js (renderDiscoveredMappingsUI, showError)

### copyStylizationMapToClipboard — Copies the stylization-map editor text to the clipboard, reporting an error on failure

#### What function call it:
- HTML event handler via main.js window.copyStylizationMapToClipboard (HTML Copy button)

#### What functions are used in it :
- js/ui.js (showError)

---

## js/ui-manual-step.js — Name-plate and manual step-by-step override modals

Contains the name-plate translation modal, the manual-step toolbar (continue/retranslate/apply), the live context-preview recompute, the bracket-strip toggle sync, and the source-line display. ui.js re-exports all symbols.

### promptUserForNameTranslation — Displays a modal prompt to review or modify a character name translation, returning a promise that resolves to the user-approved name; auto-skips the modal (resolving to the AI translation) when state.autoSkipNameModal is set and rejects on user abort

#### What function call it:
- js/translator.js (resolveNamePlate)

#### What functions are used in it :
- (none)

### resolveNameModal — Resolves the active name-translation modal promise with the user's input value and clears the resolver

#### What function call it:
- HTML event handler via main.js window.resolveNameModal (HTML Confirm button)

#### What functions are used in it :
- (none)

### closeNameModal — Closes the name-translation modal and resolves its promise with an empty fallback value, clearing the resolver

#### What function call it:
- HTML event handler via main.js window.closeNameModal (HTML Cancel button)

#### What functions are used in it :
- (none)

### refreshStepContextPreview — Recomputes the context-preview dropdown from the stored full history and current step settings by replaying the history through buildTieredContextWindow so the manual-override preview reflects the actual production state; returns the recomputed summaryState

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep, applyStepContextSettings, handleContextLinesChange)

#### What functions are used in it :
- js/translator-llm.js (buildTieredContextWindow)

### syncManualStepUIVisibility — Synchronizes the visibility of the manual-step override toolbar and the source-pane label/actions based on whether manual step-by-step mode is enabled; the current source-line box stays permanently visible regardless of mode

#### What function call it:
- js/ui.js (closeDebugMenu, syncManualStepModeLive), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- (none)

### syncManualStepModeLive — Toggles manual step-by-step mode live when the debug-modal checkbox changes, updating visibility and persisting UI state

#### What function call it:
- HTML event handler via main.js window.syncManualStepModeLive (HTML checkbox onchange)

#### What functions are used in it :
- js/ui-manual-step.js (syncManualStepUIVisibility), js/database.js (saveUIStateToCache)

### syncBracketStripToggles — Reads both bracket-strip checkboxes into state live so the strip-phase XOR decision reflects the current UI without needing to close the debug menu

#### What function call it:
- HTML event handler via main.js window.syncBracketStripToggles (HTML checkbox onchange)

#### What functions are used in it :
- (none)

### setCurrentSourceLine — Shows the current source line being translated in the permanently visible element

#### What function call it:
- js/translator.js (translateViaAiServer main loop)

#### What functions are used in it :
- (none)

### hideCurrentSourceLine — Clears the source-line text when translation ends so the placeholder shows; the element itself stays visible

#### What function call it:
- js/translator.js (translateViaAiServer completion)

#### What functions are used in it :
- (none)

### handleContextLinesChange — Handles a context-lines input change as a destructive recompute that confirms before applying (it recomputes summaries and the context window), restoring the old value if the user cancels

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep input listener)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### handleRawLinesChange — Handles a raw-lines input change by reshaping the raw-tail display directly to show the most recent rawLimit history lines, with no summary recalculation

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep input listener)

#### What functions are used in it :
- (none)

### promptUserForManualStep — Opens the manual-step toolbar for step-by-step translation evaluation and editing, storing the full history and summary context on state so the preview can recompute live, syncing the override inputs, and resolving with the chosen action (continue/retranslate) plus any manual summary edits

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer manual-step loop)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### resolveManualStepContinue — Resolves the manual-step prompt with a continue action, capturing the current context/raw input values and any manual summary-box edits

#### What function call it:
- HTML event handler via main.js window.resolveManualStepContinue (HTML Continue button)

#### What functions are used in it :
- js/ui-manual-step.js (readManualSummaryEdits)

### applyStepContextSettings — Applies the manual-override context/raw values to shared state and recomputes summaries from history, storing the resulting summary state so a subsequent retranslate reuses it instead of triggering a fresh recalc

#### What function call it:
- HTML event handler via main.js window.applyStepContextSettings (HTML Apply button)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### triggerStepRetranslation — Resolves the manual-step prompt with a retranslate action, capturing the current context/raw input values and any manual summary-box edits so they update the internal summary variables before the retranslate rebuilds the context window

#### What function call it:
- HTML event handler via main.js window.triggerStepRetranslation (HTML Retranslate button)

#### What functions are used in it :
- js/ui-manual-step.js (readManualSummaryEdits)

### readManualSummaryEdits — Reads the current (possibly user-edited) archival and recent summary boxes, returning null when neither box exists so callers can skip writing anything back

#### What function call it:
- js/ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)

#### What functions are used in it :
- (none)

---

## js/ui-layout.js — Pure DOM layout helpers: modal drag, pane/column/row resize, auto-number inputs

Contains the debug modal drag handler, the generic column/row resizers, the footer sync, the pane resizer initializer, and the auto-resizing number input initializer. No translation or state logic. ui.js re-exports all symbols.

### initDraggableModal — Initializes mouse drag-and-drop for the floating debug modal by wiring mousedown/mousemove/mouseup listeners on the modal header so the modal can be repositioned by dragging its title bar

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (onMouseMove, onMouseUp)

### onMouseMove — Moves the modal to follow the cursor during an active drag (nested helper in initDraggableModal)

#### What function call it:
- js/ui-layout.js (initDraggableModal via document mousemove listener)

#### What functions are used in it :
- (none)

### onMouseUp — Stops the modal drag and detaches the mousemove/mouseup listeners on mouseup (nested helper in initDraggableModal)

#### What function call it:
- js/ui-layout.js (initDraggableModal via document mouseup listener)

#### What functions are used in it :
- (none)

### initColResizer — Creates a column (horizontal) drag resizer between two elements

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### initRowResizer — Creates a row (vertical) drag resizer between two sibling elements

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### syncFooter — Syncs the external footer row alignment with the sidebar and pane widths

#### What function call it:
- js/ui-layout.js (initPaneResizer via onResize callback + window resize listener)

#### What functions are used in it :
- (none)

### initPaneResizer — Initializes all draggable resize handles (sidebar column, source-pane column, and the two manual-step context rows) and aligns the footer on initial load and on window resize

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (initColResizer, initRowResizer)

### initAutoNumberInputs — Makes elements with class .auto-number-input dynamically resize to fit their value by setting a calc(<ch> + 16px) width on input and change events

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (resize)

### resize — Sets a calc width based on the input value length (nested helper in initAutoNumberInputs)

#### What function call it:
- js/ui-layout.js (initAutoNumberInputs)

#### What functions are used in it :
- (none)

### _initColResizer — Generic helper: creates a column (horizontal) drag resizer between two elements, computing a width percentage from the cursor position clamped to [minPct, maxPct] and applying it to both elements, then firing the optional onResize callback

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### _initRowResizer — Generic helper: creates a row (vertical) drag resizer between two sibling elements, computing new top/bottom heights from the cursor delta clamped to a 30px minimum

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### _syncFooter — Syncs the external footer row alignment with the sidebar and pane widths, applying a left padding equal to sidebar + handle width and mirroring pane column widths so the footer actions line up under the source panes after a resize

#### What function call it:
- js/ui-layout.js (initPaneResizer via the onResize callback and the window resize listener)

#### What functions are used in it :
- (none)

---

## js/benchmark.js — Multi-dimensional parameter sweep benchmark with chunked grading

Runs a context-lines × raw-limits sweep matrix, translates each cell via the production pipeline, grades each chunk independently via the AI auditor, and averages the scores into a per-cell report.

### runParameterSweepBenchmark — Runs the multi-dimensional parameter sweep matrix using an AbortController for silent abort, logging evaluation feedback and scores per cell

#### What function call it:
- HTML event handler via main.js window.runParameterSweepBenchmark (HTML Run Benchmark button)

#### What functions are used in it :
- js/benchmark.js (gradeTranslatedChunks), js/translator.js (resolveNamePlate), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext), js/parser.js (extractScriptText), js/ui.js (showError, showWarning), js/logger.js (beginLoop, markSession, flushLoopToDisk)

### gradeTranslatedChunks — Splits translated lines into fixed-size chunks, grades each via the auditor, averages the per-chunk scores into one cell score; checks the abort signal between chunks and forwards it to the grader

#### What function call it:
- js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/benchmark.js (gradeCandidateAgent)

### gradeCandidateAgent — Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender, semantic, and flow criteria, forwarding the abort signal to fetch

#### What function call it:
- js/benchmark.js (gradeTranslatedChunks)

#### What functions are used in it :
- js/logger.js (logAIInteraction)
