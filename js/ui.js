// ui.js
// Debug modal + stylization-map CRUD + error banner. The manual-step and
// name-plate modals live in ui-manual-step.js, and the pure DOM layout helpers
// (drag/resize/auto-number) live in ui-layout.js. Both are re-exported here so
// main.js/translator.js imports from ./ui.js keep resolving unchanged.

import { state } from './main.js';
import { saveUIStateToCache } from './database.js';
import { defaultPresetManifest } from './translator.js';
// Import syncManualStepUIVisibility locally so closeDebugMenu can call it; the rest are
// re-exported below for main.js/translator.js without a local binding.
import { syncManualStepUIVisibility } from './ui-manual-step.js';

// Re-export the manual-step + name-plate modal symbols so imports from ./ui.js resolve unchanged.
export { promptUserForNameTranslation, resolveNameModal, closeNameModal, syncManualStepModeLive, syncBracketStripToggles, setCurrentSourceLine, hideCurrentSourceLine, promptUserForManualStep, resolveManualStepContinue, applyStepContextSettings, triggerStepRetranslation } from './ui-manual-step.js';
export { syncManualStepUIVisibility } from './ui-manual-step.js';
// Re-export the pure DOM layout symbols so imports from ./ui.js resolve unchanged.
export { initDraggableModal, initPaneResizer, initAutoNumberInputs } from './ui-layout.js';

/**
 * Displays the error/success/warning banner with a variant class, label, and message
 * Called by: js/ui.js (showError, showSuccess, showWarning)
 */
function setBanner(variantClass, label, msg) {
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.classList.remove("banner-success", "banner-warning");
        if (variantClass) banner.classList.add(variantClass);
        banner.style.display = "block";
        banner.textContent = `[${label}]\n` + msg;
    }
}

/**
 * Displays an error banner with the given message and logs it to the console
 * Called by: js/parser.js (loadFiles, saveEditsToMemory, downloadFile, injectTranslationToRight), js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels), js/translator-presets.js (loadSpecificPreset, loadDefaultPreset), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings), js/benchmark.js (runParameterSweepBenchmark)
 */
export function showError(msg) {
    console.log('[Trace:UI] showError():', msg);
    setBanner(null, "ERROR", msg);
    console.error("[Error Banner]", msg);
}

/**
 * Displays a success banner with the given message and logs it to the console
 * Called by: js/parser.js (saveEditsToMemory)
 */
export function showSuccess(msg) {
    console.log('[Trace:UI] showSuccess():', msg);
    setBanner("banner-success", "SUCCESS", msg);
    console.log("[Success Banner]", msg);
}

/**
 * Displays a warning banner with the given message and logs it to the console
 * Called by: js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)
 */
export function showWarning(msg) {
    console.log('[Trace:UI] showWarning():', msg);
    setBanner("banner-warning", "WARNING", msg);
    console.warn("[Warning Banner]", msg);
}

/**
 * Hides and clears the error/success/warning banner
 * Called by: js/translator.js (generateStylizationMapWithAI, translateViaAiServer), js/translator-llm.js (fetchAiModels)
 */
export function clearError() {
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.classList.remove("banner-success", "banner-warning");
        banner.style.display = "none";
        banner.textContent = "";
    }
}

/**
 * Renders one file-input row per registered default preset into the distinct-presets container, wiring each to its loadSpecificPreset handler
 * Called by: js/ui.js (openDebugMenu)
 */
export function renderDistinctPresetControls() {
    console.log(`[Trace:UI] renderDistinctPresetControls() rendering ${defaultPresetManifest.length} preset row(s).`);
    const container = document.getElementById("distinctPresetsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!defaultPresetManifest || defaultPresetManifest.length === 0) {
        container.innerHTML = '<em style="color: #64748b; font-size: 11px; grid-column: span 2;">No default preset files found in default_presets/.</em>';
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
        input.dataset.operationKey = preset.operationKey;
        input.style.fontSize = "11px";
        input.style.width = "100%";
        input.style.border = "none";
        input.style.marginTop = "2px";
        input.style.marginBottom = "2px";
        input.title = "Override the " + preset.label + " default with a custom JSON (default already loaded from " + preset.file + ")";
        input.onchange = (event) => loadSpecificPreset(preset.operationKey, event);
        cell.appendChild(input);

        // Display label under the file input showing which preset is currently
        // active. Defaults to the shipped preset file name + " (default)"; updated
        // to the custom file's name when a user uploads a replacement.
        const display = document.createElement("div");
        display.dataset.operationKey = preset.operationKey;
        display.className = "preset-display";
        display.style.fontSize = "10px";
        display.style.color = "#64748b";
        display.style.marginBottom = "6px";
        display.textContent = preset.file.split("/").pop() + " (default)";
        cell.appendChild(display);

        container.appendChild(cell);
    });
}

/**
 * Opens the debug modal: resets to page 1, syncs all debug inputs from state, renders the preset controls and discovered mappings, and disables the Save Map button
 * Called by: HTML event handler via main.js window.openDebugMenu (HTML Debug button)
 */
export function openDebugMenu() {
    console.log('[Trace:UI] openDebugMenu() invoked.');
    state.currentDebugPage = 1;
    updateDebugPageDisplay();
    renderDistinctPresetControls();
    document.getElementById("debugModalOverlay").style.display = "block";
    document.getElementById("maxLinesLimitInput").value = state.debugMaxLinesLimit;
    document.getElementById("autoSkipNameModalCheckbox").checked = state.autoSkipNameModal;
    document.getElementById("manualStepModeCheckbox").checked = state.manualStepByStepMode;
    document.getElementById("stylizationModeSelect").value = state.stylizationMode;
    document.getElementById("mapperStripBracketsCheckbox").checked = state.mapperStripBrackets;
    document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
    // The map is freshly loaded from state, so there are no unsaved edits: start
    // the Save Map button disabled and grayed out. Editing the textarea or
    // running Generate Mapping reactivates it.
    setSaveMapButtonEnabled(false);
    initStylizationMapEditorSaveActivation();
    renderDiscoveredMappingsUI();
}

/**
 * Wires the stylization-map editor textarea to reactivate the Save Map button on input (idempotent)
 * Called by: js/ui.js (openDebugMenu)
 */
export function initStylizationMapEditorSaveActivation() {
    const editor = document.getElementById("stylizationMapEditor");
    if (!editor || editor.dataset.saveActivationWired === "1") return;
    editor.dataset.saveActivationWired = "1";
    editor.addEventListener("input", () => setSaveMapButtonEnabled(true));
}

/**
 * Moves the debug modal's current page by a direction delta, clamped to pages 1-2, and updates the page display
 * Called by: HTML event handler via main.js window.switchDebugPage (HTML prev/next buttons)
 */
export function switchDebugPage(direction) {
    state.currentDebugPage += direction;
    if (state.currentDebugPage < 1) state.currentDebugPage = 1;
    if (state.currentDebugPage > 2) state.currentDebugPage = 2;
    updateDebugPageDisplay();
}

/**
 * Shows/hides debug page 1 vs page 2 and updates the title and prev/next button visibility based on the current page
 * Called by: js/ui.js (openDebugMenu, switchDebugPage)
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
        title.textContent = "Translation & Stylization";
    } else {
        page1.style.display = "none";
        page2.style.display = "flex";
        prevBtn.style.display = "inline-block";
        nextBtn.style.display = "none";
        title.textContent = "Inconsistency-Focused Benchmark Suite";
    }
}

/**
 * Saves all debug-modal settings (limits, flags, stylization map) into state, parses and reorders the map, closes the overlay, and persists UI state to cache
 * Called by: HTML event handler via main.js window.closeDebugMenu (HTML Save & Close button)
 */
export function closeDebugMenu() {
    console.log('[Trace:UI] closeDebugMenu() saving settings and closing.');
    const limitVal = parseInt(document.getElementById("maxLinesLimitInput").value);
    state.debugMaxLinesLimit = isNaN(limitVal) || limitVal < 0 ? 0 : limitVal;
    state.autoSkipNameModal = document.getElementById("autoSkipNameModalCheckbox").checked;
    state.manualStepByStepMode = document.getElementById("manualStepModeCheckbox").checked;
    syncManualStepUIVisibility();
    state.stylizationMode = document.getElementById("stylizationModeSelect").value;
    const mapperBox = document.getElementById("mapperStripBracketsCheckbox");
    if (mapperBox) state.mapperStripBrackets = mapperBox.checked;
    const manualBox = document.getElementById("manualStepStripBracketsCheckbox");
    if (manualBox) state.manualStepStripBrackets = manualBox.checked;

    try {
        const parsedMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        state.heavyStylizationMap = orderStylizationMap(parsedMap);
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
    } catch (e) {
        showError("Invalid JSON format in Stylization Map. Changes to the map were not saved.");
        console.error('[Trace:UI] closeDebugMenu() stylization map parse failed:', e);
    }

    document.getElementById("debugModalOverlay").style.display = "none";
    saveUIStateToCache();
}

/**
 * Closes the debug modal overlay without persisting any settings changes
 * Called by: HTML event handler via main.js window.closeDebugMenuWithoutSaving (HTML Cancel button)
 */
export function closeDebugMenuWithoutSaving() {
    document.getElementById("debugModalOverlay").style.display = "none";
}

/**
 * Parses the stylization-map editor textarea, reorders it into state, refreshes the editor, persists to cache, and disables the Save Map button
 * Called by: HTML event handler via main.js window.saveStylizationMapFromView (HTML Save Map button)
 */
export function saveStylizationMapFromView() {
    console.log('[Trace:UI] saveStylizationMapFromView() invoked.');
    try {
        const editorValue = document.getElementById("stylizationMapEditor").value;
        const parsedMap = JSON.parse(editorValue);
        state.heavyStylizationMap = orderStylizationMap(parsedMap);
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
        saveUIStateToCache();
        // Disable + gray out the Save Map button after a successful save. It
        // reactivates when the user edits the textarea or Generate Mapping finishes.
        setSaveMapButtonEnabled(false);
    } catch (e) {
        showError("Error: Invalid JSON format. Please fix any syntax or comma errors before saving.");
        console.error('[Trace:UI] saveStylizationMapFromView() parse failed:', e);
    }
}

/**
 * Enables or disables the Save Map button and toggles its grayed-out style.
 * Called by: ui.js (saveStylizationMapFromView, openDebugMenu, stylizationMapEditor input handler)
 */
export function setSaveMapButtonEnabled(enabled) {
    const btn = document.getElementById("saveStylizationMapBtn");
    if (!btn) return;
    btn.disabled = !enabled;
    if (enabled) {
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    } else {
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
}

/**
 * Renders the pending discovered stylization mappings as editable checkbox rows with Select All/Deselect All controls
 * Called by: js/translator.js (generateStylizationMapWithAI), js/ui.js (openDebugMenu, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, setAllDiscoveredSelection)
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

    html += `<div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; background: #f8fafc; max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">`;

    state.pendingDiscoveredMappings.forEach((item, index) => {
        html += `<div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 12px; gap: 6px;">
            <input type="checkbox" ${item.selected ? 'checked' : ''} onchange="toggleDiscoveredSelection(${index}, this.checked)" style="cursor: pointer; width: 14px; height: 14px;">
            <div style="display: flex; align-items: center; gap: 4px; flex: 1; font-family: monospace;">
                <input type="text" id="discKey_${index}" value="${item.key}" oninput="updateDiscoveredKey(${index}, this.value)" style="width: 45%; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 3px;">
                <span>-&gt;</span>
                <input type="text" id="discVal_${index}" value="${item.value}" oninput="updateDiscoveredVal(${index}, this.value)" style="width: 45%; padding: 2px 4px; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 3px;">
            </div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Toggles the selected state of a pending discovered mapping at the given index
 * Called by: HTML event handler via main.js window.toggleDiscoveredSelection (HTML checkbox onchange)
 */
export function toggleDiscoveredSelection(index, isChecked) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].selected = isChecked;
}

/**
 * Sets the selected state of every pending discovered mapping and re-renders the list
 * Called by: HTML event handler via main.js window.setAllDiscoveredSelection (HTML Select/Deselect All buttons)
 */
export function setAllDiscoveredSelection(selectionState) {
    state.pendingDiscoveredMappings.forEach(item => item.selected = selectionState);
    renderDiscoveredMappingsUI();
}

/**
 * Updates the key string of a pending discovered mapping entry.
 * Called by: main.js (window.updateDiscoveredKey wiring for HTML input oninput)
 */
export function updateDiscoveredKey(index, newVal) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].key = newVal;
}

/**
 * Updates the value string of a pending discovered mapping entry.
 * Called by: main.js (window.updateDiscoveredVal wiring for HTML input oninput)
 */
export function updateDiscoveredVal(index, newVal) {
    if (state.pendingDiscoveredMappings[index]) state.pendingDiscoveredMappings[index].value = newVal;
}

/**
 * Reorders a stylization map so longer keys come first (so longer patterns match before their substrings) while preserving the reserved __priorityOverride__ entry
 * Called by: js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap)
 */
function orderStylizationMap(map) {
    const PRIORITY_KEY = "__priorityOverride__";
    const isNameEntry = (val) => typeof val === 'string' && /^\u300c.*\u300d$/.test(val);
    const isEmpty = (val) => val === "" || val === null || val === undefined;
    const entries = Object.entries(map);
    const byKeyLengthDesc = (a, b) => b[0].length - a[0].length;
    // The priority override must always come first in the saved JSON so it is
    // applied before every other entry. It is excluded from the name/other
    // grouping and kept verbatim (its value is itself an object).
    const priority = entries.filter(([k]) => k === PRIORITY_KEY);
    const rest = entries
        .filter(([k]) => k !== PRIORITY_KEY)
        // Empty-value mappings are useless (they replace text with nothing) and
        // are dropped on save. The priority override above handles intentional
        // character stripping via explicit "-" entries instead.
        .filter(([_, v]) => !isEmpty(v));
    const names = rest.filter(([_, v]) => isNameEntry(v)).sort(byKeyLengthDesc);
    const others = rest.filter(([_, v]) => !isNameEntry(v)).sort(byKeyLengthDesc);
    return Object.fromEntries([...priority, ...names, ...others]);
}

/**
 * Adds all selected discovered mappings into the stylization map (skipping the reserved __priorityOverride__ key and empty entries), reorders it, refreshes the editor, and disables the Save Map button
 * Called by: HTML event handler via main.js window.commitApprovedMappingsToMap (HTML Add Selected button)
 */
export function commitApprovedMappingsToMap() {
    console.log('[Trace:UI] commitApprovedMappingsToMap() invoked.');
    let selectedItems = state.pendingDiscoveredMappings.filter(item => item.selected);
    if (selectedItems.length === 0) showError("No mappings are selected. Please check at least one item to add.");

    try {
        let currentMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        selectedItems.forEach(item => {
            // Add Selected only writes to the regular mapping fields. The reserved
            // __priorityOverride__ key holds an object managed separately, so a
            // discovered item whose key is the reserved token is skipped to avoid
            // overwriting it with a plain string value.
            if (item.key.trim() === "__priorityOverride__") {
                console.log('[Trace:UI] Skipping discovered item with reserved __priorityOverride__ key.');
                return;
            }
            if (item.key.trim() !== "" && item.value !== "" && item.value !== null && item.value !== undefined) {
                currentMap[item.key] = item.value;
            } else {
                console.log(`[Trace:UI] Skipping useless empty mapping: "${item.key}" -> "${item.value}"`);
            }
        });
        state.heavyStylizationMap = orderStylizationMap(currentMap);
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);

        state.pendingDiscoveredMappings = state.pendingDiscoveredMappings.filter(item => !item.selected);
        renderDiscoveredMappingsUI();
        saveUIStateToCache();
    } catch (e) {
        showError("Error parsing current Stylization Map JSON editor content. Fix syntax before committing.");
        console.error('[Trace:UI] commitApprovedMappingsToMap() parse failed:', e);
    }
}

/**
 * Deletes selected items from the pending discovered mappings list.
 * Called by: main.js (window.deleteSelectedDiscoveredMappings wiring for HTML Delete Selected button)
 */
export function deleteSelectedDiscoveredMappings() {
    let selectedCount = state.pendingDiscoveredMappings.filter(item => item.selected).length;
    if (selectedCount === 0) showError("No mappings are selected to remove.");
    state.pendingDiscoveredMappings = state.pendingDiscoveredMappings.filter(item => !item.selected);
    renderDiscoveredMappingsUI();
}

/**
 * Copies the stylization-map editor text to the clipboard, reporting an error on failure
 * Called by: HTML event handler via main.js window.copyStylizationMapToClipboard (HTML Copy button)
 */
export async function copyStylizationMapToClipboard() {
    console.log('[Trace:UI] copyStylizationMapToClipboard() invoked.');
    const mapText = document.getElementById("stylizationMapEditor").value;
    try {
        await navigator.clipboard.writeText(mapText);
    } catch (err) {
        showError("Failed to copy mapping to clipboard: " + err.message);
        console.error('[Trace:UI] copyStylizationMapToClipboard() failed:', err);
    }
}
