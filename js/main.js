export const state = {
    loadedFilesRegistry: [],
    currentDebugPage: 1,
    currentAbortController: null,
    debugMaxLinesLimit: 0,
    autoSkipNameModal: false,
    stylizationMode: "strip",
    pendingDiscoveredMappings: [],
    manualStepByStepMode: false,
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
import { loadFiles, removeFile, onSelectID, onCompareSelectionChange, saveEditsToMemory, injectTranslationToRight, downloadFile, updateBenchmarkSceneDropdown } from './parser.js';
import { fetchAiModels, translateViaAiServer, stopTranslation, generateStylizationMapWithAI } from './translator.js';
import { openDebugMenu, switchDebugPage, closeDebugMenu, closeDebugMenuWithoutSaving, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, copyStylizationMapToClipboard, toggleDiscoveredSelection, setAllDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal, resolveNameModal, closeNameModal, resolveManualStepContinue, triggerStepRetranslation } from './ui.js';
import { runParameterSweepBenchmark } from './benchmark.js';

document.addEventListener('DOMContentLoaded', async () => {
    const cachedFiles = await loadFilesFromCache();
    if (cachedFiles && cachedFiles.length > 0) {
        state.loadedFilesRegistry = cachedFiles;
        refreshApplicationState();
        const cachedState = await loadUIStateFromCache();
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
    }
});

// === EXPOSE MODULE FUNCTIONS TO WINDOW FOR INDEX.HTML EVENT HANDLERS ===
window.onSelectID = onSelectID;
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
window.runParameterSweepBenchmark = runParameterSweepBenchmark;
window.translateViaAiServer = translateViaAiServer;
window.generateStylizationMapWithAI = generateStylizationMapWithAI;
window.removeFile = removeFile;

