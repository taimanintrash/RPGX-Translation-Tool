// ui-manual-step.js
// Name-plate and manual step-by-step override modals. Split out of ui.js so the
// densest, most interactive section of the UI is isolated from stylization-map
// management. ui.js re-exports every symbol here so main.js/translator.js
// imports from ./ui.js keep resolving unchanged.

import { state } from './main.js';
import { saveUIStateToCache } from './database.js';
import { buildTieredContextWindow } from './translator.js';

/**
 * Displays a modal prompt to review or modify a character name translation, returning a promise that resolves to the user-approved name; auto-skips the modal (resolving to the AI translation) when state.autoSkipNameModal is set and rejects on user abort
 * Called by: js/translator.js (resolveNamePlate)
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
 * Resolves the active name-translation modal promise with the user's input value and clears the resolver
 * Called by: HTML event handler via main.js window.resolveNameModal (HTML Confirm button)
 */
export function resolveNameModal() {
    const transInput = document.getElementById("modalInputName").value.trim();
    if (state.activeNameResolver) {
        state.activeNameResolver(transInput);
        state.activeNameResolver = null;
    }
}

/**
 * Closes the name-translation modal and resolves its promise with an empty fallback value, clearing the resolver
 * Called by: HTML event handler via main.js window.closeNameModal (HTML Cancel button)
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
 * Recomputes the context-preview dropdown from the stored full history and current step settings by replaying the history through buildTieredContextWindow so the manual-override preview reflects the actual production state; returns the recomputed summaryState
 * Called by: js/ui-manual-step.js (promptUserForManualStep, applyStepContextSettings, handleContextLinesChange)
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
        summarizedUpToIndex: 0,
        pendingRecentSummaries: []
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
 * Instantly populates the manual-step context preview fields from pre-computed context values without triggering any AI calls
 * Called by: js/ui-manual-step.js (promptUserForManualStep)
 */
function populateStepContextFields(summaryContext, history, rawLimit) {
    const archivalBox = document.getElementById("stepArchivalSummaryText");
    const recentBox = document.getElementById("stepRecentSummaryText");
    const recentSourceBox = document.getElementById("stepRecentSummarySourceText");
    const rawBox = document.getElementById("stepRawContextText");

    const sc = (summaryContext && !Array.isArray(summaryContext)) ? summaryContext : {};
    if (archivalBox) archivalBox.value = sc.archivalSummary || "";
    if (recentBox) recentBox.value = sc.recentSummary || "";
    if (recentSourceBox) {
        recentSourceBox.value = (sc.recentSummarySourceLines || [])
            .map((line, i) => `[${i}] ${line}`).join("\n") || "";
    }
    if (rawBox) {
        const activeRaw = history.slice(Math.max(0, history.length - rawLimit));
        rawBox.value = activeRaw.map((line, i) => `[${i}] ${line}`).join("\n") || "";
    }
}

/**
 * Synchronizes the visibility of the manual-step override toolbar and the source-pane label/actions based on whether manual step-by-step mode is enabled; the current source-line box stays permanently visible regardless of mode
 * Called by: js/ui.js (closeDebugMenu, syncManualStepModeLive), js/main.js (DOMContentLoaded)
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
 * Toggles manual step-by-step mode live when the debug-modal checkbox changes, updating visibility and persisting UI state
 * Called by: HTML event handler via main.js window.syncManualStepModeLive (HTML checkbox onchange)
 */
export function syncManualStepModeLive(enabled) {
    state.manualStepByStepMode = !!enabled;
    syncManualStepUIVisibility();
    saveUIStateToCache();
}

/**
 * Reads both bracket-strip checkboxes into state live so the strip-phase XOR decision reflects the current UI without needing to close the debug menu
 * Called by: HTML event handler via main.js window.syncBracketStripToggles (HTML checkbox onchange)
 */
export function syncBracketStripToggles() {
    const mapperBox = document.getElementById("mapperStripBracketsCheckbox");
    const manualBox = document.getElementById("manualStepStripBracketsCheckbox");
    if (mapperBox) state.mapperStripBrackets = mapperBox.checked;
    if (manualBox) state.manualStepStripBrackets = manualBox.checked;
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
 * Clears the source-line text when translation ends so the placeholder shows; the element itself stays visible
 * Called by: js/translator.js (translateViaAiServer completion)
 */
export function hideCurrentSourceLine() {
    const box = document.getElementById("stepSourceText");
    if (box) box.value = "";
}

/**
 * Handles a context-lines input change as a destructive recompute that confirms before applying (it recomputes summaries and the context window), restoring the old value if the user cancels
 * Called by: js/ui-manual-step.js (promptUserForManualStep input listener)
 */
function handleContextLinesChange(inputEl, oldVal) {
    if (window.confirm("Changing context settings will recompute the active summaries and context window. Are you sure?")) {
        inputEl.dataset.oldValue = inputEl.value;
        refreshStepContextPreview().catch(e => console.warn('[Trace:UI] Preview refresh failed:', e));
    } else {
        inputEl.value = inputEl.dataset.oldValue || oldVal;
    }
}

/**
 * Handles a raw-lines input change by reshaping the raw-tail display directly to show the most recent rawLimit history lines, with no summary recalculation
 * Called by: js/ui-manual-step.js (promptUserForManualStep input listener)
 */
function handleRawLinesChange(inputEl) {
    inputEl.dataset.oldValue = inputEl.value;
    const rawLimit = parseInt(inputEl.value) || 0;
    const rawBox = document.getElementById("stepRawContextText");
    const history = state._stepFullHistory || [];
    if (rawBox) {
        const activeRaw = history.slice(Math.max(0, history.length - rawLimit));
        rawBox.value = activeRaw.map((line, i) => `[${i}] ${line}`).join("\n") || "";
    }
    console.log(`[Trace:UI] Raw tail preview updated (no summary recalc).`);
}

/**
 * Populates the speaker-override dropdown with the known-speakers set plus a Narrator
 * default. When currentSpeaker is null, the current selection is preserved (used on
 * retranslate re-entry so the user's override is not reset). Otherwise pre-selects
 * the given speaker.
 * Called by: js/ui-manual-step.js (promptUserForManualStep)
 */
function updateStepSpeakerDropdown(knownSpeakers, currentSpeaker) {
    const sel = document.getElementById("stepSpeakerSelect");
    if (!sel) return;
    const prev = sel.value; // Capture before rebuild
    sel.innerHTML = `<option value="">-- Narrator --</option>`;
    const speakers = knownSpeakers instanceof Set ? [...knownSpeakers] : (Array.isArray(knownSpeakers) ? knownSpeakers : []);
    for (const name of speakers) {
        if (!name) continue;
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    }
    if (currentSpeaker === null) {
        // Preserve the user's current selection (retranslate re-entry).
        // prev may be "" (Narrator) or a character name — both are valid.
        sel.value = (prev === "" || speakers.includes(prev)) ? prev : "";
    } else if (currentSpeaker && speakers.includes(currentSpeaker)) {
        sel.value = currentSpeaker;
    } else {
        sel.value = "";
    }
}

/**
 * Returns the current value of the speaker-override dropdown (empty string = Narrator).
 * Called by: js/translator.js (flushBuffer retranslate branch)
 */
export function getStepSpeakerOverride() {
    const sel = document.getElementById("stepSpeakerSelect");
    return sel ? sel.value : "";
}

/**
 * Opens the manual-step toolbar for step-by-step translation evaluation and editing, storing the full history and summary context on state so the preview can recompute live, syncing the override inputs, and resolving with the chosen action (continue/retranslate) plus any manual summary edits
 * Called by: js/translator.js (translateViaAiServer flushBuffer manual-step loop)
 */
export function promptUserForManualStep(currentChunkText, currentContextWindow, fullHistory, summaryContext, maxContextLinesDefault, rawLimitDefault, knownSpeakers, activeSpeakerName) {
    console.log('[Trace:UI] promptUserForManualStep() invoked; source + context populated.');
    return new Promise((resolve, reject) => {
        const toolbar = document.getElementById("manualStepToolbar");
        const titleEl = document.getElementById("manualStepTitle");
        const isRetranslateReentry = !!state._manualStepOpen;

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
        state._manualStepOpen = true;

        if (!isRetranslateReentry) {
            state._stepAppliedSummaryState = null;
        }

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

        // Populate all fields instantly from current translation state (no expensive AI replay)
        populateStepContextFields(summaryContext, fullHistory, rawLimitDefault);

        // Context changes are applied via the Apply button (applyStepContextSettings),
        // not auto-recalc on change.
        if (ctxInput) ctxInput.dataset.oldValue = ctxInput.value;
        if (rawInput) rawInput.dataset.oldValue = rawInput.value;

        // Update the speaker dropdown with any newly discovered speakers.
        // On retranslate re-entry pass null so the user's current selection is preserved.
        updateStepSpeakerDropdown(knownSpeakers || state._knownSpeakers, isRetranslateReentry ? null : activeSpeakerName);

        const outputRight = document.getElementById("outputAreaRight");
        if (outputRight) outputRight.classList.add("editable");

        state.manualStepResolver = (action, newContextCount, rawLimit, manualSummaryEdits) => {
            if (action !== "retranslate") state._manualStepOpen = false;
            if (titleEl) titleEl.textContent = "Manual Step Override Active";
            if (!state.manualStepByStepMode && toolbar) {
                toolbar.style.display = "none";
            }
            resolve({ action, newContextCount, rawLimit, manualSummaryEdits });
        };

        if (state.currentAbortController) {
            state.currentAbortController.signal.addEventListener('abort', () => {
                state._manualStepOpen = false;
                if (!state.manualStepByStepMode && toolbar) {
                    toolbar.style.display = "none";
                }
                reject(new Error("Translation cancelled by user."));
            }, { once: true });
        }
    });
}

/**
 * Resolves the manual-step prompt with a continue action, capturing the current context/raw input values and any manual summary-box edits
 * Called by: HTML event handler via main.js window.resolveManualStepContinue (HTML Continue button)
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
 * Applies the manual-override context/raw values to shared state and recomputes summaries from history, storing the resulting summary state so a subsequent retranslate reuses it instead of triggering a fresh recalc
 * Called by: HTML event handler via main.js window.applyStepContextSettings (HTML Apply button)
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

/**
 * Resolves the manual-step prompt with a retranslate action, capturing the current context/raw input values and any manual summary-box edits so they update the internal summary variables before the retranslate rebuilds the context window
 * Called by: HTML event handler via main.js window.triggerStepRetranslation (HTML Retranslate button)
 */
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
 * Reads the current (possibly user-edited) archival and recent summary boxes, returning null when neither box exists so callers can skip writing anything back
 * Called by: js/ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)
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
