import { state } from './main.js';
import { showError, clearError, promptUserForNameTranslation, promptUserForManualStep, renderDiscoveredMappingsUI, setCurrentSourceLine, hideCurrentSourceLine } from './ui.js';
import { commitTextToRightFile } from './parser.js';

// Dictionary mapping distinct presets to individual operation parameters
export const operationPresets = {
    main: { temperature: 0.3, systemPrompt: "You are a professional video game localization AI. Translate cleanly and accurately." },
    benchmark: { temperature: 0.1, systemPrompt: "You are an expert AI quality assurance auditor reviewing script translation consistency." },
    jpEn: { temperature: 0.35, systemPrompt: "You are a specialized Japanese-to-English game localizer adapting natural nuance and character voice." },
    retry: { temperature: 0.2, systemPrompt: "The previous translation attempt failed validation. Carefully re-translate keeping tags and markers exact." },
    namePlate: { temperature: 0.1, systemPrompt: "You are a specialized proper noun and character name localization engine. Output transliterated name cleanly." },
    stylization: { temperature: 0.2, systemPrompt: "You are a specialized stylization mapper. Analyze the provided game script and generate a JSON mapping of character names and unique speech patterns to standardized stylization keys." },
    recentSummary: { temperature: 0.2, systemPrompt: "You are a concise narrative context tracking engine for game translation. Maintain a tightly focused rolling recap of active character dynamics, tone, and immediate scene events without conversational filler." },
    archivalSummary: { temperature: 0.15, systemPrompt: "You are an expert story archivist compressing narrative history into a single high-level macro state sentence. Preserve primary character identities, relationships, and overarching goals while omitting resolved micro-dialogue." },
    validator: { temperature: 0.1, systemPrompt: "You are a stringent quality assurance AI evaluating Japanese-to-English translations. Analyze the provided text for untranslated Japanese fragments, romaji placeholders, and poor localization mixing. Return 'PASS' if the translation is fully and naturally localized into English. Return 'FAIL' if any fragments or poor mixing are detected." }
};

/**
 * Manifest of default preset JSON files shipped in the `default_presets/` directory.
 * Each entry maps a preset file to the operation key it overrides (matching `operationPresets`).
 * Add a new file to `default_presets/` and append an entry here to make it appear as a loadable default.
 */
export const defaultPresetManifest = [
    { file: 'default_presets/benchmark_prompt.json', operationKey: 'benchmark', label: 'Benchmark Prompt' },
    { file: 'default_presets/japanese_to_english.json', operationKey: 'jpEn', label: 'Japanese to English' },
    { file: 'default_presets/retry_translation.json', operationKey: 'retry', label: 'Retry Translation' },
    { file: 'default_presets/name_plate_unique.json', operationKey: 'namePlate', label: 'Name Plate Unique' },
    { file: 'default_presets/stylization_mapping.json', operationKey: 'stylization', label: 'Stylization Mapping' },
    { file: 'default_presets/recent_summary.json', operationKey: 'recentSummary', label: 'Recent Scene Summary' },
    { file: 'default_presets/archival_summary.json', operationKey: 'archivalSummary', label: 'Archival Story State' },
    { file: 'default_presets/translation_validator.json', operationKey: 'validator', label: 'Translation Validator' }
];

/**
 * Maps a parsed preset JSON object onto an operation-specific configuration object.
 * Shared by both the manual file upload and the default preset loader paths.
 */
function mapPresetJsonQuiet(operationKey, presetJson, sourceName) {
    let mappedConfig = {
        temperature: presetJson.temperature ?? operationPresets[operationKey].temperature,
        systemPrompt: presetJson.systemPrompt || presetJson.name || operationPresets[operationKey].systemPrompt
    };
    if (presetJson.operation && presetJson.operation.fields) {
        presetJson.operation.fields.forEach(field => {
            if (field.key === "llm.prediction.temperature") mappedConfig.temperature = field.value;
            if (field.key === "llm.prediction.systemPrompt" && field.value) mappedConfig.systemPrompt = field.value;
        });
    }
    operationPresets[operationKey] = mappedConfig;
    console.log(`[Default Presets] ${operationKey.toUpperCase()} <- "${presetJson.name || sourceName}"`);
}

function mapPresetJson(operationKey, presetJson, sourceName) {
    let mappedConfig = {
        temperature: presetJson.temperature ?? operationPresets[operationKey].temperature,
        systemPrompt: presetJson.systemPrompt || presetJson.name || operationPresets[operationKey].systemPrompt
    };

    if (presetJson.operation && presetJson.operation.fields) {
        presetJson.operation.fields.forEach(field => {
            if (field.key === "llm.prediction.temperature") mappedConfig.temperature = field.value;
            if (field.key === "llm.prediction.systemPrompt" && field.value) mappedConfig.systemPrompt = field.value;
        });
    }

    operationPresets[operationKey] = mappedConfig;
    showError(`Preset for [${operationKey.toUpperCase()}] successfully loaded from "${presetJson.name || sourceName}"!`);
}

/**
 * Loads and maps preset configurations from an uploaded JSON file for a specified operation type[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function loadSpecificPreset(operationKey, event) {
    console.log(`[Trace:Preset] loadSpecificPreset(operationKey="${operationKey}") invoked.`);
    const file = event.target.files[0];
    if (!file) { console.warn('[Trace:Preset] No file selected, aborting.'); return; }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            mapPresetJson(operationKey, JSON.parse(e.target.result), file.name);
            console.log(`[Trace:Preset] Custom preset applied to "${operationKey}" from "${file.name}".`);
        } catch (err) {
            showError("Failed to parse preset JSON file.");
            console.error(`[Trace:Preset] Failed to parse custom preset "${file.name}":`, err);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

/**
 * Fetches a shipped default preset JSON from the `default_presets/` directory and applies it to the matching operation.
 * Called by: HTML event handler / main.js (dynamic default preset buttons)[cite: 7]
 */
export async function loadDefaultPreset(operationKey) {
    console.log(`[Trace:Preset] loadDefaultPreset(operationKey="${operationKey}") invoked.`);
    const entry = defaultPresetManifest.find(p => p.operationKey === operationKey);
    if (!entry) {
        showError(`No default preset is registered for operation "${operationKey}".`);
        return;
    }
    try {
        const response = await fetch(entry.file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const presetJson = await response.json();
        mapPresetJson(operationKey, presetJson, entry.file);
    } catch (err) {
        showError(`Failed to load default preset "${entry.file}". The app must be served over HTTP (e.g. via start-agent.sh) for default presets to be fetchable.`);
        console.error(err);
    }
}

/**
 * Loads every shipped default preset from `default_presets/` into `operationPresets` so the translation
 * prompts have their default configuration available in memory without any user action.
 * Called by: main.js (DOMContentLoaded)[cite: 7]
 */
export async function loadAllDefaultPresets() {
    const results = await Promise.allSettled(
        defaultPresetManifest.map(async (entry) => {
            const response = await fetch(entry.file);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const presetJson = await response.json();
            mapPresetJsonQuiet(entry.operationKey, presetJson, entry.file);
        })
    );
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length === defaultPresetManifest.length) {
        console.warn('[Default Presets] Could not load any default presets from default_presets/. The app must be served over HTTP (e.g. via start-agent.sh).');
    } else if (failed.length > 0) {
        console.warn(`[Default Presets] ${failed.length}/${defaultPresetManifest.length} default preset(s) failed to load.`);
    } else {
        console.log(`[Default Presets] Loaded ${defaultPresetManifest.length} default preset(s) into memory.`);
    }
}

/**
 * Queries available local AI Server model endpoints and populates the model selection dropdown list[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function fetchAiModels() {
    console.log('[Trace:Models] fetchAiModels() invoked.');
    clearError();
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const modelSelect = document.getElementById("aiModel");
    const currentSelection = modelSelect.value;
    if (!host) {
        modelSelect.innerHTML = `<option value="">-- Enter Server URL --</option>`;
        showError("No server URL entered. Set the local AI server address first.");
        return;
    }
    // Common OpenAI-compatible model-list endpoint variants across LM Studio, Ollama, llama.cpp, etc.
    const endpoints = [`${host}/v1/models`, `${host}/api/v0/models`, `${host}/models`];
    console.log(`[Trace:Models] Connecting to AI server at ${host}; will try ${endpoints.length} endpoint(s): ${endpoints.join(', ')}`);
    let modelsList = [], success = false;
    const diagnostics = [];

    for (const endpoint of endpoints) {
        console.log(`[Trace:Models] Requesting available models from ${endpoint} ...`);
        try {
            const response = await fetch(endpoint);
            console.log(`[Trace:Models] ${endpoint} responded with HTTP ${response.status} (${response.ok ? 'OK' : 'not OK'}).`);
            if (!response.ok) {
                diagnostics.push(`${endpoint} -> HTTP ${response.status}`);
                continue;
            }
            const data = await response.json();
            if (Array.isArray(data)) { modelsList = data; success = true; console.log(`[Trace:Models] ${endpoint} returned ${modelsList.length} model(s) (array).`); break; }
            else if (data.data && Array.isArray(data.data)) { modelsList = data.data; success = true; console.log(`[Trace:Models] ${endpoint} returned ${modelsList.length} model(s) (data.data).`); break; }
            else if (data.models && Array.isArray(data.models)) { modelsList = data.models; success = true; console.log(`[Trace:Models] ${endpoint} returned ${modelsList.length} model(s) (data.models).`); break; }
            console.warn(`[Trace:Models] ${endpoint} returned OK but unexpected JSON shape (keys: ${Object.keys(data || {}).join(', ')}).`);
            diagnostics.push(`${endpoint} -> OK but unexpected JSON shape (keys: ${Object.keys(data || {}).join(', ')})`);
        } catch (err) {
            // Browser fetch throws TypeError on network failure or CORS rejection; capture the reason.
            console.error(`[Trace:Models] ${endpoint} request failed: ${err.name || 'FetchError'}: ${err.message || 'blocked (likely CORS or connection refused)'}`);
            diagnostics.push(`${endpoint} -> ${err.name || 'FetchError'}: ${err.message || 'blocked (likely CORS or connection refused)'}`);
        }
    }

    console.log(`[Trace:Models] Detection complete. success=${success}, rawModels=${modelsList.length}, diagnostics=${diagnostics.length}`);
    modelSelect.innerHTML = "";
    if (!success || modelsList.length === 0) {
        modelSelect.innerHTML = `<option value="">-- Connection Failed / Check Server --</option>`;
        const detail = diagnostics.length ? diagnostics.join(' | ') : 'no endpoints attempted';
        showError(`Could not fetch models from ${host}. Verify the server is running and CORS is enabled. Details: ${detail}`);
        return;
    }

    let added = 0;
    modelsList.forEach(m => {
        const modelId = m.id || m.name || m.model;
        if (modelId) {
            const opt = document.createElement("option");
            opt.value = modelId;
            opt.textContent = modelId;
            modelSelect.appendChild(opt);
            added++;
        }
    });

    if (added === 0) {
        modelSelect.innerHTML = `<option value="">-- No Models Loaded on Server --</option>`;
        showError(`Server at ${host} responded but returned no models. Load a model in your AI server first.`);
        return;
    }

    console.log(`[Trace:Models] Populated dropdown with ${added} model(s).`);
    if (currentSelection) modelSelect.value = currentSelection;
    if (!modelSelect.value && modelSelect.options.length > 0) modelSelect.selectedIndex = 0;
}

/**
 * Wraps a given string of text into an array of lines bounded by a maximum character length limit[cite: 7].
 * Called by: translator.js (translateViaAiServer)[cite: 7]
 */
export function wrapTextToLines(text, maxLineLength = 40) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = "";

    for (let word of words) {
        if ((currentLine + " " + word).trim().length <= maxLineLength) {
            currentLine = (currentLine + " " + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

/**
 * Cleans up raw LLM outputs by stripping conversational filler words, explanation prefixes, code block formatting, and surrounding quotes[cite: 7].
 * Called by: translator.js (summarizeOldContext, translateChunkWithContext)[cite: 7]
 */
export function cleanModelOutput(rawText) {
    if (!rawText) return "";
    let cleaned = rawText.split(/###|\n\nExplanation:|I’m happy to help|Could you please provide|I don’t see any/i)[0];
    cleaned = cleaned.replace(/^(Translation:|Translated text:|English:)\s*/i, '');
    cleaned = cleaned.trim().replace(/^["'|||「『]|["'|」』]$/g, '');
    const lines = cleaned.split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.toLowerCase().includes("translate the following"));
    return lines.length > 0 ? lines[0] : "";
}

/**
 * Cleans up raw LLM summary outputs by stripping preamble words, role labels, and surrounding quotes.
 * Called by: translator.js (updateRecentSummary, updateArchivalSummary, summarizeOldContext)
 */
export function cleanSummaryOutput(rawText) {
    if (!rawText) return "";
    let cleaned = rawText.split(/###|\n\nExplanation:|I’m happy to help|Could you please provide|I don’t see any/i)[0];
    cleaned = cleaned.replace(/^(Summary:|Story Summary:|Updated Story Summary:|Recap:|Updated Recap:|Scene Recap:)\s*/i, '');
    cleaned = cleaned.trim().replace(/^["']|["']$/g, '');
    const lines = cleaned.split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.toLowerCase().startsWith("task:") && !l.toLowerCase().startsWith("rules:"));
    return lines.join(" ");
}

/**
 * Updates the Tier 2 rolling recent scene summary with newly confirmed dialogue lines.
 * Focuses on active characters, emotional tone, and immediate narrative developments.
 * Called by: translator.js (translateViaAiServer)
 */
export async function updateRecentSummary(host, model, currentRecentSummary, newLines) {
    console.log(`[Trace:Summary:Recent] Updating recent summary with ${newLines.length} line(s).`);
    const newLinesText = newLines.join("\n");
    let promptText = "";

    if (!currentRecentSummary || !currentRecentSummary.trim()) {
        promptText = `Task: Summarize the following dialogue into 1-2 concise sentences.\n` +
            `Focus on: active character names, their tone/relationship, and the current action or discussion topic.\n` +
            `Rules: Output ONLY the concise summary text. No preamble, commentary, or quotes.\n\n` +
            `Dialogue:\n${newLinesText}\n\n` +
            `Summary:`;
    } else {
        promptText = `Task: Update the ongoing scene recap with the new dialogue lines.\n` +
            `Focus on: active character names, their tone/relationship, and the current action or discussion topic.\n` +
            `Rules: Keep the updated recap under 2-3 sentences total. Output ONLY the updated recap. No preamble, commentary, or quotes.\n\n` +
            `Current Recap:\n${currentRecentSummary}\n\n` +
            `New Dialogue:\n${newLinesText}\n\n` +
            `Updated Recap:`;
    }

    const recentConfig = operationPresets.recentSummary || {
        temperature: 0.2,
        systemPrompt: "You are a concise narrative context tracking engine for game translation."
    };

    const payload = {
        model: model,
        messages: [
            { role: "system", content: recentConfig.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: recentConfig.temperature ?? 0.2,
        max_tokens: 256,
        chat_template_kwargs: { "enable_thinking": false }
    };

    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.currentAbortController ? state.currentAbortController.signal : undefined
        });
        if (!res.ok) return currentRecentSummary || "Ongoing scene dialogue.";
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const cleaned = cleanSummaryOutput(raw);
        console.log(`[Trace:Summary:Recent] Updated recent summary: "${cleaned}"`);
        return cleaned || currentRecentSummary || "Ongoing scene dialogue.";
    } catch (e) {
        console.warn("[Trace:Summary:Recent] Failed to update recent summary:", e);
        return currentRecentSummary || "Ongoing scene dialogue.";
    }
}

/**
 * Updates the Tier 3 archival summary (summary-of-summaries) by compressing an overflowing scene recap.
 * If an archival summary already exists, it updates itself to preserve macro story state and key relationships.
 * Called by: translator.js (translateViaAiServer)
 */
export async function updateArchivalSummary(host, model, currentArchivalSummary, recentSummaryToArchive) {
    console.log(`[Trace:Summary:Archival] Compressing scene recap into archival summary.`);
    let promptText = "";

    if (!currentArchivalSummary || !currentArchivalSummary.trim()) {
        promptText = `Task: Compress the following scene recap into ONE concise sentence.\n` +
            `Preserve: primary character names, core relationships, and the overall story situation.\n` +
            `Rules: Output exactly ONE sentence. No preamble, quotes, or conversational filler.\n\n` +
            `Scene Recap:\n${recentSummaryToArchive}\n\n` +
            `Story Summary:`;
    } else {
        promptText = `Task: Update the long-term story recap with the latest scene developments.\n` +
            `Preserve: primary character names, core relationships, and macro plot state. Discard finished minor dialogue.\n` +
            `Rules: Output exactly ONE comprehensive sentence. No preamble, quotes, or conversational filler.\n\n` +
            `Previous Story Summary:\n${currentArchivalSummary}\n\n` +
            `Recent Developments:\n${recentSummaryToArchive}\n\n` +
            `Updated Story Summary:`;
    }

    const archivalConfig = operationPresets.archivalSummary || {
        temperature: 0.15,
        systemPrompt: "You are an expert story archivist compressing narrative history into a single high-level macro state sentence."
    };

    const payload = {
        model: model,
        messages: [
            { role: "system", content: archivalConfig.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: archivalConfig.temperature ?? 0.15,
        max_tokens: 128,
        chat_template_kwargs: { "enable_thinking": false }
    };

    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.currentAbortController ? state.currentAbortController.signal : undefined
        });
        if (!res.ok) return currentArchivalSummary || recentSummaryToArchive;
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "";
        const cleaned = cleanSummaryOutput(raw);
        console.log(`[Trace:Summary:Archival] Updated archival summary: "${cleaned}"`);
        return cleaned || currentArchivalSummary || recentSummaryToArchive;
    } catch (e) {
        console.warn("[Trace:Summary:Archival] Failed to update archival summary:", e);
        return currentArchivalSummary || recentSummaryToArchive;
    }
}

/**
 * Summarizes older dialogue context lines into a single sentence (kept for backwards compatibility).
 * Called by: translator.js
 */
export async function summarizeOldContext(host, model, linesToSummarize) {
    return await updateRecentSummary(host, model, "", linesToSummarize);
}

/**
 * Assesses the quality of a Japanese-to-English translation using a stringent QA prompt.
 * Called by: translator.js (translateChunkWithContext)
 */
export async function assessTranslationQualityWithAI(host, model, translatedText) {
    const config = operationPresets.validator || { temperature: 0.1, systemPrompt: "You are a stringent quality assurance AI evaluating Japanese-to-English translations. Analyze the provided text for untranslated Japanese fragments, romaji placeholders, and poor localization mixing. Return 'PASS' if the translation is fully and naturally localized into English. Return 'FAIL' if any fragments or poor mixing are detected." };
    const promptText = `Evaluate the following translation:\n\n${translatedText}\n\nResult:`;
    
    const payload = {
        model: model,
        messages: [
            { role: "system", content: config.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: config.temperature,
        max_tokens: 64,
        chat_template_kwargs: { "enable_thinking": false }
    };
    
    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.currentAbortController ? state.currentAbortController.signal : undefined
        });
        if (!res.ok) return true; // Fail open
        const data = await res.json();
        const content = (data.choices?.[0]?.message?.content || "").trim();
        // Qwen2.5-3B often returns prose, lowercase, trailing punctuation, or echoes the
        // instruction text ("Return 'FAIL' if..."). Treat the validator as advisory: only
        // a clean, standalone FAIL verdict (possibly with minor surrounding punctuation)
        // counts as a real failure. Anything else (PASS, prose, empty, echoed instructions)
        // is treated as a pass so the deterministic Japanese/context checks remain the gate.
        const upper = content.toUpperCase();
        const isExplicitFail = /^\s*(?:RESULT:?\s*)?FAIL[\s.!?]*$/.test(upper);
        const isEchoedInstruction = upper.includes("RETURN 'FAIL'") || upper.includes('RETURN "FAIL"');
        return !isExplicitFail || isEchoedInstruction;
    } catch (e) {
        console.warn("[Trace:Validator] Error evaluating translation quality:", e);
        return true;
    }
}

/**
 * Translates a text chunk or chunk with prior history context using configured system parameters and handles retry logic[cite: 7].
 * Called by: benchmark.js and translator.js[cite: 7]
 */
export async function translateChunkWithContext(host, model, chunkText, previousContext, presetType = 'jpEn') {
    console.log(`[Trace:Translate] translateChunkWithContext(preset="${presetType}", contextLines=${previousContext.length}) invoked.`);
    if (/^<[A-Z_]+>/.test(chunkText.trim()) && !chunkText.includes('"')) {
        console.log('[Trace:Translate] Passing control-tag line through unchanged.');
        return chunkText;
    }

    let sanitized = chunkText.replace(/<[^>]+>/g, "").trim();
    if (!sanitized) return chunkText;

    let maxRetries = 5;
    let attempts = 0;
    let currentContext = [...previousContext];
    let activePresetConfig = operationPresets[presetType] || operationPresets.main;
    console.log(`[Trace:Translate] Active preset resolved: temp=${activePresetConfig.temperature}`);

    while (attempts <= maxRetries) {
        attempts++;
        let isFallbackRun = (attempts > maxRetries);

        if (isFallbackRun) {
            currentContext = [];
            activePresetConfig = operationPresets.retry;
            console.warn(`[Fallback] Max retries (${maxRetries}) reached for chunk: "${sanitized}". Activating retry preset fallback.`);
        }

        let promptText = `Task: Translate the visual novel text block.\n` +
            `Rules:\n` +
            `- Preserve original character tone and pronoun context.\n` +
            `- Output ONLY the translated string with no filler or preambles.\n\n`;

        if (currentContext && currentContext.length > 0) {
            promptText += `<history>\n` + currentContext.join("\n") + `\n</history>\n\n`;
        }

        promptText += `<current_input>\n${sanitized}\n</current_input>\n\nTranslation:`;

        const payload = {
            model: model,
            messages: [
                { role: "system", content: activePresetConfig.systemPrompt },
                { role: "user", content: promptText }
            ],
            stream: false,
            temperature: activePresetConfig.temperature + (attempts > 1 ? (attempts * 0.1) : 0),
            max_tokens: 1024,
            chat_template_kwargs: { "enable_thinking": false }
        };

        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.currentAbortController ? state.currentAbortController.signal : undefined
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        let rawResult = data.choices?.[0]?.message?.content || sanitized;
        let cleanedResult = cleanModelOutput(rawResult);
        console.log(`[Trace:Translate] Attempt ${attempts}/${maxRetries} -> cleaned length ${cleanedResult.length}`);
        console.log(`[Trace:Translate:Response] raw: ${rawResult}`);
        console.log(`[Trace:Translate:Response] cleaned: ${cleanedResult}`);

        if (isFallbackRun) {
            return `[MANUAL_OVERRIDE_NEEDED] ${cleanedResult}`;
        }

        // --- jp->en validation checks ---
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanedResult);

        // The AI validator is advisory for small models (e.g. Qwen2.5-3B) that cannot
        // reliably emit clean PASS/FAIL tokens. The deterministic Japanese + context-leak
        // checks below are the primary gate. Skip the validator entirely for namePlate
        // chunks: a single transliterated token has no localization quality to grade beyond
        // the Japanese-character check, and the extra round-trip only wastes time/retries.
        const isNamePlatePreset = presetType === 'namePlate';
        const qualityPass = isNamePlatePreset ? true : await assessTranslationQualityWithAI(host, model, cleanedResult);

        // Context-leak detection: did any prior context line bleed into the output?
        let hasOldContext = false;
        let leakedContextLine = "";

        for (let ctxLine of currentContext) {
            let cleanCtx = ctxLine.trim();
            if (cleanCtx.length > 15) {
                let sampleSize = Math.min(cleanCtx.length, 25);
                let contextSnippet = cleanCtx.substring(0, sampleSize);
                if (cleanedResult.includes(contextSnippet) || cleanedResult.includes(cleanCtx)) {
                    hasOldContext = true;
                    leakedContextLine = cleanCtx;
                    break;
                }
            }
        }

        console.log(`[Trace:Translate:Detect] hasJapanese=${hasJapanese}, qualityPass=${qualityPass} (validator=${!isNamePlatePreset}), hasOldContext=${hasOldContext}, contextLines=${currentContext.length}`);
        if (hasJapanese) console.warn(`[Trace:Translate:Detect] Japanese characters still present in output -> will retry.`);
        if (hasOldContext) console.warn(`[Trace:Translate:Detect] Context leak detected -> output contains a prior context line: "${leakedContextLine.substring(0, 60)}..."`);
        if (!qualityPass) console.warn(`[Trace:Translate:Detect] AI validation failed -> poor localization or fragments detected.`);

        // Accept when the deterministic checks pass. The advisory validator alone cannot
        // block acceptance of a Japanese-free, leak-free output, because small models flip
        // it to FAIL spuriously on perfectly good translations (e.g. "Menchi").
        if (!hasJapanese && !hasOldContext) {
            if (!qualityPass) {
                console.log(`[Trace:Translate:Pass] Accepting translation despite advisory AI FAIL (deterministic checks passed; validator advisory only).`);
            } else {
                console.log(`[Trace:Translate:Pass] Output passed all checks (no Japanese, no context leak, passed AI validation). Accepting translation.`);
            }
            return cleanedResult;
        }
        console.log(`[Trace:Translate:Retry] Output failed checks (hasJapanese=${hasJapanese}, hasOldContext=${hasOldContext}, qualityPass=${qualityPass}). Dropping oldest context and retrying.`);
        if (currentContext.length > 0) currentContext.shift();
    }
}

/**
 * Analyzes source text blocks to discover character stutters, ticks, and punctuation anomalies, formatting them into a stylization mapping list[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
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

    state.currentAbortController = new AbortController();

    if (loadingStatus) {
        loadingStatus.style.display = "flex";
        loadingStatus.innerHTML = "Generating stylization mapping... (Analyzing text chunks)";
    }
    if (stopBtn) stopBtn.style.display = "inline-block";
    if (progressBar) {
        progressBar.style.display = "block";
        progressBar.value = 10;
    }

    let sourceLines = sourceText.split("\n");
    let totalChunks = Math.min(sourceLines.length, 5);
    let rawCombinedOutput = "";

    try {
        for (let i = 0; i < totalChunks; i++) {
            if (state.currentAbortController.signal.aborted) throw new Error("Generation cancelled by user.");

            let progressPercent = Math.round(((i + 1) / totalChunks) * 80);
            if (loadingStatus) loadingStatus.innerHTML = `Generating stylization mapping... (Analyzing text block ${i + 1} of ${totalChunks})`;
            if (progressBar) progressBar.value = progressPercent;

            let chunkText = sourceLines.slice(i * 50, (i + 1) * 50).join("\n");
            if (!chunkText.trim()) continue;

            const promptText = `Analyze this visual novel text snippet to find repeated stutters, stylized character ticks, and punctuation anomalies.\n` +
                `Return lines strictly formatted as pairs:\n` +
                `"source_pattern":"replacement_string"\n` +
                `No markdown formatting blocks or extra chatter. Example:\n` +
                `"、":""\n` +
                `"！？":"!"\n\n` +
                `Snippet:\n${chunkText.substring(0, 800)}\n\nOutput:`;

            const stylizationConfig = operationPresets.stylization || operationPresets.benchmark;
            const payload = {
                model: model,
                messages: [
                    { role: "system", content: stylizationConfig.systemPrompt },
                    { role: "user", content: promptText }
                ],
                stream: false,
                temperature: stylizationConfig.temperature ?? 0.0,
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
            let content = data.choices?.[0]?.message?.content || "";
            rawCombinedOutput += "\n" + content;
        }

        if (loadingStatus) loadingStatus.innerHTML = "Finalizing discovered mapping list...";
        if (progressBar) progressBar.value = 95;

        rawCombinedOutput = rawCombinedOutput.replace(/```/g, "").trim();
        let lines = rawCombinedOutput.split("\n");
        let discoveredArray = [];
        let seenKeys = new Set();

        for (let line of lines) {
            let match = line.match(/"([^"]+)"\s*:\s*"([^"]*)"/);
            if (match) {
                let k = match[1];
                let v = match[2];
                if (!seenKeys.has(k)) {
                    seenKeys.add(k);
                    discoveredArray.push({ key: k, value: v, selected: false });
                }
            }
        }

        console.log(`[Trace:Stylization] Discovered ${discoveredArray.length} unique mapping candidate(s).`);
        if (discoveredArray.length > 0) {
            state.pendingDiscoveredMappings = discoveredArray;
            renderDiscoveredMappingsUI();
            showError("Stylization mapping generated! Check the review section in the Debug Menu to edit or select items.");
        } else {
            throw new Error("Model did not return valid text lines in the format \"key\":\"value\".");
        }
    } catch (err) {
        if (err.name === "AbortError" || err.message.includes("cancelled")) {
            console.warn("[Mapping Generation] Successfully aborted by user.");
        } else {
            showError("Mapping generation failed: " + err.message);
        }
    } finally {
        if (loadingStatus) loadingStatus.style.display = "none";
        if (stopBtn) stopBtn.style.display = "none";
        if (progressBar) progressBar.style.display = "none";
        state.currentAbortController = null;
    }
}

/**
 * Aborts ongoing translation or generation processes using an active AbortController[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function stopTranslation() {
    if (state.currentAbortController) {
        state.currentAbortController.abort();
        console.log("[Process] Abort signal sent by user.");
    }
}

/**
 * Manages the core sequential translation loop across lines, handling buffers, name plates, stylized pattern matching, context windows, and manual step checkpoints[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function translateViaAiServer() {
    console.log('[Trace:Translation] translateViaAiServer() invoked.');
    clearError();
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const model = document.getElementById("aiModel").value;
    const maxContextLines = parseInt(document.getElementById("contextLinesCount").value) || 0;
    const rawLimitThreshold = parseInt(document.getElementById("rawContextLimit").value) || 0;

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
    state.currentAbortController = new AbortController();

    outputRight.value = "";
    if (loadingStatus) loadingStatus.style.display = "flex";
    if (stopBtn) stopBtn.style.display = "inline-block";
    if (progressBar) { progressBar.style.display = "block"; progressBar.removeAttribute("value"); }

    let lines = fullText.split("\n");
    let translatedLines = [];
    let dialogueBuffer = [];
    let history = [];

    // --- Tiered Summarization State (Qwen2.5-3B optimized) ---
    let archivalSummary = "";
    let recentSummary = "";
    let recentSummarySourceLines = [];
    let summarizedUpToIndex = 0;

    async function flushBuffer() {
        if (dialogueBuffer.length === 0) return;

        let combinedText = dialogueBuffer.map(item => item.text).join(" ");
        let formattedContextForPrompt = [];

        // Tier 1: Raw Tail (the most recent rawLimitThreshold confirmed lines from history)
        const rawTailStart = Math.max(0, history.length - rawLimitThreshold);
        const rawTail = history.slice(rawTailStart);

        // Tier 2: Rolling Recent Summary
        // Incorporate newly confirmed lines that have exited the raw tail window
        if (rawTailStart > summarizedUpToIndex) {
            const newlyExitedLines = history.slice(summarizedUpToIndex, rawTailStart);
            if (newlyExitedLines.length > 0) {
                recentSummary = await updateRecentSummary(host, model, recentSummary, newlyExitedLines);
                recentSummarySourceLines.push(...newlyExitedLines);
                summarizedUpToIndex = rawTailStart;

                // Tier 3: Archival Summary (Macro story state compression)
                // When recentSummary accumulates substantial context (~50 words or >250 chars), compress it into archival
                const wordCount = recentSummary.trim().split(/\s+/).filter(Boolean).length;
                if (wordCount >= 50 || recentSummary.length >= 250) {
                    archivalSummary = await updateArchivalSummary(host, model, archivalSummary, recentSummary);
                    recentSummary = ""; // Reset rolling recent summary for the next scene segment
                    recentSummarySourceLines = [];
                }
            }
        }

        // Build hierarchical prompt context
        if (archivalSummary) formattedContextForPrompt.push(`[Story Context: ${archivalSummary}]`);
        if (recentSummary) formattedContextForPrompt.push(`[Recent Scene: ${recentSummary}]`);
        formattedContextForPrompt.push(...rawTail);

        let sliceStart = Math.max(0, formattedContextForPrompt.length - maxContextLines);
        let currentContextSlice = maxContextLines > 0 ? formattedContextForPrompt.slice(sliceStart) : [];

        let activePresetKey = 'jpEn';
        let translatedCombined = await translateChunkWithContext(host, model, combinedText, currentContextSlice, activePresetKey);

        if (state.manualStepByStepMode) {
            translatedLines[dialogueBuffer[0].index] = translatedCombined;
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");

            let stepResult, keepTranslatingStep = true;

            while (keepTranslatingStep) {
                stepResult = await promptUserForManualStep(
                    combinedText,
                    currentContextSlice,
                    history,
                    { archivalSummary, recentSummary, recentSummarySourceLines },
                    maxContextLines
                );
                if (stepResult.action === "retranslate") {
                    const stepRawLimit = stepResult.rawLimit ?? stepResult.newContextCount;
                    const stepRawTail = history.slice(Math.max(0, history.length - stepRawLimit));
                    let stepFormattedContext = [];
                    if (archivalSummary) stepFormattedContext.push(`[Story Context: ${archivalSummary}]`);
                    if (recentSummary) stepFormattedContext.push(`[Recent Scene: ${recentSummary}]`);
                    stepFormattedContext.push(...stepRawTail);

                    let updatedContextWindow = (maxContextLines > 0 && stepResult.newContextCount > 0)
                        ? stepFormattedContext.slice(Math.max(0, stepFormattedContext.length - stepResult.newContextCount))
                        : [];
                    console.log(`[Trace:Translation] Re-translate step: contextLines=${stepResult.newContextCount}, rawLimit=${stepRawLimit}, windowSize=${updatedContextWindow.length}`);
                    translatedCombined = await translateChunkWithContext(host, model, combinedText, updatedContextWindow, 'retry');
                    translatedLines[dialogueBuffer[0].index] = translatedCombined;
                    outputRight.value = translatedLines.filter(l => l !== "").join("\n");
                } else {
                    // Read the committed translation from translatedLines (the unfiltered
                    // source of truth), NOT from outputRight.value, whose filtered lines
                    // drift out of sync with dialogueBuffer[0].index and silently drop
                    // the real line from history/memory.
                    let finalManualText = translatedLines[dialogueBuffer[0].index];
                    if (finalManualText === undefined || finalManualText === "") {
                        finalManualText = translatedCombined;
                    }
                    translatedCombined = finalManualText;
                    keepTranslatingStep = false;
                }
            }
        }

        history.push(translatedCombined);
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
                let nameValue = trimmedLine.replace("<NAME_PLATE>", "").trim();

                if (nameValue && nameValue !== '""' && nameValue !== '') {
                    let cleanName = nameValue.replace(/^["'||||||「『]|["'|」』]$/g, '').trim();
                    let finalUserApprovedName = "";

                    if (state.knownNamesMap[cleanName]) {
                        finalUserApprovedName = state.knownNamesMap[cleanName];
                    } else {
                        let namePrompt = `Transliterate this character name. Return strictly the clean name text only:\n${cleanName}`;
                        let aiTranslatedName = await translateChunkWithContext(host, model, namePrompt, [], 'namePlate');
                        console.log(`[Trace:Translation:NamePlate] cleanName="${cleanName}" -> aiTranslatedName="${aiTranslatedName}"`);
                        finalUserApprovedName = await promptUserForNameTranslation(cleanName, aiTranslatedName);
                        state.knownNamesMap[cleanName] = finalUserApprovedName;
                    }
                    translatedLines.push("<NAME_PLATE>\"" + finalUserApprovedName + "\"");
                } else {
                    translatedLines.push("<NAME_PLATE>");
                }
            }
            else if (trimmedLine.startsWith("<") || trimmedLine === "") {
                await flushBuffer();
                translatedLines.push(line);
            }
            else {
                // Only update the source line display for actual dialogue being translated
                setCurrentSourceLine(trimmedLine);
                let textToSendToAi = trimmedLine;

                if (state.stylizationMode === "strip") {
                    let extractedStylizations = [];
                    let cleanedTextForAi = trimmedLine;

                    for (const [pattern, replacement] of Object.entries(state.heavyStylizationMap)) {
                        if (cleanedTextForAi.includes(pattern)) {
                            extractedStylizations.push(pattern);
                            cleanedTextForAi = cleanedTextForAi.replace(pattern, replacement).trim();
                        }
                    }

                    if (!cleanedTextForAi && extractedStylizations.length > 0) {
                        await flushBuffer();
                        translatedLines.push(extractedStylizations.join(" "));
                        continue;
                    }
                    textToSendToAi = cleanedTextForAi;
                }
                else if (state.stylizationMode === "delineate") {
                    textToSendToAi = `[Note: Contains stylized/stuttering expressions] ${trimmedLine}`;
                }

                dialogueBuffer.push({ index: translatedLines.length, text: textToSendToAi });
                translatedLines.push("");
            }
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");
        }

        await flushBuffer();
        hideCurrentSourceLine();
        console.log('[Trace:Translation] Main loop finished. Flattening results and committing to file.');

        let finalCleanedArray = [];
        for (let l of translatedLines) {
            if (l && l.includes && l.includes("\n")) finalCleanedArray.push(...l.split("\n"));
            else finalCleanedArray.push(l);
        }

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
            console.warn("[Translation] Process successfully aborted by user.");
        } else {
            showError(error.message);
        }
    } finally {
        state.currentAbortController = null;
    }
}