# Function Manifest Audit Report

This report contains machine-parseable update directives for both source `.js` files and `FUNCTION_MANIFEST.md`.

--------------------------------------------------

### [ACTION REQUIRED] loadFiles
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Handles the file selection event via FileReader, reads file content asynchronously, and passes it to JSON parsing[cite: 7].' vs Manifest: 'Loads one or more JSON files from a file input into the registry'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Handles the file selection event via FileReader, reads file content asynchronously, and passes it to JSON parsing[cite: 7].
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadFiles — Handles the file selection event via FileReader, reads file content asynchronously, and passes it to JSON parsing[cite: 7].
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- checkFinishedReads, parseContentToJSON, showError
```

---

### [ACTION REQUIRED] checkFinishedReads
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Checks if all asynchronous file reading operations have finished, then triggers application state refresh and caching[cite: 7].' vs Manifest: 'Processes completed FileReader reads, parses each, and refreshes application state'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Checks if all asynchronous file reading operations have finished, then triggers application state refresh and caching[cite: 7].
 * Called by: parser.js (loadFiles)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### checkFinishedReads — Checks if all asynchronous file reading operations have finished, then triggers application state refresh and caching[cite: 7].
#### What function call it:
- parser.js (loadFiles)
#### What functions are used in it :
- refreshApplicationState, saveFilesToCache, saveUIStateToCache
```

---

### [ACTION REQUIRED] removeFile
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Removes a specified file from the loaded files registry, updates the application state, and updates the cache[cite: 7].' vs Manifest: 'Removes a file from the registry by name and refreshes state'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Removes a specified file from the loaded files registry, updates the application state, and updates the cache[cite: 7].
 * Called by: parser.js (updateFileListUI)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### removeFile — Removes a specified file from the loaded files registry, updates the application state, and updates the cache[cite: 7].
#### What function call it:
- parser.js (updateFileListUI)
#### What functions are used in it :
- refreshApplicationState, saveFilesToCache, saveUIStateToCache
```

---

### [ACTION REQUIRED] parseContentToJSON
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Safely parses text content into a JSON object, attempting alternative regex extraction if standard parsing fails[cite: 7].' vs Manifest: 'Parses raw file content into JSON, with regex-extraction fallback'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Safely parses text content into a JSON object, attempting alternative regex extraction if standard parsing fails[cite: 7].
 * Called by: parser.js (loadFiles)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### parseContentToJSON — Safely parses text content into a JSON object, attempting alternative regex extraction if standard parsing fails[cite: 7].
#### What function call it:
- parser.js (loadFiles)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] refreshApplicationState
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Refreshes all core user interface elements including file lists, dropdowns, and comparison views[cite: 7].' vs Manifest: 'Refreshes all core UI elements: file lists, dropdowns, and comparison views'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Refreshes all core user interface elements including file lists, dropdowns, and comparison views[cite: 7].
 * Called by: parser.js (checkFinishedReads, removeFile)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### refreshApplicationState — Refreshes all core user interface elements including file lists, dropdowns, and comparison views[cite: 7].
#### What function call it:
- parser.js (checkFinishedReads, removeFile)
#### What functions are used in it :
- renderComparisonViews, updateBenchmarkFileDropdown, updateFileDropdowns, updateFileListUI, updateMasterIDList
```

---

### [ACTION REQUIRED] updateFileListUI
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the visual tag list displaying all currently loaded files and global warning indicators[cite: 7].' vs Manifest: 'Renders the file list in the sidebar'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the visual tag list displaying all currently loaded files and global warning indicators[cite: 7].
 * Called by: parser.js (refreshApplicationState)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateFileListUI — Updates the visual tag list displaying all currently loaded files and global warning indicators[cite: 7].
#### What function call it:
- parser.js (refreshApplicationState)
#### What functions are used in it :
- removeFile
```

---

### [ACTION REQUIRED] updateFileDropdowns
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Populates the source file selection dropdowns on the UI[cite: 7].' vs Manifest: 'Populates the left/right file selection dropdowns'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Populates the source file selection dropdowns on the UI[cite: 7].
 * Called by: parser.js (refreshApplicationState)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateFileDropdowns — Populates the source file selection dropdowns on the UI[cite: 7].
#### What function call it:
- parser.js (refreshApplicationState)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] updateBenchmarkFileDropdown
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Populates the reference file selection dropdown specific to the benchmark suite[cite: 7].' vs Manifest: 'Populates the benchmark reference file dropdown'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Populates the reference file selection dropdown specific to the benchmark suite[cite: 7].
 * Called by: parser.js (refreshApplicationState)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateBenchmarkFileDropdown — Populates the reference file selection dropdown specific to the benchmark suite[cite: 7].
#### What function call it:
- parser.js (refreshApplicationState)
#### What functions are used in it :
- updateBenchmarkSceneDropdown
```

---

### [ACTION REQUIRED] updateBenchmarkSceneDropdown
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Populates the scene ID dropdown based on the selected reference file for benchmarking[cite: 7].' vs Manifest: 'Populates the benchmark reference scene dropdown based on the selected file'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Populates the scene ID dropdown based on the selected reference file for benchmarking[cite: 7].
 * Called by: parser.js (updateBenchmarkFileDropdown)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateBenchmarkSceneDropdown — Populates the scene ID dropdown based on the selected reference file for benchmarking[cite: 7].
#### What function call it:
- parser.js (updateBenchmarkFileDropdown)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] updateMasterIDList
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the master script ID selection dropdown with unique keys across all loaded files[cite: 7].' vs Manifest: 'Populates the master script ID list from all loaded files'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the master script ID selection dropdown with unique keys across all loaded files[cite: 7].
 * Called by: parser.js (commitTextToRightFile, refreshApplicationState)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateMasterIDList — Updates the master script ID selection dropdown with unique keys across all loaded files[cite: 7].
#### What function call it:
- parser.js (commitTextToRightFile, refreshApplicationState)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] onSelectID
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Event handler triggered when a new script ID is selected, updating comparison views and saving state[cite: 7].' vs Manifest: 'Handles script selection change, renders comparison views, saves UI state'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Event handler triggered when a new script ID is selected, updating comparison views and saving state[cite: 7].
 * Called by: parser.js (onSelectIDMobile)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### onSelectID — Event handler triggered when a new script ID is selected, updating comparison views and saving state[cite: 7].
#### What function call it:
- parser.js (onSelectIDMobile)
#### What functions are used in it :
- renderComparisonViews, saveUIStateToCache
```

---

### [ACTION REQUIRED] onSelectIDMobile
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Event handler triggered when a new script ID is selected from the mobile dropdown. Syncs the main select element and triggers the standard update.' vs Manifest: 'Syncs the mobile select element with the main select and triggers the standard update'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Event handler triggered when a new script ID is selected from the mobile dropdown. Syncs the main select element and triggers the standard update.
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### onSelectIDMobile — Event handler triggered when a new script ID is selected from the mobile dropdown. Syncs the main select element and triggers the standard update.
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- onSelectID
```

---

### [ACTION REQUIRED] onCompareSelectionChange
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Event handler triggered when comparison file selections change, updating views and saving state[cite: 7].' vs Manifest: 'Handles left/right file selection comparison change, renders views, saves UI state'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Event handler triggered when comparison file selections change, updating views and saving state[cite: 7].
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### onCompareSelectionChange — Event handler triggered when comparison file selections change, updating views and saving state[cite: 7].
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- renderComparisonViews, saveUIStateToCache
```

---

### [ACTION REQUIRED] renderComparisonViews
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Extracts and populates text content for the left and right comparison text areas based on current selections[cite: 7].' vs Manifest: 'Renders the left (source) and right (translated) comparison text areas'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Extracts and populates text content for the left and right comparison text areas based on current selections[cite: 7].
 * Called by: parser.js (commitTextToRightFile, onCompareSelectionChange, onSelectID, refreshApplicationState)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### renderComparisonViews — Extracts and populates text content for the left and right comparison text areas based on current selections[cite: 7].
#### What function call it:
- parser.js (commitTextToRightFile, onCompareSelectionChange, onSelectID, refreshApplicationState)
#### What functions are used in it :
- extractScriptText
```

---

### [ACTION REQUIRED] extractScriptText
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Extracts raw text blocks or script lines safely from a data object using specific key paths or fallback structures[cite: 7].' vs Manifest: 'Extracts the script text for a given key from a file data object'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Extracts raw text blocks or script lines safely from a data object using specific key paths or fallback structures[cite: 7].
 * Called by: parser.js (renderComparisonViews)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### extractScriptText — Extracts raw text blocks or script lines safely from a data object using specific key paths or fallback structures[cite: 7].
#### What function call it:
- parser.js (renderComparisonViews)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] saveEditsToMemory
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Saves manual edits made in the left text area back into the respective file registry object in memory[cite: 7].' vs Manifest: 'Saves manual edits from the left text area back into the file registry in memory'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Saves manual edits made in the left text area back into the respective file registry object in memory[cite: 7].
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### saveEditsToMemory — Saves manual edits made in the left text area back into the respective file registry object in memory[cite: 7].
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- saveFilesToCache, showError, showSuccess
```

---

### [ACTION REQUIRED] commitTextToRightFile
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Commits line arrays into the target file registry object, updates views, and caches changes[cite: 7].' vs Manifest: 'Commits translated text to the right-hand file object and updates the master ID list'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Commits line arrays into the target file registry object, updates views, and caches changes[cite: 7].
 * Called by: parser.js (injectTranslationToRight, maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### commitTextToRightFile — Commits line arrays into the target file registry object, updates views, and caches changes[cite: 7].
#### What function call it:
- parser.js (injectTranslationToRight, maxContextLines)
#### What functions are used in it :
- renderComparisonViews, saveFilesToCache, updateMasterIDList
```

---

### [ACTION REQUIRED] injectTranslationToRight
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Injects the text currently in the left output area into the right target file registry[cite: 7].' vs Manifest: 'Injects the current right-hand text into the target file'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Injects the text currently in the left output area into the right target file registry[cite: 7].
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### injectTranslationToRight — Injects the text currently in the left output area into the right target file registry[cite: 7].
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- commitTextToRightFile, showError
```

---

### [ACTION REQUIRED] downloadFile
- **Target File:** `js/parser.js`
- **Warning:** Description mismatch. JSDoc: 'Generates and triggers a browser download for a JSON file export of the specified registry item[cite: 7].' vs Manifest: 'Downloads a file from the registry as a blob'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Generates and triggers a browser download for a JSON file export of the specified registry item[cite: 7].
 * Called by: parser.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### downloadFile — Generates and triggers a browser download for a JSON file export of the specified registry item[cite: 7].
#### What function call it:
- parser.js ((none))
#### What functions are used in it :
- showError
```

---

### [ACTION REQUIRED] openDatabase
- **Target File:** `js/database.js`
- **Warning:** Description mismatch. JSDoc: 'Opens or initializes the IndexedDB database used for caching application state and loaded files[cite: 7].' vs Manifest: 'Opens (or creates) the IndexedDB database and object store'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Opens or initializes the IndexedDB database used for caching application state and loaded files[cite: 7].
 * Called by: database.js (loadFilesFromCache, loadUIStateFromCache, saveFilesToCache, saveUIStateToCache)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### openDatabase — Opens or initializes the IndexedDB database used for caching application state and loaded files[cite: 7].
#### What function call it:
- database.js (loadFilesFromCache, loadUIStateFromCache, saveFilesToCache, saveUIStateToCache)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] saveFilesToCache
- **Target File:** `js/database.js`
- **Warning:** Description mismatch. JSDoc: 'Saves the current registry of loaded files into IndexedDB storage[cite: 7].' vs Manifest: 'Persists the loaded file registry to IndexedDB'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Saves the current registry of loaded files into IndexedDB storage[cite: 7].
 * Called by: database.js (checkFinishedReads, commitTextToRightFile, removeFile, saveEditsToMemory)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### saveFilesToCache — Saves the current registry of loaded files into IndexedDB storage[cite: 7].
#### What function call it:
- database.js (checkFinishedReads, commitTextToRightFile, removeFile, saveEditsToMemory)
#### What functions are used in it :
- openDatabase
```

---

### [ACTION REQUIRED] loadFilesFromCache
- **Target File:** `js/database.js`
- **Warning:** Description mismatch. JSDoc: 'Retrieves the cached file registry from IndexedDB[cite: 7].' vs Manifest: 'Retrieves the cached file registry from IndexedDB'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Retrieves the cached file registry from IndexedDB[cite: 7].
 * Called by: database.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadFilesFromCache — Retrieves the cached file registry from IndexedDB[cite: 7].
#### What function call it:
- database.js ((none))
#### What functions are used in it :
- openDatabase
```

---

### [ACTION REQUIRED] saveUIStateToCache
- **Target File:** `js/database.js`
- **Warning:** Description mismatch. JSDoc: 'Saves the current user interface options and settings values into IndexedDB[cite: 7].' vs Manifest: 'Persists the current UI settings (dropdowns, debug flags, stylization map, bracket toggles) to IndexedDB'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Saves the current user interface options and settings values into IndexedDB[cite: 7].
 * Called by: database.js (checkFinishedReads, closeDebugMenu, commitApprovedMappingsToMap, onCompareSelectionChange, onSelectID, removeFile, saveStylizationMapFromView, syncManualStepModeLive)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### saveUIStateToCache — Saves the current user interface options and settings values into IndexedDB[cite: 7].
#### What function call it:
- database.js (checkFinishedReads, closeDebugMenu, commitApprovedMappingsToMap, onCompareSelectionChange, onSelectID, removeFile, saveStylizationMapFromView, syncManualStepModeLive)
#### What functions are used in it :
- openDatabase
```

---

### [ACTION REQUIRED] loadUIStateFromCache
- **Target File:** `js/database.js`
- **Warning:** Description mismatch. JSDoc: 'Retrieves cached user interface state settings from IndexedDB[cite: 7].' vs Manifest: 'Retrieves cached UI state settings from IndexedDB'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Retrieves cached user interface state settings from IndexedDB[cite: 7].
 * Called by: database.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadUIStateFromCache — Retrieves cached user interface state settings from IndexedDB[cite: 7].
#### What function call it:
- database.js ((none))
#### What functions are used in it :
- openDatabase
```

---

### [ACTION REQUIRED] mapPresetJsonQuiet
- **Target File:** `js/translator-presets.js`
- **Warning:** Description mismatch. JSDoc: 'Manifest of default preset JSON files shipped in the `default_presets/` directory. Each entry maps a preset file to the operation key it overrides (matching `operationPresets`). Add a new file to `default_presets/` and append an entry here to make it appear as a loadable default. export const defaultPresetManifest = [ { file: 'default_presets/benchmark_prompt.json', operationKey: 'benchmark', label: 'Benchmark Prompt' }, { file: 'default_presets/japanese_to_english.json', operationKey: 'jpEn', label: 'Japanese to English' }, { file: 'default_presets/retry_translation.json', operationKey: 'retry', label: 'Retry Translation' }, { file: 'default_presets/name_plate_unique.json', operationKey: 'namePlate', label: 'Name Plate Unique' }, { file: 'default_presets/stylization_mapping.json', operationKey: 'stylization', label: 'Stylization Mapping' }, { file: 'default_presets/stylization_punctuation.json', operationKey: 'stylizationPunctuation', label: 'Stylization Punctuation' }, { file: 'default_presets/stylization_sounds.json', operationKey: 'stylizationSounds', label: 'Stylization Sounds' }, { file: 'default_presets/stylization_ticks.json', operationKey: 'stylizationTicks', label: 'Stylization Ticks' }, { file: 'default_presets/recent_summary.json', operationKey: 'recentSummary', label: 'Recent Scene Summary' }, { file: 'default_presets/archival_summary.json', operationKey: 'archivalSummary', label: 'Archival Story State' }, { file: 'default_presets/translation_validator.json', operationKey: 'validator', label: 'Translation Validator' } ]; Maps a parsed preset JSON object onto an operation-specific configuration object, logging (not error-bannering) the result. Used by the silent default-preset loader path so startup does not spam the error banner for every loaded default.' vs Manifest: 'Maps a parsed preset JSON onto an operation config, logging (not error-bannering) the result; used by the silent default loader'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Manifest of default preset JSON files shipped in the `default_presets/` directory. Each entry maps a preset file to the operation key it overrides (matching `operationPresets`). Add a new file to `default_presets/` and append an entry here to make it appear as a loadable default. export const defaultPresetManifest = [ { file: 'default_presets/benchmark_prompt.json', operationKey: 'benchmark', label: 'Benchmark Prompt' }, { file: 'default_presets/japanese_to_english.json', operationKey: 'jpEn', label: 'Japanese to English' }, { file: 'default_presets/retry_translation.json', operationKey: 'retry', label: 'Retry Translation' }, { file: 'default_presets/name_plate_unique.json', operationKey: 'namePlate', label: 'Name Plate Unique' }, { file: 'default_presets/stylization_mapping.json', operationKey: 'stylization', label: 'Stylization Mapping' }, { file: 'default_presets/stylization_punctuation.json', operationKey: 'stylizationPunctuation', label: 'Stylization Punctuation' }, { file: 'default_presets/stylization_sounds.json', operationKey: 'stylizationSounds', label: 'Stylization Sounds' }, { file: 'default_presets/stylization_ticks.json', operationKey: 'stylizationTicks', label: 'Stylization Ticks' }, { file: 'default_presets/recent_summary.json', operationKey: 'recentSummary', label: 'Recent Scene Summary' }, { file: 'default_presets/archival_summary.json', operationKey: 'archivalSummary', label: 'Archival Story State' }, { file: 'default_presets/translation_validator.json', operationKey: 'validator', label: 'Translation Validator' } ]; Maps a parsed preset JSON object onto an operation-specific configuration object, logging (not error-bannering) the result. Used by the silent default-preset loader path so startup does not spam the error banner for every loaded default.
 * Called by: translator-presets.js (loadAllDefaultPresets)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### mapPresetJsonQuiet — Manifest of default preset JSON files shipped in the `default_presets/` directory. Each entry maps a preset file to the operation key it overrides (matching `operationPresets`). Add a new file to `default_presets/` and append an entry here to make it appear as a loadable default. export const defaultPresetManifest = [ { file: 'default_presets/benchmark_prompt.json', operationKey: 'benchmark', label: 'Benchmark Prompt' }, { file: 'default_presets/japanese_to_english.json', operationKey: 'jpEn', label: 'Japanese to English' }, { file: 'default_presets/retry_translation.json', operationKey: 'retry', label: 'Retry Translation' }, { file: 'default_presets/name_plate_unique.json', operationKey: 'namePlate', label: 'Name Plate Unique' }, { file: 'default_presets/stylization_mapping.json', operationKey: 'stylization', label: 'Stylization Mapping' }, { file: 'default_presets/stylization_punctuation.json', operationKey: 'stylizationPunctuation', label: 'Stylization Punctuation' }, { file: 'default_presets/stylization_sounds.json', operationKey: 'stylizationSounds', label: 'Stylization Sounds' }, { file: 'default_presets/stylization_ticks.json', operationKey: 'stylizationTicks', label: 'Stylization Ticks' }, { file: 'default_presets/recent_summary.json', operationKey: 'recentSummary', label: 'Recent Scene Summary' }, { file: 'default_presets/archival_summary.json', operationKey: 'archivalSummary', label: 'Archival Story State' }, { file: 'default_presets/translation_validator.json', operationKey: 'validator', label: 'Translation Validator' } ]; Maps a parsed preset JSON object onto an operation-specific configuration object, logging (not error-bannering) the result. Used by the silent default-preset loader path so startup does not spam the error banner for every loaded default.
#### What function call it:
- translator-presets.js (loadAllDefaultPresets)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] mapPresetJson
- **Target File:** `js/translator-presets.js`
- **Warning:** Description mismatch. JSDoc: 'Maps a parsed preset JSON object onto an operation-specific configuration object, then surfaces a success banner. Used by the interactive (file-upload) preset path.' vs Manifest: 'Maps a parsed preset JSON onto an operation config, then surfaces a success banner; used by the interactive upload path'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Maps a parsed preset JSON object onto an operation-specific configuration object, then surfaces a success banner. Used by the interactive (file-upload) preset path.
 * Called by: translator-presets.js (loadDefaultPreset, loadSpecificPreset)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### mapPresetJson — Maps a parsed preset JSON object onto an operation-specific configuration object, then surfaces a success banner. Used by the interactive (file-upload) preset path.
#### What function call it:
- translator-presets.js (loadDefaultPreset, loadSpecificPreset)
#### What functions are used in it :
- updatePresetDisplayText
```

---

### [MISSING] updatePresetDisplayText
- **Target File:** `js/translator-presets.js`
- **Error:** Missing from Manifest.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the preset file-input display label to show the loaded file's name. The display elements are created by renderDistinctPresetControls() keyed by data-operation-key, so this locates the matching one and sets its text.
 * Called by: translator-presets.js (mapPresetJson)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updatePresetDisplayText — Updates the preset file-input display label to show the loaded file's name. The display elements are created by renderDistinctPresetControls() keyed by data-operation-key, so this locates the matching one and sets its text.
#### What function call it:
- translator-presets.js (mapPresetJson)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] loadSpecificPreset
- **Target File:** `js/translator-presets.js`
- **Warning:** Description mismatch. JSDoc: 'Loads and maps preset configurations from an uploaded JSON file for a specified operation type.' vs Manifest: 'Loads and maps preset config from an uploaded JSON file for a specified operation'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Loads and maps preset configurations from an uploaded JSON file for a specified operation type.
 * Called by: translator-presets.js (renderDistinctPresetControls)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadSpecificPreset — Loads and maps preset configurations from an uploaded JSON file for a specified operation type.
#### What function call it:
- translator-presets.js (renderDistinctPresetControls)
#### What functions are used in it :
- mapPresetJson, showError
```

---

### [ACTION REQUIRED] loadDefaultPreset
- **Target File:** `js/translator-presets.js`
- **Warning:** Description mismatch. JSDoc: 'Fetches a shipped default preset JSON from the `default_presets/` directory and applies it to the matching operation.' vs Manifest: 'Fetches a shipped default preset JSON from default_presets/ and applies it to the matching operation'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Fetches a shipped default preset JSON from the `default_presets/` directory and applies it to the matching operation.
 * Called by: translator-presets.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadDefaultPreset — Fetches a shipped default preset JSON from the `default_presets/` directory and applies it to the matching operation.
#### What function call it:
- translator-presets.js ((none))
#### What functions are used in it :
- mapPresetJson, showError
```

---

### [ACTION REQUIRED] loadAllDefaultPresets
- **Target File:** `js/translator-presets.js`
- **Warning:** Description mismatch. JSDoc: 'Loads every shipped default preset from `default_presets/` into `operationPresets` so the translation prompts have their default configuration available in memory without any user action.' vs Manifest: 'Loads every shipped default preset from default_presets/ into operationPresets on startup'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Loads every shipped default preset from `default_presets/` into `operationPresets` so the translation prompts have their default configuration available in memory without any user action.
 * Called by: translator-presets.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### loadAllDefaultPresets — Loads every shipped default preset from `default_presets/` into `operationPresets` so the translation prompts have their default configuration available in memory without any user action.
#### What function call it:
- translator-presets.js ((none))
#### What functions are used in it :
- mapPresetJsonQuiet
```

---

### [ACTION REQUIRED] isValidMappingPair
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Validates a key/value pair from a stylization mapping output. Rejects empty keys, keys with newlines, pure-numeric keys, and object/array values. Returns true if the pair is valid.' vs Manifest: 'Validates a key/value pair from a stylization mapping output (rejects empty keys, sentences, single kana, pure ASCII, etc.)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Validates a key/value pair from a stylization mapping output. Rejects empty keys, keys with newlines, pure-numeric keys, and object/array values. Returns true if the pair is valid.
 * Called by: translator.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### isValidMappingPair — Validates a key/value pair from a stylization mapping output. Rejects empty keys, keys with newlines, pure-numeric keys, and object/array values. Returns true if the pair is valid.
#### What function call it:
- translator.js ((none))
#### What functions are used in it :
- (none)
```

---

### [MISSING] kanjiCount
- **Target File:** `js/translator.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: translator.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### kanjiCount — No description provided.
#### What function call it:
- translator.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] stripLine
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop (skipping the reserved __priorityOverride__ key), stripping name brackets only when the active bracket-strip XOR context is on. Returns the cleaned text to send to the AI and the list of matched patterns. When the line collapses to nothing (it was entirely stylization), flushOnly is true so the caller can push the extracted stylizations directly and skip translation.' vs Manifest: 'Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop (skipping the reserved __priorityOverride__ key), stripping name brackets only when the active bracket-strip XOR context is on. Returns the cleaned text to send to the AI and the list of matched patterns. When the line collapses to nothing (it was entirely stylization), flushOnly is true so the caller can push the extracted stylizations directly and skip translation.
 * Called by: translator.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### stripLine — Runs the stylization strip phase on a single source line: priority override pre-pass, then the heavyStylizationMap replacement loop (skipping the reserved __priorityOverride__ key), stripping name brackets only when the active bracket-strip XOR context is on. Returns the cleaned text to send to the AI and the list of matched patterns. When the line collapses to nothing (it was entirely stylization), flushOnly is true so the caller can push the extracted stylizations directly and skip translation.
#### What function call it:
- translator.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [MISSING] inlineReplacement
- **Target File:** `js/translator.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: translator.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### inlineReplacement — No description provided.
#### What function call it:
- translator.js ((none))
#### What functions are used in it :
- renderDiscoveredMappingsUI, setSaveMapButtonEnabled, showError, showWarning
```

---

### [ACTION REQUIRED] stopTranslation
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Aborts ongoing translation or generation processes using an active AbortController.' vs Manifest: 'Aborts the active process via the AbortController and sets the abortWarningShown guard so the in-flight catch block surfaces a yellow warning banner naming the cancelled process (translation / mapping / benchmark)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Aborts ongoing translation or generation processes using an active AbortController.
 * Called by: translator.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### stopTranslation — Aborts ongoing translation or generation processes using an active AbortController.
#### What function call it:
- translator.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] resolveNamePlate
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name. Shared by the production pipeline (translateViaAiServer) and the benchmark sweep so both use the identical name-plate resolution path (namePlate preset, knownNamesMap caching). Returns { namePlateLine, speakerName } where speakerName is "Narrator" when the plate is empty (denoting narration) and the resolved name otherwise.' vs Manifest: 'Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name; merges JP->EN name into the stylization map'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name. Shared by the production pipeline (translateViaAiServer) and the benchmark sweep so both use the identical name-plate resolution path (namePlate preset, knownNamesMap caching). Returns { namePlateLine, speakerName } where speakerName is "Narrator" when the plate is empty (denoting narration) and the resolved name otherwise.
 * Called by: translator.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### resolveNamePlate — Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name. Shared by the production pipeline (translateViaAiServer) and the benchmark sweep so both use the identical name-plate resolution path (namePlate preset, knownNamesMap caching). Returns { namePlateLine, speakerName } where speakerName is "Narrator" when the plate is empty (denoting narration) and the resolved name otherwise.
#### What function call it:
- translator.js (maxContextLines)
#### What functions are used in it :
- promptUserForNameTranslation, translateChunkWithContext
```

---

### [ACTION REQUIRED] makeSummaryStateAccessor
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Builds a getter/setter accessor object that lets buildTieredContextWindow mutate the flushBuffer-scoped summary variables in place. The accessor proxies reads/writes through closures so the tiered-summary state stays alive across the manual-step retranslate loop.' vs Manifest: 'Builds a getter/setter accessor object that lets buildTieredContextWindow mutate flushBuffer-scoped summary variables in place'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Builds a getter/setter accessor object that lets buildTieredContextWindow mutate the flushBuffer-scoped summary variables in place. The accessor proxies reads/writes through closures so the tiered-summary state stays alive across the manual-step retranslate loop.
 * Called by: translator.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### makeSummaryStateAccessor — Builds a getter/setter accessor object that lets buildTieredContextWindow mutate the flushBuffer-scoped summary variables in place. The accessor proxies reads/writes through closures so the tiered-summary state stays alive across the manual-step retranslate loop.
#### What function call it:
- translator.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] reconstructManualStepDisplayBlock
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Reconstructs the manual-step display block for a target translatedLines entry by replaying the same filter(l !== "") + join("\n") display order the main output uses. A single translatedLines entry may span multiple display lines (multi-line narration), so we cannot map to a single display-line index. Returns the edited text or the fallback combined translation when the block cannot be located.' vs Manifest: 'Reconstructs the manual-step display block for a target translatedLines entry by replaying the filter+join display order'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Reconstructs the manual-step display block for a target translatedLines entry by replaying the same filter(l !== "") + join("\n") display order the main output uses. A single translatedLines entry may span multiple display lines (multi-line narration), so we cannot map to a single display-line index. Returns the edited text or the fallback combined translation when the block cannot be located.
 * Called by: translator.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### reconstructManualStepDisplayBlock — Reconstructs the manual-step display block for a target translatedLines entry by replaying the same filter(l !== "") + join("\n") display order the main output uses. A single translatedLines entry may span multiple display lines (multi-line narration), so we cannot map to a single display-line index. Returns the edited text or the fallback combined translation when the block cannot be located.
#### What function call it:
- translator.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] flattenTranslatedLines
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines, so the final outputAreaRight value is one line per row.' vs Manifest: 'Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines, so the final outputAreaRight value is one line per row.
 * Called by: translator.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### flattenTranslatedLines — Flattens a translatedLines array whose entries may contain embedded newlines into a single flat array of display lines, so the final outputAreaRight value is one line per row.
#### What function call it:
- translator.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] translateViaAiServer
- **Target File:** `js/translator.js`
- **Warning:** Description mismatch. JSDoc: 'Manages the core sequential translation loop across lines, handling buffers, name plates, stylized pattern matching, context windows, and manual step checkpoints. Runs the strip phase per dialogue line, flushes the dialogue buffer through translateChunkWithContext, maintains the tiered summary context, and commits the final result to the right-hand file.' vs Manifest: 'Core sequential translation loop: buffers dialogue, strips stylization, resolves name plates, translates via translateChunkWithContext, handles manual-step checkpoints, commits to file'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Manages the core sequential translation loop across lines, handling buffers, name plates, stylized pattern matching, context windows, and manual step checkpoints. Runs the strip phase per dialogue line, flushes the dialogue buffer through translateChunkWithContext, maintains the tiered summary context, and commits the final result to the right-hand file.
 * Called by: translator.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### translateViaAiServer — Manages the core sequential translation loop across lines, handling buffers, name plates, stylized pattern matching, context windows, and manual step checkpoints. Runs the strip phase per dialogue line, flushes the dialogue buffer through translateChunkWithContext, maintains the tiered summary context, and commits the final result to the right-hand file.
#### What function call it:
- translator.js ((none))
#### What functions are used in it :
- clearError
```

---

### [MISSING] maxContextLines
- **Target File:** `js/translator.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: translator.js (buildTieredContextWindow)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### maxContextLines — No description provided.
#### What function call it:
- translator.js (buildTieredContextWindow)
#### What functions are used in it :
- buildTieredContextWindow, commitTextToRightFile, flattenTranslatedLines, hideCurrentSourceLine, makeSummaryStateAccessor, promptUserForManualStep, reconstructManualStepDisplayBlock, resolveNamePlate, setCurrentSourceLine, showError, showWarning, stripLine, translateChunkWithContext, wrapTextToLines
```

---

### [ACTION REQUIRED] setBanner
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Applies a banner variant class to #errorBanner, shows it, and sets its text. Shared by showError / showSuccess / showWarning so all three reuse the same #errorBanner element, swapping only the palette class.' vs Manifest: 'Applies a banner variant class to #errorBanner, shows it, and sets its text (shared by showError/showSuccess/showWarning)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Applies a banner variant class to #errorBanner, shows it, and sets its text. Shared by showError / showSuccess / showWarning so all three reuse the same #errorBanner element, swapping only the palette class.
 * Called by: ui.js (showError, showSuccess, showWarning)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### setBanner — Applies a banner variant class to #errorBanner, shows it, and sets its text. Shared by showError / showSuccess / showWarning so all three reuse the same #errorBanner element, swapping only the palette class.
#### What function call it:
- ui.js (showError, showSuccess, showWarning)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] showError
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Displays a red error message banner on the user interface and logs it to the console.' vs Manifest: 'Displays a red error message banner and logs to console'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Displays a red error message banner on the user interface and logs it to the console.
 * Called by: ui.js (closeDebugMenu, commitApprovedMappingsToMap, copyStylizationMapToClipboard, deleteSelectedDiscoveredMappings, downloadFile, fetchAiModels, injectTranslationToRight, inlineReplacement, loadDefaultPreset, loadFiles, loadSpecificPreset, maxContextLines, saveEditsToMemory, saveStylizationMapFromView)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### showError — Displays a red error message banner on the user interface and logs it to the console.
#### What function call it:
- ui.js (closeDebugMenu, commitApprovedMappingsToMap, copyStylizationMapToClipboard, deleteSelectedDiscoveredMappings, downloadFile, fetchAiModels, injectTranslationToRight, inlineReplacement, loadDefaultPreset, loadFiles, loadSpecificPreset, maxContextLines, saveEditsToMemory, saveStylizationMapFromView)
#### What functions are used in it :
- setBanner
```

---

### [ACTION REQUIRED] showSuccess
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Displays a green success banner on the user interface and logs it to the console.' vs Manifest: 'Displays a green success banner and logs to console'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Displays a green success banner on the user interface and logs it to the console.
 * Called by: ui.js (saveEditsToMemory)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### showSuccess — Displays a green success banner on the user interface and logs it to the console.
#### What function call it:
- ui.js (saveEditsToMemory)
#### What functions are used in it :
- setBanner
```

---

### [ACTION REQUIRED] showWarning
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Displays a yellow warning banner on the user interface and logs it to the console.' vs Manifest: 'Displays a yellow warning banner and logs to console'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Displays a yellow warning banner on the user interface and logs it to the console.
 * Called by: ui.js (inlineReplacement, maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### showWarning — Displays a yellow warning banner on the user interface and logs it to the console.
#### What function call it:
- ui.js (inlineReplacement, maxContextLines)
#### What functions are used in it :
- setBanner
```

---

### [ACTION REQUIRED] clearError
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Clears and hides the message banner (works for error, success, and warning variants).' vs Manifest: 'Clears and hides the message banner (error, success, or warning)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Clears and hides the message banner (works for error, success, and warning variants).
 * Called by: ui.js (fetchAiModels, translateViaAiServer)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### clearError — Clears and hides the message banner (works for error, success, and warning variants).
#### What function call it:
- ui.js (fetchAiModels, translateViaAiServer)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] renderDistinctPresetControls
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Dynamically renders one custom-upload row per available default preset file in `default_presets/`. The defaults themselves are already loaded into memory on startup; these controls let a user upload a custom JSON to override any operation tier in memory. The number of rows scales with the entries in `defaultPresetManifest`.' vs Manifest: 'Renders one custom-upload row per default preset file in default_presets/, each with a display label showing the active preset file name (default or custom)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Dynamically renders one custom-upload row per available default preset file in `default_presets/`. The defaults themselves are already loaded into memory on startup; these controls let a user upload a custom JSON to override any operation tier in memory. The number of rows scales with the entries in `defaultPresetManifest`.
 * Called by: ui.js (openDebugMenu)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### renderDistinctPresetControls — Dynamically renders one custom-upload row per available default preset file in `default_presets/`. The defaults themselves are already loaded into memory on startup; these controls let a user upload a custom JSON to override any operation tier in memory. The number of rows scales with the entries in `defaultPresetManifest`.
#### What function call it:
- ui.js (openDebugMenu)
#### What functions are used in it :
- loadSpecificPreset
```

---

### [ACTION REQUIRED] openDebugMenu
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Opens the debug modal overlay and initializes input values and UI page elements from state.' vs Manifest: 'Opens the debug modal and initializes input values from state; disables the Save Map button until the editor is edited'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Opens the debug modal overlay and initializes input values and UI page elements from state.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### openDebugMenu — Opens the debug modal overlay and initializes input values and UI page elements from state.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- initStylizationMapEditorSaveActivation, renderDiscoveredMappingsUI, renderDistinctPresetControls, setSaveMapButtonEnabled, updateDebugPageDisplay
```

---

### [ACTION REQUIRED] initStylizationMapEditorSaveActivation
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Attaches a one-time input listener to the stylization map editor textarea so any edit reactivates the Save Map button. Guarded with a dataset flag so repeated openDebugMenu calls do not stack duplicate listeners.' vs Manifest: 'Attaches a one-time input listener to the stylization map editor so any edit reactivates the Save Map button'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Attaches a one-time input listener to the stylization map editor textarea so any edit reactivates the Save Map button. Guarded with a dataset flag so repeated openDebugMenu calls do not stack duplicate listeners.
 * Called by: ui.js (openDebugMenu)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### initStylizationMapEditorSaveActivation — Attaches a one-time input listener to the stylization map editor textarea so any edit reactivates the Save Map button. Guarded with a dataset flag so repeated openDebugMenu calls do not stack duplicate listeners.
#### What function call it:
- ui.js (openDebugMenu)
#### What functions are used in it :
- setSaveMapButtonEnabled
```

---

### [ACTION REQUIRED] switchDebugPage
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Switches between different pages within the debug modal interface.' vs Manifest: 'Switches between debug modal pages'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Switches between different pages within the debug modal interface.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### switchDebugPage — Switches between different pages within the debug modal interface.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- updateDebugPageDisplay
```

---

### [ACTION REQUIRED] updateDebugPageDisplay
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the visibility of sections and button states for the current debug page view.' vs Manifest: 'Updates section visibility and button states for the current debug page'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the visibility of sections and button states for the current debug page view.
 * Called by: ui.js (openDebugMenu, switchDebugPage)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateDebugPageDisplay — Updates the visibility of sections and button states for the current debug page view.
#### What function call it:
- ui.js (openDebugMenu, switchDebugPage)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] closeDebugMenu
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Saves configuration changes from the debug modal inputs and closes the debug overlay. Reorders the stylization map (names first, then by key length desc) so the saved JSON matches what is visible in the editor, and persists the full UI state to the IndexedDB cache.' vs Manifest: 'Saves debug modal config changes, reorders the stylization map, and closes the overlay'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Saves configuration changes from the debug modal inputs and closes the debug overlay. Reorders the stylization map (names first, then by key length desc) so the saved JSON matches what is visible in the editor, and persists the full UI state to the IndexedDB cache.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### closeDebugMenu — Saves configuration changes from the debug modal inputs and closes the debug overlay. Reorders the stylization map (names first, then by key length desc) so the saved JSON matches what is visible in the editor, and persists the full UI state to the IndexedDB cache.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- orderStylizationMap, saveUIStateToCache, showError, syncManualStepUIVisibility
```

---

### [ACTION REQUIRED] closeDebugMenuWithoutSaving
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Closes the debug modal overlay without saving input changes.' vs Manifest: 'Closes the debug modal without saving'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Closes the debug modal overlay without saving input changes.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### closeDebugMenuWithoutSaving — Closes the debug modal overlay without saving input changes.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] saveStylizationMapFromView
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Parses and saves the current JSON contents of the stylization map editor to application memory and cache.' vs Manifest: 'Parses and saves the stylization map editor JSON to memory and cache, then disables the Save Map button'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Parses and saves the current JSON contents of the stylization map editor to application memory and cache.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### saveStylizationMapFromView — Parses and saves the current JSON contents of the stylization map editor to application memory and cache.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- orderStylizationMap, saveUIStateToCache, setSaveMapButtonEnabled, showError
```

---

### [ACTION REQUIRED] renderDiscoveredMappingsUI
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Renders the dynamic HTML container listing discovered stylization mappings pending review.' vs Manifest: 'Renders the HTML container listing discovered stylization mappings pending review'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Renders the dynamic HTML container listing discovered stylization mappings pending review.
 * Called by: ui.js (commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, inlineReplacement, openDebugMenu, setAllDiscoveredSelection)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### renderDiscoveredMappingsUI — Renders the dynamic HTML container listing discovered stylization mappings pending review.
#### What function call it:
- ui.js (commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, inlineReplacement, openDebugMenu, setAllDiscoveredSelection)
#### What functions are used in it :
- setAllDiscoveredSelection, toggleDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal
```

---

### [ACTION REQUIRED] toggleDiscoveredSelection
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the selection status of an individual pending discovered mapping item.' vs Manifest: 'Updates the selection status of an individual pending discovered mapping'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the selection status of an individual pending discovered mapping item.
 * Called by: ui.js (renderDiscoveredMappingsUI)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### toggleDiscoveredSelection — Updates the selection status of an individual pending discovered mapping item.
#### What function call it:
- ui.js (renderDiscoveredMappingsUI)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] setAllDiscoveredSelection
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Sets the selection state for all pending discovered mapping items at once.' vs Manifest: 'Sets the selection state for all pending discovered mappings at once'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Sets the selection state for all pending discovered mapping items at once.
 * Called by: ui.js (renderDiscoveredMappingsUI)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### setAllDiscoveredSelection — Sets the selection state for all pending discovered mapping items at once.
#### What function call it:
- ui.js (renderDiscoveredMappingsUI)
#### What functions are used in it :
- renderDiscoveredMappingsUI
```

---

### [ACTION REQUIRED] orderStylizationMap
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Returns an ordered copy of a stylization map object: __priorityOverride__ first, then name entries (values wrapped in 「」), then all other entries, each group sorted by key length descending so longer multi-character keys are applied before their substrings during replacement. Empty-value mappings are dropped since they replace text with nothing.' vs Manifest: 'Returns an ordered copy of a stylization map: priority override first, then names, then others, each by key length desc; drops empty-value entries'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Returns an ordered copy of a stylization map object: __priorityOverride__ first, then name entries (values wrapped in 「」), then all other entries, each group sorted by key length descending so longer multi-character keys are applied before their substrings during replacement. Empty-value mappings are dropped since they replace text with nothing.
 * Called by: ui.js (closeDebugMenu, commitApprovedMappingsToMap, saveStylizationMapFromView)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### orderStylizationMap — Returns an ordered copy of a stylization map object: __priorityOverride__ first, then name entries (values wrapped in 「」), then all other entries, each group sorted by key length descending so longer multi-character keys are applied before their substrings during replacement. Empty-value mappings are dropped since they replace text with nothing.
#### What function call it:
- ui.js (closeDebugMenu, commitApprovedMappingsToMap, saveStylizationMapFromView)
#### What functions are used in it :
- (none)
```

---

### [MISSING] isNameEntry
- **Target File:** `js/ui.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: ui.js (byKeyLengthDesc)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### isNameEntry — No description provided.
#### What function call it:
- ui.js (byKeyLengthDesc)
#### What functions are used in it :
- (none)
```

---

### [MISSING] isEmpty
- **Target File:** `js/ui.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: ui.js (byKeyLengthDesc)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### isEmpty — No description provided.
#### What function call it:
- ui.js (byKeyLengthDesc)
#### What functions are used in it :
- (none)
```

---

### [MISSING] byKeyLengthDesc
- **Target File:** `js/ui.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### byKeyLengthDesc — No description provided.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- isEmpty, isNameEntry
```

---

### [ACTION REQUIRED] commitApprovedMappingsToMap
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Commits selected pending discovered mappings into the active heavy stylization map dictionary. Skips items with empty keys/values and items whose key is the reserved __priorityOverride__ token.' vs Manifest: 'Commits selected pending discovered mappings into the heavy stylization map; skips empty and __priorityOverride__ keys'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Commits selected pending discovered mappings into the active heavy stylization map dictionary. Skips items with empty keys/values and items whose key is the reserved __priorityOverride__ token.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### commitApprovedMappingsToMap — Commits selected pending discovered mappings into the active heavy stylization map dictionary. Skips items with empty keys/values and items whose key is the reserved __priorityOverride__ token.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- orderStylizationMap, renderDiscoveredMappingsUI, saveUIStateToCache, showError
```

---

### [ACTION REQUIRED] copyStylizationMapToClipboard
- **Target File:** `js/ui.js`
- **Warning:** Description mismatch. JSDoc: 'Copies the current text contents of the stylization map editor to the system clipboard.' vs Manifest: 'Copies the stylization map editor text to the system clipboard'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Copies the current text contents of the stylization map editor to the system clipboard.
 * Called by: ui.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### copyStylizationMapToClipboard — Copies the current text contents of the stylization map editor to the system clipboard.
#### What function call it:
- ui.js ((none))
#### What functions are used in it :
- showError
```

---

### [ACTION REQUIRED] fetchAiModels
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Queries available local AI Server model endpoints and populates the model selection dropdown list. Tries multiple OpenAI-compatible endpoints (LM Studio, Ollama, llama.cpp) and falls back across them.' vs Manifest: 'Queries available local AI Server model endpoints and populates the model selection dropdown'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Queries available local AI Server model endpoints and populates the model selection dropdown list. Tries multiple OpenAI-compatible endpoints (LM Studio, Ollama, llama.cpp) and falls back across them.
 * Called by: translator-llm.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### fetchAiModels — Queries available local AI Server model endpoints and populates the model selection dropdown list. Tries multiple OpenAI-compatible endpoints (LM Studio, Ollama, llama.cpp) and falls back across them.
#### What function call it:
- translator-llm.js ((none))
#### What functions are used in it :
- clearError, showError
```

---

### [ACTION REQUIRED] wrapTextToLines
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Wraps a given string of text into an array of lines bounded by a maximum character length limit.' vs Manifest: 'Wraps a string of text into an array of lines bounded by a max character length'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Wraps a given string of text into an array of lines bounded by a maximum character length limit.
 * Called by: translator-llm.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### wrapTextToLines — Wraps a given string of text into an array of lines bounded by a maximum character length limit.
#### What function call it:
- translator-llm.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] cleanModelOutput
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Cleans up raw LLM outputs by stripping conversational filler words, explanation prefixes, code block formatting, and surrounding quotes.' vs Manifest: 'Cleans raw LLM outputs by stripping conversational filler, prefixes, code blocks, and surrounding quotes'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Cleans up raw LLM outputs by stripping conversational filler words, explanation prefixes, code block formatting, and surrounding quotes.
 * Called by: translator-llm.js (translateChunkWithContext)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### cleanModelOutput — Cleans up raw LLM outputs by stripping conversational filler words, explanation prefixes, code block formatting, and surrounding quotes.
#### What function call it:
- translator-llm.js (translateChunkWithContext)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] cleanSummaryOutput
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Cleans up raw LLM summary outputs by stripping preamble words, role labels, and surrounding quotes.' vs Manifest: 'Cleans raw LLM summary outputs by stripping preamble, role labels, and surrounding quotes'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Cleans up raw LLM summary outputs by stripping preamble words, role labels, and surrounding quotes.
 * Called by: translator-llm.js (updateArchivalSummary, updateRecentSummary)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### cleanSummaryOutput — Cleans up raw LLM summary outputs by stripping preamble words, role labels, and surrounding quotes.
#### What function call it:
- translator-llm.js (updateArchivalSummary, updateRecentSummary)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] updateRecentSummary
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines. Focuses on active characters, emotional tone, and immediate narrative developments.' vs Manifest: 'Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines. Focuses on active characters, emotional tone, and immediate narrative developments.
 * Called by: translator-llm.js (buildTieredContextWindow, summarizeOldContext)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateRecentSummary — Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines. Focuses on active characters, emotional tone, and immediate narrative developments.
#### What function call it:
- translator-llm.js (buildTieredContextWindow, summarizeOldContext)
#### What functions are used in it :
- cleanSummaryOutput
```

---

### [ACTION REQUIRED] updateArchivalSummary
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Updates the Tier 3 archival summary (summary-of-summaries) by compressing an overflowing scene recap. If an archival summary already exists, it updates itself to preserve macro story state and key relationships.' vs Manifest: 'Updates the Tier 3 archival summary by compressing an overflowing scene recap'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Updates the Tier 3 archival summary (summary-of-summaries) by compressing an overflowing scene recap. If an archival summary already exists, it updates itself to preserve macro story state and key relationships.
 * Called by: translator-llm.js (buildTieredContextWindow)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### updateArchivalSummary — Updates the Tier 3 archival summary (summary-of-summaries) by compressing an overflowing scene recap. If an archival summary already exists, it updates itself to preserve macro story state and key relationships.
#### What function call it:
- translator-llm.js (buildTieredContextWindow)
#### What functions are used in it :
- cleanSummaryOutput
```

---

### [ACTION REQUIRED] summarizeOldContext
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Summarizes older dialogue context lines into a single sentence (kept for backwards compatibility).' vs Manifest: 'Summarizes older dialogue context lines into a single sentence (backwards-compat wrapper around updateRecentSummary)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Summarizes older dialogue context lines into a single sentence (kept for backwards compatibility).
 * Called by: translator-llm.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### summarizeOldContext — Summarizes older dialogue context lines into a single sentence (kept for backwards compatibility).
#### What function call it:
- translator-llm.js ((none))
#### What functions are used in it :
- updateRecentSummary
```

---

### [ACTION REQUIRED] detectRomajiFragment
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Curated list of Japanese words that frequently bleed untranslated into English output as romaji when the model fails to translate (e.g. "nani", "baka", "matte"). Matched as whole-word tokens so substrings inside legitimate English words are not flagged. This is a deterministic hard-gate: any match forces a retry on every attempt. Intentionally EXCLUDES words commonly kept untranslated in English VN/anime localization: honorifics/titles (sensei, senpai, kouhai, onii-chan, onee-chan), loanwords (otaku, moe, kawaii, sugoi), and trope terms (ecchi, hentai, tsundere, yandere, kuudere). These are valid English usage in this context and must not trigger a hard retry. Extend this list only with true untranslated fragments. const ROMAJI_FRAGMENT_WORDS = [ "nani", "baka", "aho", "urusai", "yarou", "temee", "kisama", "itadakimasu", "tadaima", "okaeri", "gomen", "gomenasai", "arigatou", "arigato", "sayonara", "douzo", "iie", "yamete", "yamate", "chigau", "matte", "doushite", "naze", "dare", "doko", "itsu", "nanji", "sumimasen", "moshi moshi", "moshimoshi" ]; Detects leftover Japanese romaji fragments in an otherwise-English translation. Returns the first matched fragment, or null if none found.' vs Manifest: 'Detects leftover Japanese romaji fragments in an English translation; returns the first match or null'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Curated list of Japanese words that frequently bleed untranslated into English output as romaji when the model fails to translate (e.g. "nani", "baka", "matte"). Matched as whole-word tokens so substrings inside legitimate English words are not flagged. This is a deterministic hard-gate: any match forces a retry on every attempt. Intentionally EXCLUDES words commonly kept untranslated in English VN/anime localization: honorifics/titles (sensei, senpai, kouhai, onii-chan, onee-chan), loanwords (otaku, moe, kawaii, sugoi), and trope terms (ecchi, hentai, tsundere, yandere, kuudere). These are valid English usage in this context and must not trigger a hard retry. Extend this list only with true untranslated fragments. const ROMAJI_FRAGMENT_WORDS = [ "nani", "baka", "aho", "urusai", "yarou", "temee", "kisama", "itadakimasu", "tadaima", "okaeri", "gomen", "gomenasai", "arigatou", "arigato", "sayonara", "douzo", "iie", "yamete", "yamate", "chigau", "matte", "doushite", "naze", "dare", "doko", "itsu", "nanji", "sumimasen", "moshi moshi", "moshimoshi" ]; Detects leftover Japanese romaji fragments in an otherwise-English translation. Returns the first matched fragment, or null if none found.
 * Called by: translator-llm.js (translateChunkWithContext)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### detectRomajiFragment — Curated list of Japanese words that frequently bleed untranslated into English output as romaji when the model fails to translate (e.g. "nani", "baka", "matte"). Matched as whole-word tokens so substrings inside legitimate English words are not flagged. This is a deterministic hard-gate: any match forces a retry on every attempt. Intentionally EXCLUDES words commonly kept untranslated in English VN/anime localization: honorifics/titles (sensei, senpai, kouhai, onii-chan, onee-chan), loanwords (otaku, moe, kawaii, sugoi), and trope terms (ecchi, hentai, tsundere, yandere, kuudere). These are valid English usage in this context and must not trigger a hard retry. Extend this list only with true untranslated fragments. const ROMAJI_FRAGMENT_WORDS = [ "nani", "baka", "aho", "urusai", "yarou", "temee", "kisama", "itadakimasu", "tadaima", "okaeri", "gomen", "gomenasai", "arigatou", "arigato", "sayonara", "douzo", "iie", "yamete", "yamate", "chigau", "matte", "doushite", "naze", "dare", "doko", "itsu", "nanji", "sumimasen", "moshi moshi", "moshimoshi" ]; Detects leftover Japanese romaji fragments in an otherwise-English translation. Returns the first matched fragment, or null if none found.
#### What function call it:
- translator-llm.js (translateChunkWithContext)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] assessTranslationQualityWithAI
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Assesses the quality of a Japanese-to-English translation using a stringent QA prompt. Returns true (pass) unless a clean standalone FAIL verdict is emitted (flaky small-model prose or echoed instructions are treated as a pass so deterministic checks remain the gate).' vs Manifest: 'Assesses translation quality via a stringent QA prompt; returns true (pass) unless a clean standalone FAIL is emitted'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Assesses the quality of a Japanese-to-English translation using a stringent QA prompt. Returns true (pass) unless a clean standalone FAIL verdict is emitted (flaky small-model prose or echoed instructions are treated as a pass so deterministic checks remain the gate).
 * Called by: translator-llm.js (translateChunkWithContext)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### assessTranslationQualityWithAI — Assesses the quality of a Japanese-to-English translation using a stringent QA prompt. Returns true (pass) unless a clean standalone FAIL verdict is emitted (flaky small-model prose or echoed instructions are treated as a pass so deterministic checks remain the gate).
#### What function call it:
- translator-llm.js (translateChunkWithContext)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] detectContextLeak
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Detects whether a prior context line leaked into the translation output. Uses exact-substring and a sliding 30-char window match (step 5) so leaks copying the middle/end of a context line are caught, while short common phrases avoid false positives. Returns { leaked: boolean, leakedLine: string } where leakedLine is the matched context line.' vs Manifest: 'Detects whether a prior context line leaked into the translation output (exact + sliding 30-char window match)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Detects whether a prior context line leaked into the translation output. Uses exact-substring and a sliding 30-char window match (step 5) so leaks copying the middle/end of a context line are caught, while short common phrases avoid false positives. Returns { leaked: boolean, leakedLine: string } where leakedLine is the matched context line.
 * Called by: translator-llm.js (translateChunkWithContext)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### detectContextLeak — Detects whether a prior context line leaked into the translation output. Uses exact-substring and a sliding 30-char window match (step 5) so leaks copying the middle/end of a context line are caught, while short common phrases avoid false positives. Returns { leaked: boolean, leakedLine: string } where leakedLine is the matched context line.
#### What function call it:
- translator-llm.js (translateChunkWithContext)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] translateChunkWithContext
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Translates a text chunk or chunk with prior history context using configured system parameters and handles retry logic. Runs a multi-check validation gate (Japanese chars, romaji fragment, context leak, AI validator) with a hard-fail window that degrades the AI verdict to advisory after 3 attempts so a flaky small model cannot stall.' vs Manifest: 'Translates a text chunk with prior context, running a multi-check validation gate (Japanese, romaji, context leak, AI validator) with retry logic'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Translates a text chunk or chunk with prior history context using configured system parameters and handles retry logic. Runs a multi-check validation gate (Japanese chars, romaji fragment, context leak, AI validator) with a hard-fail window that degrades the AI verdict to advisory after 3 attempts so a flaky small model cannot stall.
 * Called by: translator-llm.js (maxContextLines, resolveNamePlate)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### translateChunkWithContext — Translates a text chunk or chunk with prior history context using configured system parameters and handles retry logic. Runs a multi-check validation gate (Japanese chars, romaji fragment, context leak, AI validator) with a hard-fail window that degrades the AI verdict to advisory after 3 attempts so a flaky small model cannot stall.
#### What function call it:
- translator-llm.js (maxContextLines, resolveNamePlate)
#### What functions are used in it :
- assessTranslationQualityWithAI, cleanModelOutput, detectContextLeak, detectRomajiFragment
```

---

### [ACTION REQUIRED] buildTieredContextWindow
- **Target File:** `js/translator-llm.js`
- **Warning:** Description mismatch. JSDoc: 'Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the production translation pipeline and the benchmark sweep, so both grade the model under identical context conditions. Mutates and returns the summaryState object in place. Tier 1 (Raw Tail): the most recent `rawLimitThreshold` confirmed lines from history. Tier 2 (Recent Summary): a rolling recap of lines that fell out of the raw tail. Tier 3 (Archival Summary): a compressed macro story state when the recent summary overflows. The final window is capped to `maxContextLines` entries (summary lines + raw tail combined).' vs Manifest: 'Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the pipeline and benchmark'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the production translation pipeline and the benchmark sweep, so both grade the model under identical context conditions. Mutates and returns the summaryState object in place. Tier 1 (Raw Tail): the most recent `rawLimitThreshold` confirmed lines from history. Tier 2 (Recent Summary): a rolling recap of lines that fell out of the raw tail. Tier 3 (Archival Summary): a compressed macro story state when the recent summary overflows. The final window is capped to `maxContextLines` entries (summary lines + raw tail combined).
 * Called by: translator-llm.js (maxContextLines, refreshStepContextPreview)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### buildTieredContextWindow — Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the production translation pipeline and the benchmark sweep, so both grade the model under identical context conditions. Mutates and returns the summaryState object in place. Tier 1 (Raw Tail): the most recent `rawLimitThreshold` confirmed lines from history. Tier 2 (Recent Summary): a rolling recap of lines that fell out of the raw tail. Tier 3 (Archival Summary): a compressed macro story state when the recent summary overflows. The final window is capped to `maxContextLines` entries (summary lines + raw tail combined).
#### What function call it:
- translator-llm.js (maxContextLines, refreshStepContextPreview)
#### What functions are used in it :
- maxContextLines, updateArchivalSummary, updateRecentSummary
```

---

### [ACTION REQUIRED] promptUserForNameTranslation
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Displays a modal prompt to let the user review or modify character name translations interactively. Returns a promise resolving to the user-approved name. Auto-skips the modal (resolving to the AI translation) when state.autoSkipNameModal is set, and rejects on user abort.' vs Manifest: 'Displays a modal to review/modify character name translations; returns a promise resolving to the user-approved name'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Displays a modal prompt to let the user review or modify character name translations interactively. Returns a promise resolving to the user-approved name. Auto-skips the modal (resolving to the AI translation) when state.autoSkipNameModal is set, and rejects on user abort.
 * Called by: ui-manual-step.js (resolveNamePlate)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### promptUserForNameTranslation — Displays a modal prompt to let the user review or modify character name translations interactively. Returns a promise resolving to the user-approved name. Auto-skips the modal (resolving to the AI translation) when state.autoSkipNameModal is set, and rejects on user abort.
#### What function call it:
- ui-manual-step.js (resolveNamePlate)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] resolveNameModal
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Resolves the active name translation modal promise with the user's input value.' vs Manifest: 'Resolves the name translation modal promise with the user's input value'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Resolves the active name translation modal promise with the user's input value.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### resolveNameModal — Resolves the active name translation modal promise with the user's input value.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] closeNameModal
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Closes the name translation modal and passes an empty fallback value to the resolver.' vs Manifest: 'Closes the name translation modal with an empty fallback value'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Closes the name translation modal and passes an empty fallback value to the resolver.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### closeNameModal — Closes the name translation modal and passes an empty fallback value to the resolver.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] refreshStepContextPreview
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Recomputes the context-preview dropdown from the stored full history + current step settings. Replays the entire history through buildTieredContextWindow to reconstruct the tiered summaries (Raw Tail -> Recent Summary -> Archival Summary) so the manual override preview reflects the actual production state rather than a stale snapshot. Returns the recomputed summaryState.' vs Manifest: 'Recomputes the context-preview dropdown from stored history + current step settings by replaying through buildTieredContextWindow'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Recomputes the context-preview dropdown from the stored full history + current step settings. Replays the entire history through buildTieredContextWindow to reconstruct the tiered summaries (Raw Tail -> Recent Summary -> Archival Summary) so the manual override preview reflects the actual production state rather than a stale snapshot. Returns the recomputed summaryState.
 * Called by: ui-manual-step.js (applyStepContextSettings, handleContextLinesChange, promptUserForManualStep)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### refreshStepContextPreview — Recomputes the context-preview dropdown from the stored full history + current step settings. Replays the entire history through buildTieredContextWindow to reconstruct the tiered summaries (Raw Tail -> Recent Summary -> Archival Summary) so the manual override preview reflects the actual production state rather than a stale snapshot. Returns the recomputed summaryState.
#### What function call it:
- ui-manual-step.js (applyStepContextSettings, handleContextLinesChange, promptUserForManualStep)
#### What functions are used in it :
- buildTieredContextWindow
```

---

### [ACTION REQUIRED] syncManualStepUIVisibility
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Synchronizes the visibility of the manual step override toolbar (and the source-pane label/actions) based on whether manual step-by-step mode is enabled. The current source line box stays permanently visible above the toolbar regardless of mode.' vs Manifest: 'Synchronizes the visibility of the manual step toolbar and source-pane label/actions based on manual mode state'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Synchronizes the visibility of the manual step override toolbar (and the source-pane label/actions) based on whether manual step-by-step mode is enabled. The current source line box stays permanently visible above the toolbar regardless of mode.
 * Called by: ui-manual-step.js (closeDebugMenu, syncManualStepModeLive)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### syncManualStepUIVisibility — Synchronizes the visibility of the manual step override toolbar (and the source-pane label/actions) based on whether manual step-by-step mode is enabled. The current source line box stays permanently visible above the toolbar regardless of mode.
#### What function call it:
- ui-manual-step.js (closeDebugMenu, syncManualStepModeLive)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] syncManualStepModeLive
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Toggles manual step mode live when the debug modal checkbox changes state.' vs Manifest: 'Toggles manual step mode live when the debug checkbox changes'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Toggles manual step mode live when the debug modal checkbox changes state.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### syncManualStepModeLive — Toggles manual step mode live when the debug modal checkbox changes state.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- saveUIStateToCache, syncManualStepUIVisibility
```

---

### [ACTION REQUIRED] syncBracketStripToggles
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Reads both bracket-strip checkboxes into state. Called live whenever either checkbox toggles (onchange), so the strip-phase XOR decision reflects the current UI without needing to close the debug menu.' vs Manifest: 'Reads both bracket-strip checkboxes into state live on toggle'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Reads both bracket-strip checkboxes into state. Called live whenever either checkbox toggles (onchange), so the strip-phase XOR decision reflects the current UI without needing to close the debug menu.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### syncBracketStripToggles — Reads both bracket-strip checkboxes into state. Called live whenever either checkbox toggles (onchange), so the strip-phase XOR decision reflects the current UI without needing to close the debug menu.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] hideCurrentSourceLine
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Clears the source line text when translation ends so the placeholder shows. The element itself stays visible permanently.' vs Manifest: 'Clears the source line text when translation ends'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Clears the source line text when translation ends so the placeholder shows. The element itself stays visible permanently.
 * Called by: ui-manual-step.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### hideCurrentSourceLine — Clears the source line text when translation ends so the placeholder shows. The element itself stays visible permanently.
#### What function call it:
- ui-manual-step.js (maxContextLines)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] handleContextLinesChange
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Handles a context-lines input change: a destructive recompute that confirms before applying (since it recomputes summaries and the context window). Restores the old value if the user cancels the confirmation.' vs Manifest: 'Handles a context-lines input change: confirms before recomputing summaries'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Handles a context-lines input change: a destructive recompute that confirms before applying (since it recomputes summaries and the context window). Restores the old value if the user cancels the confirmation.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### handleContextLinesChange — Handles a context-lines input change: a destructive recompute that confirms before applying (since it recomputes summaries and the context window). Restores the old value if the user cancels the confirmation.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- refreshStepContextPreview
```

---

### [ACTION REQUIRED] handleRawLinesChange
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Handles a raw-lines input change: reshapes the raw tail display directly (no summary recalculation, which only happens on context-lines change). Updates the raw context box to show the most recent `rawLimit` history lines.' vs Manifest: 'Handles a raw-lines input change: reshapes the raw tail display without summary recalc'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Handles a raw-lines input change: reshapes the raw tail display directly (no summary recalculation, which only happens on context-lines change). Updates the raw context box to show the most recent `rawLimit` history lines.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### handleRawLinesChange — Handles a raw-lines input change: reshapes the raw tail display directly (no summary recalculation, which only happens on context-lines change). Updates the raw context box to show the most recent `rawLimit` history lines.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] promptUserForManualStep
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Opens the manual step toolbar to allow step-by-step translation evaluation and editing. Stores the full history and summary context on state so the preview can recompute live, syncs the override inputs to the current .translate-config values, and resolves the returned promise with the chosen action (continue/retranslate) plus any manual summary edits.' vs Manifest: 'Opens the manual step toolbar for step-by-step evaluation; stores history/summary context, syncs inputs, resolves with the chosen action'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Opens the manual step toolbar to allow step-by-step translation evaluation and editing. Stores the full history and summary context on state so the preview can recompute live, syncs the override inputs to the current .translate-config values, and resolves the returned promise with the chosen action (continue/retranslate) plus any manual summary edits.
 * Called by: ui-manual-step.js (maxContextLines)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### promptUserForManualStep — Opens the manual step toolbar to allow step-by-step translation evaluation and editing. Stores the full history and summary context on state so the preview can recompute live, syncs the override inputs to the current .translate-config values, and resolves the returned promise with the chosen action (continue/retranslate) plus any manual summary edits.
#### What function call it:
- ui-manual-step.js (maxContextLines)
#### What functions are used in it :
- refreshStepContextPreview
```

---

### [ACTION REQUIRED] resolveManualStepContinue
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Resolves the manual step prompt indicating a continue action, capturing the current context/raw input values and any manual summary-box edits.' vs Manifest: 'Resolves the manual step prompt with a continue action, capturing context/raw values and manual summary edits'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Resolves the manual step prompt indicating a continue action, capturing the current context/raw input values and any manual summary-box edits.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### resolveManualStepContinue — Resolves the manual step prompt indicating a continue action, capturing the current context/raw input values and any manual summary-box edits.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- readManualSummaryEdits
```

---

### [ACTION REQUIRED] applyStepContextSettings
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Applies the manual override context/raw values to shared state and recomputes summaries from history, storing the resulting summary state so a subsequent retranslate reuses it instead of triggering a fresh recalc.' vs Manifest: 'Applies manual override context/raw values to state and recomputes summaries from history'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Applies the manual override context/raw values to shared state and recomputes summaries from history, storing the resulting summary state so a subsequent retranslate reuses it instead of triggering a fresh recalc.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### applyStepContextSettings — Applies the manual override context/raw values to shared state and recomputes summaries from history, storing the resulting summary state so a subsequent retranslate reuses it instead of triggering a fresh recalc.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- refreshStepContextPreview
```

---

### [ACTION REQUIRED] triggerStepRetranslation
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Resolves the manual step prompt indicating that a re-translation pass is required, capturing the current context/raw input values and any manual summary-box edits so they update the internal summary variables before the retranslate rebuilds the context window.' vs Manifest: 'Resolves the manual step prompt with a retranslate action, capturing context/raw values and manual summary edits'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Resolves the manual step prompt indicating that a re-translation pass is required, capturing the current context/raw input values and any manual summary-box edits so they update the internal summary variables before the retranslate rebuilds the context window.
 * Called by: ui-manual-step.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### triggerStepRetranslation — Resolves the manual step prompt indicating that a re-translation pass is required, capturing the current context/raw input values and any manual summary-box edits so they update the internal summary variables before the retranslate rebuilds the context window.
#### What function call it:
- ui-manual-step.js ((none))
#### What functions are used in it :
- readManualSummaryEdits
```

---

### [ACTION REQUIRED] readManualSummaryEdits
- **Target File:** `js/ui-manual-step.js`
- **Warning:** Description mismatch. JSDoc: 'Reads the current (possibly user-edited) archival and recent summary boxes. Returns null when neither box exists so callers can skip writing anything back.' vs Manifest: 'Reads the current (possibly user-edited) archival and recent summary boxes; returns null if neither box exists'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Reads the current (possibly user-edited) archival and recent summary boxes. Returns null when neither box exists so callers can skip writing anything back.
 * Called by: ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### readManualSummaryEdits — Reads the current (possibly user-edited) archival and recent summary boxes. Returns null when neither box exists so callers can skip writing anything back.
#### What function call it:
- ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] initDraggableModal
- **Target File:** `js/ui-layout.js`
- **Warning:** Description mismatch. JSDoc: 'Initializes mouse drag-and-drop mechanics for the floating debug modal window. Attaches mousedown/mousemove/mouseup listeners to the modal header so the modal can be repositioned by dragging its title bar.' vs Manifest: 'Initializes mouse drag-and-drop for the floating debug modal window'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Initializes mouse drag-and-drop mechanics for the floating debug modal window. Attaches mousedown/mousemove/mouseup listeners to the modal header so the modal can be repositioned by dragging its title bar.
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### initDraggableModal — Initializes mouse drag-and-drop mechanics for the floating debug modal window. Attaches mousedown/mousemove/mouseup listeners to the modal header so the modal can be repositioned by dragging its title bar.
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] onMouseMove
- **Target File:** `js/ui-layout.js`
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.
- **Warning:** Description mismatch. JSDoc: '' vs Manifest: 'Moves the modal on mouse drag (nested helper in initDraggableModal)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Moves the modal on mouse drag (nested helper in initDraggableModal)
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### onMouseMove — Moves the modal on mouse drag (nested helper in initDraggableModal)
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] onMouseUp
- **Target File:** `js/ui-layout.js`
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.
- **Warning:** Description mismatch. JSDoc: '' vs Manifest: 'Stops the modal drag on mouseup (nested helper in initDraggableModal)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Stops the modal drag on mouseup (nested helper in initDraggableModal)
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### onMouseUp — Stops the modal drag on mouseup (nested helper in initDraggableModal)
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [MISSING] _initColResizer
- **Target File:** `js/ui-layout.js`
- **Error:** Missing from Manifest.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Generic helper: creates a column (horizontal) drag resizer between two elements. Computes a width percentage from the cursor position clamped to [minPct, maxPct] and applies it to both elements, then fires the optional onResize callback.
 * Called by: ui-layout.js (initPaneResizer)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### _initColResizer — Generic helper: creates a column (horizontal) drag resizer between two elements. Computes a width percentage from the cursor position clamped to [minPct, maxPct] and applies it to both elements, then fires the optional onResize callback.
#### What function call it:
- ui-layout.js (initPaneResizer)
#### What functions are used in it :
- (none)
```

---

### [MISSING] _initRowResizer
- **Target File:** `js/ui-layout.js`
- **Error:** Missing from Manifest.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Generic helper: creates a row (vertical) drag resizer between two sibling elements. Computes new top/bottom heights from the cursor delta, clamped to a 30px minimum.
 * Called by: ui-layout.js (initPaneResizer)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### _initRowResizer — Generic helper: creates a row (vertical) drag resizer between two sibling elements. Computes new top/bottom heights from the cursor delta, clamped to a 30px minimum.
#### What function call it:
- ui-layout.js (initPaneResizer)
#### What functions are used in it :
- (none)
```

---

### [MISSING] _syncFooter
- **Target File:** `js/ui-layout.js`
- **Error:** Missing from Manifest.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Syncs the external footer row alignment with the sidebar and pane widths. Applies a left padding equal to sidebar + handle width, and mirrors pane column widths so the footer actions line up under the source panes after a resize.
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### _syncFooter — Syncs the external footer row alignment with the sidebar and pane widths. Applies a left padding equal to sidebar + handle width, and mirrors pane column widths so the footer actions line up under the source panes after a resize.
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] initPaneResizer
- **Target File:** `js/ui-layout.js`
- **Warning:** Description mismatch. JSDoc: 'Initializes all draggable resize handles: the sidebar column resizer, the source-pane column resizer, and the two manual-step context row resizers (Archival<->Recent, Recent<->Split). Also aligns the footer on initial load and on window resize.' vs Manifest: 'Initializes all draggable resize handles (sidebar, source panes, context rows) and aligns the footer'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Initializes all draggable resize handles: the sidebar column resizer, the source-pane column resizer, and the two manual-step context row resizers (Archival<->Recent, Recent<->Split). Also aligns the footer on initial load and on window resize.
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### initPaneResizer — Initializes all draggable resize handles: the sidebar column resizer, the source-pane column resizer, and the two manual-step context row resizers (Archival<->Recent, Recent<->Split). Also aligns the footer on initial load and on window resize.
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- _initColResizer, _initRowResizer
```

---

### [ACTION REQUIRED] initAutoNumberInputs
- **Target File:** `js/ui-layout.js`
- **Warning:** Description mismatch. JSDoc: 'Makes elements with class .auto-number-input dynamically resize to fit their value by setting a calc(<ch> + 16px) width on input and change events.' vs Manifest: 'Makes .auto-number-input elements dynamically resize to fit their value'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Makes elements with class .auto-number-input dynamically resize to fit their value by setting a calc(<ch> + 16px) width on input and change events.
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### initAutoNumberInputs — Makes elements with class .auto-number-input dynamically resize to fit their value by setting a calc(<ch> + 16px) width on input and change events.
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] resize
- **Target File:** `js/ui-layout.js`
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.
- **Warning:** Description mismatch. JSDoc: '' vs Manifest: 'Sets a calc width based on the input value length (nested helper in initAutoNumberInputs)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Sets a calc width based on the input value length (nested helper in initAutoNumberInputs)
 * Called by: ui-layout.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### resize — Sets a calc width based on the input value length (nested helper in initAutoNumberInputs)
#### What function call it:
- ui-layout.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] runParameterSweepBenchmark
- **Target File:** `js/benchmark.js`
- **Warning:** Description mismatch. JSDoc: 'Runs a multi-dimensional parameter sweep matrix to audit translation inconsistency by testing different context lines and raw limits, then logs the evaluation feedback and scores.' vs Manifest: 'Runs the multi-dimensional parameter sweep matrix and logs evaluation feedback and scores; uses an AbortController (silent abort of any running process, signal checks in the sweep loop, try/catch with abort handling)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Runs a multi-dimensional parameter sweep matrix to audit translation inconsistency by testing different context lines and raw limits, then logs the evaluation feedback and scores.
 * Called by: benchmark.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### runParameterSweepBenchmark — Runs a multi-dimensional parameter sweep matrix to audit translation inconsistency by testing different context lines and raw limits, then logs the evaluation feedback and scores.
#### What function call it:
- benchmark.js ((none))
#### What functions are used in it :
- (none)
```

---

### [MISSING] sourceText
- **Target File:** `js/benchmark.js`
- **Error:** Missing from Manifest.
- **Error:** No description detected in JSDoc.
- **Error:** Missing 'Called by' in JSDoc.

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * No description provided.
 * Called by: benchmark.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### sourceText — No description provided.
#### What function call it:
- benchmark.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] gradeCandidateAgent
- **Target File:** `js/benchmark.js`
- **Warning:** Description mismatch. JSDoc: 'Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow. The auditor sees ONLY the candidate translated text. Context history, raw context, and prompt scaffolding are never passed to the grader so the score reflects the translation output alone.' vs Manifest: 'Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard; passes the abort signal to fetch'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow. The auditor sees ONLY the candidate translated text. Context history, raw context, and prompt scaffolding are never passed to the grader so the score reflects the translation output alone.
 * Called by: benchmark.js ((none))
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### gradeCandidateAgent — Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow. The auditor sees ONLY the candidate translated text. Context history, raw context, and prompt scaffolding are never passed to the grader so the score reflects the translation output alone.
#### What function call it:
- benchmark.js ((none))
#### What functions are used in it :
- (none)
```

---

### [ACTION REQUIRED] recolorScriptSelectOptions
- **Target File:** `js/main.js`
- **Warning:** Description mismatch. JSDoc: 'Re-applies the inline status colors to script-select options after a theme change, since native <option> elements cannot be restyled via CSS classes.' vs Manifest: 'Re-applies inline status colors to script-select options after a theme change (native option elements can't be restyled via CSS classes)'

**Suggested JSDoc Fix (for JS file):**
```javascript
/**
 * Re-applies the inline status colors to script-select options after a theme change, since native <option> elements cannot be restyled via CSS classes.
 * Called by: main.js (applyTheme)
 */
```

**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**
```markdown
### recolorScriptSelectOptions — Re-applies the inline status colors to script-select options after a theme change, since native <option> elements cannot be restyled via CSS classes.
#### What function call it:
- main.js (applyTheme)
#### What functions are used in it :
- (none)
```

---

**Scan Summary:** Found 11 missing function(s) and 123 issue(s).
