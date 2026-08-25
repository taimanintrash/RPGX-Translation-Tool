// translator.js
// Translation pipeline: stylization (strip phase + priority override + generation),
// name-plate resolution, and the main sequential translation loop. Also re-exports
// every symbol from translator-presets.js and translator-llm.js so existing imports
// from ./translator.js (main.js, benchmark.js, ui.js) keep resolving unchanged.

import { state } from './main.js';
import { showError, showWarning, clearError, setSaveMapButtonEnabled, promptUserForNameTranslation, promptUserForManualStep, getStepSpeakerOverride, renderDiscoveredMappingsUI, setCurrentSourceLine, hideCurrentSourceLine } from './ui.js';
import { commitTextToRightFile } from './parser.js';
import { operationPresets } from './translator-presets.js';
import { translateChunkWithContext, buildTieredContextWindow, wrapTextToLines } from './translator-llm.js';
import { beginLoop, logAIInteraction, markSession, flushLoopToDisk } from './logger.js';

// Re-export preset/manifest symbols so imports from ./translator.js resolve unchanged.
export { operationPresets, defaultPresetManifest, loadSpecificPreset, loadDefaultPreset, loadAllDefaultPresets } from './translator-presets.js';
// Re-export LLM HTTP helper symbols so imports from ./translator.js resolve unchanged.
export { fetchAiModels, wrapTextToLines, cleanModelOutput, cleanSummaryOutput, updateRecentSummary, updateArchivalSummary, summarizeOldContext, detectRomajiFragment, assessTranslationQualityWithAI, translateChunkWithContext, buildTieredContextWindow } from './translator-llm.js';

/**
 * Validates a candidate stylization mapping key/value pair, rejecting empty/oversized/numeric/sentence-like keys, single kana, common grammar particles, and empty or object values so only legitimate tick/punctuation patterns pass
 * Called by: js/translator.js (parseMappingOutput)
 */
function isValidMappingPair(key, value) {
    if (!key || typeof key !== "string") return false;
    if (key.length === 0 || key.length > 100) return false;
    if (/\n|\r/.test(key)) return false;
    if (/^\d+$/.test(key.trim())) return false;
    if (value === null || typeof value === "object") return false;
    // Reject empty or whitespace-only replacements (they delete content).
    if (typeof value === "string" && value.trim() === "") return false;
    // Reject single kana characters (they corrupt words by firing inside them).
    // 2-char kana fragments are allowed — they can be legitimate sound ticks
    // (e.g. ふぁ -> Faa, むぅ -> Muuu). Grammar-particle and sentence
    // checks below filter out the problematic 2-char cases.
    if (/^[\u3040-\u309F\u30A0-\u30FF]$/.test(key.trim())) return false;
    // Reject 2-char kana that are common grammar particles (は, が, を,
    // に, で, と, の, も, か, ん) — they corrupt words.
    if (/^[\u306f\u304c\u3092\u306b\u3067\u3068\u306e\u3082\u304b\u3093]{1,2}$/.test(key.trim())) return false;
    // Reject keys that look like sentences rather than ticks/punctuation:
    // a key with 3+ kana that contains grammar particles (は, が, を, に, で,
    // と, の, は, も, か) or a mix of kanji + kana longer than 6 chars is
    // almost certainly dialogue, not a stylization pattern.
    const k = key.trim();
    if (/[\u3040-\u309F\u30A0-\u30FF]{3,}/.test(k)) {
        // Contains a run of 3+ kana — check for grammar particles indicating a sentence.
        if (/[\u3092\u306b\u3067\u3068\u306f\u304c\u306e\u3082]\s|^[\u3092\u306b\u3067\u3068\u306f\u304c\u306e\u3082]/.test(k)) return false;
        // Contains kanji mixed with a kana run longer than 4 -> sentence.
        if (/[\u4E00-\u9FAF]/.test(k) && /[\u3040-\u309F\u30A0-\u30FF]{5,}/.test(k)) return false;
    }
    // Hard cap: keys longer than 8 chars are dialogue, not ticks.
    if (k.length > 8) return false;
    // Reject keys containing Japanese quotation brackets (「, 」, 『, 』, 【, 】)
    // — the model wraps patterns in brackets, which won't match the source text
    // (brackets are dialogue markers, not content).
    if (/[\u300c\u300d\u300e\u300f\u3010\u3011]/.test(k)) return false;
    // Reject keys that are pure ASCII/English — the model echoes its own prior
    // output back as a key (e.g. "Aa", "Na", "Ha-ha"). Keys must contain Japanese
    // characters (kana, kanji, or Japanese punctuation).
    if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3000-\u303F\uFF00-\uFFEF]/.test(k)) return false;
    // Reject keys containing a mix of kanji + hiragana that form a word/sentence
    // (e.g. 処女を失う, 始めるぞ, いい答えだ). These are dialogue fragments, not
    // stylization patterns. Any kanji with 2+ consecutive hiragana, or alternating
    // kanji-hiragana (inflected verbs), is a word.
    // NOTE: katakana is NOT counted here — katakana + kanji compounds like
    // アサギ校長 (Asagi Principal) are legitimate name+title mappings that appear
    // inline in dialogue and are not handled by name-plate resolution.
    if (/[\u4E00-\u9FAF]/.test(k) && /[\u3040-\u309F]{2,}/.test(k)) return false;
    // Also reject alternating kanji-hiragana patterns (e.g. 処女を失う)
    // where hiragana is interspersed between kanji — these are inflected words/sentences.
    const kanjiCount = (k.match(/[\u4E00-\u9FAF]/g) || []).length;
    const hiraganaCount = (k.match(/[\u3040-\u309F]/g) || []).length;
    if (kanjiCount >= 1 && hiraganaCount >= 2) return false;
    return true;
}

/**
 * Parses stylization mapping output from a model into key/value pairs.
 * Handles JSON objects, per-line "key":"value" pairs, single-quoted pairs,
 * and unquoted keys. Returns an array of { key, value }.
 * Called by: translator.js (generateStylizationMapWithAI)
 */
function parseMappingOutput(content) {
    if (!content || !content.trim()) return [];
    let pairs = [];

    // 1. Try parsing as a JSON object first (most reliable).
    try {
        let obj = JSON.parse(content);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            for (let [k, v] of Object.entries(obj)) {
                let val = String(v ?? "");
                if (isValidMappingPair(k, val)) pairs.push({ key: k, value: val });
            }
            if (pairs.length > 0) return pairs;
        }
    } catch (e) { /* not a JSON object, fall through to line-by-line */ }

    // 2. Try extracting a JSON object from mixed text (model may wrap it).
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            let obj = JSON.parse(jsonMatch[0]);
            if (obj && typeof obj === "object" && !Array.isArray(obj)) {
                for (let [k, v] of Object.entries(obj)) {
                    let val = String(v ?? "");
                    if (isValidMappingPair(k, val)) pairs.push({ key: k, value: val });
                }
                if (pairs.length > 0) return pairs;
            }
        } catch (e) { /* fall through */ }
    }

    // 3. Fall back to line-by-line regex matching with flexible quoting.
    let lines = content.split("\n");
    for (let line of lines) {
        let match = line.match(/["']?([^"'\s,:]+)["']?\s*:\s*["']([^"']*)["']/);
        if (match && isValidMappingPair(match[1], match[2])) {
            pairs.push({ key: match[1], value: match[2] });
        }
    }
    return pairs;
}

/**
 * Decides whether 「」 brackets should be stripped from name values during
 * in-dialogue replacement. XOR of the two active contexts:
 *   A = Manual line-by-line Override active AND its bracket checkbox checked
 *   B = Generate Mapper running AND its bracket checkbox checked
 * Brackets are stripped when exactly one of A or B is true.
 * Called by: translator.js (stripLine)
 */
export function shouldStripNameBrackets() {
    const ctxManual = state.manualStepByStepMode && state.manualStepStripBrackets;
    const ctxMapper = state.mapperGenerationActive && state.mapperStripBrackets;
    return ctxManual !== ctxMapper; // XOR
}

/**
 * Applies the reserved __priorityOverride__ entries from the stylization map to the source text FIRST,
 * before the normal strip-phase replacement loop, so downstream phases never see the original characters.
 * Applies longest-key-first so longer patterns win over their substrings; every occurrence is replaced globally.
 * Called by: translator.js (stripLine, generateStylizationMapWithAI)
 */
export function applyPriorityOverride(text, map) {
    if (!map || typeof map !== 'object') return text;
    const override = map.__priorityOverride__;
    if (!override || typeof override !== 'object') return text;
    // Apply longest keys first so longer patterns win over their substrings.
    const entries = Object.entries(override).sort((a, b) => b[0].length - a[0].length);
    let out = text;
    for (const [pattern, replacement] of entries) {
        if (pattern && out.includes(pattern)) {
            // global replace; priority override is meant to rewrite every occurrence.
            out = out.split(pattern).join(replacement);
        }
    }
    return out;
}

/**
 * Strips heavy-stylization patterns from a line for AI input (with optional bracket stripping of name replacements), collecting the applied patterns for context
 * Called by: js/translator.js (translateViaAiServer main loop, flushBuffer manual-step retranslate)
 */
function stripLine(line) {
    let extractedStylizations = [];
    let cleanedTextForAi = applyPriorityOverride(line, state.heavyStylizationMap);

    for (const [pattern, replacement] of Object.entries(state.heavyStylizationMap)) {
        if (pattern === "__priorityOverride__") continue;
        if (cleanedTextForAi.includes(pattern)) {
            extractedStylizations.push(pattern);
            const stripBrackets = shouldStripNameBrackets();
            const inlineReplacement = (stripBrackets && typeof replacement === 'string' && /^\u300c.*\u300d$/.test(replacement))
                ? replacement.slice(1, -1)
                : replacement;
            cleanedTextForAi = cleanedTextForAi.replace(pattern, inlineReplacement).trim();
        }
    }

    if (!cleanedTextForAi && extractedStylizations.length > 0) {
        return { textToSendToAi: "", extracted: extractedStylizations, flushOnly: true };
    }
    return { textToSendToAi: cleanedTextForAi, extracted: extractedStylizations, flushOnly: false };
}

/**
 * Analyzes source text blocks to discover character stutters, ticks, and punctuation anomalies,
 * formatting them into a stylization mapping list via a 3-phase AI analysis (Ticks -> Sounds -> Punctuation).
 * Results land in state.pendingDiscoveredMappings for user review. Applies priority override first
 * so generation phases never see the original characters.
 * Called by: main.js (window.generateStylizationMapWithAI wiring for HTML Generate Mapping button)
 */
export async function generateStylizationMapWithAI() {
    console.log('[Trace:Stylization] generateStylizationMapWithAI() invoked.');
    clearError();
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const model = document.getElementById("aiModel").value;
    const sourceText = document.getElementById("outputAreaLeft").value;
    const loadingStatus = document.getElementById("loading-status");
    const progressBar = document.getElementById("translation-progress");
    const stopBtn = document.getElementById("stopTranslateBtn");

    if (!model) showError("Select an active model first.");
    if (!sourceText.trim()) showError("Source 1 text area is empty. Load/select a script ID first.");

    // Silently abort any currently-running process before starting a new one.
    if (state.currentAbortController) {
        state.currentAbortController.abort();
        console.log("[Trace:Stylization] Aborted prior process before starting mapping generation.");
    }
    state.currentAbortController = new AbortController();
    state.mapperGenerationActive = true;
    beginLoop('mapping');

    if (loadingStatus) {
        loadingStatus.style.display = "flex";
        loadingStatus.innerHTML = "Generating stylization mapping... (Starting 3-phase analysis)";
    }
    if (stopBtn) stopBtn.style.display = "inline-block";
    if (progressBar) {
        progressBar.style.display = "block";
        progressBar.value = 5;
    }

    let sourceLines = sourceText.split("\n");
    // Filter to only dialogue lines, mirroring the main translation loop: skip
    // <NAME_PLATE>, control tags (<...>), and empty lines. Then strip newlines
    // so the mapping phases see the same clean text the translator sees.
    let dialogueLines = sourceLines
        .map(l => l.trim())
        .filter(l => l && !l.startsWith("<"));
    // Snapshot the original dialogue lines BEFORE priority override so each chunk's
    // log entry can record the pre-mapping source text the model never sees directly.
    let originalDialogueLines = [...dialogueLines];
    // Apply the priority override FIRST so the generation phases never see the
    // original characters (e.g. 、 rewritten to - before tick/sound analysis).
    if (state.heavyStylizationMap && state.heavyStylizationMap.__priorityOverride__) {
        dialogueLines = dialogueLines.map(l => applyPriorityOverride(l, state.heavyStylizationMap));
    }
    let totalChunks = Math.min(dialogueLines.length, 5);
    let discoveredArray = [];
    let seenKeys = new Set();

    // Each phase analyzes the original clean dialogue text independently.
    // Order: Ticks (most detail-oriented) -> Sounds -> Punctuation (broadest).
    // Dedup via seenKeys prevents the same pattern appearing twice across phases.
    const phases = [
        {
            name: "Ticks",
            presetKey: "stylizationTicks",
            prompt: (chunk) => `Find ONLY Japanese speech stutters, repeated-kana ticks, and gemination tick+punctuation combos in this text.\n` +
                `Translate each to its English equivalent.\n` +
                `Return lines as "source":"replacement". No markdown blocks.\n\n` +
                `Examples:\n` +
                `"ッ！":"!"\n` +
                `"ッ！？":"!"\n` +
                `"びりびり":"bzz-bzz"\n` +
                `"どきどき":"thump-thump"\n\n` +
                `TRANSLATE ticks to English — NEVER remove them. Do NOT output empty replacements unless the pattern is pure gemination punctuation (っ alone).\n` +
                `Each pattern must be 2+ characters. NEVER output single kana, grammar particles, full sentences, or dialogue fragments.\n` +
                `NEVER output a pattern containing a sentence-ending mark as part of a longer phrase.\n\n` +
                `Snippet:\n${chunk.substring(0, 800)}\n\nOutput:`
        },
        {
            name: "Sounds",
            presetKey: "stylizationSounds",
            prompt: (chunk) => `Find ONLY Japanese sound effects and onomatopoeia in this text.\n` +
                `Translate each to a natural English equivalent.\n` +
                `Return lines as "source":"replacement". No markdown blocks.\n\n` +
                `Examples:\n` +
                `"あああ":"Aaaah"\n` +
                `"きゃあ":"Kyaa"\n` +
                `"ふふ":"Hehe"\n` +
                `"ぐぬぬ":"Grrr"\n` +
                `"びりびり":"bzz-bzz"\n` +
                `"どきどき":"thump-thump"\n\n` +
                `Each pattern MUST be 3 or more kana. NEVER output single kana, 2-char fragments, grammar particles, sentences, or dialogue.\n` +
                `NEVER output an empty replacement — every sound maps to an English word.\n\n` +
                `Snippet:\n${chunk.substring(0, 800)}\n\nOutput:`
        },
        {
            name: "Punctuation",
            presetKey: "stylizationPunctuation",
            prompt: (chunk) => `Find ONLY Japanese punctuation marks and multi-character punctuation sequences in this text.\n` +
                `Map each to its English equivalent. Include single chars AND multi-char sequences (e.g. ellipses, dash repeats, combined marks).\n` +
                `Return lines as "source":"replacement". No markdown blocks.\n\n` +
                `Examples:\n` +
                `"、":""\n` +
                `"。":"."\n` +
                `"！":"!"\n` +
                `"？":"?"\n` +
                `"ー":"-"\n` +
                `"…":"..."\n` +
                `"――":"—"\n` +
                `"！？":"!"\n\n` +
                `NEVER output kana that are not punctuation. NEVER output words, sentences, sounds, or dialogue.\n` +
                `Empty replacements are allowed ONLY for punctuation being stripped (e.g. 、).\n\n` +
                `Snippet:\n${chunk.substring(0, 800)}\n\nOutput:`
        }
    ];

    try {
        let phaseIndex = 0;
        for (const phase of phases) {
            phaseIndex++;
            if (loadingStatus) loadingStatus.innerHTML = `Generating stylization mapping... (Phase ${phaseIndex}/3: ${phase.name})`;
            const phaseConfig = operationPresets[phase.presetKey] || operationPresets.stylization || operationPresets.benchmark;

            for (let i = 0; i < totalChunks; i++) {
                if (state.currentAbortController.signal.aborted) throw new Error("Generation cancelled by user.");

                let progressPercent = Math.round(((phaseIndex - 1) * totalChunks + (i + 1)) / (phases.length * totalChunks) * 95);
                if (loadingStatus) loadingStatus.innerHTML = `Generating stylization mapping... (Phase ${phaseIndex}/3: ${phase.name} - block ${i + 1} of ${totalChunks})`;
                if (progressBar) progressBar.value = progressPercent;

                let chunkText = dialogueLines.slice(i * 50, (i + 1) * 50).join("\n");
                // Original (pre-override) source for the same chunk, for logging only.
                let originalChunkText = originalDialogueLines.slice(i * 50, (i + 1) * 50).join("\n");
                originalChunkText = originalChunkText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
                // Strip embedded newlines so the phase prompt text is a single coherent string.
                chunkText = chunkText.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
                if (!chunkText.trim()) continue;

                const promptText = phase.prompt(chunkText);
                const payload = {
                    model: model,
                    messages: [
                        { role: "system", content: phaseConfig.systemPrompt },
                        { role: "user", content: promptText }
                    ],
                    stream: false,
                    temperature: phaseConfig.temperature ?? 0.0,
                    max_tokens: 256
                };

                const res = await fetch(`${host}/v1/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: state.currentAbortController.signal
                });

                if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                const data = await res.json();
                let content = (data.choices?.[0]?.message?.content || "").replace(/```/g, "").trim();

                // Parse the model output flexibly. Models may return a JSON object,
                // individual "key":"value" lines, single-quoted pairs, or unquoted keys.
                let phasePairs = parseMappingOutput(content);
                logAIInteraction({
                    preset: phase.presetKey,
                    sourceText: originalChunkText,
                    prompt: promptText,
                    response: content,
                    retryAttempt: 1,
                    outcome: 'generated'
                });
                for (let { key, value } of phasePairs) {
                    // Skip if the key already exists in the base heavyStylizationMap.
                    if (state.heavyStylizationMap && Object.prototype.hasOwnProperty.call(state.heavyStylizationMap, key)) {
                        console.log(`[Trace:Stylization] Skipping duplicate of base map entry: "${key}"`);
                        continue;
                    }
                    // Skip if we already discovered this key (dedup across phases/chunks).
                    if (seenKeys.has(key)) {
                        console.log(`[Trace:Stylization] Skipping duplicate discovered key: "${key}"`);
                        continue;
                    }
                    seenKeys.add(key);
                    discoveredArray.push({ key, value, selected: false });
                }
            }
        }

        if (loadingStatus) loadingStatus.innerHTML = "Finalizing discovered mapping list...";
        if (progressBar) progressBar.value = 95;

        console.log(`[Trace:Stylization] Discovered ${discoveredArray.length} unique mapping candidate(s) across 3 phases.`);
        if (discoveredArray.length > 0) {
            state.pendingDiscoveredMappings = discoveredArray;
            renderDiscoveredMappingsUI();
            // Surface completion on the loading-status progress bar instead of the banner.
            if (loadingStatus) {
                loadingStatus.style.display = "flex";
                loadingStatus.innerHTML = `Stylization mapping generated! ${discoveredArray.length} candidate(s) found. Review them in the Debug Menu.`;
            }
            // Generate Mapping finished, so re-arm the Save Map button for the user
            // to commit any edits they make to the discovered map.
            setSaveMapButtonEnabled(true);
        } else {
            throw new Error("Model did not return valid text lines in the format \"key\":\"value\".");
        }
    } catch (err) {
        if (err.name === "AbortError" || err.message.includes("cancelled")) {
            // Show the warning banner only for a user-initiated Stop (guard set by
            // stopTranslation). A silent abort from starting another process shows nothing.
            if (state.abortWarningShown) showWarning("Mapping generation cancelled by user.");
        } else {
            showError("Mapping generation failed: " + err.message);
            console.error("[Mapping Generation] Failed:", err);
        }
    } finally {
        if (loadingStatus) loadingStatus.style.display = "none";
        if (stopBtn) stopBtn.style.display = "none";
        if (progressBar) progressBar.style.display = "none";
        state.currentAbortController = null;
        state.mapperGenerationActive = false;
        state.abortWarningShown = false;
        // Flush the mapping-loop logs to disk (docs/logs/mapping/*.md) and mark
        // the session boundary. The abort-vs-completed status is inferred from
        // the abortWarningShown guard set by stopTranslation.
        markSession(state.abortWarningShown ? 'aborted' : 'completed', 'mapping generation run');
        await flushLoopToDisk('mapping');
        beginLoop('translation');
    }
}

/**
 * Aborts the currently running translation by firing the active AbortController and flags it as user-initiated so the catch block surfaces a warning banner
 * Called by: HTML event handler via main.js window.stopTranslation (HTML Stop button)
 */
export function stopTranslation() {
    if (state.currentAbortController) {
        // Guard so the in-flight catch block knows this was a user-initiated Stop
        // (and should surface a warning banner) rather than a silent abort from
        // starting another process (which shows nothing).
        state.abortWarningShown = true;
        state.currentAbortController.abort();
        console.log("[Process] Abort signal sent by user.");
    }
}

/**
 * Resolves a <NAME_PLATE> line to a character name, using the known-names cache or translating via the model, optionally prompting the user, and merging the resolved name into the stylization map
 * Called by: js/translator.js (translateViaAiServer), js/benchmark.js (runParameterSweepBenchmark)
 */
export async function resolveNamePlate(host, model, rawNamePlateLine, autoAccept = false) {
    let nameValue = rawNamePlateLine.replace("<NAME_PLATE>", "").trim();

    if (nameValue && nameValue !== '""' && nameValue !== '「」' && nameValue !== '') {
        let cleanName = nameValue.replace(/^[\u300c\u300e"']|[\u300d\u300f"']$/g, '').trim();
        let finalUserApprovedName = "";

        if (state.knownNamesMap[cleanName]) {
            finalUserApprovedName = state.knownNamesMap[cleanName];
        } else {
            let namePrompt = `Transliterate this character name. Return strictly the clean name text only:\n${cleanName}`;
            let aiTranslatedName = await translateChunkWithContext(host, model, namePrompt, [], 'namePlate', '', 0, cleanName);
            console.log(`[Trace:NamePlate] cleanName="${cleanName}" -> aiTranslatedName="${aiTranslatedName}"`);
            // In benchmark mode (autoAccept) skip the interactive UI prompt and accept the AI result.
            finalUserApprovedName = autoAccept ? aiTranslatedName : await promptUserForNameTranslation(cleanName, aiTranslatedName);
            state.knownNamesMap[cleanName] = finalUserApprovedName;
        }

        // Merge the resolved Japanese name -> English name into the stylization map so that
        // occurrences of the character's name inside dialogue text are auto-replaced before
        // translation (strip mode), just like stutters and ticks. This keeps names consistent
        // across name plates and in-dialogue references without extra model calls.
        if (cleanName && finalUserApprovedName && cleanName !== finalUserApprovedName) {
            // Wrap the name in brackets so name swaps are visible in the translated dialogue.
            // The speaker context (historyEntry) uses activeSpeakerName directly, not the
            // mapped value, so this does not affect speaker context.
            state.heavyStylizationMap[cleanName] = `「${finalUserApprovedName}」`;
            console.log(`[Trace:NamePlate] Merged "${cleanName}" -> "「${finalUserApprovedName}」" into stylization map for in-dialogue auto-replacement.`);
        }

        return {
            namePlateLine: `<NAME_PLATE>「${finalUserApprovedName}」`,
            speakerName: finalUserApprovedName
        };
    } else {
        // An empty name plate denotes narration in this visual novel format.
        return { namePlateLine: "<NAME_PLATE>", speakerName: "Narrator" };
    }
}

/**
 * Builds an accessor object exposing gettable/settable archivalSummary, recentSummary, recentSummarySourceLines, and summarizedUpToIndex properties backed by the supplied getter/setter closures
 * Called by: js/translator.js (translateViaAiServer flushBuffer)
 */
function makeSummaryStateAccessor(getArchival, setArchival, getRecent, setRecent, getRecentSourceLines, getSummarizedUpTo, setSummarizedUpTo, getPending, setPending) {
    return {
        get archivalSummary() { return getArchival(); },
        set archivalSummary(v) { setArchival(v); },
        get recentSummary() { return getRecent(); },
        set recentSummary(v) { setRecent(v); },
        get recentSummarySourceLines() { return getRecentSourceLines(); },
        get summarizedUpToIndex() { return getSummarizedUpTo(); },
        set summarizedUpToIndex(v) { setSummarizedUpTo(v); },
        get pendingRecentSummaries() { return getPending ? getPending() : []; },
        set pendingRecentSummaries(v) { if (setPending) setPending(v); }
    };
}

/**
 * Reconstructs the displayed line block for a target unfiltered index from the right-hand output area, returning the matching slice or a fallback string
 * Called by: js/translator.js (translateViaAiServer flushBuffer manual-step continue path)
 */
function reconstructManualStepDisplayBlock(translatedLines, outputRight, targetUnfilteredIndex, fallbackText) {
    const displayedLines = outputRight.value.split("\n");
    let displayCursor = 0;
    let blockStart = -1;
    let blockEnd = -1;
    for (let i = 0; i < translatedLines.length; i++) {
        if (translatedLines[i] === "") continue;
        const entryLineCount = translatedLines[i].split("\n").length;
        if (i === targetUnfilteredIndex) {
            blockStart = displayCursor;
            blockEnd = displayCursor + entryLineCount;
            break;
        }
        displayCursor += entryLineCount;
    }
    if (blockStart >= 0 && blockEnd <= displayedLines.length) {
        return displayedLines.slice(blockStart, blockEnd).join("\n");
    }
    return fallbackText;
}

/**
 * Flattens an array of translated lines by splitting any entries containing embedded newlines into individual lines
 * Called by: js/translator.js (translateViaAiServer final flatten step)
 */
function flattenTranslatedLines(translatedLines) {
    let finalCleanedArray = [];
    for (let l of translatedLines) {
        if (l && l.includes && l.includes("\n")) finalCleanedArray.push(...l.split("\n"));
        else finalCleanedArray.push(l);
    }
    return finalCleanedArray;
}

/**
 * Drives the AI-server translation run: reads host/model and manual-override context settings, then translates the selected script lines through the configured preset and validation gate
 * Called by: HTML event handler via main.js window.translateViaAiServer (HTML Translate button)
 */
export async function translateViaAiServer() {
    console.log('[Trace:Translation] translateViaAiServer() invoked.');
    clearError();
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const model = document.getElementById("aiModel").value;
    // Use the manual-override values applied via the Apply button when present;
    // otherwise fall back to the main .translate-config inputs. This overrides
    // the pipeline values without writing back to the UI inputs.
    const maxContextLines = (state.appliedContextLines !== null && !isNaN(state.appliedContextLines))
        ? state.appliedContextLines
        : (parseInt(document.getElementById("contextLinesCount").value) || 0);
    const rawLimitThreshold = (state.appliedRawLimit !== null && !isNaN(state.appliedRawLimit))
        ? state.appliedRawLimit
        : (parseInt(document.getElementById("rawContextLimit").value) || 0);

    const selectElement = document.getElementById("scriptSelect");
    const selectRight = document.getElementById("fileSelectRight");
    const outputLeft = document.getElementById("outputAreaLeft");
    const outputRight = document.getElementById("outputAreaRight");
    const loadingStatus = document.getElementById("loading-status");
    const progressBar = document.getElementById("translation-progress");
    const stopBtn = document.getElementById("stopTranslateBtn");

    if (!model) { console.warn('[Trace:Translation] Aborted: no model selected.'); showError("No model selected."); return; }
    if (!selectElement.value || selectRight.value === "") { console.warn('[Trace:Translation] Aborted: script ID or target file not selected.'); showError("Please select a script ID and target file."); return; }

    let key = selectElement.value.replace(/^[+-]\s*/, "").split(" ")[0];
    let fileObj = state.loadedFilesRegistry[selectRight.value];
    let fullText = outputLeft.value;

    if (!fullText.trim()) showError("No source text to translate.");
    // Silently abort any currently-running process before starting a new one.
    if (state.currentAbortController) {
        state.currentAbortController.abort();
        console.log("[Trace:Translation] Aborted prior process before starting translation.");
    }
    state.currentAbortController = new AbortController();

    outputRight.value = "";
    if (loadingStatus) loadingStatus.style.display = "flex";
    if (stopBtn) stopBtn.style.display = "inline-block";
    if (progressBar) { progressBar.style.display = "block"; progressBar.removeAttribute("value"); }

    beginLoop('translation');

    let lines = fullText.split("\n");
    let translatedLines = [];
    let dialogueBuffer = [];
    let history = [];

    // --- Tiered Summarization State (Qwen2.5-3B optimized) ---
    let archivalSummary = "";
    let recentSummary = "";
    let recentSummarySourceLines = [];
    let summarizedUpToIndex = 0;
    // Pending previous recent summaries accumulated before the archival threshold is reached.
    // Once MIN_ARCHIVAL_SUMMARIES entries are collected, the first archival is built from them.
    let pendingRecentSummaries = [];

    // Tracks the most recently resolved name-plate speaker so it can be passed to the
    // model as [Speaker: Name] context on the following dialogue lines. Small models
    // (Qwen2.5-3B) need the speaker adjacent to the text to keep pronoun/gender consistent.
    let activeSpeakerName = "";
    // The effective speaker used for the most recent translation (may be overridden via dropdown).
    // null = no override applied; "" = explicit Narrator override; "Name" = explicit character override.
    let effectiveSpeakerName = null;

    // Accumulate all resolved speaker names across the run so the manual-step
    // speaker dropdown can offer the full character roster seen so far.
    const knownSpeakers = new Set();
    state._knownSpeakers = knownSpeakers;

    /**
     * Flushes the accumulated dialogue buffer through translateChunkWithContext, handles
     * manual-step checkpoints when manual mode is active, and pushes the translated result
     * into history with the active speaker prefix. Declared inline so it closes over the
     * loop-scoped summary state and dialogueBuffer.
     * Called by: translator.js (translateViaAiServer main loop)
     */
    async function flushBuffer() {
        if (dialogueBuffer.length === 0) return;

        let combinedText = dialogueBuffer.map(item => item.text).join(" ").replace(/\n/g, " ").trim();

        // Tiered context window (Raw Tail -> Recent Summary -> Archival Summary) is built by the
        // shared helper so the production pipeline and benchmark sweep grade under identical conditions.
        let currentContextSlice = await buildTieredContextWindow(host, model, history, maxContextLines, rawLimitThreshold, makeSummaryStateAccessor(
            () => archivalSummary, (v) => { archivalSummary = v; },
            () => recentSummary, (v) => { recentSummary = v; },
            () => recentSummarySourceLines,
            () => summarizedUpToIndex, (v) => { summarizedUpToIndex = v; },
            () => pendingRecentSummaries, (v) => { pendingRecentSummaries = v; }
        ));

        let activePresetKey = 'jpEn';
        let originalChunkSource = dialogueBuffer.map(item => item.originalLine).join(" ").replace(/\n/g, " ").trim();
        let translatedCombined = await translateChunkWithContext(host, model, combinedText, currentContextSlice, activePresetKey, activeSpeakerName, 0, originalChunkSource);

        if (state.manualStepByStepMode) {
            translatedLines[dialogueBuffer[0].index] = translatedCombined;
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");

            let stepResult, keepTranslatingStep = true;
            let manualRetranslateCount = 0;

            while (keepTranslatingStep) {
                stepResult = await promptUserForManualStep(
                    combinedText,
                    currentContextSlice,
                    history,
                    { archivalSummary, recentSummary, recentSummarySourceLines },
                    maxContextLines,
                    rawLimitThreshold,
                    knownSpeakers,
                    activeSpeakerName
                );
                if (stepResult.action === "retranslate") {
                    manualRetranslateCount++;
                    const stepCtxLines = stepResult.newContextCount || maxContextLines;
                    const stepRawLimit = stepResult.rawLimit ?? rawLimitThreshold;
                    // Reuse the summary state computed by Apply (applyStepContextSettings) when
                    // present so retranslate does NOT trigger a fresh recalc. Copy the applied
                    // summaries into the live translation variables; summarizedUpToIndex is already
                    // advanced, so buildTieredContextWindow reassembles the window without
                    // re-summarizing. Then layer any manual summary-box edits on top.
                    const applied = state._stepAppliedSummaryState;
                    if (applied) {
                        archivalSummary = applied.archivalSummary || "";
                        recentSummary = applied.recentSummary || "";
                        recentSummarySourceLines = Array.isArray(applied.recentSummarySourceLines)
                            ? applied.recentSummarySourceLines.slice()
                            : [];
                        summarizedUpToIndex = applied.summarizedUpToIndex || 0;
                    }
                    const edits = stepResult.manualSummaryEdits;
                    if (edits) {
                        if (typeof edits.archivalSummary === "string") archivalSummary = edits.archivalSummary;
                        if (typeof edits.recentSummary === "string") recentSummary = edits.recentSummary;
                    }
                    // Rebuild the context window using the updated settings via buildTieredContextWindow,
                    // so the retranslate uses the same tiered summary pipeline as the main translation.
                    let updatedContextWindow = await buildTieredContextWindow(host, model, history, stepCtxLines, stepRawLimit, makeSummaryStateAccessor(
                        () => archivalSummary, (v) => { archivalSummary = v; },
                        () => recentSummary, (v) => { recentSummary = v; },
                        () => recentSummarySourceLines,
                        () => summarizedUpToIndex, (v) => { summarizedUpToIndex = v; },
                        () => pendingRecentSummaries, (v) => { pendingRecentSummaries = v; }
                    ));
                    console.log(`[Trace:Translation] Re-translate step: contextLines=${stepCtxLines}, rawLimit=${stepRawLimit}, windowSize=${updatedContextWindow.length}`);
                    // Re-run the mapper replacement on the original source lines so a
                    // changed bracket-strip checkbox takes effect on retranslate.
                    if (state.stylizationMode === "strip") {
                        combinedText = dialogueBuffer
                            .map(item => stripLine(item.originalLine || item.text).textToSendToAi)
                            .filter(t => t)
                            .join(" ").replace(/\n/g, " ").trim();
                    }
                    // Use the speaker dropdown override if the user changed it, otherwise
                    // fall back to the auto-detected activeSpeakerName.
                    const retranslateSpeaker = getStepSpeakerOverride() !== undefined ? getStepSpeakerOverride() : activeSpeakerName;
                    effectiveSpeakerName = retranslateSpeaker;
                    beginLoop('retranslate');
                    // Cycle temperature between 0.20 and 0.50 (steps of 0.15, modulo 3) to prevent context leaks and hallucinations
                    const tempAdjust = ((manualRetranslateCount - 1) % 3) * 0.15;
                    translatedCombined = await translateChunkWithContext(host, model, combinedText, updatedContextWindow, 'retry', retranslateSpeaker, tempAdjust, originalChunkSource);
                    beginLoop('translation');
                    translatedLines[dialogueBuffer[0].index] = translatedCombined;
                    outputRight.value = translatedLines.filter(l => l !== "").join("\n");
                } else {
                    // Apply any manual edits to the archival/recent summary boxes to the
                    // internal summary variables so the next chunk carries them forward.
                    const edits = stepResult.manualSummaryEdits;
                    if (edits) {
                        if (typeof edits.archivalSummary === "string") archivalSummary = edits.archivalSummary;
                        if (typeof edits.recentSummary === "string") recentSummary = edits.recentSummary;
                    }
                    // The user edits the translation directly in the outputRight textarea,
                    // so read their edited text back from there. A single translatedLines
                    // entry may span multiple display lines (multi-line narration), so we
                    // cannot map to a single display-line index. Reconstruct the display
                    // block for the target entry via the shared helper.
                    translatedCombined = reconstructManualStepDisplayBlock(
                        translatedLines, outputRight, dialogueBuffer[0].index, translatedCombined
                    );
                    keepTranslatingStep = false;
                }
            }
        }

        // Prefix the speaker name to the history entry so the raw tail display and the
        // tiered summary retain speaker context. The committed output stays clean.
        // effectiveSpeakerName: null = no override, "" = explicit Narrator, "Name" = explicit character.
        // Always emit a [Speaker:] tag — fall back to activeSpeakerName, then "Narrator".
        const speakerForHistory = effectiveSpeakerName !== null ? effectiveSpeakerName : activeSpeakerName;
        const speakerLabel = speakerForHistory || "Narrator";
        let historyEntry = `[Speaker: ${speakerLabel}] ${translatedCombined}`;
        history.push(historyEntry);
        // Reset to null after consuming so the next auto-flush uses activeSpeakerName.
        effectiveSpeakerName = null;

        let wrappedLines = wrapTextToLines(translatedCombined, 42);

        for (let i = 0; i < dialogueBuffer.length; i++) {
            if (i === 0) translatedLines[dialogueBuffer[i].index] = wrappedLines.join("\n");
            else translatedLines[dialogueBuffer[i].index] = "";
        }
        dialogueBuffer = [];
    }

    try {
        let totalLines = lines.length;
        let effectiveLimit = (state.debugMaxLinesLimit > 0 && state.debugMaxLinesLimit < totalLines) ? state.debugMaxLinesLimit : totalLines;
        console.log(`[Trace:Translation] Starting loop: ${effectiveLimit}/${totalLines} lines, preset='jpEn', mode=${state.stylizationMode}, manualStep=${state.manualStepByStepMode}`);

        for (let idx = 0; idx < effectiveLimit; idx++) {
            if (state.currentAbortController.signal.aborted) throw new Error("Translation cancelled by user.");

            let line = lines[idx];
            let trimmedLine = line.trim();

            if (loadingStatus) loadingStatus.innerHTML = `Translating line ${idx + 1} of ${effectiveLimit}...`;

            if (trimmedLine.startsWith("<NAME_PLATE>")) {
                console.log(`[Trace:Translation] NAME_PLATE encountered at line ${idx + 1}.`);
                await flushBuffer();
                let namePlateResult = await resolveNamePlate(host, model, trimmedLine);
                translatedLines.push(namePlateResult.namePlateLine);
                activeSpeakerName = namePlateResult.speakerName;
                if (activeSpeakerName) knownSpeakers.add(activeSpeakerName);
            }
            else if (trimmedLine.startsWith("<") || trimmedLine === "") {
                await flushBuffer();
                translatedLines.push(line);
            }
            else {
                // Strip embedded newlines so the source line displays cleanly and the
                // prompt text is a single coherent string (multi-line breaks confuse the 3B model).
                let cleanSourceLine = trimmedLine.replace(/\n/g, " ").trim();
                setCurrentSourceLine(cleanSourceLine);
                let textToSendToAi = cleanSourceLine;
                let originalLine = trimmedLine;

                if (state.stylizationMode === "strip") {
                    let result = stripLine(trimmedLine);
                    textToSendToAi = result.textToSendToAi;
                    if (result.flushOnly) {
                        await flushBuffer();
                        translatedLines.push(result.extracted.join(" "));
                        continue;
                    }
                }
                else if (state.stylizationMode === "delineate") {
                    textToSendToAi = `[Note: Contains stylized/stuttering expressions] ${trimmedLine}`;
                }

                // The speaker is injected into the system prompt inside translateChunkWithContext,
                // so the dialogue text is passed clean — no inline [Speaker:] tag that the
                // model might echo back. The original line is retained so a manual-step
                // retranslate can re-run the strip phase with the current bracket setting.
                dialogueBuffer.push({ index: translatedLines.length, text: textToSendToAi, originalLine });
                translatedLines.push("");
            }
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");
        }

        await flushBuffer();
        hideCurrentSourceLine();
        state._manualStepOpen = false;
        console.log('[Trace:Translation] Main loop finished. Flattening results and committing to file.');

        let finalCleanedArray = flattenTranslatedLines(translatedLines);

        if (loadingStatus) loadingStatus.style.display = "none";
        if (stopBtn) stopBtn.style.display = "none";
        if (progressBar) progressBar.style.display = "none";

        outputRight.value = finalCleanedArray.join("\n");
        commitTextToRightFile(fileObj, key, finalCleanedArray);
    } catch (error) {
        if (loadingStatus) loadingStatus.style.display = "none";
        if (stopBtn) stopBtn.style.display = "none";
        if (progressBar) progressBar.style.display = "none";

        if (error.name === "AbortError" || error.message.includes("cancelled")) {
            // Show the warning banner only for a user-initiated Stop (guard set by
            // stopTranslation). A silent abort from starting another process shows nothing.
            if (state.abortWarningShown) showWarning("Translation cancelled by user.");
        } else {
            showError(error.message);
            console.error("[Translation] Process failed:", error);
        }
    } finally {
        state.currentAbortController = null;
        // Source 1 is fully translated (or the run ended), so clear the manual
        // override values. The next translation reads from .translate-config again.
        state.appliedContextLines = null;
        state.appliedRawLimit = null;
        // Flush translation-loop logs to disk (docs/logs/translation/*.md) and mark
        // the session boundary. The retranslate path's entries are flushed here too
        // since they were captured under the 'translation' active loop after restore.
        markSession(state.abortWarningShown ? 'aborted' : 'completed', 'translation run');
        await flushLoopToDisk('translation');
        // Retranslate (manual-step) entries were captured under the 'retranslate'
        // loop during the run; flush them to docs/logs/manual-step/*.md too.
        await flushLoopToDisk('retranslate');
        state.abortWarningShown = false;
    }
}
