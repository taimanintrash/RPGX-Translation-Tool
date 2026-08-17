import { state } from './main.js';

/**
 * Opens (or creates) the IndexedDB database and object store at version 6, resolving with the db handle
 * Called by: js/database.js (saveFilesToCache, loadFilesFromCache, saveUIStateToCache, loadUIStateFromCache)
 */
export function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(state.DB_NAME, 6);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(state.STORE_NAME)) db.createObjectStore(state.STORE_NAME);
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Persists the loaded-files registry to IndexedDB under the cachedFilesRegistry key
 * Called by: js/parser.js (checkFinishedReads, removeFile, saveEditsToMemory, commitTextToRightFile)
 */
export async function saveFilesToCache(registry) {
    console.log(`[Trace:Cache] saveFilesToCache(${registry ? registry.length : 0} files) invoked.`);
    try {
        const db = await openDatabase();
        const tx = db.transaction(state.STORE_NAME, "readwrite");
        tx.objectStore(state.STORE_NAME).put(registry, "cachedFilesRegistry");
    } catch (e) { console.error("[Cache Error]", e); }
}

/**
 * Retrieves the cached file registry from IndexedDB.
 * Called by: main.js
 */
export async function loadFilesFromCache() {
    console.log('[Trace:Cache] loadFilesFromCache() invoked.');
    try {
        const db = await openDatabase();
        return new Promise((resolve) => {
            const tx = db.transaction(state.STORE_NAME, "readonly");
            const req = tx.objectStore(state.STORE_NAME).get("cachedFilesRegistry");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) { console.warn('[Cache] Failed to load cached file registry from IndexedDB:', e); return null; }
}

/**
 * Persists the current UI settings (dropdowns, debug flags, stylization map, bracket toggles) to IndexedDB under the cachedUIState key
 * Called by: js/parser.js (onSelectID, onCompareSelectionChange), js/ui.js (closeDebugMenu, saveStylizationMapFromView, commitApprovedMappingsToMap), js/ui-manual-step.js (syncManualStepModeLive)
 */
export async function saveUIStateToCache() {
    console.log('[Trace:Cache] saveUIStateToCache() invoked.');
    try {
        const db = await openDatabase();
        const tx = db.transaction(state.STORE_NAME, "readwrite");
        tx.objectStore(state.STORE_NAME).put({
            leftIndex: document.getElementById("fileSelectLeft").value,
            rightIndex: document.getElementById("fileSelectRight").value,
            selectedId: document.getElementById("scriptSelect").value,
            contextLines: document.getElementById("contextLinesCount").value,
            rawLimit: document.getElementById("rawContextLimit").value,
            debugLimit: state.debugMaxLinesLimit,
            autoSkipNames: state.autoSkipNameModal,
            manualStepMode: state.manualStepByStepMode,
            mapperStripBrackets: state.mapperStripBrackets,
            manualStepStripBrackets: state.manualStepStripBrackets,
            stylizationOption: state.stylizationMode,
            stylizationMapData: state.heavyStylizationMap
        }, "cachedUIState");
    } catch (e) { console.error(e); }
}

/**
 * Retrieves the cached UI state object from IndexedDB, returning null on failure
 * Called by: js/main.js (DOMContentLoaded)
 */
export async function loadUIStateFromCache() {
    console.log('[Trace:Cache] loadUIStateFromCache() invoked.');
    try {
        const db = await openDatabase();
        return new Promise((resolve) => {
            const tx = db.transaction(state.STORE_NAME, "readonly");
            const req = tx.objectStore(state.STORE_NAME).get("cachedUIState");
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        });
    } catch (e) { console.warn('[Cache] Failed to load cached UI state from IndexedDB:', e); return null; }
}