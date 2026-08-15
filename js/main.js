export const state = {
    loadedFilesRegistry: [],
    currentDebugPage: 1,
    currentAbortController: null,
    debugMaxLinesLimit: 0,
    autoSkipNameModal: false,
    stylizationMode: "strip",
    pendingDiscoveredMappings: [],
    manualStepByStepMode: false,
    knownNamesMap: {},
    manualStepResolver: null,
    heavyStylizationMap: {
        "、": "",
        "！？": "!",
        "ッ！？": "!",
        "ッ！": "!",
        "――": "—",
        "ああぁ-ッ": "あー",
        "ビリビリィィ-ッ": "ビリビーッ"
    },
    activePreset: {
        temperature: 0.1,
        systemPrompt: "You are a precise game script translator with strict focus on semantic fidelity, tone consistency, and correct pronoun assignment. Output only the translation string.",
        stopStrings: ["Target text:", "Context history:", "Task:", "Translation:", "</current_input>"],
        topK: 40,
        topP: 1.0,
        repeatPenalty: 1.0
    }
};

import { loadFilesFromCache, loadUIStateFromCache } from './database.js';
import { initDraggableModal } from './ui.js';
import { refreshApplicationState, renderComparisonViews } from './parser.js';
import { loadFiles, removeFile, onSelectID, onSelectIDMobile, onCompareSelectionChange, saveEditsToMemory, injectTranslationToRight, downloadFile, updateBenchmarkSceneDropdown } from './parser.js';
import { fetchAiModels, translateViaAiServer, stopTranslation, generateStylizationMapWithAI, loadSpecificPreset, loadDefaultPreset, loadAllDefaultPresets } from './translator.js';
import { openDebugMenu, switchDebugPage, closeDebugMenu, closeDebugMenuWithoutSaving, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, copyStylizationMapToClipboard, toggleDiscoveredSelection, setAllDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal, resolveNameModal, closeNameModal, resolveManualStepContinue, triggerStepRetranslation, syncManualStepUIVisibility, syncManualStepModeLive, initPaneResizer, initAutoNumberInputs } from './ui.js';
import { runParameterSweepBenchmark } from './benchmark.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Trace:Init] DOMContentLoaded fired. Booting application...');
    // Restore saved theme preference (default: light) before the UI paints to avoid a flash.
    applyTheme(localStorage.getItem('rpgx-theme') || 'light');
    // Load shipped default presets into memory first so the translation prompts always have a default config.
    await loadAllDefaultPresets();
    const cachedFiles = await loadFilesFromCache();
    console.log(`[Trace:Init] IndexedDB cache loaded: ${cachedFiles ? cachedFiles.length : 0} file(s).`);
    if (cachedFiles && cachedFiles.length > 0) {
        state.loadedFilesRegistry = cachedFiles;
        refreshApplicationState();
        const cachedState = await loadUIStateFromCache();
        console.log('[Trace:Init] Restoring cached UI state...');
        if (cachedState) {
            const selectLeft = document.getElementById("fileSelectLeft");
            const selectRight = document.getElementById("fileSelectRight");
            const scriptSelect = document.getElementById("scriptSelect");
            const contextInput = document.getElementById("contextLinesCount");
            const rawLimitInput = document.getElementById("rawContextLimit");

            if (cachedState.leftIndex !== "" && selectLeft.options[cachedState.leftIndex]) selectLeft.value = cachedState.leftIndex;
            if (cachedState.rightIndex !== "" && selectRight.options[cachedState.rightIndex]) selectRight.value = cachedState.rightIndex;
            if (cachedState.contextLines !== undefined) contextInput.value = cachedState.contextLines;
            if (cachedState.rawLimit !== undefined) rawLimitInput.value = cachedState.rawLimit;

            if (cachedState.debugLimit !== undefined) {
                state.debugMaxLinesLimit = cachedState.debugLimit;
                document.getElementById("maxLinesLimitInput").value = state.debugMaxLinesLimit;
            }
            if (cachedState.autoSkipNames !== undefined) {
                state.autoSkipNameModal = cachedState.autoSkipNames;
                document.getElementById("autoSkipNameModalCheckbox").checked = state.autoSkipNameModal;
            }
            if (cachedState.manualStepMode !== undefined) {
                state.manualStepByStepMode = cachedState.manualStepMode;
                document.getElementById("manualStepModeCheckbox").checked = state.manualStepByStepMode;
            }
            if (cachedState.stylizationOption !== undefined) {
                state.stylizationMode = cachedState.stylizationOption;
                document.getElementById("stylizationModeSelect").value = state.stylizationMode;
            }
            if (cachedState.stylizationMapData !== undefined) {
                state.heavyStylizationMap = cachedState.stylizationMapData;
            }

            if (cachedState.selectedId) {
                for (let opt of scriptSelect.options) {
                    if (opt.value === cachedState.selectedId) { opt.selected = true; break; }
                }
            }
            renderComparisonViews();
        }
        syncManualStepUIVisibility();
    } else {
        syncManualStepUIVisibility();
    }
    initPaneResizer();
    initAutoNumberInputs();
    // Auto-detect models from the AI server on page load
    fetchAiModels().catch(() => { /* silently ignore if server is not running */ });
    console.log('[Trace:Init] Application boot complete.');
});

// === Theme (light/dark) toggle ===
/**
 * Applies the given theme ('light' or 'dark') to the document root and updates the toggle button label.
 * Called by: main.js (DOMContentLoaded, toggleTheme)
 */
function applyTheme(theme) {
    // Set on both <html> and <body> for maximum CSS selector compatibility.
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.textContent = (theme === 'dark') ? 'Light Mode' : 'Dark Mode';
    // Re-apply inline option status colors so incomplete lines flip black<->white with the theme.
    recolorScriptSelectOptions();
    console.log(`[Trace:Theme] Applied theme: ${theme}`);
}

/**
 * Re-applies the inline status colors to script-select options after a theme change,
 * since native <option> elements cannot be restyled via CSS classes.
 * Called by: main.js (applyTheme)
 */
function recolorScriptSelectOptions() {
    const sel = document.getElementById('scriptSelect');
    if (!sel) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    Array.from(sel.options).forEach(opt => {
        // Determine completeness from the leading symbol (+ complete, - incomplete).
        const isComplete = opt.textContent.trim().startsWith('+');
        opt.style.color = isComplete ? '#16a34a' : (isDark ? '#ffffff' : '#000000');
    });
}

/**
 * Toggles between light and dark themes and persists the choice to localStorage.
 * Called by: HTML event handler (theme toggle button)
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = (current === 'dark') ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('rpgx-theme', next);
}

// === EXPOSE MODULE FUNCTIONS TO WINDOW FOR INDEX.HTML EVENT HANDLERS ===
window.onSelectID = onSelectID;
window.onSelectIDMobile = onSelectIDMobile;
window.onCompareSelectionChange = onCompareSelectionChange;
window.saveEditsToMemory = saveEditsToMemory;
window.injectTranslationToRight = injectTranslationToRight;
window.downloadFile = downloadFile;
window.updateBenchmarkSceneDropdown = updateBenchmarkSceneDropdown;
window.fetchAiModels = fetchAiModels;
window.loadFiles = loadFiles;
window.stopTranslation = stopTranslation;
window.openDebugMenu = openDebugMenu;
window.switchDebugPage = switchDebugPage;
window.closeDebugMenu = closeDebugMenu;
window.closeDebugMenuWithoutSaving = closeDebugMenuWithoutSaving;
window.commitApprovedMappingsToMap = commitApprovedMappingsToMap;
window.deleteSelectedDiscoveredMappings = deleteSelectedDiscoveredMappings;
window.copyStylizationMapToClipboard = copyStylizationMapToClipboard;
window.toggleDiscoveredSelection = toggleDiscoveredSelection;
window.setAllDiscoveredSelection = setAllDiscoveredSelection;
window.updateDiscoveredKey = updateDiscoveredKey;
window.updateDiscoveredVal = updateDiscoveredVal;
window.resolveNameModal = resolveNameModal;
window.closeNameModal = closeNameModal;
window.resolveManualStepContinue = resolveManualStepContinue;
window.triggerStepRetranslation = triggerStepRetranslation;
window.syncManualStepUIVisibility = syncManualStepUIVisibility;
window.syncManualStepModeLive = syncManualStepModeLive;
window.runParameterSweepBenchmark = runParameterSweepBenchmark;
window.translateViaAiServer = translateViaAiServer;
window.generateStylizationMapWithAI = generateStylizationMapWithAI;
window.loadSpecificPreset = loadSpecificPreset;
window.loadDefaultPreset = loadDefaultPreset;
window.loadAllDefaultPresets = loadAllDefaultPresets;
window.removeFile = removeFile;
window.toggleTheme = toggleTheme;
