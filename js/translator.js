import { state } from './main.js';
import { showError, clearError, promptUserForNameTranslation, promptUserForManualStep, renderDiscoveredMappingsUI } from './ui.js';
import { commitTextToRightFile } from './parser.js';

// Dictionary mapping distinct presets to individual operation parameters
export const operationPresets = {
    main: { temperature: 0.3, systemPrompt: "You are a professional video game localization AI. Translate cleanly and accurately." },
    benchmark: { temperature: 0.1, systemPrompt: "You are an expert AI quality assurance auditor reviewing script translation consistency." },
    jpEn: { temperature: 0.35, systemPrompt: "You are a specialized Japanese-to-English game localizer adapting natural nuance and character voice." },
    retry: { temperature: 0.2, systemPrompt: "The previous translation attempt failed validation. Carefully re-translate keeping tags and markers exact." },
    namePlate: { temperature: 0.1, systemPrompt: "You are a specialized proper noun and character name localization engine. Output transliterated name cleanly." }
};

/**
 * Loads and maps preset configurations from an uploaded JSON file for a specified operation type[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export function loadSpecificPreset(operationKey, event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const presetJson = JSON.parse(e.target.result);
            
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
            showError(`Preset for [${operationKey.toUpperCase()}] successfully loaded from "${presetJson.name || file.name}"!`);
        } catch (err) {
            showError("Failed to parse preset JSON file.");
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = "";
}

/**
 * Queries available local AI Server model endpoints and populates the model selection dropdown list[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function fetchAiModels() {
    clearError();
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const modelSelect = document.getElementById("aiModel");
    const currentSelection = modelSelect.value;
    const endpoints = [`${host}/v1/models`, `${host}/api/v0/models`];
    let modelsList = [], success = false;

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) { modelsList = data; success = true; break; }
                else if (data.data && Array.isArray(data.data)) { modelsList = data.data; success = true; break; }
                else if (data.models && Array.isArray(data.models)) { modelsList = data.models; success = true; break; }
            }
        } catch (err) {}
    }

    modelSelect.innerHTML = "";
    if (!success || modelsList.length === 0) {
        modelSelect.innerHTML = `<option value="">-- Connection Failed / Check Server --</option>`;
        showError("Could not fetch models. Verify server is running.");
        return;
    }

    modelsList.forEach(m => {
        const modelId = m.id || m.name || m.model;
        if (modelId) {
            const opt = document.createElement("option");
            opt.value = modelId;
            opt.textContent = modelId;
            modelSelect.appendChild(opt);
        }
    });

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
    if (/^<[A-Z_]+>/.test(chunkText.trim()) && !chunkText.includes('"')) {
        return chunkText;
    }

    let sanitized = chunkText.replace(/<[^>]+>/g, "").trim();
    if (!sanitized) return chunkText;

    let maxRetries = 5;
    let attempts = 0;
    let currentContext = [...previousContext];
    let activePresetConfig = operationPresets[presetType] || operationPresets.main;

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

        if (isFallbackRun) {
            return `[MANUAL_OVERRIDE_NEEDED] ${cleanedResult}`;
        }

        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanedResult);
        let hasOldContext = false;
        
        for (let ctxLine of currentContext) {
            let cleanCtx = ctxLine.trim();
            if (cleanCtx.length > 15) {
                let sampleSize = Math.min(cleanCtx.length, 25);
                let contextSnippet = cleanCtx.substring(0, sampleSize);
                if (cleanedResult.includes(contextSnippet) || cleanedResult.includes(cleanCtx)) {
                    hasOldContext = true;
                    break;
                }
            }
        }

        if (!hasJapanese && !hasOldContext) return cleanedResult; 
        if (currentContext.length > 0) currentContext.shift();
    }
}

/**
 * Analyzes source text blocks to discover character stutters, ticks, and punctuation anomalies, formatting them into a stylization mapping list[cite: 7].
 * Called by: HTML event handler / main.js[cite: 7]
 */
export async function generateStylizationMapWithAI() {
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

            const payload = {
                model: model,
                messages: [
                    { role: "system", content: operationPresets.benchmark.systemPrompt },
                    { role: "user", content: promptText }
                ],
                stream: false,
                temperature: 0.0,
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

    if (!model) { showError("No model selected."); return; }
    if (!selectElement.value || selectRight.value === "") { showError("Please select a script ID and target file."); return; }

    let key = selectElement.value.replace(/^[🟢❌]\s*/, "").split(" ")[0];
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
    let recentContextHistory = [];
    let milestoneSummaries = [];

    async function flushBuffer() {
        if (dialogueBuffer.length === 0) return;

        let combinedText = dialogueBuffer.map(item => item.text).join(" ");
        let formattedContextForPrompt = [];

        if (recentContextHistory.length > rawLimitThreshold) {
            let linesToSnapshot = recentContextHistory.slice(0, recentContextHistory.length - rawLimitThreshold);
            let activeRawLines = recentContextHistory.slice(recentContextHistory.length - rawLimitThreshold);
            let newMilestone = await summarizeOldContext(host, model, targetLang, linesToSnapshot);
            milestoneSummaries.push(newMilestone);
            recentContextHistory = activeRawLines;
        }

        if (milestoneSummaries.length > 0) formattedContextForPrompt.push(`[Story Milestones:\n` + milestoneSummaries.join("\n") + `\n]`);
        formattedContextForPrompt.push(...recentContextHistory);

        let sliceStart = Math.max(0, formattedContextForPrompt.length - maxContextLines);
        let currentContextSlice = maxContextLines > 0 ? formattedContextForPrompt.slice(sliceStart) : [];

        let activePresetKey = (targetLang.toLowerCase() === 'english') ? 'jpEn' : 'main';
        let translatedCombined = await translateChunkWithContext(host, model, targetLang, combinedText, currentContextSlice, activePresetKey);

        if (state.manualStepByStepMode) {
            translatedLines[dialogueBuffer[0].index] = translatedCombined;
            outputRight.value = translatedLines.filter(l => l !== "").join("\n");

            let stepResult, keepTranslatingStep = true;
            
            while (keepTranslatingStep) {
                stepResult = await promptUserForManualStep(combinedText, currentContextSlice);
                if (stepResult.action === "retranslate") {
                    let updatedContextWindow = maxContextLines > 0 ? recentContextHistory.slice(Math.max(0, recentContextHistory.length - stepResult.newContextCount)) : [];
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

        recentContextHistory.push(translatedCombined);
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

        for (let idx = 0; idx < effectiveLimit; idx++) {
            if (state.currentAbortController.signal.aborted) throw new Error("Translation cancelled by user.");

            let line = lines[idx];
            let trimmedLine = line.trim();

            if (loadingStatus) loadingStatus.innerHTML = `Translating line ${idx + 1} of ${effectiveLimit}...`;

            if (trimmedLine.startsWith("<NAME_PLATE>")) {
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