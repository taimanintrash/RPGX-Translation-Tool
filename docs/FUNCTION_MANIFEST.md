# Function Manifest

This document describes every JavaScript module in the RPGX Translation Tool, the functions it exports/contains, and the static call graph between them.

**File load order:** `index.html` loads only `js/main.js` as `<script type="module">`. Every other file is reached via ES module imports. `main.js` imports from `database.js`, `ui.js`, `parser.js`, `translator.js`, and `benchmark.js`. `translator.js` re-exports symbols from `translator-presets.js` and `translator-llm.js`. `ui.js` re-exports symbols from `ui-manual-step.js` and `ui-layout.js`.

**HTML event handlers:** Functions wired to `window.*` in `main.js` are invoked by inline `onclick`/`onchange` attributes in `index.html`. These are noted as "Called by: HTML event handler (via main.js window.* wiring)".

---

## Script files: js/main.js — Application entry point, shared state, theme toggle, and window.* wiring

Exports the central `state` object (imported by every other module), wires all module functions to `window.*` for HTML event handlers, restores cached UI state on DOMContentLoaded, and provides the light/dark theme toggle.

### Functions in the file: applyTheme — Applies the given theme ('light' or 'dark') to the document root and updates the toggle button label

#### What files use the function:
- Separated by file: js/main.js (toggleTheme, DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/main.js (recolorScriptSelectOptions)

### Functions in the file: recolorScriptSelectOptions — Re-applies inline status colors to script-select options after a theme change (native option elements can't be restyled via CSS classes)

#### What files use the function:
- Separated by file: js/main.js (applyTheme)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: toggleTheme — Toggles between light and dark themes and persists the choice to localStorage

#### What files use the function:
- Separated by file: HTML event handler via main.js window.toggleTheme (theme toggle button)

#### What files the function is used in:
- Separated by file: js/main.js (applyTheme)

---

## Script files: js/database.js — IndexedDB persistence layer for cached files and UI state

Provides open/put/get operations for the IndexedDB cache storing the file registry and UI settings.

### Functions in the file: openDatabase — Opens (or creates) the IndexedDB database and object store

#### What files use the function:
- Separated by file: js/database.js (saveFilesToCache, loadFilesFromCache, saveUIStateToCache, loadUIStateFromCache)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: saveFilesToCache — Persists the loaded file registry to IndexedDB

#### What files use the function:
- Separated by file: js/parser.js (checkFinishedReads, removeFile, saveEditsToMemory, commitTextToRightFile)

#### What files the function is used in:
- Separated by file: js/database.js (openDatabase)

### Functions in the file: loadFilesFromCache — Retrieves the cached file registry from IndexedDB

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/database.js (openDatabase)

### Functions in the file: saveUIStateToCache — Persists the current UI settings (dropdowns, debug flags, stylization map, bracket toggles) to IndexedDB

#### What files use the function:
- Separated by file: js/parser.js (onSelectID, onCompareSelectionChange), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap), js/ui-manual-step.js (syncManualStepModeLive)

#### What files the function is used in:
- Separated by file: js/database.js (openDatabase)

### Functions in the file: loadUIStateFromCache — Retrieves cached UI state settings from IndexedDB

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/database.js (openDatabase)

---

## Script files: js/parser.js — File/script registry, dropdown population, and comparison view rendering

Manages loading JSON script files into the registry, parsing content, populating file/script/master-ID dropdowns, rendering comparison views, and committing translated text back to the right-hand file.

### Functions in the file: loadFiles — Loads one or more JSON files from a file input into the registry

#### What files use the function:
- Separated by file: HTML event handler via main.js window.loadFiles (HTML file input)

#### What files the function is used in:
- Separated by file: js/parser.js (checkFinishedReads, parseContentToJSON), js/ui.js (showError)

### Functions in the file: checkFinishedReads — Processes completed FileReader reads, parses each, and refreshes application state

#### What files use the function:
- Separated by file: js/parser.js (loadFiles)

#### What files the function is used in:
- Separated by file: js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache)

### Functions in the file: removeFile — Removes a file from the registry by name and refreshes state

#### What files use the function:
- Separated by file: HTML event handler via main.js window.removeFiles (HTML remove button)

#### What files the function is used in:
- Separated by file: js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache), js/parser.js (updateFileListUI)

### Functions in the file: parseContentToJSON — Parses raw file content into JSON, with regex-extraction fallback

#### What files use the function:
- Separated by file: js/parser.js (loadFiles)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: refreshApplicationState — Refreshes all core UI elements: file lists, dropdowns, and comparison views

#### What files use the function:
- Separated by file: js/parser.js (checkFinishedReads, removeFile), js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/parser.js (renderComparisonViews, updateBenchmarkFileDropdown, updateFileDropdowns, updateFileListUI, updateMasterIDList)

### Functions in the file: updateFileListUI — Renders the file list in the sidebar

#### What files use the function:
- Separated by file: js/parser.js (refreshApplicationState)

#### What files the function is used in:
- Separated by file: js/parser.js (removeFile)

### Functions in the file: updateFileDropdowns — Populates the left/right file selection dropdowns

#### What files use the function:
- Separated by file: js/parser.js (refreshApplicationState)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: updateBenchmarkFileDropdown — Populates the benchmark reference file dropdown

#### What files use the function:
- Separated by file: js/parser.js (refreshApplicationState)

#### What files the function is used in:
- Separated by file: js/parser.js (updateBenchmarkSceneDropdown)

### Functions in the file: updateBenchmarkSceneDropdown — Populates the benchmark reference scene dropdown based on the selected file

#### What files use the function:
- Separated by file: HTML event handler via main.js window.updateBenchmarkSceneDropdown (HTML dropdown onchange)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: updateMasterIDList — Populates the master script ID list from all loaded files

#### What files use the function:
- Separated by file: js/parser.js (refreshApplicationState, commitTextToRightFile)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: onSelectID — Handles script selection change, renders comparison views, saves UI state

#### What files use the function:
- Separated by file: HTML event handler via main.js window.onSelectID (HTML select onchange)

#### What files the function is used in:
- Separated by file: js/parser.js (renderComparisonViews, saveUIStateToCache), js/parser.js (onSelectIDMobile)

### Functions in the file: onSelectIDMobile — Syncs the mobile select element with the main select and triggers the standard update

#### What files use the function:
- Separated by file: HTML event handler via main.js window.onSelectIDMobile (HTML mobile select onchange)

#### What files the function is used in:
- Separated by file: js/parser.js (onSelectID)

### Functions in the file: onCompareSelectionChange — Handles left/right file selection comparison change, renders views, saves UI state

#### What files use the function:
- Separated by file: HTML event handler via main.js window.onCompareSelectionChange (HTML select onchange)

#### What files the function is used in:
- Separated by file: js/parser.js (renderComparisonViews, saveUIStateToCache)

### Functions in the file: renderComparisonViews — Renders the left (source) and right (translated) comparison text areas

#### What files use the function:
- Separated by file: js/parser.js (onSelectID, onCompareSelectionChange), js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/parser.js (extractScriptText)

### Functions in the file: extractScriptText — Extracts the script text for a given key from a file data object

#### What files use the function:
- Separated by file: js/parser.js (renderComparisonViews), js/benchmark.js (runParameterSweepBenchmark)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: saveEditsToMemory — Saves manual edits from the left text area back into the file registry in memory

#### What files use the function:
- Separated by file: HTML event handler via main.js window.saveEditsToMemory (HTML save button)

#### What files the function is used in:
- Separated by file: js/parser.js (saveFilesToCache), js/ui.js (showError)

### Functions in the file: commitTextToRightFile — Commits translated text to the right-hand file object and updates the master ID list

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer)

#### What files the function is used in:
- Separated by file: js/parser.js (renderComparisonViews, saveFilesToCache, updateMasterIDList), js/parser.js (injectTranslationToRight)

### Functions in the file: injectTranslationToRight — Injects the current right-hand text into the target file

#### What files use the function:
- Separated by file: HTML event handler via main.js window.injectTranslationToRight (HTML inject button)

#### What files the function is used in:
- Separated by file: js/parser.js (commitTextToRightFile), js/ui.js (showError)

### Functions in the file: downloadFile — Downloads a file from the registry as a blob

#### What files use the function:
- Separated by file: HTML event handler via main.js window.downloadFile (HTML download button)

#### What files the function is used in:
- Separated by file: js/ui.js (showError)

---

## Script files: js/translator.js — Translation pipeline: stylization, name-plate resolution, and the main translation loop

Contains the stylization strip phase (stripLine, shouldStripNameBrackets, applyPriorityOverride), the 3-phase stylization map generator (generateStylizationMapWithAI), name-plate resolution (resolveNamePlate), the stop control, and the core sequential translation loop (translateViaAiServer). Re-exports all symbols from translator-presets.js and translator-llm.js.

### Functions in the file: isValidMappingPair — Validates a key/value pair from a stylization mapping output (rejects empty keys, sentences, single kana, pure ASCII, etc.)

#### What files use the function:
- Separated by file: js/translator.js (parseMappingOutput)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: parseMappingOutput — Parses stylization mapping output from a model into key/value pairs (JSON, regex-extracted JSON, or line-by-line)

#### What files use the function:
- Separated by file: js/translator.js (generateStylizationMapWithAI)

#### What files the function is used in:
- Separated by file: js/translator.js (isValidMappingPair)

### Functions in the file: shouldStripNameBrackets — Decides whether 「」 brackets are stripped from name values during in-dialogue replacement (XOR of manual-step and mapper contexts)

#### What files use the function:
- Separated by file: js/translator.js (stripLine)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: applyPriorityOverride — Applies the reserved __priorityOverride__ entries to source text FIRST (longest key first, globally), before the normal strip-phase replacement loop

#### What files use the function:
- Separated by file: js/translator.js (stripLine, generateStylizationMapWithAI)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: stripLine — Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer main loop, flushBuffer manual-step retranslate)

#### What files the function is used in:
- Separated by file: js/translator.js (applyPriorityOverride, shouldStripNameBrackets)

### Functions in the file: generateStylizationMapWithAI — Analyzes source text to discover stutters/ticks/sounds/punctuation via a 3-phase AI analysis, populating state.pendingDiscoveredMappings

#### What files use the function:
- Separated by file: HTML event handler via main.js window.generateStylizationMapWithAI (HTML Generate Mapping button)

#### What files the function is used in:
- Separated by file: js/translator.js (applyPriorityOverride, parseMappingOutput), js/ui.js (clearError, renderDiscoveredMappingsUI, showError)

### Functions in the file: stopTranslation — Aborts ongoing translation or generation via the active AbortController

#### What files use the function:
- Separated by file: HTML event handler via main.js window.stopTranslation (HTML Stop button)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: resolveNamePlate — Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name; merges JP->EN name into the stylization map

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)

#### What files the function is used in:
- Separated by file: js/translator.js (translateChunkWithContext), js/ui-manual-step.js (promptUserForNameTranslation)

### Functions in the file: makeSummaryStateAccessor — Builds a getter/setter accessor object that lets buildTieredContextWindow mutate flushBuffer-scoped summary variables in place

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer flushBuffer)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: reconstructManualStepDisplayBlock — Reconstructs the manual-step display block for a target translatedLines entry by replaying the filter+join display order

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer flushBuffer manual-step continue path)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: flattenTranslatedLines — Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer final flatten step)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: translateViaAiServer — Core sequential translation loop: buffers dialogue, strips stylization, resolves name plates, translates via translateChunkWithContext, handles manual-step checkpoints, commits to file

#### What files use the function:
- Separated by file: HTML event handler via main.js window.translateViaAiServer (HTML Translate button)

#### What files the function is used in:
- Separated by file: js/translator.js (flushBuffer, stripLine, resolveNamePlate, makeSummaryStateAccessor, reconstructManualStepDisplayBlock, flattenTranslatedLines), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep, setCurrentSourceLine, hideCurrentSourceLine), js/ui.js (clearError, showError), js/parser.js (commitTextToRightFile)

### Functions in the file: flushBuffer (nested in translateViaAiServer) — Flushes the accumulated dialogue buffer through translateChunkWithContext, handles manual-step checkpoints, pushes result into history with speaker prefix

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer main loop)

#### What files the function is used in:
- Separated by file: js/translator.js (stripLine, makeSummaryStateAccessor, reconstructManualStepDisplayBlock), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep)

---

## Script files: js/translator-presets.js — Operation preset definitions and default-preset JSON loaders

Defines the operationPresets dictionary (temperature + systemPrompt per operation tier), the defaultPresetManifest (shipped JSON files), and the loaders that apply presets from file uploads or shipped defaults. translator.js re-exports all symbols.

### Functions in the file: mapPresetJsonQuiet — Maps a parsed preset JSON onto an operation config, logging (not error-bannering) the result; used by the silent default loader

#### What files use the function:
- Separated by file: js/translator-presets.js (loadAllDefaultPresets)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: mapPresetJson — Maps a parsed preset JSON onto an operation config, then surfaces a success banner; used by the interactive upload path

#### What files use the function:
- Separated by file: js/translator-presets.js (loadSpecificPreset, loadDefaultPreset)

#### What files the function is used in:
- Separated by file: js/ui.js (showError)

### Functions in the file: loadSpecificPreset — Loads and maps preset config from an uploaded JSON file for a specified operation

#### What files use the function:
- Separated by file: HTML event handler via main.js window.loadSpecificPreset (HTML file-upload onchange), js/ui.js (renderDistinctPresetControls via global window.loadSpecificPreset)

#### What files the function is used in:
- Separated by file: js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### Functions in the file: loadDefaultPreset — Fetches a shipped default preset JSON from default_presets/ and applies it to the matching operation

#### What files use the function:
- Separated by file: HTML event handler via main.js window.loadDefaultPreset (HTML default-preset button)

#### What files the function is used in:
- Separated by file: js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### Functions in the file: loadAllDefaultPresets — Loads every shipped default preset from default_presets/ into operationPresets on startup

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/translator-presets.js (mapPresetJsonQuiet)

---

## Script files: js/translator-llm.js — LLM HTTP helpers: model discovery, text cleaning, tiered summarization, validation, and chunk translation

Contains the AI server model-list fetcher, text-wrapping and output-cleaning helpers, the tiered summarization engine (recent + archival), the romaji-fragment detector, the AI quality validator, the context-leak detector, the chunk translator with retry logic, and the tiered context-window builder. translator.js re-exports all symbols.

### Functions in the file: fetchAiModels — Queries available local AI Server model endpoints and populates the model selection dropdown

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded, window.fetchAiModels wiring)

#### What files the function is used in:
- Separated by file: js/ui.js (clearError, showError)

### Functions in the file: wrapTextToLines — Wraps a string of text into an array of lines bounded by a max character length

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer flushBuffer)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: cleanModelOutput — Cleans raw LLM outputs by stripping conversational filler, prefixes, code blocks, and surrounding quotes

#### What files use the function:
- Separated by file: js/translator-llm.js (translateChunkWithContext)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: cleanSummaryOutput — Cleans raw LLM summary outputs by stripping preamble, role labels, and surrounding quotes

#### What files use the function:
- Separated by file: js/translator-llm.js (updateRecentSummary, updateArchivalSummary)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: updateRecentSummary — Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines

#### What files use the function:
- Separated by file: js/translator-llm.js (buildTieredContextWindow, summarizeOldContext)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (cleanSummaryOutput)

### Functions in the file: updateArchivalSummary — Updates the Tier 3 archival summary by compressing an overflowing scene recap

#### What files use the function:
- Separated by file: js/translator-llm.js (buildTieredContextWindow)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (cleanSummaryOutput)

### Functions in the file: summarizeOldContext — Summarizes older dialogue context lines into a single sentence (backwards-compat wrapper around updateRecentSummary)

#### What files use the function:
- Separated by file: js/translator.js (legacy callers)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (updateRecentSummary)

### Functions in the file: detectRomajiFragment — Detects leftover Japanese romaji fragments in an English translation; returns the first match or null

#### What files use the function:
- Separated by file: js/translator-llm.js (translateChunkWithContext)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: assessTranslationQualityWithAI — Assesses translation quality via a stringent QA prompt; returns true (pass) unless a clean standalone FAIL is emitted

#### What files use the function:
- Separated by file: js/translator-llm.js (translateChunkWithContext)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: detectContextLeak — Detects whether a prior context line leaked into the translation output (exact + sliding 30-char window match)

#### What files use the function:
- Separated by file: js/translator-llm.js (translateChunkWithContext)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: translateChunkWithContext — Translates a text chunk with prior context, running a multi-check validation gate (Japanese, romaji, context leak, AI validator) with retry logic

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer, flushBuffer, resolveNamePlate), js/benchmark.js (runParameterSweepBenchmark)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (assessTranslationQualityWithAI, cleanModelOutput, detectContextLeak, detectRomajiFragment)

### Functions in the file: buildTieredContextWindow — Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the pipeline and benchmark

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer flushBuffer), js/benchmark.js (runParameterSweepBenchmark), js/ui-manual-step.js (refreshStepContextPreview)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (updateArchivalSummary, updateRecentSummary)

---

## Script files: js/ui.js — Debug modal, stylization-map CRUD, and error banner

Manages the debug modal (open/close/page switching), the stylization map editor (save, order, commit discovered mappings, delete, copy), the discovered-mappings review UI, and the error banner. Re-exports symbols from ui-manual-step.js and ui-layout.js.

### Functions in the file: showError — Displays an error message banner and logs to console

#### What files use the function:
- Separated by file: js/parser.js (loadFiles, saveEditsToMemory, downloadFile, injectTranslationToRight), js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels), js/translator-presets.js (loadSpecificPreset, loadDefaultPreset, mapPresetJson), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, copyStylizationMapToClipboard), js/benchmark.js (runParameterSweepBenchmark)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: clearError — Clears and hides the error message banner

#### What files use the function:
- Separated by file: js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: renderDistinctPresetControls — Renders one custom-upload row per default preset file in default_presets/

#### What files use the function:
- Separated by file: js/ui.js (openDebugMenu)

#### What files the function is used in:
- Separated by file: js/translator-presets.js (loadSpecificPreset via global window.loadSpecificPreset)

### Functions in the file: openDebugMenu — Opens the debug modal and initializes input values from state

#### What files use the function:
- Separated by file: HTML event handler via main.js window.openDebugMenu (HTML Debug button)

#### What files the function is used in:
- Separated by file: js/ui.js (updateDebugPageDisplay, renderDistinctPresetControls, renderDiscoveredMappingsUI)

### Functions in the file: switchDebugPage — Switches between debug modal pages

#### What files use the function:
- Separated by file: HTML event handler via main.js window.switchDebugPage (HTML prev/next buttons)

#### What files the function is used in:
- Separated by file: js/ui.js (updateDebugPageDisplay)

### Functions in the file: updateDebugPageDisplay — Updates section visibility and button states for the current debug page

#### What files use the function:
- Separated by file: js/ui.js (openDebugMenu, switchDebugPage)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: closeDebugMenu — Saves debug modal config changes, reorders the stylization map, and closes the overlay

#### What files use the function:
- Separated by file: HTML event handler via main.js window.closeDebugMenu (HTML Save & Close button)

#### What files the function is used in:
- Separated by file: js/ui.js (orderStylizationMap, saveUIStateToCache, showError), js/ui-manual-step.js (syncManualStepUIVisibility)

### Functions in the file: closeDebugMenuWithoutSaving — Closes the debug modal without saving

#### What files use the function:
- Separated by file: HTML event handler via main.js window.closeDebugMenuWithoutSaving (HTML Cancel button)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: saveStylizationMapFromView — Parses and saves the stylization map editor JSON to memory and cache

#### What files use the function:
- Separated by file: HTML event handler via main.js window.saveStylizationMapFromView (HTML Save Map button)

#### What files the function is used in:
- Separated by file: js/ui.js (orderStylizationMap, saveUIStateToCache, showError)

### Functions in the file: renderDiscoveredMappingsUI — Renders the HTML container listing discovered stylization mappings pending review

#### What files use the function:
- Separated by file: js/translator.js (generateStylizationMapWithAI), js/ui.js (openDebugMenu, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, setAllDiscoveredSelection)

#### What files the function is used in:
- Separated by file: js/ui.js (setAllDiscoveredSelection, toggleDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal)

### Functions in the file: toggleDiscoveredSelection — Updates the selection status of an individual pending discovered mapping

#### What files use the function:
- Separated by file: HTML event handler via main.js window.toggleDiscoveredSelection (HTML checkbox onchange)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: setAllDiscoveredSelection — Sets the selection state for all pending discovered mappings at once

#### What files use the function:
- Separated by file: HTML event handler via main.js window.setAllDiscoveredSelection (HTML Select/Deselect All buttons)

#### What files the function is used in:
- Separated by file: js/ui.js (renderDiscoveredMappingsUI)

### Functions in the file: updateDiscoveredKey — Updates the key string of a pending discovered mapping entry

#### What files use the function:
- Separated by file: HTML event handler via main.js window.updateDiscoveredKey (HTML input oninput)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: updateDiscoveredVal — Updates the value string of a pending discovered mapping entry

#### What files use the function:
- Separated by file: HTML event handler via main.js window.updateDiscoveredVal (HTML input oninput)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: orderStylizationMap — Returns an ordered copy of a stylization map: priority override first, then names, then others, each by key length desc; drops empty-value entries

#### What files use the function:
- Separated by file: js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: commitApprovedMappingsToMap — Commits selected pending discovered mappings into the heavy stylization map; skips empty and __priorityOverride__ keys

#### What files use the function:
- Separated by file: HTML event handler via main.js window.commitApprovedMappingsToMap (HTML Add Selected button)

#### What files the function is used in:
- Separated by file: js/ui.js (orderStylizationMap, renderDiscoveredMappingsUI, saveUIStateToCache, showError)

### Functions in the file: deleteSelectedDiscoveredMappings — Deletes selected items from the pending discovered mappings list

#### What files use the function:
- Separated by file: HTML event handler via main.js window.deleteSelectedDiscoveredMappings (HTML Delete Selected button)

#### What files the function is used in:
- Separated by file: js/ui.js (renderDiscoveredMappingsUI, showError)

### Functions in the file: copyStylizationMapToClipboard — Copies the stylization map editor text to the system clipboard

#### What files use the function:
- Separated by file: HTML event handler via main.js window.copyStylizationMapToClipboard (HTML Copy button)

#### What files the function is used in:
- Separated by file: js/ui.js (showError)

---

## Script files: js/ui-manual-step.js — Name-plate and manual step-by-step override modals

Contains the name-plate translation modal, the manual-step toolbar (continue/retranslate/apply), the live context-preview recompute, the bracket-strip toggle sync, and the source-line display. ui.js re-exports all symbols.

### Functions in the file: promptUserForNameTranslation — Displays a modal to review/modify character name translations; returns a promise resolving to the user-approved name

#### What files use the function:
- Separated by file: js/translator.js (resolveNamePlate)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: resolveNameModal — Resolves the name translation modal promise with the user's input value

#### What files use the function:
- Separated by file: HTML event handler via main.js window.resolveNameModal (HTML Confirm button)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: closeNameModal — Closes the name translation modal with an empty fallback value

#### What files use the function:
- Separated by file: HTML event handler via main.js window.closeNameModal (HTML Cancel button)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: refreshStepContextPreview — Recomputes the context-preview dropdown from stored history + current step settings by replaying through buildTieredContextWindow

#### What files use the function:
- Separated by file: js/ui-manual-step.js (promptUserForManualStep, applyStepContextSettings, handleContextLinesChange)

#### What files the function is used in:
- Separated by file: js/translator-llm.js (buildTieredContextWindow)

### Functions in the file: syncManualStepUIVisibility — Synchronizes the visibility of the manual step toolbar and source-pane label/actions based on manual mode state

#### What files use the function:
- Separated by file: js/ui.js (closeDebugMenu, syncManualStepModeLive), js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: syncManualStepModeLive — Toggles manual step mode live when the debug checkbox changes

#### What files use the function:
- Separated by file: HTML event handler via main.js window.syncManualStepModeLive (HTML checkbox onchange)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (syncManualStepUIVisibility), js/database.js (saveUIStateToCache)

### Functions in the file: syncBracketStripToggles — Reads both bracket-strip checkboxes into state live on toggle

#### What files use the function:
- Separated by file: HTML event handler via main.js window.syncBracketStripToggles (HTML checkbox onchange)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: setCurrentSourceLine — Shows the current source line being translated in the permanently visible element

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer main loop)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: hideCurrentSourceLine — Clears the source line text when translation ends

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer completion)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: handleContextLinesChange — Handles a context-lines input change: confirms before recomputing summaries

#### What files use the function:
- Separated by file: js/ui-manual-step.js (promptUserForManualStep input listener)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (refreshStepContextPreview)

### Functions in the file: handleRawLinesChange — Handles a raw-lines input change: reshapes the raw tail display without summary recalc

#### What files use the function:
- Separated by file: js/ui-manual-step.js (promptUserForManualStep input listener)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: promptUserForManualStep — Opens the manual step toolbar for step-by-step evaluation; stores history/summary context, syncs inputs, resolves with the chosen action

#### What files use the function:
- Separated by file: js/translator.js (translateViaAiServer flushBuffer manual-step loop)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (refreshStepContextPreview)

### Functions in the file: resolveManualStepContinue — Resolves the manual step prompt with a continue action, capturing context/raw values and manual summary edits

#### What files use the function:
- Separated by file: HTML event handler via main.js window.resolveManualStepContinue (HTML Continue button)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (readManualSummaryEdits)

### Functions in the file: applyStepContextSettings — Applies manual override context/raw values to state and recomputes summaries from history

#### What files use the function:
- Separated by file: HTML event handler via main.js window.applyStepContextSettings (HTML Apply button)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (refreshStepContextPreview)

### Functions in the file: triggerStepRetranslation — Resolves the manual step prompt with a retranslate action, capturing context/raw values and manual summary edits

#### What files use the function:
- Separated by file: HTML event handler via main.js window.triggerStepRetranslation (HTML Retranslate button)

#### What files the function is used in:
- Separated by file: js/ui-manual-step.js (readManualSummaryEdits)

### Functions in the file: readManualSummaryEdits — Reads the current (possibly user-edited) archival and recent summary boxes; returns null if neither box exists

#### What files use the function:
- Separated by file: js/ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)

#### What files the function is used in:
- Separated by file: (none)

---

## Script files: js/ui-layout.js — Pure DOM layout helpers: modal drag, pane/column/row resize, auto-number inputs

Contains the debug modal drag handler, the generic column/row resizers, the footer sync, the pane resizer initializer, and the auto-resizing number input initializer. No translation or state logic. ui.js re-exports all symbols.

### Functions in the file: initDraggableModal — Initializes mouse drag-and-drop for the floating debug modal window

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/ui-layout.js (onMouseMove, onMouseUp)

### Functions in the file: onMouseMove (nested in initDraggableModal) — Moves the modal on mouse drag

#### What files use the function:
- Separated by file: js/ui-layout.js (initDraggableModal via document mousemove listener)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: onMouseUp (nested in initDraggableModal) — Stops the modal drag on mouseup

#### What files use the function:
- Separated by file: js/ui-layout.js (initDraggableModal via document mouseup listener)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: _initColResizer — Creates a column (horizontal) drag resizer between two elements

#### What files use the function:
- Separated by file: js/ui-layout.js (initPaneResizer)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: _initRowResizer — Creates a row (vertical) drag resizer between two sibling elements

#### What files use the function:
- Separated by file: js/ui-layout.js (initPaneResizer)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: _syncFooter — Syncs the external footer row alignment with the sidebar and pane widths

#### What files use the function:
- Separated by file: js/ui-layout.js (initPaneResizer via onResize callback + window resize listener)

#### What files the function is used in:
- Separated by file: (none)

### Functions in the file: initPaneResizer — Initializes all draggable resize handles (sidebar, source panes, context rows) and aligns the footer

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/ui-layout.js (_initColResizer, _initRowResizer)

### Functions in the file: initAutoNumberInputs — Makes .auto-number-input elements dynamically resize to fit their value

#### What files use the function:
- Separated by file: js/main.js (DOMContentLoaded)

#### What files the function is used in:
- Separated by file: js/ui-layout.js (resize)

### Functions in the file: resize (nested in initAutoNumberInputs) — Sets a calc width based on the input value length

#### What files use the function:
- Separated by file: js/ui-layout.js (initAutoNumberInputs)

#### What files the function is used in:
- Separated by file: (none)

---

## Script files: js/benchmark.js — Multi-dimensional parameter sweep benchmark with chunked grading

Runs a context-lines × raw-limits sweep matrix, translates each cell via the production pipeline, grades each chunk independently via the AI auditor, and averages the scores into a per-cell report.

### Functions in the file: runParameterSweepBenchmark — Runs the multi-dimensional parameter sweep matrix and logs evaluation feedback and scores

#### What files use the function:
- Separated by file: HTML event handler via main.js window.runParameterSweepBenchmark (HTML Run Benchmark button)

#### What files the function is used in:
- Separated by file: js/benchmark.js (gradeTranslatedChunks), js/translator.js (resolveNamePlate), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext), js/parser.js (extractScriptText), js/ui.js (showError)

### Functions in the file: gradeTranslatedChunks — Splits translated lines into fixed-size chunks, grades each via the auditor, averages the per-chunk scores into one cell score

#### What files use the function:
- Separated by file: js/benchmark.js (runParameterSweepBenchmark)

#### What files the function is used in:
- Separated by file: js/benchmark.js (gradeCandidateAgent)

### Functions in the file: gradeCandidateAgent — Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard

#### What files use the function:
- Separated by file: js/benchmark.js (gradeTranslatedChunks)

#### What files the function is used in:
- Separated by file: (none)
