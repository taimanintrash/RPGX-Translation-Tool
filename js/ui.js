import { state } from './main.js';
import { saveUIStateToCache } from './database.js';
import { defaultPresetManifest } from './translator.js';

/**
 * Initializes mouse drag-and-drop mechanics for the floating debug modal window[cite: 7].
 * Called by: main.js[cite: 7]
 */
export function initDraggableModal() {
    const modal = document.getElementById("draggableDebugModal");
    const header = document.getElementById("debugModalHeader");
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('modal-close-x')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = modal.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        modal.style.position = 'absolute';
        modal.style.left = initialLeft + 'px';
        modal.style.top = initialTop + 'px';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    });

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        modal.style.left = (initialLeft + dx) + 'px';
        modal.style.top = (initialTop + dy) + 'px';
    }

    function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
}

/**
 * Displays an error message banner on the user interface[cite: 7].
 * Called by: parser.js, translator.js, and ui.js[cite: 7]
 */
export function showError(msg) {
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.style.display = "block";
        banner.textContent = "❌ ERROR:\n" + msg;
    }
    console.error("[Error Banner]", msg);
}

/**
 * Clears and hides the error message banner[cite: 7].
 * Called by: translator.js (fetchOllamaModels, generateStylizationMapWithAI, translateViaOllama)[cite: 7]
 */
export function clearError() {
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.style.display = "none";
        banner.textContent = "";
    }
}

/**
 * Dynamically renders one custom-upload row per available default preset file in `defalt_presets/`.
 * The defaults themselves are already loaded into memory on startup; these controls let a user
 * upload a custom JSON to override any operation tier in memory. The number of rows scales with
 * the entries in `defaultPresetManifest`.
 * Called by: ui.js (openDebugMenu)[cite: 7]
 */
export function renderDistinctPresetControls() {
    const container = document.getElementById("distinctPresetsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!defaultPresetManifest || defaultPresetManifest.length === 0) {
        container.innerHTML = '<em style="color: #64748b; font-size: 11px; grid-column: span 2;">No default preset files found in defalt_presets/.</em>';
        return;
    }

    defaultPresetManifest.forEach(preset => {
        const cell = document.createElement("div");

        const lbl = document.createElement("label");
        lbl.style.fontWeight = "bold";
        lbl.textContent = preset.label + ":";
        cell.appendChild(lbl);

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.style.fontSize = "11px";
        input.style.width = "100%";
        input.title = "Override the " + preset.label + " default with a custom JSON (default already loaded from " + preset.file + ")";
        input.onchange = (event) => loadSpecificPreset(preset.operationKey, event);
        cell.appendChild(input);

        container.appendChild(cell);
    });
}

/**
 * Opens the debug modal overlay and initializes input values and UI page elements[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function openDebugMenu() {
    state.currentDebugPage = 1;
    updateDebugPageDisplay();
    renderDistinctPresetControls();
    document.getElementById("debugModalOverlay").style.display = "block";
    document.getElementById("maxLinesLimitInput").value = state.debugMaxLinesLimit;
    document.getElementById("autoSkipNameModalCheckbox").checked = state.autoSkipNameModal;
    document.getElementById("manualStepModeCheckbox").checked = state.manualStepByStepMode;
    document.getElementById("stylizationModeSelect").value = state.stylizationMode;
    document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
    renderDiscoveredMappingsUI();
}

/**
 * Switches between different pages within the debug modal interface[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function switchDebugPage(direction) {
    state.currentDebugPage += direction;
    if (state.currentDebugPage < 1) state.currentDebugPage = 1;
    if (state.currentDebugPage > 2) state.currentDebugPage = 2;
    updateDebugPageDisplay();
}

/**
 * Updates the visibility of sections and button states for the current debug page view[cite: 7].
 * Called by: ui.js (openDebugMenu, switchDebugPage)[cite: 7]
 */
export function updateDebugPageDisplay() {
    const page1 = document.getElementById("debugPage1");
    const page2 = document.getElementById("debugPage2");
    const prevBtn = document.getElementById("debugPrevBtn");
    const nextBtn = document.getElementById("debugNextBtn");
    const title = document.getElementById("debugModalTitle");

    if (state.currentDebugPage === 1) {
        page1.style.display = "flex";
        page2.style.display = "none";
        prevBtn.style.display = "none";
        nextBtn.style.display = "inline-block";
        title.textContent = "Translation & Stylization (Page 1 / 2)";
    } else {
        page1.style.display = "none";
        page2.style.display = "flex";
        prevBtn.style.display = "inline-block";
        nextBtn.style.display = "none";
        title.textContent = "Inconsistency-Focused Benchmark Suite (Page 2 / 2)";
    }
}

/**
 * Saves configuration changes from the debug modal inputs and closes the debug overlay[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function closeDebugMenu() {
    const limitVal = parseInt(document.getElementById("maxLinesLimitInput").value);
    state.debugMaxLinesLimit = isNaN(limitVal) || limitVal < 0 ? 0 : limitVal;
    state.autoSkipNameModal = document.getElementById("autoSkipNameModalCheckbox").checked;
    state.manualStepByStepMode = document.getElementById("manualStepModeCheckbox").checked;
    state.stylizationMode = document.getElementById("stylizationModeSelect").value;

    try {
        const parsedMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        state.heavyStylizationMap = parsedMap;
    } catch (e) {
        showError("Invalid JSON format in Stylization Map. Changes to the map were not saved.");
    }

    document.getElementById("debugModalOverlay").style.display = "none";
    saveUIStateToCache();
}

/**
 * Closes the debug modal overlay without saving input changes[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function closeDebugMenuWithoutSaving() {
    document.getElementById("debugModalOverlay").style.display = "none";
}

/**
 * Parses and saves the current JSON contents of the stylization map editor to application memory and cache[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function saveStylizationMapFromView() {
    try {
        const editorValue = document.getElementById("stylizationMapEditor").value;
        const parsedMap = JSON.parse(editorValue);
        state.heavyStylizationMap = parsedMap;
        saveUIStateToCache();
        showError("Stylization mapping successfully saved to variable and local cache!");
    } catch (e) {
        showError("Error: Invalid JSON format. Please fix any syntax or comma errors before saving.");
    }
}

/**
 * Renders the dynamic HTML container listing discovered stylization mappings pending review[cite: 7].
 * Called by: translator.js and ui.js[cite: 7]
 */
export function renderDiscoveredMappingsUI() {
    let container = document.getElementById("discoveredMappingsContainer");
    if (!container) return;

    if (state.pendingDiscoveredMappings.length === 0) {
        container.innerHTML = `<em style="color: #64748b; font-size: 11px;">No pending mappings discovered yet. Click "Generate Mapping" above.</em>`;
        return;
    }

    let html = `<div style="display: flex; gap: 6px; margin-bottom: 6px;">
        <button class="action-btn" style="padding: 2px 6px; font-size: 11px;" onclick="setAllDiscoveredSelection(true)">Select All</button>
        <button class="action-btn" style="padding: 2px 6px; font-size: 11px; background-color: #64748b;" onclick="setAllDiscoveredSelection(false)">Deselect All</button>
    </div>`;

    html += `<div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #f8fafc; max-height: 160px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">`;

    state.pendingDiscoveredMappings.forEach((item, index) => {
        html += `<div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 12px; gap: 6px;">
            <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleDiscoveredSelection(${index}, this.checked)" style="cursor: pointer; width: 14px; height: 14px;">
            <div style="display: flex; align-items: center; gap: 4px; flex: 1; font-family: monospace;">
                <input type="text" id="discKey_${index}" value="${item.key}" oninput="updateDiscoveredKey(${index}, this.value)" style="width: 45%; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 3px;">
                <span>➔</span>
                <input type="text" id="discVal_${index}" value="${item.value}" oninput="updateDiscoveredVal(${index}, this.value)" style="width: 45%; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 3px;">
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Updates the selection status of an individual pending discovered mapping item[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function toggleDiscoveredSelection(index, isChecked) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].selected = isChecked;
}

/**
 * Sets the selection state for all pending discovered mapping items at once[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function setAllDiscoveredSelection(selectionState) {
    state.pendingDiscoveredMappings.forEach(item => item.selected = selectionState);
    renderDiscoveredMappingsUI();
}

/**
 * Updates the key string of a pending discovered mapping entry[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function updateDiscoveredKey(index, newVal) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].key = newVal;
}

/**
 * Updates the value string of a pending discovered mapping entry[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function updateDiscoveredVal(index, newVal) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].value = newVal;
}

/**
 * Commits selected pending discovered mappings into the active heavy stylization map dictionary[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function commitApprovedMappingsToMap() {
    let selectedItems = state.pendingDiscoveredMappings.filter(item => item.selected);
    if (selectedItems.length === 0) showError("No mappings are selected. Please check at least one item to add.");

    try {
        let currentMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        selectedItems.forEach(item => { if (item.key.trim() !== "") currentMap[item.key] = item.value; });
        state.heavyStylizationMap = currentMap;
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);

        state.pendingDiscoveredMappings = state.pendingDiscoveredMappings.filter(item => !item.selected);
        renderDiscoveredMappingsUI();
        saveUIStateToCache();
        showError("Selected mappings successfully added to the Stylization Map!");
    } catch (e) {
        showError("Error parsing current Stylization Map JSON editor content. Fix syntax before committing.");
    }
}

/**
 * Deletes selected items from the pending discovered mappings list[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function deleteSelectedDiscoveredMappings() {
    let selectedCount = state.pendingDiscoveredMappings.filter(item => item.selected).length;
    if (selectedCount === 0) showError("No mappings are selected to remove.");
    state.pendingDiscoveredMappings = state.pendingDiscoveredMappings.filter(item => !item.selected);
    renderDiscoveredMappingsUI();
}

/**
 * Copies the current text contents of the stylization map editor to the system clipboard[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function copyStylizationMapToClipboard() {
    const mapText = document.getElementById("stylizationMapEditor").value;
    try {
        await navigator.clipboard.writeText(mapText);
        showError("Stylization mapping copied to clipboard!");
    } catch (err) {
        showError("Failed to copy mapping to clipboard: " + err.message);
    }
}

/**
 * Displays a modal prompt to let the user review or modify character name translations interactively[cite: 7].
 * Called by: translator.js (translateViaOllama)[cite: 7]
 */
export function promptUserForNameTranslation(originalName, aiTranslatedName) {
    return new Promise((resolve, reject) => {
        if (state.autoSkipNameModal) return resolve(aiTranslatedName);

        const overlay = document.getElementById("nameModalOverlay");
        const origInput = document.getElementById("modalOriginalName");
        const transInput = document.getElementById("modalInputName");

        origInput.value = originalName;
        transInput.value = aiTranslatedName;
        overlay.style.display = "flex";
        transInput.focus();
        transInput.select();

        state.activeNameResolver = (userConfirmedValue) => {
            overlay.style.display = "none";
            resolve(userConfirmedValue);
        };

        if (state.currentAbortController) {
            state.currentAbortController.signal.addEventListener('abort', () => {
                overlay.style.display = "none";
                reject(new Error("Translation cancelled by user."));
            }, { once: true });
        }
    });
}

/**
 * Resolves the active name translation modal promise with the user's input value[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function resolveNameModal() {
    const transInput = document.getElementById("modalInputName").value.trim();
    if (state.activeNameResolver) {
        state.activeNameResolver(transInput);
        state.activeNameResolver = null;
    }
}

/**
 * Closes the name translation modal and passes an empty fallback value[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function closeNameModal() {
    const overlay = document.getElementById("nameModalOverlay");
    overlay.style.display = "none";
    if (state.activeNameResolver) {
        state.activeNameResolver("");
        state.activeNameResolver = null;
    }
}

/**
 * Opens the manual step toolbar to allow step-by-step translation evaluation and editing[cite: 7].
 * Called by: translator.js (translateViaOllama)[cite: 7]
 */
export function promptUserForManualStep(currentChunkText, currentContextWindow) {
    return new Promise((resolve, reject) => {
        const toolbar = document.getElementById("manualStepToolbar");
        toolbar.style.display = "flex";
        
        const outputRight = document.getElementById("outputAreaRight");
        outputRight.classList.add("editable");

        state.manualStepResolver = (action, newContextCount) => {
            toolbar.style.display = "none";
            resolve({ action, newContextCount });
        };

        if (state.currentAbortController) {
            state.currentAbortController.signal.addEventListener('abort', () => {
                toolbar.style.display = "none";
                reject(new Error("Translation cancelled by user."));
            }, { once: true });
        }
    });
}

/**
 * Resolves the manual step prompt indicating a continue action[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function resolveManualStepContinue() {
    const contextCount = parseInt(document.getElementById("stepContextLinesInput").value) || 6;
    if (state.manualStepResolver) {
        state.manualStepResolver("continue", contextCount);
        state.manualStepResolver = null;
    }
}

/**
 * Resolves the manual step prompt indicating that a re-translation pass is required[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function triggerStepRetranslation() {
    const contextCount = parseInt(document.getElementById("stepContextLinesInput").value) || 6;
    if (state.manualStepResolver) {
        state.manualStepResolver("retranslate", contextCount);
        state.manualStepResolver = null;
    }
}