import { state } from './main.js';
import { saveFilesToCache, saveUIStateToCache } from './database.js';
import { showError } from './ui.js';

/**
 * Handles the file selection event via FileReader, reads file content asynchronously, and passes it to JSON parsing[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function loadFiles(event) {
    console.log(`[Trace:Files] loadFiles() invoked with ${event.target.files.length} file(s).`);
    const files = event.target.files;
    if (!files.length) { console.warn('[Trace:Files] No files selected.'); return; }
    let pendingReads = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onerror = function (e) {
            showError(`FileReader failed to read file: ${file.name}`);
            pendingReads--;
            checkFinishedReads(pendingReads);
        };

        reader.onload = function(e) {
            const content = e.target.result;
            const parsedData = parseContentToJSON(content, file.name);
            if (parsedData) {
                const idx = state.loadedFilesRegistry.findIndex(f => f.name === file.name);
                if (idx >= 0) state.loadedFilesRegistry[idx].data = parsedData;
                else state.loadedFilesRegistry.push({ name: file.name, data: parsedData });
            } else {
                showError(`Failed to parse file: "${file.name}". Make sure it contains valid JSON.`);
            }
            pendingReads--;
            checkFinishedReads(pendingReads);
        };
        reader.readAsText(file);
    }
    event.target.value = "";
}

/**
 * Checks if all asynchronous file reading operations have finished, then triggers application state refresh and caching[cite: 7].
 * Called by: parser.js (loadFiles)[cite: 7]
 */
export function checkFinishedReads(pendingReads) {
    if (pendingReads === 0) {
        console.log('[Trace:Files] All reads finished. Refreshing UI and caching state.');
        refreshApplicationState();
        saveFilesToCache(state.loadedFilesRegistry);
        saveUIStateToCache();
    }
}

/**
 * Removes a specified file from the loaded files registry, updates the application state, and updates the cache[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function removeFile(fileName) {
    console.log(`[Trace:Files] removeFile("${fileName}") invoked.`);
    state.loadedFilesRegistry = state.loadedFilesRegistry.filter(f => f.name !== fileName);
    refreshApplicationState();
    saveFilesToCache(state.loadedFilesRegistry);
    saveUIStateToCache();
}

/**
 * Safely parses text content into a JSON object, attempting alternative regex extraction if standard parsing fails[cite: 7].
 * Called by: parser.js (loadFiles)[cite: 7]
 */
export function parseContentToJSON(content, fileName) {
    try { return JSON.parse(content); } catch (e1) { console.warn(`[Trace:Files] Standard JSON.parse failed for "${fileName}", trying regex extraction.`); }
    try {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
    } catch (e2) {}
    return null;
}

/**
 * Refreshes all core user interface elements including file lists, dropdowns, and comparison views[cite: 7].
 * Called by: parser.js and main.js[cite: 7]
 */
export function refreshApplicationState() {
    console.log('[Trace:UI] refreshApplicationState() invoked.');
    updateFileListUI();
    updateFileDropdowns();
    updateMasterIDList();
    updateBenchmarkFileDropdown();
    renderComparisonViews();
}

/**
 * Updates the visual tag list displaying all currently loaded files and global warning indicators[cite: 7].
 * Called by: parser.js (refreshApplicationState)[cite: 7]
 */
export function updateFileListUI() {
    const listBox = document.getElementById("fileListBox");
    const warningBox = document.getElementById("globalWarning");
    if (state.loadedFilesRegistry.length === 0) {
        listBox.innerHTML = "<em>No files loaded yet. Select multiple files above.</em>";
    } else {
        listBox.innerHTML = "<strong>Loaded Files:</strong> " +
            state.loadedFilesRegistry.map(f => `<span class="file-tag">${f.name}<button class="remove-btn" onclick="removeFile('${f.name}')">&times;</button></span>`).join(" ");
    }
    warningBox.style.display = state.loadedFilesRegistry.length < 2 ? "block" : "none";
    if(state.loadedFilesRegistry.length < 2) warningBox.textContent = `Warning: Only ${state.loadedFilesRegistry.length} file loaded.`;
}

/**
 * Populates the source file selection dropdowns on the UI[cite: 7].
 * Called by: parser.js (refreshApplicationState)[cite: 7]
 */
export function updateFileDropdowns() {
    const selectLeft = document.getElementById("fileSelectLeft");
    const selectRight = document.getElementById("fileSelectRight");
    const prevLeft = selectLeft.value, prevRight = selectRight.value;
    selectLeft.innerHTML = ""; selectRight.innerHTML = "";

    state.loadedFilesRegistry.forEach((fileObj, idx) => {
        selectLeft.appendChild(new Option(fileObj.name, idx));
        selectRight.appendChild(new Option(fileObj.name, idx));
    });

    if (state.loadedFilesRegistry.length >= 2) {
        if (prevLeft !== "" && prevLeft < state.loadedFilesRegistry.length) selectLeft.value = prevLeft;
        if (prevRight !== "" && prevRight < state.loadedFilesRegistry.length) selectRight.value = prevRight;
        if (selectLeft.value === selectRight.value && selectRight.options.length > 1) selectRight.selectedIndex = 1;
    }
}

/**
 * Populates the reference file selection dropdown specific to the benchmark suite[cite: 7].
 * Called by: parser.js (refreshApplicationState)[cite: 7]
 */
export function updateBenchmarkFileDropdown() {
    const refFileSelect = document.getElementById("benchmarkRefFileSelect");
    const prevRefFile = refFileSelect.value;
    refFileSelect.innerHTML = `<option value="">-- Select Reference File --</option>`;

    state.loadedFilesRegistry.forEach((fileObj, idx) => {
        refFileSelect.appendChild(new Option(fileObj.name, idx));
    });

    if (prevRefFile !== "" && prevRefFile < state.loadedFilesRegistry.length) {
        refFileSelect.value = prevRefFile;
    }
    updateBenchmarkSceneDropdown();
}

/**
 * Populates the scene ID dropdown based on the selected reference file for benchmarking[cite: 7].
 * Called by: parser.js (updateBenchmarkFileDropdown)[cite: 7]
 */
export function updateBenchmarkSceneDropdown() {
    const refFileSelect = document.getElementById("benchmarkRefFileSelect");
    const refSceneSelect = document.getElementById("benchmarkRefSceneSelect");
    const prevScene = refSceneSelect.value;
    refSceneSelect.innerHTML = `<option value="">-- Select Scene ID --</option>`;

    const fileIdx = refFileSelect.value;
    if (fileIdx === "" || !state.loadedFilesRegistry[fileIdx]) return;

    let fileObj = state.loadedFilesRegistry[fileIdx];
    let allKeys = Object.keys(fileObj.data).sort();

    allKeys.forEach(key => {
        refSceneSelect.appendChild(new Option(key, key));
    });

    if (prevScene && allKeys.includes(prevScene)) {
        refSceneSelect.value = prevScene;
    }
}

/**
 * Updates the master script ID selection dropdown with unique keys across all loaded files[cite: 7].
 * Called by: parser.js (refreshApplicationState, commitTextToRightFile)[cite: 7]
 */
export function updateMasterIDList() {
    const selectElement = document.getElementById("scriptSelect");
    const mobileSelectElement = document.getElementById("scriptSelectMobile");
    
    const currentSelected = selectElement.value;
    selectElement.innerHTML = "";
    if (mobileSelectElement) mobileSelectElement.innerHTML = '<option value="">Select script...</option>';
    
    let allKeys = new Set();
    state.loadedFilesRegistry.forEach(f => Object.keys(f.data).forEach(k => allKeys.add(k)));

    Array.from(allKeys).sort().forEach(key => {
        let count = state.loadedFilesRegistry.filter(f => f.data[key]).length;
        const isComplete = count >= 2;
        const statusSymbol = isComplete ? "+" : "-";
        
        const opt = new Option(statusSymbol + " " + key + ` (${count} files)`, key);
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        opt.style.color = isComplete ? "#16a34a" : (isDark ? "#ffffff" : "#000000");
        selectElement.appendChild(opt);
        
        if (mobileSelectElement) {
            const mobileOpt = opt.cloneNode(true);
            mobileSelectElement.appendChild(mobileOpt);
        }
    });

    if (currentSelected) {
        let rawKey = currentSelected.replace(/^[+-]\s*/, "").split(" ")[0];
        for (let opt of selectElement.options) {
            if (opt.value.includes(rawKey)) { opt.selected = true; break; }
        }
        if (mobileSelectElement) {
            for (let opt of mobileSelectElement.options) {
                if (opt.value.includes(rawKey)) { opt.selected = true; break; }
            }
        }
    }
}

/**
 * Event handler triggered when a new script ID is selected, updating comparison views and saving state[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function onSelectID() { renderComparisonViews(); saveUIStateToCache(); }

/**
 * Event handler triggered when a new script ID is selected from the mobile dropdown.
 * Syncs the main select element and triggers the standard update.
 */
export function onSelectIDMobile() { 
    const mobileSelect = document.getElementById("scriptSelectMobile");
    const mainSelect = document.getElementById("scriptSelect");
    if (mobileSelect && mainSelect) {
        mainSelect.value = mobileSelect.value;
    }
    onSelectID(); 
}

/**
 * Event handler triggered when comparison file selections change, updating views and saving state[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function onCompareSelectionChange() { renderComparisonViews(); saveUIStateToCache(); }

/**
 * Extracts and populates text content for the left and right comparison text areas based on current selections[cite: 7].
 * Called by: parser.js and main.js[cite: 7]
 */
export function renderComparisonViews() {
    const selectElement = document.getElementById("scriptSelect");
    const selectLeft = document.getElementById("fileSelectLeft");
    const selectRight = document.getElementById("fileSelectRight");
    const outputLeft = document.getElementById("outputAreaLeft");
    const outputRight = document.getElementById("outputAreaRight");

    if (!selectElement.value || state.loadedFilesRegistry.length === 0) {
        outputLeft.value = ""; outputRight.value = ""; return;
    }

    let key = selectElement.value.replace(/^[+-]\s*/, "").split(" ")[0];
    outputLeft.value = (selectLeft.value !== "" && state.loadedFilesRegistry[selectLeft.value]) ? extractScriptText(state.loadedFilesRegistry[selectLeft.value].data, key) : "[No file]";
    outputRight.value = (selectRight.value !== "" && state.loadedFilesRegistry[selectRight.value]) ? extractScriptText(state.loadedFilesRegistry[selectRight.value].data, key) : "[No file]";
}

/**
 * Extracts raw text blocks or script lines safely from a data object using specific key paths or fallback structures[cite: 7].
 * Called by: parser.js and benchmark.js[cite: 7]
 */
export function extractScriptText(dataObj, key) {
    if (!dataObj[key]) return "[ID not found]";
    const item = dataObj[key];
    try {
        if (item.SCRIPTS?.PART1?.TRANSLATIONS) return item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"].join("\n");
        if (item.SCRIPTS?.PART1?.SCRIPT) return item.SCRIPTS.PART1["SCRIPT"].join("\n");
        if (Array.isArray(item)) return item.join("\n");
    } catch (e) {}

    if (Array.isArray(item)) return item.join("\n");
    return JSON.stringify(item, null, 2);
}

/**
 * Saves manual edits made in the left text area back into the respective file registry object in memory[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function saveEditsToMemory() {
    console.log('[Trace:Files] saveEditsToMemory() invoked.');
    const selectElement = document.getElementById("scriptSelect");
    const selectLeft = document.getElementById("fileSelectLeft");
    if (!selectElement.value || selectLeft.value === "") showError("Select script ID and Source 1 file.");
    let key = selectElement.value.replace(/^[+-]\s*/, "").split(" ")[0];
    let fileObj = state.loadedFilesRegistry[selectLeft.value];
    if (!fileObj.data[key]) showError("ID not found in file.");

    const lines = document.getElementById("outputAreaLeft").value.split("\n");
    if (fileObj.data[key].SCRIPTS?.PART1?.TRANSLATIONS) {
        fileObj.data[key].SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = lines;
    } else if (fileObj.data[key].SCRIPTS?.PART1?.SCRIPT) {
        fileObj.data[key].SCRIPTS.PART1["SCRIPT"] = lines;
    } else if (Array.isArray(fileObj.data[key])) {
        fileObj.data[key] = lines;
    } else {
        fileObj.data[key] = lines;
    }
    saveFilesToCache(state.loadedFilesRegistry);
    showError("Edits saved successfully!");
}

/**
 * Commits line arrays into the target file registry object, updates views, and caches changes[cite: 7].
 * Called by: parser.js and translator.js[cite: 7]
 */
export function commitTextToRightFile(fileObj, key, linesArray) {
    console.log(`[Trace:Files] commitTextToRightFile(key="${key}", lines=${linesArray.length}) invoked.`);
    const item = fileObj.data[key];
    if (item && item.SCRIPTS?.PART1?.TRANSLATIONS) {
        item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = linesArray;
    } else if (item && item.SCRIPTS?.PART1?.SCRIPT) {
        item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = linesArray;
        item.SCRIPTS.PART1["SCRIPT"] = linesArray;
    } else {
        fileObj.data[key] = {
            "SCRIPTS": { "PART1": { "TRANSLATIONS": [{ "LANGUAGE": "English", "TRANSLATOR": "CAT-Translate", "SCRIPT": linesArray }] } }
        };
    }
    renderComparisonViews();
    updateMasterIDList();
    saveFilesToCache(state.loadedFilesRegistry);
}

/**
 * Injects the text currently in the left output area into the right target file registry[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function injectTranslationToRight() {
    console.log('[Trace:Files] injectTranslationToRight() invoked.');
    const selectElement = document.getElementById("scriptSelect");
    const selectRight = document.getElementById("fileSelectRight");
    if (!selectElement.value || selectRight.value === "") showError("Select script ID and Source 2 target.");
    let key = selectElement.value.replace(/^[+-]\s*/, "").split(" ")[0];
    let fileObj = state.loadedFilesRegistry[selectRight.value];
    if (!fileObj.data[key]) {
        fileObj.data[key] = { "SCRIPTS": { "PART1": { "TRANSLATIONS": [{ "LANGUAGE": "English", "TRANSLATOR": "Custom", "SCRIPT": [] }] } } };
    }
    commitTextToRightFile(fileObj, key, document.getElementById("outputAreaLeft").value.split("\n"));
}

/**
 * Generates and triggers a browser download for a JSON file export of the specified registry item[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function downloadFile(idx) {
    console.log(`[Trace:Files] downloadFile(idx="${idx}") invoked.`);
    if (idx === "" || !state.loadedFilesRegistry[idx]) showError("Select a file to export.");
    let fileObj = state.loadedFilesRegistry[idx];
    const blob = new Blob([JSON.stringify(fileObj.data, null, 4)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "updated_" + fileObj.name;
    a.click();
}