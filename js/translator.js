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
    stylization: { temperature: 0.2, systemPrompt: "You are a specialized stylization mapper. Analyze the provided game script and generate a JSON mapping of character names and unique speech patterns to standardized stylization keys." }
};

/**
 * Manifest of default preset JSON files shipped in the `defalt_presets/` directory.
 * Each entry maps a preset file to the operation key it overrides (matching `operationPresets`).
 * Add a new file to `defalt_presets/` and append an entry here to make it appear as a loadable default.
 */
export const defaultPresetManifest = [
    { file: 'defalt_presets/defalt_presets.json', operationKey: 'main', label: 'Main Translation' },
    { file: 'defalt_presets/benchmark_prompt.json', operationKey: 'benchmark', label: 'Benchmark Prompt' },
    { file: 'defalt_presets/japanese_to_english.json', operationKey: 'jpEn', label: 'Japanese to English' },
    { file: 'defalt_presets/retry_translation.json', operationKey: 'retry', label: 'Retry Translation' },
    { file: 'defalt_presets/name_plate_unique.json', operationKey: 'namePlate', label: 'Name Plate Unique' },
    { file: 'defalt_presets/stylization_mapping.json', operationKey: 'stylization', label: 'Stylization Mapping' }
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
    reader.onload = function(e) {
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
 * Fetches a shipped default preset JSON from the `defalt_presets/` directory and applies it to the matching operation.
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
 * Loads every shipped default preset from `defalt_presets/` into `operationPresets` so the translation
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
        console.warn('[Default Presets] Could not load any default presets from defalt_presets/. The app must be served over HTTP (e.g. via start-agent.sh).');
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
 * Summarizes older dialogue context lines into a single sentence via an AI call to preserve history dynamics[cite: 7].
 * Called by: translator.js (translateViaAiServer)[cite: 7]
 */
export async function summarizeOldContext(host, model, targetLang, linesToSummarize) {
    console.log(`[Trace:Context] summarizeOldContext() summarizing ${linesToSummarize.length} line(s).`);
    let textToSummarize = linesToSummarize.join(" ");
    let promptText = `Summarize the following previous dialogue lines in 1 sentence in ${targetLang}, tracking core character speaker dynamics.\n\nText:\n${textToSummarize}\n\nSummary:`;

    const payload = {
        model: model,
        messages: [
            { role: "system", content: operationPresets.benchmark.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: operationPresets.benchmark.temperature,
        max_tokens: 128
    };

    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.currentAbortController ? state.currentAbortController.signal : undefined
        });
        if (!res.ok) return "Previous context summary unavailable.";
        const data = await res.json();
        return cleanModelOutput(data.choices?.[0]?.message?.content || "Context segment.");
    } catch (e) { return "Context summary."; }
}

/**
 * Translates a text chunk or chunk with prior history context using configured system parameters and handles retry logic[cite: 7].
 * Called by: benchmark.js and translator.js[cite: 7]
 */
export async function translateChunkWithContext(host, model, targetLang, chunkText, previousContext, presetType = 'main') {
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

        let promptText = `Task: Translate the Japanese visual novel text block into fluent ${targetLang}.\n` +
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
        // Detect leftover romaji fragments (common untranslated jp words) that signal the jp->en prompt didn't fully translate.
        const romajiFragments = /\b(nani|boku|ore|watashi|konnichiwa|sugoi|kawaii|baka|senpai|sensei|sayonara|arigatou|doko|dare|naze|shinjirarenai|yatta|ganbatte)\b/i.test(cleanedResult);
        console.log(`[Trace:Translate:Detect] hasJapanese=${hasJapanese}, romajiFragments=${romajiFragments}, contextLines=${currentContext.length}`);
        if (hasJapanese) console.warn(`[Trace:Translate:Detect] Japanese characters still present in output -> will retry.`);
        if (romajiFragments) console.warn(`[Trace:Translate:Detect] Romaji fragment detected in output -> jp->en prompt may not have fully translated.`);

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
        if (hasOldContext) console.warn(`[Trace:Translate:Detect] Context leak detected -> output contains a prior context line: "${leakedContextLine.substring(0, 60)}..."`);

        if (!hasJapanese && !hasOldContext && !romajiFragments) {
            console.log(`[Trace:Translate:Pass] Output passed all checks (no Japanese, no romaji, no context leak). Accepting translation.`);
            return cleanedResult; 
        }
        console.log(`[Trace:Translate:Retry] Output failed checks (hasJapanese=${hasJapanese}, hasOldContext=${hasOldContext}, romajiFragments=${romajiFragments}). Dropping oldest context and retrying.`);
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
    const targetLang = document.getElementById("targetLanguage").value;
    const maxContextLines = parseInt(document.getElementById("contextLinesCount").value) || 6;
    const rawLimitThreshold = parseInt(document.getElementById("rawContextLimit").value) || 2;

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
    let milestoneSummaries = [];

    async function flushBuffer() {
        if (dialogueBuffer.length === 0) return;

        let combinedText = dialogueBuffer.map(item => item.text).join(" ");
        let formattedContextForPrompt = [];

        // history stores ALL confirmed translated dialogue (never truncated).
        // The raw tail (most recent rawLimitThreshold lines) feeds raw into the prompt;
        // older confirmed lines beyond the raw tail get summarized into milestones.
        const rawTail = history.slice(Math.max(0, history.length - rawLimitThreshold));
        const olderConfirmed = history.slice(0, Math.max(0, history.length - rawLimitThreshold));

        // Summarize older confirmed lines when they exceed the context limit.
        if (olderConfirmed.length > maxContextLines) {
            const linesToSnapshot = olderConfirmed.slice(0, olderConfirmed.length - maxContextLines);
            let newMilestone = await summarizeOldContext(host, model, targetLang, linesToSnapshot);
            milestoneSummaries.push(newMilestone);
        }

        if (milestoneSummaries.length > 0) formattedContextForPrompt.push(`[Story Milestones:\n` + milestoneSummaries.join("\n") + `\n]`);
        // Feed the raw tail (recent confirmed dialogue) directly.
        formattedContextForPrompt.push(...rawTail);

        let sliceStart = Math.max(0, formattedContextForPrompt.length - maxContextLines);
        let currentContextSlice = maxContextLines > 0 ? formattedContextForPrompt.slice(sliceStart) : [];

        let activePresetKey = (targetLang.toLowerCase() === 'english') ? 'jpEn' : 'main';
        let translatedCombined = await translateChunkWithContext(host, model, targetLang, combinedText, currentContextSlice, activePresetKey);

        if (state.manualStepByStepMode) {
            translatedLines[dialogueBuffer[0].index] = translatedCombined;
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");

            let stepResult, keepTranslatingStep = true;
            
            while (keepTranslatingStep) {
                stepResult = await promptUserForManualStep(combinedText, currentContextSlice, history, milestoneSummaries, maxContextLines);
                if (stepResult.action === "retranslate") {
                    // newContextCount = step context lines; rawLimit caps how many raw history lines feed the window.
                    const stepRawLimit = stepResult.rawLimit ?? stepResult.newContextCount;
                    let updatedContextWindow = (maxContextLines > 0 && stepResult.newContextCount > 0)
                        ? history.slice(Math.max(0, history.length - stepRawLimit), history.length - Math.max(0, history.length - stepResult.newContextCount))
                        : (maxContextLines > 0 ? history.slice(Math.max(0, history.length - stepResult.newContextCount)) : []);
                    console.log(`[Trace:Translation] Re-translate step: contextLines=${stepResult.newContextCount}, rawLimit=${stepRawLimit}, windowSize=${updatedContextWindow.length}`);
                    translatedCombined = await translateChunkWithContext(host, model, targetLang, combinedText, updatedContextWindow, 'retry');
                    translatedLines[dialogueBuffer[0].index] = translatedCombined;
                    outputRight.value = translatedLines.filter(l => l !== "").join("\n");
                } else {
                    let finalManualText = outputRight.value.split("\n")[dialogueBuffer[0].index] || translatedCombined;
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
        console.log(`[Trace:Translation] Starting loop: ${effectiveLimit}/${totalLines} lines, preset=${(targetLang.toLowerCase() === 'english') ? 'jpEn' : 'main'}, mode=${state.stylizationMode}, manualStep=${state.manualStepByStepMode}`);

        for (let idx = 0; idx < effectiveLimit; idx++) {
            if (state.currentAbortController.signal.aborted) throw new Error("Translation cancelled by user.");

            let line = lines[idx];
            let trimmedLine = line.trim();

            if (loadingStatus) loadingStatus.innerHTML = `Translating line ${idx + 1} of ${effectiveLimit}...`;
            setCurrentSourceLine(trimmedLine);

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
                        let namePrompt = `Transliterate this character name into ${targetLang}. Return strictly the clean name text only:\n${cleanName}`;
                        let aiTranslatedName = await translateChunkWithContext(host, model, targetLang, namePrompt, [], 'namePlate');
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