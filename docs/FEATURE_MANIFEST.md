# Feature Manifest

This document lists the RPGX Translation Tool's user-facing features, the **main function** that implements each, and the **pipeline** of functions that pipeline runs. It is derived from the static call graph in [`FUNCTION_MANIFEST.md`](./FUNCTION_MANIFEST.md) and grouped by feature area.

> **Convention used below:** when a feature reuses another feature's pipeline (e.g. the benchmark and name-plate features both call the translation pipeline), it says **"uses the &lt;Feature&gt; pipeline"** and does not re-list those functions, because they are already documented under that feature.

**Module key (for the `function` column):**
`main` = `js/main.js` · `database` = `js/database.js` · `logger` = `js/logger.js` · `parser` = `js/parser.js` · `translator` = `js/translator.js` · `translator-presets` = `js/translator-presets.js` · `translator-llm` = `js/translator-llm.js` · `ui` = `js/ui.js` · `ui-manual-step` = `js/ui-manual-step.js` · `ui-layout` = `js/ui-layout.js` · `benchmark` = `js/benchmark.js`

---

## 1. Application Bootstrap & State

The single entry point. Wires every module function to `window.*` for HTML event handlers, restores cached UI state on load, applies the persisted theme, and exports the central `state` object imported by all other modules.

| Item | Value |
|---|---|
| **Main function** | `DOMContentLoaded` handler |
| **Module** | `main` |

**Pipeline:**
1. `main.loadFilesFromCache` (database)
2. `main.loadUIStateFromCache` (database)
3. `translator-presets.loadAllDefaultPresets`
4. `translator-llm.fetchAiModels`
5. `main.refreshApplicationState` (parser)
6. `ui-manual-step.syncManualStepUIVisibility`
7. `ui-layout.initDraggableModal`
8. `ui-layout.initPaneResizer`
9. `ui-layout.initAutoNumberInputs`

### Theme Toggle

| Item | Value |
|---|---|
| **Main function** | `toggleTheme` |
| **Module** | `main` |

**Pipeline:** `toggleTheme` → `main.applyTheme` → `main.recolorScriptSelectOptions`

---

## 2. File Loading & Script Registry

Loads JSON/JS game script files into an in-memory registry, parses their content, and refreshes all dependent UI (file list, dropdowns, master-ID list, benchmark dropdowns, comparison views). Registry and UI state are persisted to IndexedDB on every change.

| Item | Value |
|---|---|
| **Main function** | `loadFiles` |
| **Module** | `parser` |

**Pipeline:**
1. `parser.loadFiles` (FileReader) → `parser.parseContentToJSON`
2. `parser.checkFinishedReads` → `parser.refreshApplicationState` + `parser.saveFilesToCache` + `parser.saveUIStateToCache`
3. `parser.refreshApplicationState` → `parser.renderComparisonViews` · `parser.updateBenchmarkFileDropdown` · `parser.updateFileDropdowns` · `parser.updateFileListUI` · `parser.updateMasterIDList`
4. `parser.updateFileListUI` → `parser.removeFile`
5. `parser.updateBenchmarkFileDropdown` → `parser.updateBenchmarkSceneDropdown`

### Comparison View Rendering

| Item | Value |
|---|---|
| **Main function** | `renderComparisonViews` |
| **Module** | `parser` |

**Pipeline:** `onSelectID` / `onCompareSelectionChange` → `renderComparisonViews` → `parser.extractScriptText` (+ `parser.saveUIStateToCache`)

---

## 3. IndexedDB Persistence

Caches the loaded file registry and UI state so the tool restores between sessions. A small open/put/get layer over the browser's IndexedDB.

| Item | Value |
|---|---|
| **Main function** | `openDatabase` |
| **Module** | `database` |

**Pipeline:**
1. `database.openDatabase` (version 6 object store)
2. `database.saveFilesToCache` / `database.saveUIStateToCache` (writes)
3. `database.loadFilesFromCache` / `database.loadUIStateFromCache` (reads)

---

## 4. AI Model Discovery

Queries OpenAI-compatible model-list endpoints across LM Studio, Ollama, and llama.cpp variants, populating the model dropdown. Falls back across `/v1/models`, `/api/v0/models`, and `/models`.

| Item | Value |
|---|---|
| **Main function** | `fetchAiModels` |
| **Module** | `translator-llm` |

**Pipeline:** `fetchAiModels` → `ui.clearError` / `ui.showError`

---

## 5. Preset System

Loads the 11 shipped JSON prompt presets into the in-memory `operationPresets` config, and supports per-operation user overrides via file upload.

| Item | Value |
|---|---|
| **Main function** | `loadAllDefaultPresets` |
| **Module** | `translator-presets` |

**Pipeline:**
1. `translator-presets.loadAllDefaultPresets` → `translator-presets.mapPresetJsonQuiet`
2. (per-file override) `translator-presets.loadSpecificPreset` → `translator-presets.mapPresetJson` → `translator-presets.updatePresetDisplayText`
3. (single default) `translator-presets.loadDefaultPreset` → `translator-presets.mapPresetJson`

---

## 6. Translation Pipeline (core feature)

The main sequential translation loop. Reads host/model and manual-override settings, strips heavy stylization from each source line, resolves name plates, builds a tiered context window, translates each dialogue chunk through a multi-check validation gate, and commits results back to the target file. Sets the active log loop to `translation`.

| Item | Value |
|---|---|
| **Main function** | `translateViaAiServer` |
| **Module** | `translator` |

**Pipeline:**
1. `translator.translateViaAiServer` (entry; `logger.beginLoop('translation')`)
2. `translator.stripLine` (pre-translation stylization strip) → `translator.applyPriorityOverride` · `translator.shouldStripNameBrackets`
3. `translator.resolveNamePlate` (name-plate resolution)
4. `translator.flushBuffer` (per-chunk flush; nested) → `translator.makeSummaryStateAccessor` · `translator.reconstructManualStepDisplayBlock` · `translator-llm.buildTieredContextWindow` · `translator-llm.translateChunkWithContext` · `translator-llm.wrapTextToLines`
5. `translator.flattenTranslatedLines` (final flatten)
6. `parser.commitTextToRightFile` (write to target registry) → `parser.renderComparisonViews` · `parser.saveFilesToCache` · `parser.updateMasterIDList` · `parser.injectTranslationToRight`
7. `logger.markSession` + `logger.flushLoopToDisk` (finally; writes `docs/logs/translation/<preset>.md`)

> The **Chunk Translation + Validation** sub-pipeline (run by `translateChunkWithContext` inside `flushBuffer`) is documented in detail under **Feature 9 — Translation Validation Pipeline**, since it is the validation feature. `translateViaAiServer` uses that pipeline.

---

## 7. Stylization & Text Masking

Strips, delineates, or passes through heavy Japanese stylization patterns (stutters, ticks, sounds, punctuation) so small LLMs receive cleaner input. Includes a 3-phase AI mapper that discovers patterns automatically.

| Item | Value |
|---|---|
| **Main function** | `stripLine` (strip phase) · `generateStylizationMapWithAI` (mapper) |
| **Module** | `translator` |

### 7a. Strip Phase

**Pipeline:** `translator.stripLine` → `translator.applyPriorityOverride` (longest-first global pre-pass) · `translator.shouldStripNameBrackets` (bracket XOR decision)

### 7b. AI Mapping Generator (3-phase)

| Item | Value |
|---|---|
| **Main function** | `generateStylizationMapWithAI` |
| **Module** | `translator` |

**Pipeline:**
1. `translator.generateStylizationMapWithAI` (sets `logger.beginLoop('mapping')`; applies priority override to analysis lines)
2. `translator.parseMappingOutput` → `translator.isValidMappingPair` (candidate validation)
3. `ui.renderDiscoveredMappingsUI` (review UI)
4. `logger.logAIInteraction` (per phase) → `logger.markSession` + `logger.flushLoopToDisk` (finally; writes `docs/logs/mapping/<preset>.md`)

---

## 8. Name Plate Resolution

Intercepts `<NAME_PLATE>` lines, looks up or transliterates the character name, optionally prompts the user, caches the result, and merges it into the stylization map.

| Item | Value |
|---|---|
| **Main function** | `resolveNamePlate` |
| **Module** | `translator` |

**Pipeline:**
1. `translator.resolveNamePlate` (cache check → transliteration)
2. `translator-llm.translateChunkWithContext` (transliterate via the `namePlate` preset)
3. `ui-manual-step.promptUserForNameTranslation` (user approval modal)
4. Merge resolved name into stylization map; return `{ namePlateLine, speakerName }`

> The transliteration step uses the **Translation Validation Pipeline** (Feature 9), driven by `translateChunkWithContext`.

---

## 9. Translation Validation Pipeline

The multi-check validation gate run by `translateChunkWithContext`. Validates every chunk up to 5 retry attempts, degrading the AI verdict to advisory after 3, and falling back to a retry preset + empty context on exhaustion.

| Item | Value |
|---|---|
| **Main function** | `translateChunkWithContext` |
| **Module** | `translator-llm` |

**Pipeline:**
1. `translator-llm.translateChunkWithContext` (entry; retry loop)
2. `translator-llm.cleanModelOutput` (output cleaning)
3. `translator-llm.detectRomajiFragment` (romaji check)
4. `translator-llm.detectContextLeak` (context-leak check)
5. `translator-llm.assessTranslationQualityWithAI` (AI QA validator) → `logger.logAIInteraction`
6. `translator-llm.buildTieredContextWindow` (context assembly; called by `flushBuffer` and the benchmark)

---

## 10. Tiered Context Summarization

Builds the 3-tier context window shared by the translation pipeline and the benchmark. Raw Tail → Rolling Scene Recap → Archival Story State.

| Item | Value |
|---|---|
| **Main function** | `buildTieredContextWindow` |
| **Module** | `translator-llm` |

**Pipeline:**
1. `translator-llm.buildTieredContextWindow` (entry; assembles & caps the window)
2. `translator-llm.updateRecentSummary` (Tier 2) → `translator-llm.cleanSummaryOutput` · `logger.logAIInteraction`
3. `translator-llm.updateArchivalSummary` (Tier 3 overflow) → `translator-llm.cleanSummaryOutput`
4. `translator-llm.summarizeOldContext` (legacy wrapper → `updateRecentSummary`)

> This is the shared context pipeline. The **Translation Pipeline** (Feature 6), **Manual Step-by-Step Review** (Feature 11), and **Benchmark Sweep** (Feature 12) all use this pipeline via `buildTieredContextWindow`.

---

## 11. Manual Step-by-Step Review

Per-chunk review toolbar for translating one chunk at a time, with a live context preview replayed through the tiered context builder, editable output, and re-translate with adjusted settings.

| Item | Value |
|---|---|
| **Main function** | `promptUserForManualStep` |
| **Module** | `ui-manual-step` |

**Pipeline:**
1. `ui-manual-step.promptUserForManualStep` (open toolbar; resolve continue/retranslate)
2. `ui-manual-step.refreshStepContextPreview` (live preview recompute)
3. `ui-manual-step.applyStepContextSettings` / `ui-manual-step.triggerStepRetranslation` / `ui-manual-step.resolveManualStepContinue` → `ui-manual-step.readManualSummaryEdits`
4. `ui-manual-step.handleContextLinesChange` (destructive recompute) → `ui-manual-step.refreshStepContextPreview`
5. `ui-manual-step.handleRawLinesChange` (raw-tail reshape)
6. `ui-manual-step.syncManualStepUIVisibility` / `ui-manual-step.syncBracketStripToggles` (UI/state sync)
7. `ui-manual-step.setCurrentSourceLine` / `ui-manual-step.hideCurrentSourceLine` (source-line display)

> The re-translate path uses the **Translation Pipeline** (Feature 6), driven through `flushBuffer`, and the **Tiered Context Summarization** pipeline (Feature 10) via `buildTieredContextWindow`.

---

## 12. Benchmark Sweep

Multi-dimensional parameter sweep (context-lines × raw-limits). Each cell translates through the production pipeline and is graded independently by an AI auditor, averaged into a per-cell score.

| Item | Value |
|---|---|
| **Main function** | `runParameterSweepBenchmark` |
| **Module** | `benchmark` |

**Pipeline:**
1. `benchmark.runParameterSweepBenchmark` (entry; `logger.beginLoop('benchmark')`)
2. `parser.extractScriptText` (reference text)
3. `translator.resolveNamePlate` (name-plate resolution)
4. `benchmark.gradeTranslatedChunks` → `benchmark.gradeCandidateAgent` (AI grading) → `logger.logAIInteraction`
5. `logger.markSession` + `logger.flushLoopToDisk` (finally; writes `docs/logs/benchmark/<preset>.md`)

> Each sweep cell uses the **Translation Pipeline** (Feature 6), specifically `translator-llm.buildTieredContextWindow` + `translator-llm.translateChunkWithContext`, so it grades under identical conditions to production.

---

## 13. AI Interaction Logging

In-memory ring buffer capturing every LLM prompt/response, grouped by originating loop (translation / retranslate / mapping / benchmark) and split by preset, then flushed to `docs/logs/<loop>/<preset>.md` at run end.

| Item | Value |
|---|---|
| **Main function** | `flushLoopToDisk` |
| **Module** | `logger` |

**Pipeline:**
1. `logger.beginLoop` (set active loop cursor)
2. `logger.logAIInteraction` (capture entry; 5-field schema)
3. `logger.markSession` (session boundary)
4. `logger.flushLoopToDisk` (write to disk via `serve.py`) → `logger.getPresetsForLoop` · `logger.exportPresetAsMarkdown`
5. `logger.setCaptureEnabled` / `logger.isCaptureEnabled` (toggle; defaults ON)

> Disk write requires the `serve.py` dev server's `POST /__write_log` endpoint. With a plain static server, the in-memory buffer still captures; only disk flush is skipped.

---

## 14. Debug Modal & Stylization-Map Editor

The draggable debug modal with two pages: translation/stylization settings (page 1) and the benchmark suite (page 2). Includes the stylization-map CRUD editor and the discovered-mappings review UI.

| Item | Value |
|---|---|
| **Main function** | `openDebugMenu` |
| **Module** | `ui` |

**Pipeline:**
1. `ui.openDebugMenu` → `ui.updateDebugPageDisplay` · `ui.renderDistinctPresetControls` · `ui.renderDiscoveredMappingsUI` · `ui.setSaveMapButtonEnabled` · `ui.initStylizationMapEditorSaveActivation`
2. `ui.switchDebugPage` → `ui.updateDebugPageDisplay`
3. `ui.closeDebugMenu` → `ui.orderStylizationMap` · `database.saveUIStateToCache` · `ui-manual-step.syncManualStepUIVisibility`
4. `ui.closeDebugMenuWithoutSaving` (cancel path)
5. Map editor: `ui.saveStylizationMapFromView` → `ui.orderStylizationMap` · `database.saveUIStateToCache` · `ui.setSaveMapButtonEnabled`
6. Discovered mappings: `ui.renderDiscoveredMappingsUI` → `ui.setAllDiscoveredSelection` · `ui.toggleDiscoveredSelection` · `ui.updateDiscoveredKey` · `ui.updateDiscoveredVal` · `ui.commitApprovedMappingsToMap` · `ui.deleteSelectedDiscoveredMappings` · `ui.copyStylizationMapToClipboard`

> `renderDistinctPresetControls` wires each row to the **Preset System** (Feature 5) via `translator-presets.loadSpecificPreset`.

---

## 15. Notification Banner

Shared error/success/warning banner (`#errorBanner`) used across modules.

| Item | Value |
|---|---|
| **Main function** | `setBanner` |
| **Module** | `ui` |

**Pipeline:** `ui.showError` / `ui.showSuccess` / `ui.showWarning` → `ui.setBanner` (and `ui.clearError` to hide)

---

## 16. DOM Layout Helpers

Pure DOM layout: draggable modal, column/row/pane resizers, footer sync, auto-resizing number inputs. No translation or state logic.

| Item | Value |
|---|---|
| **Main function** | `initPaneResizer` |
| **Module** | `ui-layout` |

**Pipeline:**
1. `ui-layout.initDraggableModal` → `ui-layout.onMouseMove` · `ui-layout.onMouseUp`
2. `ui-layout.initPaneResizer` → `ui-layout.initColResizer` · `ui-layout.initRowResizer` (+ `_initColResizer` · `_initRowResizer` · `syncFooter` / `_syncFooter`)
3. `ui-layout.initAutoNumberInputs` → `ui-layout.resize`

---

## 17. Manual Edits & Export

Save manual left-pane edits back to the registry, inject right-pane text into the target file, and export the selected file as a downloaded JSON blob.

| Item | Value |
|---|---|
| **Main function** | `saveEditsToMemory` (save) · `downloadFile` (export) |
| **Module** | `parser` |

**Pipeline:**
- Save edits: `parser.saveEditsToMemory` → `parser.saveFilesToCache` · `ui.showError` / `ui.showSuccess`
- Inject right: `parser.injectTranslationToRight` → `parser.commitTextToRightFile` · `ui.showError`
- Export: `parser.downloadFile` → `ui.showError`

---

## Cross-Feature Pipeline Reuse (summary)

| Reusing feature | Reuses pipeline |
|---|---|
| Translation Pipeline (6) | Validation Pipeline (9), via `translateChunkWithContext` |
| Name Plate Resolution (8) | Validation Pipeline (9), via `translateChunkWithContext` |
| Manual Step-by-Step Review (11) | Translation Pipeline (6) via `flushBuffer`; Tiered Context Summarization (10) via `buildTieredContextWindow` |
| Benchmark Sweep (12) | Translation Pipeline (6) via `buildTieredContextWindow` + `translateChunkWithContext` |
| Debug Modal (14) | Preset System (5), via `loadSpecificPreset` |
| AI Interaction Logging (13) | Flushed by every loop pipeline (6, 7b, 11, 12) via `flushLoopToDisk` |
