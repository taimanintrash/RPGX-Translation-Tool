import { state } from './main.js';
import { saveFilesToCache, saveUIStateToCache } from './database.js';
import { showError, showSuccess } from './ui.js';

/**
 * Handles the file-selection event via FileReader, reads each file asynchronously, parses it to JSON, and adds/updates it in the loaded-files registry
 * Called by: HTML event handler via main.js window.loadFiles (HTML file input)
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
 * When all asynchronous file reads complete, refreshes application state and persists the file registry and UI state to cache
 * Called by: js/parser.js (loadFiles)
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
 * Removes a file from the loaded-files registry by name, then refreshes application state and re-caches the registry and UI state
 * Called by: HTML event handler via main.js window.removeFiles (HTML remove button)
 */
export function removeFile(fileName) {
    console.log(`[Trace:Files] removeFile("${fileName}") invoked.`);
    state.loadedFilesRegistry = state.loadedFilesRegistry.filter(f => f.name !== fileName);
    refreshApplicationState();
    saveFilesToCache(state.loadedFilesRegistry);
    saveUIStateToCache();
}

/**
 * Parses file content into JSON, falling back to a regex extraction of the first {...} block when standard JSON.parse fails
 * Called by: js/parser.js (loadFiles)
 */
export function parseContentToJSON(content, fileName) {
    try { return JSON.parse(content); } catch (e1) { console.warn(`[Trace:Files] Standard JSON.parse failed for "${fileName}", trying regex extraction.`); }
    try {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
    } catch (e2) { console.warn(`[Trace:Files] Regex JSON extraction also failed for "${fileName}".`); }
    return null;
}

/**
 * Refreshes all core UI elements after a file-registry change: the file list, file dropdowns, master ID list, benchmark dropdown, and comparison views
 * Called by: js/parser.js (checkFinishedReads, removeFile), js/main.js (DOMContentLoaded)
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
 * Renders the loaded-files tag list in the sidebar and toggles the global warning shown when fewer than two files are loaded
 * Called by: js/parser.js (refreshApplicationState)
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
 * Populates the left/right source-file dropdowns from the loaded-files registry, restoring prior selections and avoiding identical left/right choices
 * Called by: js/parser.js (refreshApplicationState)
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
 * Populates the benchmark reference-file dropdown from the loaded-files registry, restoring the prior selection, then refreshes the scene dropdown
 * Called by: js/parser.js (refreshApplicationState)
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
 * Populates the benchmark reference-scene dropdown from the keys of the selected reference file, restoring the prior scene selection
 * Called by: HTML event handler via main.js window.updateBenchmarkSceneDropdown (HTML dropdown onchange)
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
 * Populates the master script-ID dropdown (desktop and mobile) with the unique keys across all loaded files, marking each with a completeness symbol and file count
 * Called by: js/parser.js (refreshApplicationState, commitTextToRightFile)
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
 * Event handler for script-ID selection: re-renders the comparison views and persists UI state
 * Called by: HTML event handler via main.js window.onSelectID (HTML select onchange)
 */
export function onSelectID() { renderComparisonViews(); saveUIStateToCache(); }

/**
 * Event handler for mobile script-ID selection: syncs the main select element to the mobile selection and delegates to the standard ID handler
 * Called by: HTML event handler via main.js window.onSelectIDMobile (HTML mobile select onchange)
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
 * Event handler for left/right file-selection change: re-renders the comparison views and persists UI state
 * Called by: HTML event handler via main.js window.onCompareSelectionChange (HTML select onchange)
 */
export function onCompareSelectionChange() { renderComparisonViews(); saveUIStateToCache(); }

/**
 * Renders the left (source) and right (target) comparison text areas for the selected script ID using the currently chosen left/right files
 * Called by: js/parser.js (onSelectID, onCompareSelectionChange), js/main.js (DOMContentLoaded)
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
 * Updates an array of dialogue objects in place with translated/edited speaker names and serif texts from a flat lines array, using segment-based alignment.
 * Called by: parser.js (commitTextToRightFile, saveEditsToMemory)
 */
function updateScriptArrayFromLines(scriptArray, lines) {
    let namedIndices = [];
    for (let i = 0; i < scriptArray.length; i++) {
        if (scriptArray[i] && scriptArray[i].Name) namedIndices.push(i);
    }
    let namePlateIndices = [];
    for (let j = 0; j < lines.length; j++) {
        if (lines[j] && lines[j].startsWith("<NAME_PLATE>")) namePlateIndices.push(j);
    }

    if (namedIndices.length === namePlateIndices.length) {
        // Segment-based mapping
        let objEnd = namedIndices.length > 0 ? namedIndices[0] : scriptArray.length;
        let lineEnd = namePlateIndices.length > 0 ? namePlateIndices[0] : lines.length;
        
        let initialSerifText = [];
        let initialMetadata = {};
        for (let j = 0; j < lineEnd; j++) {
            let line = lines[j];
            if (line.startsWith("<BGM>")) initialMetadata.BGM = line.replace("<BGM>", "").trim();
            else if (line.startsWith("<VOICE>")) initialMetadata.Voice = line.replace("<VOICE>", "").trim();
            else if (line.startsWith("<MOTION>")) initialMetadata.Motion = parseInt(line.replace("<MOTION>", "").trim(), 10);
            else if (line.startsWith("<IMAGE>")) initialMetadata.StillPath = line.replace("<IMAGE>", "").trim();
            else if (line.startsWith("<SE>")) initialMetadata.SE = line.replace("<SE>", "").trim();
            else if (line.startsWith("<EFFECT>")) initialMetadata.Effect = line.replace("<EFFECT>", "").trim();
            else if (line.startsWith("<CH_ANIM>")) initialMetadata.CharaAnimation = parseInt(line.replace("<CH_ANIM>", "").trim(), 10);
            else initialSerifText.push(line);
        }

        if (objEnd > 0) {
            if (initialMetadata.BGM !== undefined) scriptArray[0].BGM = initialMetadata.BGM;
            if (initialMetadata.Voice !== undefined) scriptArray[0].Voice = initialMetadata.Voice;
            if (initialMetadata.Motion !== undefined) scriptArray[0].Motion = initialMetadata.Motion;
            if (initialMetadata.StillPath !== undefined) scriptArray[0].StillPath = initialMetadata.StillPath;
            if (initialMetadata.SE !== undefined) scriptArray[0].SE = initialMetadata.SE;
            if (initialMetadata.Effect !== undefined) scriptArray[0].Effect = initialMetadata.Effect;
            if (initialMetadata.CharaAnimation !== undefined) scriptArray[0].CharaAnimation = initialMetadata.CharaAnimation;
        }

        assignSegment(scriptArray.slice(0, objEnd), initialSerifText);

        for (let s = 0; s < namedIndices.length; s++) {
            let objStart = namedIndices[s];
            let objEnd = s + 1 < namedIndices.length ? namedIndices[s + 1] : scriptArray.length;
            let lineStart = namePlateIndices[s];
            let lineEnd = s + 1 < namePlateIndices.length ? namePlateIndices[s + 1] : lines.length;

            let namePlateText = "";
            let serifText = [];
            let metadata = {};

            for (let j = lineStart; j < lineEnd; j++) {
                let line = lines[j];
                if (line.startsWith("<NAME_PLATE>")) {
                    namePlateText = line.replace("<NAME_PLATE>", "").replace(/[「」]/g, "").trim();
                } else if (line.startsWith("<BGM>")) {
                    metadata.BGM = line.replace("<BGM>", "").trim();
                } else if (line.startsWith("<VOICE>")) {
                    metadata.Voice = line.replace("<VOICE>", "").trim();
                } else if (line.startsWith("<MOTION>")) {
                    metadata.Motion = parseInt(line.replace("<MOTION>", "").trim(), 10);
                } else if (line.startsWith("<IMAGE>")) {
                    metadata.StillPath = line.replace("<IMAGE>", "").trim();
                } else if (line.startsWith("<SE>")) {
                    metadata.SE = line.replace("<SE>", "").trim();
                } else if (line.startsWith("<EFFECT>")) {
                    metadata.Effect = line.replace("<EFFECT>", "").trim();
                } else if (line.startsWith("<CH_ANIM>")) {
                    metadata.CharaAnimation = parseInt(line.replace("<CH_ANIM>", "").trim(), 10);
                } else {
                    serifText.push(line);
                }
            }

            scriptArray[objStart].Name = namePlateText;
            if (metadata.BGM !== undefined) scriptArray[objStart].BGM = metadata.BGM;
            if (metadata.Voice !== undefined) scriptArray[objStart].Voice = metadata.Voice;
            if (metadata.Motion !== undefined) scriptArray[objStart].Motion = metadata.Motion;
            if (metadata.StillPath !== undefined) scriptArray[objStart].StillPath = metadata.StillPath;
            if (metadata.SE !== undefined) scriptArray[objStart].SE = metadata.SE;
            if (metadata.Effect !== undefined) scriptArray[objStart].Effect = metadata.Effect;
            if (metadata.CharaAnimation !== undefined) scriptArray[objStart].CharaAnimation = metadata.CharaAnimation;

            assignSegment(scriptArray.slice(objStart, objEnd), serifText);
        }
    } else {
        // Fallback mapping: Assign non-name-plate lines to Serifs sequentially
        let serifLines = lines.filter(l => !l.startsWith("<NAME_PLATE>"));
        for (let i = 0; i < scriptArray.length; i++) {
            if (i < serifLines.length) {
                scriptArray[i].Serif = serifLines[i];
            }
        }
    }
}

/**
 * Distributes a segment of dialogue lines to a matching segment of script objects.
 * Called by: parser.js (updateScriptArrayFromLines)
 */
function assignSegment(objs, dialogueLines) {
    if (objs.length === 0) return;
    let k = objs.length;
    let m = dialogueLines.length;
    if (k === 1) {
        objs[0].Serif = dialogueLines.join("\n");
    } else {
        if (m === k) {
            for (let r = 0; r < k; r++) objs[r].Serif = dialogueLines[r];
        } else if (m < k) {
            for (let r = 0; r < k; r++) {
                objs[r].Serif = r < m ? dialogueLines[r] : "";
            }
        } else {
            objs[0].Serif = dialogueLines.slice(0, m - k + 1).join("\n");
            for (let r = 1; r < k; r++) {
                objs[r].Serif = dialogueLines[m - k + r];
            }
        }
    }
}

/**
 * Extracts the script text for a given key from a file data object, following the SCRIPTS.PART1.TRANSLATIONS/SCRIPT structure with array and JSON-stringification fallbacks
 * Called by: js/parser.js (renderComparisonViews), js/benchmark.js (runParameterSweepBenchmark)
 */
export function extractScriptText(dataObj, key) {
    if (!dataObj[key]) return "[ID not found]";
    const item = dataObj[key];
    try {
        if (item.SCRIPTS?.PART1?.TRANSLATIONS) {
            const scriptArray = item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"];
            if (Array.isArray(scriptArray)) {
                if (scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
                    let extracted = [];
                    for (let entry of scriptArray) {
                        if (entry.Name) extracted.push(`<NAME_PLATE>${entry.Name}`);
                        if (entry.BGM) extracted.push(`<BGM>${entry.BGM}`);
                        if (entry.Voice) extracted.push(`<VOICE>${entry.Voice}`);
                        if (entry.Motion !== undefined && entry.Motion !== null && entry.Motion !== "") extracted.push(`<MOTION>${entry.Motion}`);
                        if (entry.StillPath) extracted.push(`<IMAGE>${entry.StillPath}`);
                        if (entry.SE) extracted.push(`<SE>${entry.SE}`);
                        if (entry.Effect) extracted.push(`<EFFECT>${entry.Effect}`);
                        if (entry.CharaAnimation !== undefined && entry.CharaAnimation !== null && entry.CharaAnimation !== "") extracted.push(`<CH_ANIM>${entry.CharaAnimation}`);
                        extracted.push(entry.Serif || "");
                    }
                    return extracted.join("\n");
                }
                return scriptArray.join("\n");
            }
        }
        if (item.SCRIPTS?.PART1?.SCRIPT) {
            const scriptArray = item.SCRIPTS.PART1["SCRIPT"];
            if (Array.isArray(scriptArray)) {
                if (scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
                    let extracted = [];
                    for (let entry of scriptArray) {
                        if (entry.Name) extracted.push(`<NAME_PLATE>${entry.Name}`);
                        if (entry.BGM) extracted.push(`<BGM>${entry.BGM}`);
                        if (entry.Voice) extracted.push(`<VOICE>${entry.Voice}`);
                        if (entry.Motion !== undefined && entry.Motion !== null && entry.Motion !== "") extracted.push(`<MOTION>${entry.Motion}`);
                        if (entry.StillPath) extracted.push(`<IMAGE>${entry.StillPath}`);
                        if (entry.SE) extracted.push(`<SE>${entry.SE}`);
                        if (entry.Effect) extracted.push(`<EFFECT>${entry.Effect}`);
                        if (entry.CharaAnimation !== undefined && entry.CharaAnimation !== null && entry.CharaAnimation !== "") extracted.push(`<CH_ANIM>${entry.CharaAnimation}`);
                        extracted.push(entry.Serif || "");
                    }
                    return extracted.join("\n");
                }
                return scriptArray.join("\n");
            }
        }
        if (Array.isArray(item)) {
            if (item.length > 0 && typeof item[0] === 'object' && item[0] !== null) {
                let extracted = [];
                for (let entry of item) {
                    if (entry.Name) extracted.push(`<NAME_PLATE>${entry.Name}`);
                    if (entry.BGM) extracted.push(`<BGM>${entry.BGM}`);
                    if (entry.Voice) extracted.push(`<VOICE>${entry.Voice}`);
                    if (entry.Motion !== undefined && entry.Motion !== null && entry.Motion !== "") extracted.push(`<MOTION>${entry.Motion}`);
                    if (entry.StillPath) extracted.push(`<IMAGE>${entry.StillPath}`);
                    if (entry.SE) extracted.push(`<SE>${entry.SE}`);
                    if (entry.Effect) extracted.push(`<EFFECT>${entry.Effect}`);
                    if (entry.CharaAnimation !== undefined && entry.CharaAnimation !== null && entry.CharaAnimation !== "") extracted.push(`<CH_ANIM>${entry.CharaAnimation}`);
                    extracted.push(entry.Serif || "");
                }
                return extracted.join("\n");
            }
            return item.join("\n");
        }
    } catch (e) { console.warn('[Trace:Files] extractScriptText structured extraction failed, falling back to stringification.', e); }

    if (Array.isArray(item)) return item.join("\n");
    return JSON.stringify(item, null, 2);
}

/**
 * Saves manual edits from the left text area back into the corresponding script-ID entry of the selected file in the registry, then re-caches the registry
 * Called by: HTML event handler via main.js window.saveEditsToMemory (HTML save button)
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
        const scriptArray = fileObj.data[key].SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"];
        if (Array.isArray(scriptArray) && scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
            updateScriptArrayFromLines(scriptArray, lines);
        } else {
            fileObj.data[key].SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = lines;
        }
    } else if (fileObj.data[key].SCRIPTS?.PART1?.SCRIPT) {
        const scriptArray = fileObj.data[key].SCRIPTS.PART1["SCRIPT"];
        if (Array.isArray(scriptArray) && scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
            updateScriptArrayFromLines(scriptArray, lines);
        } else {
            fileObj.data[key].SCRIPTS.PART1["SCRIPT"] = lines;
        }
    } else if (Array.isArray(fileObj.data[key])) {
        const scriptArray = fileObj.data[key];
        if (scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
            updateScriptArrayFromLines(scriptArray, lines);
        } else {
            fileObj.data[key] = lines;
        }
    } else {
        fileObj.data[key] = lines;
    }
    saveFilesToCache(state.loadedFilesRegistry);
    showSuccess("Edits saved successfully!");
}

/**
 * Writes a line array into the selected script-ID entry of the target file registry object (creating the SCRIPTS/PART1/TRANSLATIONS structure if missing), then re-renders views, updates the ID list, and re-caches
 * Called by: js/translator.js (translateViaAiServer)
 */
export function commitTextToRightFile(fileObj, key, linesArray) {
    console.log(`[Trace:Files] commitTextToRightFile(key="${key}", lines=${linesArray.length}) invoked.`);
    
    // Get the source item if available to copy structure if target is fresh or missing structure
    const selectLeft = document.getElementById("fileSelectLeft");
    let sourceItem = null;
    if (selectLeft && selectLeft.value !== "" && state.loadedFilesRegistry[selectLeft.value]) {
        sourceItem = state.loadedFilesRegistry[selectLeft.value].data[key];
    }

    let item = fileObj.data[key];
    if (!item && sourceItem) {
        item = JSON.parse(JSON.stringify(sourceItem));
        fileObj.data[key] = item;
    }

    if (item && item.SCRIPTS?.PART1?.TRANSLATIONS) {
        const scriptArray = item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"];
        if (Array.isArray(scriptArray) && scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
            updateScriptArrayFromLines(scriptArray, linesArray);
        } else {
            item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = linesArray;
        }
        if (item.SCRIPTS?.PART1?.SCRIPT) {
            const origScriptArray = item.SCRIPTS.PART1["SCRIPT"];
            if (Array.isArray(origScriptArray) && origScriptArray.length > 0 && typeof origScriptArray[0] === 'object' && origScriptArray[0] !== null) {
                updateScriptArrayFromLines(origScriptArray, linesArray);
            } else {
                item.SCRIPTS.PART1["SCRIPT"] = linesArray;
            }
        }
    } else if (item && item.SCRIPTS?.PART1?.SCRIPT) {
        const scriptArray = item.SCRIPTS.PART1["SCRIPT"];
        if (Array.isArray(scriptArray) && scriptArray.length > 0 && typeof scriptArray[0] === 'object' && scriptArray[0] !== null) {
            if (!item.SCRIPTS.PART1.TRANSLATIONS) {
                item.SCRIPTS.PART1.TRANSLATIONS = [{ "LANGUAGE": "English", "TRANSLATOR": "CAT-Translate", "SCRIPT": [] }];
            }
            const transScriptArray = item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"];
            if (Array.isArray(transScriptArray) && transScriptArray.length > 0 && typeof transScriptArray[0] === 'object' && transScriptArray[0] !== null) {
                updateScriptArrayFromLines(transScriptArray, linesArray);
            } else {
                const clonedScript = JSON.parse(JSON.stringify(scriptArray));
                updateScriptArrayFromLines(clonedScript, linesArray);
                item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = clonedScript;
            }
            updateScriptArrayFromLines(scriptArray, linesArray);
        } else {
            if (!item.SCRIPTS.PART1.TRANSLATIONS) {
                item.SCRIPTS.PART1.TRANSLATIONS = [{ "LANGUAGE": "English", "TRANSLATOR": "CAT-Translate", "SCRIPT": [] }];
            }
            item.SCRIPTS.PART1.TRANSLATIONS[0]["SCRIPT"] = linesArray;
            item.SCRIPTS.PART1["SCRIPT"] = linesArray;
        }
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
 * Takes the current right-hand text area content and commits it into the selected script-ID entry of the right-hand target file, creating the entry structure if missing
 * Called by: HTML event handler via main.js window.injectTranslationToRight (HTML inject button)
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
    commitTextToRightFile(fileObj, key, document.getElementById("outputAreaRight").value.split("\n"));
}

/**
 * Generates a JSON Blob from the selected registry item and triggers a browser download of it as updated_<filename>
 * Called by: HTML event handler via main.js window.downloadFile (HTML download button)
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