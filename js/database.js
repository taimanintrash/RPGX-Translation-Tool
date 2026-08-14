import { state } from './main.js';

/**
 * Opens or initializes the IndexedDB database used for caching application state and loaded files[cite: 7].
 * Called by: database.js (saveFilesToCache, loadFilesFromCache, saveUIStateToCache, loadUIStateFromCache)[cite: 7]
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
 * Saves the current registry of loaded files into IndexedDB storage[cite: 7].
 * Called by: parser.js (checkFinishedReads, removeFile, saveEditsToMemory, commitTextToRightFile)[cite: 7]
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
 * Retrieves the cached file registry from IndexedDB[cite: 7].
 * Called by: main.js[cite: 7]
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
    } catch (e) { return null; }
}

/**
 * Saves the current user interface options and settings values into IndexedDB[cite: 7].
 * Called by: parser.js, ui.js, and database.js[cite: 7]
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
            stylizationOption: state.stylizationMode,
            stylizationMapData: state.heavyStylizationMap
        }, "cachedUIState");
    } catch (e) { console.error(e); }
}

/**
 * Retrieves cached user interface state settings from IndexedDB[cite: 7].
 * Called by: main.js[cite: 7]
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
    } catch (e) { return null; }
}