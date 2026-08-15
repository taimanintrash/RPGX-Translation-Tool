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
    // Split on any whitespace (including newlines) so multi-line input is handled
    // correctly. The previous split(" ") kept embedded newlines glued to words
    // (e.g. "the\ncar" treated as one token), corrupting wrapped output.
    const words = text.split(/\s+/).filter(Boolean);
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
 * Curated list of Japanese words that frequently bleed untranslated into English
 * output as romaji when the model fails to translate (e.g. "nani", "baka",
 * "matte"). Matched as whole-word tokens so substrings inside legitimate English
 * words are not flagged. This is a deterministic hard-gate: any match forces a
 * retry on every attempt.
 *
 * Intentionally EXCLUDES words commonly kept untranslated in English VN/anime
 * localization: honorifics/titles (sensei, senpai, kouhai, onii-chan, onee-chan),
 * loanwords (otaku, moe, kawaii, sugoi), and trope terms (ecchi, hentai, tsundere,
 * yandere, kuudere). These are valid English usage in this context and must not
 * trigger a hard retry. Extend this list only with true untranslated fragments.
 */
const ROMAJI_FRAGMENT_WORDS = [
    "nani", "baka", "aho", "urusai", "yarou", "temee", "kisama",
    "itadakimasu", "tadaima", "okaeri", "gomen", "gomenasai",
    "arigatou", "arigato", "sayonara", "douzo", "iie",
    "yamete", "yamate", "chigau", "matte",
    "doushite", "naze", "dare", "doko", "itsu", "nanji",
    "sumimasen", "moshi moshi", "moshimoshi"
];

/**
 * Detects leftover Japanese romaji fragments in an otherwise-English translation.
 * Returns the first matched fragment, or null if none found.
 * Called by: translator.js (translateChunkWithContext)
 */
export function detectRomajiFragment(translatedText) {
    if (!translatedText) return null;
    // Normalize: lowercase, collapse whitespace so multi-word entries ("onii-chan") match.
    const normalized = translatedText.toLowerCase();
    for (const word of ROMAJI_FRAGMENT_WORDS) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // Word-boundary match; tolerate trailing punctuation like "nani?" or "baka!"
        const re = new RegExp("(?:^|[^a-z-])" + escaped + "(?:[^a-z-]|$)");
        if (re.test(normalized)) return word;
    }
    return null;
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
export async function translateChunkWithContext(host, model, chunkText, previousContext, presetType = 'jpEn', speakerName = '') {
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

        // The speaker name is passed as a parameter (from resolveNamePlate) and injected
        // into the system prompt. No inline [Speaker:] tag is added to the text.
        let textToTranslate = sanitized;

        let promptText = `Task: Translate the visual novel text block.\n` +
            `Rules:\n` +
            `- Preserve original character tone and pronoun context.\n` +
            `- Output ONLY the translated string with no filler or preambles.\n\n`;

        if (currentContext && currentContext.length > 0) {
            promptText += `<history>\n` + currentContext.join("\n") + `\n</history>\n\n`;
        }

        promptText += `<current_input>\n${textToTranslate}\n</current_input>\n\nTranslation:`;

        // Inject the speaker into the system prompt (not the user message) so the 3B model
        // treats it as context/instruction rather than content to echo back in the output.
        let systemPrompt = activePresetConfig.systemPrompt;
        if (speakerName) {
            systemPrompt += ` The current speaker is ${speakerName}. Keep this character's pronouns and gender consistent. Do not include the speaker name or any speaker tags in the output.`;
        }

        const payload = {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
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
        // Three deterministic + one advisory check gate acceptance:
        //   1. hasJapanese          (regex)   -> hard fail every attempt
        //   2. hasRomajiFragment    (word list)-> hard fail every attempt
        //   3. hasOldContext        (substring)-> hard fail every attempt
        //   4. AI validator         (LLM call)-> hard fail on attempts 1-3 only,
        //                                        advisory (log warning) on attempts 4+,
        //                                        so a flaky small-model verdict cannot
        //                                        burn all 5 retries on a good translation.
        const isNamePlatePreset = presetType === 'namePlate';
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanedResult);
        const romajiFragment = isNamePlatePreset ? null : detectRomajiFragment(cleanedResult);

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

        // AI validator: run for non-namePlate chunks. On attempts 1-3 a clean FAIL is a
        // hard retry trigger; from attempt 4 onward it degrades to advisory (warning only)
        // so a 3B model that cannot reliably emit PASS/FAIL cannot stall the loop.
        const validatorHardFailWindow = 3;
        const validatorIsHardFail = !isNamePlatePreset && attempts <= validatorHardFailWindow;
        let qualityPass = true;
        let validatorVerdict = "skipped";
        if (!isNamePlatePreset) {
            qualityPass = await assessTranslationQualityWithAI(host, model, cleanedResult);
            validatorVerdict = qualityPass ? "PASS" : "FAIL";
        }

        console.log(`[Trace:Translate:Detect] attempt=${attempts}/${maxRetries} hasJapanese=${hasJapanese}, romajiFragment=${romajiFragment ? `'${romajiFragment}'` : 'none'}, hasOldContext=${hasOldContext}, aiValidator=${validatorVerdict} (${validatorIsHardFail ? 'hard-fail' : 'advisory'}), contextLines=${currentContext.length}`);
        if (hasJapanese) console.warn(`[Trace:Translate:Detect] Japanese characters still present in output -> will retry.`);
        if (romajiFragment) console.warn(`[Trace:Translate:Detect] Romaji fragment "${romajiFragment}" left in output -> will retry.`);
        if (hasOldContext) console.warn(`[Trace:Translate:Detect] Context leak detected -> output contains a prior context line: "${leakedContextLine.substring(0, 60)}..."`);

        // Advisory AI-FAIL warning (attempt > validatorHardFailWindow): log but do not block.
        if (!isNamePlatePreset && !qualityPass && !validatorIsHardFail) {
            console.warn(`[Trace:Translate:Detect] AI validator returned FAIL on attempt ${attempts} (beyond hard-fail window of ${validatorHardFailWindow}); treating as advisory only.`);
        }

        // Hard-fail conditions: Japanese chars, romaji fragment, context leak, or an AI
        // FAIL within the early hard-fail window. Any of these forces a retry.
        const failedHardCheck = hasJapanese || !!romajiFragment || hasOldContext;
        const failedAiHardCheck = validatorIsHardFail && !qualityPass;

        if (!failedHardCheck && !failedAiHardCheck) {
            if (!isNamePlatePreset && !qualityPass) {
                console.log(`[Trace:Translate:Pass] Accepting translation despite advisory AI FAIL (deterministic checks passed; validator advisory only).`);
            } else {
                console.log(`[Trace:Translate:Pass] Output passed all checks (no Japanese, no romaji fragment, no context leak, AI validation ${validatorVerdict}). Accepting translation.`);
            }
            return cleanedResult;
        }
        console.log(`[Trace:Translate:Retry] Output failed checks (hasJapanese=${hasJapanese}, romajiFragment=${romajiFragment ? `'${romajiFragment}'` : 'none'}, hasOldContext=${hasOldContext}, aiHardFail=${failedAiHardCheck}). Dropping oldest context and retrying.`);
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

            const promptText = `Analyze this visual novel text snippet to find repeated stutters, stylized character ticks, Japanese punctuation, and sound effects.\n` +
                `Return lines strictly formatted as pairs:\n` +
                `"source_pattern":"replacement_string"\n` +
                `No markdown formatting blocks or extra chatter.\n\n` +
                `Guidelines:\n` +
                `- Convert Japanese punctuation to English equivalents (e.g. 、 -> comma, 。 -> ., ー -> -).\n` +
                `- Translate Japanese sound effects and onomatopoeia to English (e.g. あああ -> Aaaah, きゃあ -> Kyaa).\n` +
                `- Map speech stutters and ticks to English (e.g. びりびり -> bzz-bzz).\n\n` +
                `Example:\n` +
                `"、":""\n` +
                `"！？":"!"\n` +
                `"あああ":"Aaaah"\n` +
                `"きゃあ":"Kyaa"\n\n` +
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
/**
 * Builds the tiered context window (Raw Tail -> Recent Summary -> Archival Summary) shared by the
 * production translation pipeline and the benchmark sweep, so both grade the model under
 * identical context conditions. Mutates and returns the summaryState object in place.
 *
 * Tier 1 (Raw Tail): the most recent `rawLimitThreshold` confirmed lines from history.
 * Tier 2 (Recent Summary): a rolling recap of lines that fell out of the raw tail.
 * Tier 3 (Archival Summary): a compressed macro story state when the recent summary overflows.
 * The final window is capped to `maxContextLines` entries (summary lines + raw tail combined).
 *
 * Called by: translator.js (translateViaAiServer), benchmark.js (runParameterSweepBenchmark)
 */
export async function buildTieredContextWindow(host, model, history, maxContextLines, rawLimitThreshold, summaryState) {
    let formattedContextForPrompt = [];

    // Three-tier context window:
    //   [Archival Summary] [Recent Summary] [Raw Tail]
    //
    // The window is bounded by two settings:
    //   - rawLimitThreshold (Raw Lines): size of the raw tail (verbatim recent lines)
    //   - maxContextLines (Summary Lines): size of the recent summary window (lines between
    //     the raw tail and the summary window start)
    //
    // A line scrolls through the tiers as history grows:
    //   1. Enters the raw tail (verbatim).
    //   2. Exits the raw tail -> enters the recent summary window (gets summarized).
    //   3. Exits the recent summary window -> the recent summary block is flushed into
    //      the archival summary (compressed macro story state).

    // Tier 1: Raw Tail (the most recent rawLimitThreshold confirmed lines from history)
    const rawTailStart = Math.max(0, history.length - rawLimitThreshold);
    const rawTail = history.slice(rawTailStart);

    // Tier 2: Recent Summary window — lines between the raw tail and the summary window start.
    // The summary window covers `maxContextLines` lines before the raw tail.
    // Lines that exit this window are flushed to archival (Tier 3).
    const summaryWindowEnd = rawTailStart; // exclusive (raw tail starts here)
    const summaryWindowStart = Math.max(0, summaryWindowEnd - maxContextLines);

    // Lines that newly entered the recent summary window (exited the raw tail)
    if (summaryWindowEnd > summaryState.summarizedUpToIndex) {
        const newlyExitedLines = history.slice(summaryState.summarizedUpToIndex, summaryWindowEnd);
        if (newlyExitedLines.length > 0) {
            summaryState.recentSummary = await updateRecentSummary(host, model, summaryState.recentSummary, newlyExitedLines);
            summaryState.recentSummarySourceLines.push(...newlyExitedLines);
            summaryState.summarizedUpToIndex = summaryWindowEnd;
        }
    }

    // Tier 3: Archival Summary — triggered when lines exit the recent summary window
    // (i.e., the summary has accumulated more than maxContextLines source lines, and the
    // oldest ones have scrolled past the window). Flush the recent summary into archival.
    if (maxContextLines > 0 && summaryState.recentSummarySourceLines.length > maxContextLines) {
        // Lines that scrolled past the summary window get flushed to archival
        const overflowCount = summaryState.recentSummarySourceLines.length - maxContextLines;
        const flushedLines = summaryState.recentSummarySourceLines.splice(0, overflowCount);
        // Re-summarize the recent summary from the remaining window lines
        const remainingLines = summaryState.recentSummarySourceLines;
        summaryState.archivalSummary = await updateArchivalSummary(host, model, summaryState.archivalSummary, summaryState.recentSummary);
        // Reset recent summary to cover only the remaining window lines
        if (remainingLines.length > 0) {
            summaryState.recentSummary = await updateRecentSummary(host, model, "", remainingLines);
        } else {
            summaryState.recentSummary = "";
        }
        console.log(`[Trace:Summary:Archival] Flushed ${overflowCount} line(s) from recent summary to archival. Remaining in window: ${remainingLines.length}.`);
    }

    // Build hierarchical prompt context
    if (summaryState.archivalSummary) formattedContextForPrompt.push(`[Story Context: ${summaryState.archivalSummary}]`);
    if (summaryState.recentSummary) formattedContextForPrompt.push(`[Recent Scene: ${summaryState.recentSummary}]`);
    formattedContextForPrompt.push(...rawTail);

    // Cap the total context passed to the model
    let sliceStart = Math.max(0, formattedContextForPrompt.length - (maxContextLines + rawLimitThreshold));
    let currentContextSlice = (maxContextLines + rawLimitThreshold) > 0 ? formattedContextForPrompt.slice(sliceStart) : [];

    return currentContextSlice;
}

/**
 * Resolves a <NAME_PLATE> line into a translated name plate line and the active speaker name.
 * Shared by the production pipeline (translateViaAiServer) and the benchmark sweep so both
 * use the identical name-plate resolution path (namePlate preset, knownNamesMap caching).
 *
 * Returns { namePlateLine, speakerName } where speakerName is "Narrator" when the plate is
 * empty (denoting narration) and the resolved name otherwise.
 *
 * Called by: translator.js (translateViaAiServer), benchmark.js (runParameterSweepBenchmark)
 */
export async function resolveNamePlate(host, model, rawNamePlateLine, autoAccept = false) {
    let nameValue = rawNamePlateLine.replace("<NAME_PLATE>", "").trim();

    if (nameValue && nameValue !== '""' && nameValue !== '') {
        let cleanName = nameValue.replace(/^[\u300c\u300e"']|[\u300d\u300f"']$/g, '').trim();
        let finalUserApprovedName = "";

        if (state.knownNamesMap[cleanName]) {
            finalUserApprovedName = state.knownNamesMap[cleanName];
        } else {
            let namePrompt = `Transliterate this character name. Return strictly the clean name text only:\n${cleanName}`;
            let aiTranslatedName = await translateChunkWithContext(host, model, namePrompt, [], 'namePlate');
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
            state.heavyStylizationMap[cleanName] = finalUserApprovedName;
            console.log(`[Trace:NamePlate] Merged "${cleanName}" -> "${finalUserApprovedName}" into stylization map for in-dialogue auto-replacement.`);
        }

        return {
            namePlateLine: `<NAME_PLATE>"${finalUserApprovedName}"`,
            speakerName: finalUserApprovedName
        };
    } else {
        // An empty name plate denotes narration in this visual novel format.
        return { namePlateLine: "<NAME_PLATE>", speakerName: "Narrator" };
    }
}

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

    // Tracks the most recently resolved name-plate speaker so it can be passed to the
    // model as [Speaker: Name] context on the following dialogue lines. Small models
    // (Qwen2.5-3B) need the speaker adjacent to the text to keep pronoun/gender consistent.
    let activeSpeakerName = "";

    async function flushBuffer() {
        if (dialogueBuffer.length === 0) return;

        let combinedText = dialogueBuffer.map(item => item.text).join(" ").replace(/\n/g, " ").trim();

        // Tiered context window (Raw Tail -> Recent Summary -> Archival Summary) is built by the
        // shared helper so the production pipeline and benchmark sweep grade under identical conditions.
        let currentContextSlice = await buildTieredContextWindow(host, model, history, maxContextLines, rawLimitThreshold, {
            get archivalSummary() { return archivalSummary; },
            set archivalSummary(v) { archivalSummary = v; },
            get recentSummary() { return recentSummary; },
            set recentSummary(v) { recentSummary = v; },
            get recentSummarySourceLines() { return recentSummarySourceLines; },
            get summarizedUpToIndex() { return summarizedUpToIndex; },
            set summarizedUpToIndex(v) { summarizedUpToIndex = v; }
        });

        let activePresetKey = 'jpEn';
        let translatedCombined = await translateChunkWithContext(host, model, combinedText, currentContextSlice, activePresetKey, activeSpeakerName);

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
                    translatedCombined = await translateChunkWithContext(host, model, combinedText, updatedContextWindow, 'retry', activeSpeakerName);
                    translatedLines[dialogueBuffer[0].index] = translatedCombined;
                    outputRight.value = translatedLines.filter(l => l !== "").join("\n");
                } else {
                    // The user edits the translation directly in the outputRight textarea,
                    // so read their edited text back from there. A single translatedLines
                    // entry may span multiple display lines (multi-line narration), so we
                    // cannot map to a single display-line index. Instead, reconstruct the
                    // display block for the target entry by replaying the same
                    // filter(l !== "") + join("\n") order and capturing every display line
                    // that belongs to dialogueBuffer[0].index.
                    const targetUnfilteredIndex = dialogueBuffer[0].index;
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
                    let finalManualText;
                    if (blockStart >= 0 && blockEnd <= displayedLines.length) {
                        finalManualText = displayedLines.slice(blockStart, blockEnd).join("\n");
                    } else {
                        finalManualText = translatedCombined;
                    }
                    translatedCombined = finalManualText;
                    keepTranslatingStep = false;
                }
            }
        }

        // Prefix the speaker name to the history entry so the raw tail display and the
        // tiered summary retain speaker context. The committed output stays clean.
        let historyEntry = activeSpeakerName
            ? `[Speaker: ${activeSpeakerName}] ${translatedCombined}`
            : translatedCombined;
        history.push(historyEntry);

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

                // The speaker is injected into the system prompt inside translateChunkWithContext,
                // so the dialogue text is passed clean — no inline [Speaker:] tag that the
                // model might echo back.
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