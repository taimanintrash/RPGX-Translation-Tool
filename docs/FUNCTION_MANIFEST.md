# Function Manifest

This document describes every JavaScript module in the RPGX Translation Tool, the functions it exports/contains, and the static call graph between them.

**File load order:** `index.html` loads only `js/main.js` as `<script type="module">`. Every other file is reached via ES module imports. `main.js` imports from `database.js`, `ui.js`, `parser.js`, `translator.js`, and `benchmark.js`. `translator.js` re-exports symbols from `translator-presets.js` and `translator-llm.js`. `ui.js` re-exports symbols from `ui-manual-step.js` and `ui-layout.js`.

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

### openDatabase — Opens (or creates) the IndexedDB database and object store

#### What function call it:
- js/database.js (saveFilesToCache, loadFilesFromCache, saveUIStateToCache, loadUIStateFromCache)

#### What functions are used in it :
- (none)

### saveFilesToCache — Persists the loaded file registry to IndexedDB

#### What function call it:
- js/parser.js (checkFinishedReads, removeFile, saveEditsToMemory, commitTextToRightFile)

#### What functions are used in it :
- js/database.js (openDatabase)

### loadFilesFromCache — Retrieves the cached file registry from IndexedDB

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/database.js (openDatabase)

### saveUIStateToCache — Persists the current UI settings (dropdowns, debug flags, stylization map, bracket toggles) to IndexedDB

#### What function call it:
- js/parser.js (onSelectID, onCompareSelectionChange), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap), js/ui-manual-step.js (syncManualStepModeLive)

#### What functions are used in it :
- js/database.js (openDatabase)

### loadUIStateFromCache — Retrieves cached UI state settings from IndexedDB

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/database.js (openDatabase)

---

## js/parser.js — File/script registry, dropdown population, and comparison view rendering

Manages loading JSON script files into the registry, parsing content, populating file/script/master-ID dropdowns, rendering comparison views, and committing translated text back to the right-hand file.

### loadFiles — Loads one or more JSON files from a file input into the registry

#### What function call it:
- HTML event handler via main.js window.loadFiles (HTML file input)

#### What functions are used in it :
- js/parser.js (checkFinishedReads, parseContentToJSON), js/ui.js (showError)

### checkFinishedReads — Processes completed FileReader reads, parses each, and refreshes application state

#### What function call it:
- js/parser.js (loadFiles)

#### What functions are used in it :
- js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache)

### removeFile — Removes a file from the registry by name and refreshes state

#### What function call it:
- HTML event handler via main.js window.removeFiles (HTML remove button)

#### What functions are used in it :
- js/parser.js (refreshApplicationState, saveFilesToCache, saveUIStateToCache), js/parser.js (updateFileListUI)

### parseContentToJSON — Parses raw file content into JSON, with regex-extraction fallback

#### What function call it:
- js/parser.js (loadFiles)

#### What functions are used in it :
- (none)

### refreshApplicationState — Refreshes all core UI elements: file lists, dropdowns, and comparison views

#### What function call it:
- js/parser.js (checkFinishedReads, removeFile), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, updateBenchmarkFileDropdown, updateFileDropdowns, updateFileListUI, updateMasterIDList)

### updateFileListUI — Renders the file list in the sidebar

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- js/parser.js (removeFile)

### updateFileDropdowns — Populates the left/right file selection dropdowns

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- (none)

### updateBenchmarkFileDropdown — Populates the benchmark reference file dropdown

#### What function call it:
- js/parser.js (refreshApplicationState)

#### What functions are used in it :
- js/parser.js (updateBenchmarkSceneDropdown)

### updateBenchmarkSceneDropdown — Populates the benchmark reference scene dropdown based on the selected file

#### What function call it:
- HTML event handler via main.js window.updateBenchmarkSceneDropdown (HTML dropdown onchange)

#### What functions are used in it :
- (none)

### updateMasterIDList — Populates the master script ID list from all loaded files

#### What function call it:
- js/parser.js (refreshApplicationState, commitTextToRightFile)

#### What functions are used in it :
- (none)

### onSelectID — Handles script selection change, renders comparison views, saves UI state

#### What function call it:
- HTML event handler via main.js window.onSelectID (HTML select onchange)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveUIStateToCache), js/parser.js (onSelectIDMobile)

### onSelectIDMobile — Syncs the mobile select element with the main select and triggers the standard update

#### What function call it:
- HTML event handler via main.js window.onSelectIDMobile (HTML mobile select onchange)

#### What functions are used in it :
- js/parser.js (onSelectID)

### onCompareSelectionChange — Handles left/right file selection comparison change, renders views, saves UI state

#### What function call it:
- HTML event handler via main.js window.onCompareSelectionChange (HTML select onchange)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveUIStateToCache)

### renderComparisonViews — Renders the left (source) and right (translated) comparison text areas

#### What function call it:
- js/parser.js (onSelectID, onCompareSelectionChange), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/parser.js (extractScriptText)

### extractScriptText — Extracts the script text for a given key from a file data object

#### What function call it:
- js/parser.js (renderComparisonViews), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- (none)

### saveEditsToMemory — Saves manual edits from the left text area back into the file registry in memory

#### What function call it:
- HTML event handler via main.js window.saveEditsToMemory (HTML save button)

#### What functions are used in it :
- js/parser.js (saveFilesToCache), js/ui.js (showError)

### commitTextToRightFile — Commits translated text to the right-hand file object and updates the master ID list

#### What function call it:
- js/translator.js (translateViaAiServer)

#### What functions are used in it :
- js/parser.js (renderComparisonViews, saveFilesToCache, updateMasterIDList), js/parser.js (injectTranslationToRight)

### injectTranslationToRight — Injects the current right-hand text into the target file

#### What function call it:
- HTML event handler via main.js window.injectTranslationToRight (HTML inject button)

#### What functions are used in it :
- js/parser.js (commitTextToRightFile), js/ui.js (showError)

### downloadFile — Downloads a file from the registry as a blob

#### What function call it:
- HTML event handler via main.js window.downloadFile (HTML download button)

#### What functions are used in it :
- js/ui.js (showError)

---

## js/translator.js — Translation pipeline: stylization, name-plate resolution, and the main translation loop

Contains the stylization strip phase (stripLine, shouldStripNameBrackets, applyPriorityOverride), the 3-phase stylization map generator (generateStylizationMapWithAI), name-plate resolution (resolveNamePlate), the stop control, and the core sequential translation loop (translateViaAiServer). Re-exports all symbols from translator-presets.js and translator-llm.js.

### isValidMappingPair — Validates a key/value pair from a stylization mapping output (rejects empty keys, sentences, single kana, pure ASCII, etc.)

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

### stripLine — Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop

#### What function call it:
- js/translator.js (translateViaAiServer main loop, flushBuffer manual-step retranslate)

#### What functions are used in it :
- js/translator.js (applyPriorityOverride, shouldStripNameBrackets)

### generateStylizationMapWithAI — Analyzes source text to discover stutters/ticks/sounds/punctuation via a 3-phase AI analysis, populating state.pendingDiscoveredMappings

#### What function call it:
- HTML event handler via main.js window.generateStylizationMapWithAI (HTML Generate Mapping button)

#### What functions are used in it :
- js/translator.js (applyPriorityOverride, parseMappingOutput), js/ui.js (clearError, renderDiscoveredMappingsUI, showError)

### stopTranslation — Aborts the active process via the AbortController and sets the abortWarningShown guard so the in-flight catch block surfaces a yellow warning banner naming the cancelled process (translation / mapping / benchmark)

#### What function call it:
- HTML event handler via main.js window.stopTranslation (HTML Stop button)

#### What functions are used in it :
- (none)

### resolveNamePlate — Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name; merges JP->EN name into the stylization map

#### What function call it:
- js/translator.js (translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/translator.js (translateChunkWithContext), js/ui-manual-step.js (promptUserForNameTranslation)

### makeSummaryStateAccessor — Builds a getter/setter accessor object that lets buildTieredContextWindow mutate flushBuffer-scoped summary variables in place

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer)

#### What functions are used in it :
- (none)

### reconstructManualStepDisplayBlock — Reconstructs the manual-step display block for a target translatedLines entry by replaying the filter+join display order

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer manual-step continue path)

#### What functions are used in it :
- (none)

### flattenTranslatedLines — Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines

#### What function call it:
- js/translator.js (translateViaAiServer final flatten step)

#### What functions are used in it :
- (none)

### translateViaAiServer — Core sequential translation loop: buffers dialogue, strips stylization, resolves name plates, translates via translateChunkWithContext, handles manual-step checkpoints, commits to file

#### What function call it:
- HTML event handler via main.js window.translateViaAiServer (HTML Translate button)

#### What functions are used in it :
- js/translator.js (flushBuffer, stripLine, resolveNamePlate, makeSummaryStateAccessor, reconstructManualStepDisplayBlock, flattenTranslatedLines), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep, setCurrentSourceLine, hideCurrentSourceLine), js/ui.js (clearError, showError), js/parser.js (commitTextToRightFile)

### flushBuffer (nested in translateViaAiServer) — Flushes the accumulated dialogue buffer through translateChunkWithContext, handles manual-step checkpoints, pushes result into history with speaker prefix

#### What function call it:
- js/translator.js (translateViaAiServer main loop)

#### What functions are used in it :
- js/translator.js (stripLine, makeSummaryStateAccessor, reconstructManualStepDisplayBlock), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext, wrapTextToLines), js/ui-manual-step.js (promptUserForManualStep)

---

## js/translator-presets.js — Operation preset definitions and default-preset JSON loaders

Defines the operationPresets dictionary (temperature + systemPrompt per operation tier), the defaultPresetManifest (shipped JSON files), and the loaders that apply presets from file uploads or shipped defaults. translator.js re-exports all symbols.

### mapPresetJsonQuiet — Maps a parsed preset JSON onto an operation config, logging (not error-bannering) the result; used by the silent default loader

#### What function call it:
- js/translator-presets.js (loadAllDefaultPresets)

#### What functions are used in it :
- (none)

### mapPresetJson — Maps a parsed preset JSON onto an operation config, then surfaces a success banner; used by the interactive upload path

#### What function call it:
- js/translator-presets.js (loadSpecificPreset, loadDefaultPreset)

#### What functions are used in it :
- js/ui.js (showError)

### loadSpecificPreset — Loads and maps preset config from an uploaded JSON file for a specified operation

#### What function call it:
- HTML event handler via main.js window.loadSpecificPreset (HTML file-upload onchange), js/ui.js (renderDistinctPresetControls via global window.loadSpecificPreset)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### loadDefaultPreset — Fetches a shipped default preset JSON from default_presets/ and applies it to the matching operation

#### What function call it:
- HTML event handler via main.js window.loadDefaultPreset (HTML default-preset button)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJson), js/ui.js (showError)

### loadAllDefaultPresets — Loads every shipped default preset from default_presets/ into operationPresets on startup

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/translator-presets.js (mapPresetJsonQuiet)

---

## js/translator-llm.js — LLM HTTP helpers: model discovery, text cleaning, tiered summarization, validation, and chunk translation

Contains the AI server model-list fetcher, text-wrapping and output-cleaning helpers, the tiered summarization engine (recent + archival), the romaji-fragment detector, the AI quality validator, the context-leak detector, the chunk translator with retry logic, and the tiered context-window builder. translator.js re-exports all symbols.

### fetchAiModels — Queries available local AI Server model endpoints and populates the model selection dropdown

#### What function call it:
- js/main.js (DOMContentLoaded, window.fetchAiModels wiring)

#### What functions are used in it :
- js/ui.js (clearError, showError)

### wrapTextToLines — Wraps a string of text into an array of lines bounded by a max character length

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer)

#### What functions are used in it :
- (none)

### cleanModelOutput — Cleans raw LLM outputs by stripping conversational filler, prefixes, code blocks, and surrounding quotes

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### cleanSummaryOutput — Cleans raw LLM summary outputs by stripping preamble, role labels, and surrounding quotes

#### What function call it:
- js/translator-llm.js (updateRecentSummary, updateArchivalSummary)

#### What functions are used in it :
- (none)

### updateRecentSummary — Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines

#### What function call it:
- js/translator-llm.js (buildTieredContextWindow, summarizeOldContext)

#### What functions are used in it :
- js/translator-llm.js (cleanSummaryOutput)

### updateArchivalSummary — Updates the Tier 3 archival summary by compressing an overflowing scene recap

#### What function call it:
- js/translator-llm.js (buildTieredContextWindow)

#### What functions are used in it :
- js/translator-llm.js (cleanSummaryOutput)

### summarizeOldContext — Summarizes older dialogue context lines into a single sentence (backwards-compat wrapper around updateRecentSummary)

#### What function call it:
- js/translator.js (legacy callers)

#### What functions are used in it :
- js/translator-llm.js (updateRecentSummary)

### detectRomajiFragment — Detects leftover Japanese romaji fragments in an English translation; returns the first match or null

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### assessTranslationQualityWithAI — Assesses translation quality via a stringent QA prompt; returns true (pass) unless a clean standalone FAIL is emitted

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### detectContextLeak — Detects whether a prior context line leaked into the translation output (exact + sliding 30-char window match)

#### What function call it:
- js/translator-llm.js (translateChunkWithContext)

#### What functions are used in it :
- (none)

### translateChunkWithContext — Translates a text chunk with prior context, running a multi-check validation gate (Japanese, romaji, context leak, AI validator) with retry logic

#### What function call it:
- js/translator.js (translateViaAiServer, flushBuffer, resolveNamePlate), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/translator-llm.js (assessTranslationQualityWithAI, cleanModelOutput, detectContextLeak, detectRomajiFragment)

### buildTieredContextWindow — Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the pipeline and benchmark

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer), js/benchmark.js (runParameterSweepBenchmark), js/ui-manual-step.js (refreshStepContextPreview)

#### What functions are used in it :
- js/translator-llm.js (updateArchivalSummary, updateRecentSummary)

---

## js/ui.js — Debug modal, stylization-map CRUD, and notification banner (error/success/warning)

Manages the debug modal (open/close/page switching), the stylization map editor (save, order, commit discovered mappings, delete, copy), the discovered-mappings review UI, and the notification banner (showError red / showSuccess green / showWarning yellow, all sharing #errorBanner). Re-exports symbols from ui-manual-step.js and ui-layout.js.

### showError — Displays a red error message banner and logs to console

#### What function call it:
- js/parser.js (loadFiles, saveEditsToMemory, downloadFile, injectTranslationToRight), js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels), js/translator-presets.js (loadSpecificPreset, loadDefaultPreset), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/ui.js (setBanner)

### showSuccess — Displays a green success banner and logs to console

#### What function call it:
- js/parser.js (saveEditsToMemory)

#### What functions are used in it :
- js/ui.js (setBanner)

### showWarning — Displays a yellow warning banner and logs to console

#### What function call it:
- js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/ui.js (setBanner)

### setBanner — Applies a banner variant class to #errorBanner, shows it, and sets its text (shared by showError/showSuccess/showWarning)

#### What function call it:
- js/ui.js (showError, showSuccess, showWarning)

#### What functions are used in it :
- (none)

### clearError — Clears and hides the message banner (error, success, or warning)

#### What function call it:
- js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels)

#### What functions are used in it :
- (none)

### renderDistinctPresetControls — Renders one custom-upload row per default preset file in default_presets/, each with a display label showing the active preset file name (default or custom)

#### What function call it:
- js/ui.js (openDebugMenu)

#### What functions are used in it :
- js/translator-presets.js (loadSpecificPreset via global window.loadSpecificPreset)

### openDebugMenu — Opens the debug modal and initializes input values from state; disables the Save Map button until the editor is edited

#### What function call it:
- HTML event handler via main.js window.openDebugMenu (HTML Debug button)

#### What functions are used in it :
- js/ui.js (updateDebugPageDisplay, renderDistinctPresetControls, renderDiscoveredMappingsUI, setSaveMapButtonEnabled, initStylizationMapEditorSaveActivation)

### switchDebugPage — Switches between debug modal pages

#### What function call it:
- HTML event handler via main.js window.switchDebugPage (HTML prev/next buttons)

#### What functions are used in it :
- js/ui.js (updateDebugPageDisplay)

### updateDebugPageDisplay — Updates section visibility and button states for the current debug page

#### What function call it:
- js/ui.js (openDebugMenu, switchDebugPage)

#### What functions are used in it :
- (none)

### closeDebugMenu — Saves debug modal config changes, reorders the stylization map, and closes the overlay

#### What function call it:
- HTML event handler via main.js window.closeDebugMenu (HTML Save & Close button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, saveUIStateToCache, showError), js/ui-manual-step.js (syncManualStepUIVisibility)

### closeDebugMenuWithoutSaving — Closes the debug modal without saving

#### What function call it:
- HTML event handler via main.js window.closeDebugMenuWithoutSaving (HTML Cancel button)

#### What functions are used in it :
- (none)

### saveStylizationMapFromView — Parses and saves the stylization map editor JSON to memory and cache, then disables the Save Map button

#### What function call it:
- HTML event handler via main.js window.saveStylizationMapFromView (HTML Save Map button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, saveUIStateToCache, setSaveMapButtonEnabled, showError)

### setSaveMapButtonEnabled — Enables or disables the Save Map button and toggles its grayed-out style

#### What function call it:
- js/ui.js (saveStylizationMapFromView, openDebugMenu, initStylizationMapEditorSaveActivation), js/translator.js (generateStylizationMapWithAI)

#### What functions are used in it :
- (none)

### initStylizationMapEditorSaveActivation — Attaches a one-time input listener to the stylization map editor so any edit reactivates the Save Map button

#### What function call it:
- js/ui.js (openDebugMenu)

#### What functions are used in it :
- js/ui.js (setSaveMapButtonEnabled)

### renderDiscoveredMappingsUI — Renders the HTML container listing discovered stylization mappings pending review

#### What function call it:
- js/translator.js (generateStylizationMapWithAI), js/ui.js (openDebugMenu, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, setAllDiscoveredSelection)

#### What functions are used in it :
- js/ui.js (setAllDiscoveredSelection, toggleDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal)

### toggleDiscoveredSelection — Updates the selection status of an individual pending discovered mapping

#### What function call it:
- HTML event handler via main.js window.toggleDiscoveredSelection (HTML checkbox onchange)

#### What functions are used in it :
- (none)

### setAllDiscoveredSelection — Sets the selection state for all pending discovered mappings at once

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

### orderStylizationMap — Returns an ordered copy of a stylization map: priority override first, then names, then others, each by key length desc; drops empty-value entries

#### What function call it:
- js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap)

#### What functions are used in it :
- (none)

### commitApprovedMappingsToMap — Commits selected pending discovered mappings into the heavy stylization map; skips empty and __priorityOverride__ keys

#### What function call it:
- HTML event handler via main.js window.commitApprovedMappingsToMap (HTML Add Selected button)

#### What functions are used in it :
- js/ui.js (orderStylizationMap, renderDiscoveredMappingsUI, saveUIStateToCache, showError)

### deleteSelectedDiscoveredMappings — Deletes selected items from the pending discovered mappings list

#### What function call it:
- HTML event handler via main.js window.deleteSelectedDiscoveredMappings (HTML Delete Selected button)

#### What functions are used in it :
- js/ui.js (renderDiscoveredMappingsUI, showError)

### copyStylizationMapToClipboard — Copies the stylization map editor text to the system clipboard

#### What function call it:
- HTML event handler via main.js window.copyStylizationMapToClipboard (HTML Copy button)

#### What functions are used in it :
- js/ui.js (showError)

---

## js/ui-manual-step.js — Name-plate and manual step-by-step override modals

Contains the name-plate translation modal, the manual-step toolbar (continue/retranslate/apply), the live context-preview recompute, the bracket-strip toggle sync, and the source-line display. ui.js re-exports all symbols.

### promptUserForNameTranslation — Displays a modal to review/modify character name translations; returns a promise resolving to the user-approved name

#### What function call it:
- js/translator.js (resolveNamePlate)

#### What functions are used in it :
- (none)

### resolveNameModal — Resolves the name translation modal promise with the user's input value

#### What function call it:
- HTML event handler via main.js window.resolveNameModal (HTML Confirm button)

#### What functions are used in it :
- (none)

### closeNameModal — Closes the name translation modal with an empty fallback value

#### What function call it:
- HTML event handler via main.js window.closeNameModal (HTML Cancel button)

#### What functions are used in it :
- (none)

### refreshStepContextPreview — Recomputes the context-preview dropdown from stored history + current step settings by replaying through buildTieredContextWindow

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep, applyStepContextSettings, handleContextLinesChange)

#### What functions are used in it :
- js/translator-llm.js (buildTieredContextWindow)

### syncManualStepUIVisibility — Synchronizes the visibility of the manual step toolbar and source-pane label/actions based on manual mode state

#### What function call it:
- js/ui.js (closeDebugMenu, syncManualStepModeLive), js/main.js (DOMContentLoaded)

#### What functions are used in it :
- (none)

### syncManualStepModeLive — Toggles manual step mode live when the debug checkbox changes

#### What function call it:
- HTML event handler via main.js window.syncManualStepModeLive (HTML checkbox onchange)

#### What functions are used in it :
- js/ui-manual-step.js (syncManualStepUIVisibility), js/database.js (saveUIStateToCache)

### syncBracketStripToggles — Reads both bracket-strip checkboxes into state live on toggle

#### What function call it:
- HTML event handler via main.js window.syncBracketStripToggles (HTML checkbox onchange)

#### What functions are used in it :
- (none)

### setCurrentSourceLine — Shows the current source line being translated in the permanently visible element

#### What function call it:
- js/translator.js (translateViaAiServer main loop)

#### What functions are used in it :
- (none)

### hideCurrentSourceLine — Clears the source line text when translation ends

#### What function call it:
- js/translator.js (translateViaAiServer completion)

#### What functions are used in it :
- (none)

### handleContextLinesChange — Handles a context-lines input change: confirms before recomputing summaries

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep input listener)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### handleRawLinesChange — Handles a raw-lines input change: reshapes the raw tail display without summary recalc

#### What function call it:
- js/ui-manual-step.js (promptUserForManualStep input listener)

#### What functions are used in it :
- (none)

### promptUserForManualStep — Opens the manual step toolbar for step-by-step evaluation; stores history/summary context, syncs inputs, resolves with the chosen action

#### What function call it:
- js/translator.js (translateViaAiServer flushBuffer manual-step loop)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### resolveManualStepContinue — Resolves the manual step prompt with a continue action, capturing context/raw values and manual summary edits

#### What function call it:
- HTML event handler via main.js window.resolveManualStepContinue (HTML Continue button)

#### What functions are used in it :
- js/ui-manual-step.js (readManualSummaryEdits)

### applyStepContextSettings — Applies manual override context/raw values to state and recomputes summaries from history

#### What function call it:
- HTML event handler via main.js window.applyStepContextSettings (HTML Apply button)

#### What functions are used in it :
- js/ui-manual-step.js (refreshStepContextPreview)

### triggerStepRetranslation — Resolves the manual step prompt with a retranslate action, capturing context/raw values and manual summary edits

#### What function call it:
- HTML event handler via main.js window.triggerStepRetranslation (HTML Retranslate button)

#### What functions are used in it :
- js/ui-manual-step.js (readManualSummaryEdits)

### readManualSummaryEdits — Reads the current (possibly user-edited) archival and recent summary boxes; returns null if neither box exists

#### What function call it:
- js/ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)

#### What functions are used in it :
- (none)

---

## js/ui-layout.js — Pure DOM layout helpers: modal drag, pane/column/row resize, auto-number inputs

Contains the debug modal drag handler, the generic column/row resizers, the footer sync, the pane resizer initializer, and the auto-resizing number input initializer. No translation or state logic. ui.js re-exports all symbols.

### initDraggableModal — Initializes mouse drag-and-drop for the floating debug modal window

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (onMouseMove, onMouseUp)

### onMouseMove (nested in initDraggableModal) — Moves the modal on mouse drag

#### What function call it:
- js/ui-layout.js (initDraggableModal via document mousemove listener)

#### What functions are used in it :
- (none)

### onMouseUp (nested in initDraggableModal) — Stops the modal drag on mouseup

#### What function call it:
- js/ui-layout.js (initDraggableModal via document mouseup listener)

#### What functions are used in it :
- (none)

### _initColResizer — Creates a column (horizontal) drag resizer between two elements

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### _initRowResizer — Creates a row (vertical) drag resizer between two sibling elements

#### What function call it:
- js/ui-layout.js (initPaneResizer)

#### What functions are used in it :
- (none)

### _syncFooter — Syncs the external footer row alignment with the sidebar and pane widths

#### What function call it:
- js/ui-layout.js (initPaneResizer via onResize callback + window resize listener)

#### What functions are used in it :
- (none)

### initPaneResizer — Initializes all draggable resize handles (sidebar, source panes, context rows) and aligns the footer

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (_initColResizer, _initRowResizer)

### initAutoNumberInputs — Makes .auto-number-input elements dynamically resize to fit their value

#### What function call it:
- js/main.js (DOMContentLoaded)

#### What functions are used in it :
- js/ui-layout.js (resize)

### resize (nested in initAutoNumberInputs) — Sets a calc width based on the input value length

#### What function call it:
- js/ui-layout.js (initAutoNumberInputs)

#### What functions are used in it :
- (none)

---

## js/benchmark.js — Multi-dimensional parameter sweep benchmark with chunked grading

Runs a context-lines × raw-limits sweep matrix, translates each cell via the production pipeline, grades each chunk independently via the AI auditor, and averages the scores into a per-cell report.

### runParameterSweepBenchmark — Runs the multi-dimensional parameter sweep matrix and logs evaluation feedback and scores; uses an AbortController (silent abort of any running process, signal checks in the sweep loop, try/catch with abort handling)

#### What function call it:
- HTML event handler via main.js window.runParameterSweepBenchmark (HTML Run Benchmark button)

#### What functions are used in it :
- js/benchmark.js (gradeTranslatedChunks), js/translator.js (resolveNamePlate), js/translator-llm.js (buildTieredContextWindow, translateChunkWithContext), js/parser.js (extractScriptText), js/ui.js (showError, showWarning)

### gradeTranslatedChunks — Splits translated lines into fixed-size chunks, grades each via the auditor, averages the per-chunk scores into one cell score; checks the abort signal between chunks and forwards it to the grader

#### What function call it:
- js/benchmark.js (runParameterSweepBenchmark)

#### What functions are used in it :
- js/benchmark.js (gradeCandidateAgent)

### gradeCandidateAgent — Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard; passes the abort signal to fetch

#### What function call it:
- js/benchmark.js (gradeTranslatedChunks)

#### What functions are used in it :
- (none)
