// logger.js
// Structured AI interaction logging: captures every prompt sent to the LLM and
// every response received, grouped by originating loop (translation / retranslate /
// mapping / benchmark) and further split by preset, so each preset's
// prompt/response pairs land in their own file for performance tracking.
//
// Logs are written to disk via the companion serve.py write endpoint
// (POST /__write_log) into docs/logs/<loopFolder>/<preset>.md. Each preset file
// keeps only the latest 500 entries (rolling window) so files never bloat.
//
// The logger keeps its own module-scoped buffers (NOT on `state`) so the
// production pipeline never pays for logging unless the capture flag is on.

/**
 * Per-loop folder name on disk. The keys are the loop kinds set via beginLoop().
 */
const LOOP_FOLDERS = {
    translation: 'translation',
    retranslate: 'manual-step',
    mapping: 'mapping',
    benchmark: 'benchmark'
};

/**
 * The canonical set of loop kinds. Used for validation and iteration.
 */
export const LOOP_KINDS = ['translation', 'retranslate', 'mapping', 'benchmark'];

/**
 * Buffer shape: { [loopKind]: { [presetKey]: Array<entry> } }.
 * Each preset's array holds its prompt/response entries (most-recent-last).
 */
const logs = {
    translation: {},
    retranslate: {},
    mapping: {},
    benchmark: {}
};

/**
 * The active loop kind, set by beginLoop() at the start of a translation /
 * mapping / benchmark / manual-step run. Defaults to 'translation'. Inherited by
 * every LLM call made while that loop is on the stack so the shared
 * translateChunkWithContext helper is attributed to the correct loop.
 */
let activeLoopKind = 'translation';

/**
 * When false, capture calls are no-ops so logging has zero allocation cost on
 * the production path. Defaults to ON so a fresh run is always captured.
 */
let captureEnabled = true;

/**
 * Soft cap on entries kept per preset file. Older entries are dropped once a
 * preset buffer exceeds this so files never grow without bound.
 */
const MAX_ENTRIES_PER_PRESET = 500;

/**
 * Monotonic sequence number for stable, sortable entry IDs across all buffers.
 */
let entrySequence = 0;

/**
 * Endpoint exposed by serve.py to write a preset log file to disk. The browser
 * POSTs the file body here; the server writes docs/logs/<folder>/<preset>.md.
 */
const WRITE_ENDPOINT = '/__write_log';

/**
 * Enables or disables AI-interaction capture; when disabled, logging calls are no-ops so the production pipeline pays no allocation cost
 * Called by: (reserved for an optional capture toggle; defaults ON)
 */
export function setCaptureEnabled(enabled) {
    captureEnabled = !!enabled;
    console.log(`[Trace:Logger] Capture ${captureEnabled ? 'enabled' : 'disabled'}.`);
}

/**
 * Returns whether capture is currently enabled.
 * Called by: ui.js (logging toggle checkbox state)
 */
export function isCaptureEnabled() {
    return captureEnabled;
}

/**
 * Sets the active loop kind so subsequent LLM calls are tagged with the loop that owns them, defaulting to 'translation' for unknown kinds
 * Called by: js/translator.js (translateViaAiServer, flushBuffer retranslate path, generateStylizationMapWithAI + its finally), js/benchmark.js (runParameterSweepBenchmark + its finally)
 */
export function beginLoop(kind) {
    if (!LOOP_KINDS.includes(kind)) {
        console.warn(`[Trace:Logger] Unknown loop kind "${kind}"; defaulting to "translation".`);
        activeLoopKind = 'translation';
        return;
    }
    activeLoopKind = kind;
}

/**
 * Returns the currently active loop kind.
 * Called by: translator-llm.js (translateChunkWithContext)
 */
export function getActiveLoopKind() {
    return activeLoopKind;
}

/**
 * Captures a single AI-interaction entry with the 6-field schema (preset, sourceText, prompt, response, retryAttempt, outcome), routing it to the active loop's buffer under its preset key with a rolling cap; no-op when capture is disabled
 * Called by: js/translator-llm.js (translateChunkWithContext accepted/retried/fallback paths, updateRecentSummary, updateArchivalSummary, assessTranslationQualityWithAI), js/translator.js (generateStylizationMapWithAI phases), js/benchmark.js (gradeCandidateAgent)
 */
export function logAIInteraction({ preset, prompt, response, sourceText = '', retryAttempt = 1, outcome = '' }) {
    if (!captureEnabled) return;
    const kind = activeLoopKind;
    if (!LOOP_KINDS.includes(kind)) return;
    const presetKey = preset || 'unknown';

    if (!logs[kind][presetKey]) logs[kind][presetKey] = [];

    const record = {
        id: ++entrySequence,
        timestamp: new Date().toISOString(),
        loopKind: kind,
        preset: presetKey,
        sourceText: sourceText ?? '',
        prompt: prompt ?? '',
        response: response ?? '',
        retryAttempt,
        outcome
    };

    const buffer = logs[kind][presetKey];
    buffer.push(record);
    // Rolling cap: drop the oldest entry once the preset buffer overflows.
    if (buffer.length > MAX_ENTRIES_PER_PRESET) buffer.shift();
}

/**
 * Appends a session-boundary marker (completed/aborted) to the active loop's buffer under the reserved __session__ preset key so run boundaries render as headers in the exported file
 * Called by: js/translator.js (translateViaAiServer finally, generateStylizationMapWithAI finally), js/benchmark.js (runParameterSweepBenchmark finally)
 */
export function markSession(status, note = '') {
    if (!captureEnabled) return;
    const kind = activeLoopKind;
    if (!LOOP_KINDS.includes(kind)) return;
    const marker = {
        id: ++entrySequence,
        timestamp: new Date().toISOString(),
        loopKind: kind,
        preset: '__session__',
        prompt: '',
        response: '',
        retryAttempt: 0,
        outcome: status === 'aborted' ? 'session-abort' : 'session-end',
        sessionNote: note
    };
    // Session markers are stored under the reserved __session__ preset key so they
    // render as a single header block at the top of each preset file's export
    // rather than interleaving into a preset's prompt/response list.
    if (!logs[kind]['__session__']) logs[kind]['__session__'] = [];
    logs[kind]['__session__'].push(marker);
}

/**
 * Renders a loop's preset buffer as an AI-parseable markdown document with per-entry headers, metadata tags, fenced prompt/response blocks, and session-boundary headers
 * Called by: js/logger.js (flushLoopToDisk)
 */
export function exportPresetAsMarkdown(kind, presetKey) {
    if (!LOOP_KINDS.includes(kind)) return '';
    const entries = logs[kind][presetKey] || [];
    const folder = LOOP_FOLDERS[kind] || kind;
    let md = `# AI Interaction Log — ${folder} / ${presetKey}\n\n`;
    md += `> Captured ${entries.length} interaction(s) for preset "${presetKey}" in loop "${kind}". `;
    md += `Generated ${new Date().toISOString()}.\n`;
    md += `> Rolling window: latest ${MAX_ENTRIES_PER_PRESET} entries per preset.\n\n`;
    md += `---\n\n`;

    if (entries.length === 0) {
        md += `_No interactions captured for this preset yet._\n`;
        return md;
    }

    for (const e of entries) {
        // Session markers render as section headers so run boundaries are visible.
        if (e.outcome === 'session-end' || e.outcome === 'session-abort') {
            const label = e.outcome === 'session-abort' ? 'ABORTED' : 'COMPLETED';
            md += `## [SESSION ${label}] — ${e.timestamp}\n`;
            if (e.sessionNote) md += `> ${e.sessionNote}\n`;
            md += `\n---\n\n`;
            continue;
        }

        md += `## Entry ${e.id} — ${e.preset} (attempt ${e.retryAttempt})\n\n`;
        md += `- **timestamp:** ${e.timestamp}\n`;
        md += `- **preset:** ${e.preset}\n`;
        md += `- **retry attempt:** ${e.retryAttempt}\n`;
        if (e.outcome) md += `- **outcome:** ${e.outcome}\n`;
        md += `\n`;
        if (e.sourceText) {
            md += `### Source Text (before strip/mapping)\n\n\`\`\`text\n${e.sourceText}\n\`\`\`\n\n`;
        }
        if (e.prompt) {
            md += `### Prompt Sent to LLM\n\n\`\`\`text\n${e.prompt}\n\`\`\`\n\n`;
        }
        if (e.response) {
            md += `### Response Received\n\n\`\`\`text\n${e.response}\n\`\`\`\n\n`;
        }
        md += `---\n\n`;
    }

    return md;
}

/**
 * Returns the list of preset keys that have captured entries for a loop kind, so the flush helper knows which files to write
 * Called by: js/logger.js (flushLoopToDisk)
 */
export function getPresetsForLoop(kind) {
    if (!LOOP_KINDS.includes(kind)) return [];
    return Object.keys(logs[kind]);
}

/**
 * Writes every preset file for a single loop kind to disk via the serve.py POST /__write_log endpoint into docs/logs/<loopFolder>/<preset>.md, silently skipping when the write endpoint is unavailable
 * Called by: js/translator.js (translateViaAiServer finally, generateStylizationMapWithAI finally), js/benchmark.js (runParameterSweepBenchmark finally)
 */
export async function flushLoopToDisk(kind) {
    if (!LOOP_KINDS.includes(kind)) return;
    const folder = LOOP_FOLDERS[kind] || kind;
    const presetKeys = getPresetsForLoop(kind);
    for (const presetKey of presetKeys) {
        const md = exportPresetAsMarkdown(kind, presetKey);
        try {
            await fetch(WRITE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder, preset: presetKey, content: md })
            });
        } catch (e) {
            // Write endpoint unavailable (plain static server). Non-fatal: the
            // in-memory buffer still holds the entries; the app is unaffected.
            console.warn(`[Trace:Logger] Could not write ${folder}/${presetKey}.md to disk (write endpoint unavailable).`);
            return;
        }
    }
}

/**
 * Clears all captured logs across every loop kind and resets the entry sequence counter
 * Called by: (reserved)
 */
export function clearAllLogs() {
    for (const kind of LOOP_KINDS) logs[kind] = {};
    entrySequence = 0;
    console.log('[Trace:Logger] All logs cleared.');
}
