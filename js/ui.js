import { state } from './main.js';
import { saveUIStateToCache } from './database.js';
import { defaultPresetManifest, buildTieredContextWindow } from './translator.js';

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
    console.log('[Trace:UI] showError():', msg);
    const banner = document.getElementById("errorBanner");
    if (banner) {
        banner.style.display = "block";
        banner.textContent = "[ERROR]\n" + msg;
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
 * Dynamically renders one custom-upload row per available default preset file in `default_presets/`.
 * The defaults themselves are already loaded into memory on startup; these controls let a user
 * upload a custom JSON to override any operation tier in memory. The number of rows scales with
 * the entries in `defaultPresetManifest`.
 * Called by: ui.js (openDebugMenu)[cite: 7]
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
        input.style.fontSize = "11px";
        input.style.width = "100%";
        input.style.border = "none";
        input.style.marginTop = "2px";
        input.style.marginBottom = "6px";
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
    console.log('[Trace:UI] openDebugMenu() invoked.');
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
 * Saves configuration changes from the debug modal inputs and closes the debug overlay[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function closeDebugMenu() {
    console.log('[Trace:UI] closeDebugMenu() saving settings and closing.');
    const limitVal = parseInt(document.getElementById("maxLinesLimitInput").value);
    state.debugMaxLinesLimit = isNaN(limitVal) || limitVal < 0 ? 0 : limitVal;
    state.autoSkipNameModal = document.getElementById("autoSkipNameModalCheckbox").checked;
    state.manualStepByStepMode = document.getElementById("manualStepModeCheckbox").checked;
    syncManualStepUIVisibility();
    state.stylizationMode = document.getElementById("stylizationModeSelect").value;

    try {
        const parsedMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        state.heavyStylizationMap = orderStylizationMap(parsedMap);
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
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
    console.log('[Trace:UI] saveStylizationMapFromView() invoked.');
    try {
        const editorValue = document.getElementById("stylizationMapEditor").value;
        const parsedMap = JSON.parse(editorValue);
        state.heavyStylizationMap = orderStylizationMap(parsedMap);
        document.getElementById("stylizationMapEditor").value = JSON.stringify(state.heavyStylizationMap, null, 4);
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
                <span>-&gt;</span>
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
 * Returns an ordered copy of a stylization map object: name entries (values wrapped in
 * 「」) first, then all other entries, each group sorted by key length descending so
 * longer multi-character keys are applied before their substrings during replacement.
 * @param {Object} map - The source stylization map.
 * @returns {Object} A new object with the same entries in the desired order.
 */
function orderStylizationMap(map) {
    const isNameEntry = (val) => typeof val === 'string' && /^「.*」$/.test(val);
    const entries = Object.entries(map);
    const byKeyLengthDesc = (a, b) => b[0].length - a[0].length;
    const names = entries.filter(([_, v]) => isNameEntry(v)).sort(byKeyLengthDesc);
    const others = entries.filter(([_, v]) => !isNameEntry(v)).sort(byKeyLengthDesc);
    return Object.fromEntries([...names, ...others]);
}

/**
 * Commits selected pending discovered mappings into the active heavy stylization map dictionary[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function commitApprovedMappingsToMap() {
    console.log('[Trace:UI] commitApprovedMappingsToMap() invoked.');
    let selectedItems = state.pendingDiscoveredMappings.filter(item => item.selected);
    if (selectedItems.length === 0) showError("No mappings are selected. Please check at least one item to add.");

    try {
        let currentMap = JSON.parse(document.getElementById("stylizationMapEditor").value);
        selectedItems.forEach(item => { if (item.key.trim() !== "") currentMap[item.key] = item.value; });
        state.heavyStylizationMap = orderStylizationMap(currentMap);
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
    console.log('[Trace:UI] copyStylizationMapToClipboard() invoked.');
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
    console.log(`[Trace:UI] promptUserForNameTranslation("${originalName}") invoked; autoSkip=${state.autoSkipNameModal}.`);
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
/**
 * Recomputes the context-preview dropdown from the stored full history + current step settings.
 * Called by: ui.js (promptUserForManualStep, input change listeners)
 */
async function refreshStepContextPreview(currentContextWindow) {
    const ctxLines = parseInt(document.getElementById("stepContextLinesInput")?.value) || state._stepMaxCtxDefault || 0;
    const rawLimit = parseInt(document.getElementById("stepRawLimitInput")?.value) || 0;

    const archivalBox = document.getElementById("stepArchivalSummaryText");
    const recentBox = document.getElementById("stepRecentSummaryText");
    const rawBox = document.getElementById("stepRawContextText");
    const recentSourceBox = document.getElementById("stepRecentSummarySourceText");

    const history = state._stepFullHistory || [];

    // Recalculate the tiered summaries from the beginning of the full history, going
    // step by step through the raw-tail window (same logic as flushBuffer). This ensures
    // the manual override's summary preview reflects the actual production state rather
    // than a stale snapshot.
    const host = document.getElementById("aiServerHost")?.value.trim().replace(/\/+$/, "") || "";
    const model = document.getElementById("aiModel")?.value || "";
    let summaryState = {
        archivalSummary: "",
        recentSummary: "",
        recentSummarySourceLines: [],
        summarizedUpToIndex: 0
    };

    if (host && model && history.length > 0) {
        // Replay the history through buildTieredContextWindow to reconstruct summaries.
        for (let i = 0; i < history.length; i++) {
            let partialHistory = history.slice(0, i + 1);
            await buildTieredContextWindow(host, model, partialHistory, ctxLines, rawLimit, summaryState);
        }
    }

    if (archivalBox) {
        archivalBox.value = summaryState.archivalSummary || "";
    }
    if (recentBox) {
        recentBox.value = summaryState.recentSummary || "";
    }
    if (recentSourceBox) {
        recentSourceBox.value = (summaryState.recentSummarySourceLines || [])
            .map((line, i) => `[${i}] ${line}`).join("\n") || "";
    }
    if (rawBox) {
        const activeRaw = history.slice(Math.max(0, history.length - rawLimit));
        rawBox.value = activeRaw.map((line, i) => `[${i}] ${line}`).join("\n") || "";
    }

    console.log(`[Trace:UI] Context preview refreshed (summaries recalculated from history).`);
    return summaryState;
}

/**
 * Synchronizes the visibility of the manual step override toolbar.
 * (The current source line box is permanently visible above the toolbar).
 * Called by: ui.js (closeDebugMenu, syncManualStepModeLive), main.js (init)
 */
export function syncManualStepUIVisibility() {
    const msToolbar = document.getElementById("manualStepToolbar");
    const outputLeft = document.getElementById("outputAreaLeft");
    const labelLeft = document.getElementById("labelPaneLeft");
    const paneLeftActions = document.getElementById("paneLeftActions");
    const isEnabled = !!state.manualStepByStepMode;

    if (msToolbar) msToolbar.style.display = isEnabled ? "flex" : "none";
    if (outputLeft) outputLeft.style.display = isEnabled ? "none" : "block";
    if (labelLeft) labelLeft.textContent = isEnabled ? "Manual Override" : "Source 1 Output";
    if (paneLeftActions) paneLeftActions.style.display = isEnabled ? "none" : "flex";

    console.log(`[Trace:UI] syncManualStepUIVisibility() -> manualStepToolbar isEnabled=${isEnabled}`);
}

/**
 * Generic helper: creates a column (horizontal) drag resizer between two elements.
 * @param {Function} [onResize] - Optional callback fired on every drag tick after widths are set.
 */
function _initColResizer(handleEl, leftEl, rightEl, wrapperEl, minPct, maxPct, onResize) {
    if (!handleEl || !leftEl || !rightEl || !wrapperEl) return;
    let active = false;
    handleEl.addEventListener("mousedown", (e) => {
        active = true;
        handleEl.classList.add("active");
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
        if (!active) return;
        const rect = wrapperEl.getBoundingClientRect();
        const pct = Math.max(minPct, Math.min(maxPct, ((e.clientX - rect.left) / rect.width) * 100));
        leftEl.style.flex = "none";
        rightEl.style.flex = "none";
        leftEl.style.width = `calc(${pct}% - 3px)`;
        rightEl.style.width = `calc(${100 - pct}% - 3px)`;
        if (onResize) onResize();
    });
    document.addEventListener("mouseup", () => {
        if (active) {
            active = false;
            handleEl.classList.remove("active");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });
}

/**
 * Generic helper: creates a row (vertical) drag resizer between two sibling elements.
 */
function _initRowResizer(handleEl, topEl, bottomEl, containerEl) {
    if (!handleEl || !topEl || !bottomEl || !containerEl) return;
    let active = false;
    let startY = 0, startTopH = 0, startBottomH = 0;

    handleEl.addEventListener("mousedown", (e) => {
        active = true;
        handleEl.classList.add("active");
        startY = e.clientY;
        startTopH = topEl.getBoundingClientRect().height;
        startBottomH = bottomEl.getBoundingClientRect().height;
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";
        e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
        if (!active) return;
        const delta = e.clientY - startY;
        const newTopH = Math.max(30, startTopH + delta);
        const newBottomH = Math.max(30, startBottomH - delta);
        topEl.style.flex = "none";
        bottomEl.style.flex = "none";
        topEl.style.height = newTopH + "px";
        bottomEl.style.height = newBottomH + "px";
    });
    document.addEventListener("mouseup", () => {
        if (active) {
            active = false;
            handleEl.classList.remove("active");
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });
}

/**
 * Syncs the external footer row alignment with the sidebar and pane widths.
 * Applies a left padding equal to sidebar + handle width, and mirrors pane column widths.
 */
function _syncFooter() {
    const sidebar = document.querySelector(".sidebar");
    const handle = document.getElementById("sidebarResizeHandle");
    const footer = document.getElementById("mainFooterActions");
    const paneLeft = document.getElementById("paneLeft");
    const paneRight = document.getElementById("paneRight");
    const lf = document.getElementById("paneLeftFooter");
    const rf = document.getElementById("paneRightFooter");
    const fs = document.getElementById("footerPaneSpacer");
    if (!footer || !sidebar || !handle || !lf || !rf) return;

    const sidebarW = sidebar.getBoundingClientRect().width;
    const handleW = handle.getBoundingClientRect().width;
    const containerGap = 4; // matches .container gap
    footer.style.paddingLeft = `${sidebarW + handleW + containerGap}px`;

    // Mirror pane widths if they have been resized
    if (paneLeft && paneRight) {
        const plW = paneLeft.getBoundingClientRect().width;
        const prW = paneRight.getBoundingClientRect().width;
        const handlePaneW = document.getElementById("paneResizeHandle")?.getBoundingClientRect().width ?? 10;
        lf.style.flex = "none";
        rf.style.flex = "none";
        lf.style.width = `${plW}px`;
        rf.style.width = `${prW}px`;
        if (fs) fs.style.width = `${handlePaneW}px`;
    }
}

/**
 * Initializes all draggable resize handles.
 * Called by: main.js (DOMContentLoaded)
 */
export function initPaneResizer() {
    _initColResizer(
        document.getElementById("sidebarResizeHandle"),
        document.querySelector(".sidebar"),
        document.getElementById("mainContent"),
        document.querySelector(".container"),
        10, 40,
        _syncFooter   // callback fired on every sidebar drag tick
    );

    // 2. Source pane left ↔ Source pane right
    _initColResizer(
        document.getElementById("paneResizeHandle"),
        document.getElementById("paneLeft"),
        document.getElementById("paneRight"),
        document.querySelector(".panes-wrapper"),
        15, 85,
        _syncFooter   // callback fired on every pane drag tick
    );

    // Align footer on initial load and whenever the window is resized
    requestAnimationFrame(_syncFooter);
    window.addEventListener("resize", _syncFooter);

    // 3. Context: Archival ↔ Recent
    _initRowResizer(
        document.getElementById("ctxResizeArchRecent"),
        document.getElementById("ctxRowArchival"),
        document.getElementById("ctxRowRecent"),
        document.querySelector(".manual-step-context-grid")
    );

    // 4. Context: Recent ↔ Split (raw + source lines)
    _initRowResizer(
        document.getElementById("ctxResizeRecentSplit"),
        document.getElementById("ctxRowRecent"),
        document.getElementById("ctxRowSplit"),
        document.querySelector(".manual-step-context-grid")
    );
}

/**
 * Toggles manual step mode live when the debug modal checkbox changes state.
 * Called by: HTML event handler on manualStepModeCheckbox
 */
export function syncManualStepModeLive(enabled) {
    state.manualStepByStepMode = !!enabled;
    syncManualStepUIVisibility();
    saveUIStateToCache();
}

/**
 * Shows the current source line being translated in the permanently visible element.
 * Called by: translator.js (translateViaAiServer main loop)
 */
export function setCurrentSourceLine(text) {
    const box = document.getElementById("stepSourceText");
    if (box) box.value = text || "";
}

/**
 * Clears the source line text when translation ends so the placeholder shows.
 * The element itself stays visible permanently.
 * Called by: translator.js (translateViaAiServer completion)
 */
export function hideCurrentSourceLine() {
    const box = document.getElementById("stepSourceText");
    if (box) box.value = "";
}

export function promptUserForManualStep(currentChunkText, currentContextWindow, fullHistory, summaryContext, maxContextLinesDefault, rawLimitDefault) {
    console.log('[Trace:UI] promptUserForManualStep() invoked; source + context populated.');
    return new Promise((resolve, reject) => {
        const toolbar = document.getElementById("manualStepToolbar");
        const titleEl = document.getElementById("manualStepTitle");
        if (toolbar) toolbar.style.display = "flex";
        if (titleEl) titleEl.textContent = "Manual Step Override - Action Required";

        // Show the source line being translated in the source box.
        const sourceBox = document.getElementById("stepSourceText");
        if (sourceBox) sourceBox.value = currentChunkText || "";

        // Store raw history + summary context so the preview can recompute live when settings change.
        state._stepFullHistory = Array.isArray(fullHistory) ? fullHistory : [];
        if (Array.isArray(summaryContext)) {
            state._stepMilestones = summaryContext;
            state._stepSummaryContext = {};
        } else {
            state._stepSummaryContext = summaryContext || {};
            state._stepMilestones = [];
        }
        state._stepMaxCtxDefault = maxContextLinesDefault || 0;
        state._stepMaxRawDefault = rawLimitDefault || 0;

        // Sync the manual override inputs to the current main .translate-config values
        // at the start of each manual step, so the preview reflects the Summary/Raw Lines
        // the user just set instead of stale values from a prior step.
        const ctxInput = document.getElementById("stepContextLinesInput");
        const rawInput = document.getElementById("stepRawLimitInput");
        if (ctxInput) {
            ctxInput.value = maxContextLinesDefault || 0;
            ctxInput.dataset.oldValue = ctxInput.value;
            ctxInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (rawInput) {
            rawInput.value = rawLimitDefault || 0;
            rawInput.dataset.oldValue = rawInput.value;
            rawInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Initial population + live refresh of the context preview.
        refreshStepContextPreview(currentContextWindow).catch(e => console.warn('[Trace:UI] Preview refresh failed:', e));

        // Context-lines change is a destructive recompute: confirm before applying.
        const handleContextLinesChange = (inputEl, oldVal) => {
            if (window.confirm("Changing context settings will recompute the active summaries and context window. Are you sure?")) {
                inputEl.dataset.oldValue = inputEl.value;
                refreshStepContextPreview().catch(e => console.warn('[Trace:UI] Preview refresh failed:', e));
            } else {
                inputEl.value = inputEl.dataset.oldValue || oldVal;
            }
        };
        // Raw-lines change only reshapes the raw tail display — no summary recalculation
        // (that only happens on context-lines change). Update the raw box directly.
        const handleRawLinesChange = (inputEl) => {
            inputEl.dataset.oldValue = inputEl.value;
            const rawLimit = parseInt(inputEl.value) || 0;
            const rawBox = document.getElementById("stepRawContextText");
            const history = state._stepFullHistory || [];
            if (rawBox) {
                const activeRaw = history.slice(Math.max(0, history.length - rawLimit));
                rawBox.value = activeRaw.map((line, i) => `[${i}] ${line}`).join("\n") || "";
            }
            console.log(`[Trace:UI] Raw tail preview updated (no summary recalc).`);
        };

        // Context changes are applied via the Apply button (applyStepContextSettings),
        // not auto-recalc on change.
        if (ctxInput) ctxInput.dataset.oldValue = ctxInput.value;
        if (rawInput) rawInput.dataset.oldValue = rawInput.value;

        const outputRight = document.getElementById("outputAreaRight");
        if (outputRight) outputRight.classList.add("editable");

        state.manualStepResolver = (action, newContextCount, rawLimit, manualSummaryEdits) => {
            if (titleEl) titleEl.textContent = "Manual Step Override Active";
            if (!state.manualStepByStepMode && toolbar) {
                toolbar.style.display = "none";
            }
            resolve({ action, newContextCount, rawLimit, manualSummaryEdits });
        };

        if (state.currentAbortController) {
            state.currentAbortController.signal.addEventListener('abort', () => {
                if (!state.manualStepByStepMode && toolbar) {
                    toolbar.style.display = "none";
                }
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
    const contextCount = parseInt(document.getElementById("stepContextLinesInput").value) || 0;
    const rawLimit = parseInt(document.getElementById("stepRawLimitInput").value) || 0;
    // Capture any manual edits to the archival/recent summary boxes so they update
    // the internal summary variables when the step resolves.
    const manualSummaryEdits = readManualSummaryEdits();
    if (state.manualStepResolver) {
        state.manualStepResolver("continue", contextCount, rawLimit, manualSummaryEdits);
        state.manualStepResolver = null;
    }
}

/**
 * Resolves the manual step prompt indicating that a re-translation pass is required[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function applyStepContextSettings() {
    console.log('[Trace:UI] applyStepContextSettings() invoked.');
    // Store the manual override values in shared state so the main translation
    // pipeline reads them at translation time, without writing back to the
    // .translate-config UI inputs.
    const contextCount = parseInt(document.getElementById("stepContextLinesInput").value) || 0;
    const rawLimit = parseInt(document.getElementById("stepRawLimitInput").value) || 0;
    state.appliedContextLines = contextCount;
    state.appliedRawLimit = rawLimit;
    console.log(`[Trace:UI] Applied override values -> contextLines=${contextCount}, rawLimit=${rawLimit}`);
    // Recalculate summaries from history with the current manual override settings,
    // then update the preview. Store the resulting summary state so retranslate reuses
    // it instead of triggering a fresh recalc.
    try {
        state._stepAppliedSummaryState = await refreshStepContextPreview();
    } catch (e) {
        console.warn('[Trace:UI] Apply context settings failed:', e);
    }
}

export async function triggerStepRetranslation() {
    const contextCount = parseInt(document.getElementById("stepContextLinesInput").value) || 0;
    const rawLimit = parseInt(document.getElementById("stepRawLimitInput").value) || 0;
    // Capture any manual edits to the archival/recent summary boxes so they update
    // the internal summary variables before the retranslate rebuilds the context window.
    const manualSummaryEdits = readManualSummaryEdits();
    if (state.manualStepResolver) {
        state.manualStepResolver("retranslate", contextCount, rawLimit, manualSummaryEdits);
        state.manualStepResolver = null;
    }
}

/**
 * Reads the current (possibly user-edited) archival and recent summary boxes.
 * Returns null when neither box exists so callers can skip writing anything back.
 * Called by: resolveManualStepContinue, triggerStepRetranslation
 */
function readManualSummaryEdits() {
    const archivalBox = document.getElementById("stepArchivalSummaryText");
    const recentBox = document.getElementById("stepRecentSummaryText");
    if (!archivalBox && !recentBox) return null;
    return {
        archivalSummary: archivalBox ? archivalBox.value : undefined,
        recentSummary: recentBox ? recentBox.value : undefined
    };
}

/**
 * Makes elements with class .auto-number-input dynamically resize to fit their value.
 * Called by: main.js (DOMContentLoaded)
 */
export function initAutoNumberInputs() {
    function resize(el) {
        const len = String(el.value).length || 1;
        el.style.width = 'calc(' + len + 'ch + 16px)';
    }
    document.querySelectorAll('.auto-number-input').forEach(el => {
        resize(el);
        el.addEventListener('input', () => resize(el));
        el.addEventListener('change', () => resize(el));
    });
}