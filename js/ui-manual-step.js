// ui-manual-step.js
// Name-plate and manual step-by-step override modals. Split out of ui.js so the
// densest, most interactive section of the UI is isolated from stylization-map
// management. ui.js re-exports every symbol here so main.js/translator.js
// imports from ./ui.js keep resolving unchanged.

import { state } from './main.js';
import { saveUIStateToCache } from './database.js';
import { buildTieredContextWindow } from './translator.js';

/**
 * Displays a modal prompt to let the user review or modify character name translations interactively.
 * Returns a promise resolving to the user-approved name. Auto-skips the modal (resolving to the AI
 * translation) when state.autoSkipNameModal is set, and rejects on user abort.
 * Called by: translator.js (resolveNamePlate)
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
 * Resolves the active name translation modal promise with the user's input value.
 * Called by: main.js (window.resolveNameModal wiring for HTML Confirm button)
 */
export function resolveNameModal() {
    const transInput = document.getElementById("modalInputName").value.trim();
    if (state.activeNameResolver) {
        state.activeNameResolver(transInput);
        state.activeNameResolver = null;
    }
}

/**
 * Closes the name translation modal and passes an empty fallback value to the resolver.
 * Called by: main.js (window.closeNameModal wiring for HTML Cancel button)
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
 * Recomputes the context-preview dropdown from the stored full history + current step settings.
 * Replays the entire history through buildTieredContextWindow to reconstruct the tiered summaries
 * (Raw Tail -> Recent Summary -> Archival Summary) so the manual override preview reflects the
 * actual production state rather than a stale snapshot. Returns the recomputed summaryState.
 * Called by: ui-manual-step.js (promptUserForManualStep, applyStepContextSettings)
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
 * Synchronizes the visibility of the manual step override toolbar (and the source-pane label/actions)
 * based on whether manual step-by-step mode is enabled. The current source line box stays permanently
 * visible above the toolbar regardless of mode.
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
 * Toggles manual step mode live when the debug modal checkbox changes state.
 * Called by: main.js (window.syncManualStepModeLive wiring for HTML checkbox onchange)
 */
export function syncManualStepModeLive(enabled) {
    state.manualStepByStepMode = !!enabled;
    syncManualStepUIVisibility();
    saveUIStateToCache();
}

/**
 * Reads both bracket-strip checkboxes into state. Called live whenever either
 * checkbox toggles (onchange), so the strip-phase XOR decision reflects the
 * current UI without needing to close the debug menu.
 * Called by: main.js (window.syncBracketStripToggles wiring for HTML onchange handlers on the two bracket-strip checkboxes)
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
 * Clears the source line text when translation ends so the placeholder shows.
 * The element itself stays visible permanently.
 * Called by: translator.js (translateViaAiServer completion)
 */
export function hideCurrentSourceLine() {
    const box = document.getElementById("stepSourceText");
    if (box) box.value = "";
}

/**
 * Handles a context-lines input change: a destructive recompute that confirms before
 * applying (since it recomputes summaries and the context window). Restores the old
 * value if the user cancels the confirmation.
 * Called by: ui-manual-step.js (promptUserForManualStep input listener)
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
 * Handles a raw-lines input change: reshapes the raw tail display directly (no summary
 * recalculation, which only happens on context-lines change). Updates the raw context box
 * to show the most recent `rawLimit` history lines.
 * Called by: ui-manual-step.js (promptUserForManualStep input listener)
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
 * Opens the manual step toolbar to allow step-by-step translation evaluation and editing.
 * Stores the full history and summary context on state so the preview can recompute live,
 * syncs the override inputs to the current .translate-config values, and resolves the
 * returned promise with the chosen action (continue/retranslate) plus any manual summary edits.
 * Called by: translator.js (translateViaAiServer flushBuffer manual-step loop)
 */
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
 * Resolves the manual step prompt indicating a continue action, capturing the current
 * context/raw input values and any manual summary-box edits.
 * Called by: main.js (window.resolveManualStepContinue wiring for HTML Continue button)
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
 * Applies the manual override context/raw values to shared state and recomputes summaries
 * from history, storing the resulting summary state so a subsequent retranslate reuses it
 * instead of triggering a fresh recalc.
 * Called by: main.js (window.applyStepContextSettings wiring for HTML Apply button)
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
 * Resolves the manual step prompt indicating that a re-translation pass is required,
 * capturing the current context/raw input values and any manual summary-box edits so they
 * update the internal summary variables before the retranslate rebuilds the context window.
 * Called by: main.js (window.triggerStepRetranslation wiring for HTML Retranslate button)
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
 * Reads the current (possibly user-edited) archival and recent summary boxes.
 * Returns null when neither box exists so callers can skip writing anything back.
 * Called by: ui-manual-step.js (resolveManualStepContinue, triggerStepRetranslation)
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
