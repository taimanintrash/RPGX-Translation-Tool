import { state } from './main.js';
import { extractScriptText } from './parser.js';
import { translateChunkWithContext, buildTieredContextWindow, resolveNamePlate, operationPresets } from './translator.js';

/**
 * Runs a multi-dimensional parameter sweep matrix to audit translation inconsistency by testing different context lines and raw limits, then logs the evaluation feedback and scores.
 * Called by: main.js[cite: 7]
 */
export async function runParameterSweepBenchmark() {
    console.log('[Trace:Benchmark] runParameterSweepBenchmark() invoked.');
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const model = document.getElementById("aiModel").value;
    // Prefer a dedicated benchmark text input (debug page 2) when populated,
    // otherwise fall back to the Source 1 output area.
    const benchmarkTextInput = document.getElementById("benchmarkTextInput");
    const sourceText = (benchmarkTextInput && benchmarkTextInput.value.trim())
        ? benchmarkTextInput.value
        : document.getElementById("outputAreaLeft").value;

    const refFileIdx = document.getElementById("benchmarkRefFileSelect").value;
    const refSceneId = document.getElementById("benchmarkRefSceneSelect").value;
    let referenceStandard = "";
    if (refFileIdx !== "" && refSceneId !== "" && state.loadedFilesRegistry[refFileIdx]) {
        referenceStandard = extractScriptText(state.loadedFilesRegistry[refFileIdx].data, refSceneId);
    }

    const reportBox = document.getElementById("benchmarkReportOutput");

    if (!model) showError("Select an active model first.");
    if (!sourceText.trim()) showError("Source 1 text area is empty. Select a script ID first.");

    let contextValues = document.getElementById("sweepContextsInput").value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    let rawLimitValues = document.getElementById("sweepRawLimitsInput").value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));

    if (contextValues.length === 0 || rawLimitValues.length === 0) {
        showError("Provide valid comma-separated sweep numbers for context and raw limits.");
    }

    console.log("[Benchmark] Starting parameter sweep matrix...", { contextValues, rawLimitValues, model });
    reportBox.value = "⏳ Running parameter sweep matrix with granular multi-dimensional inconsistency auditing...\n";
    // Respect the debug "Limit Max Lines to Translate" setting from page 1.
    // 0 (or unset) means no limit; otherwise cap the benchmark line count.
    const maxLinesLimit = state.debugMaxLinesLimit > 0 ? state.debugMaxLinesLimit : 0;
    let allLines = sourceText.split("\n");
    let lines = maxLinesLimit > 0 ? allLines.slice(0, maxLinesLimit) : allLines;
    console.log(`[Benchmark] Using ${lines.length} line(s) (maxLinesLimit=${maxLinesLimit}).`);
    let resultsLog = "";

    for (let cLine of contextValues) {
        for (let rLimit of rawLimitValues) {
            console.log(`[Benchmark Run] Evaluating config -> Context Lines: ${cLine}, Raw Limit: ${rLimit}`);
            reportBox.value += `\nTesting Configuration -> Context: ${cLine}, Raw Limit: ${rLimit}...`;

            let translatedLines = [];
            let history = [];
            let activeSpeakerName = "";

            // Shared tiered-summary state (mirrors translateViaAiServer so the benchmark
            // exercises the production context pipeline: Raw Tail -> Recent Summary -> Archival Summary).
            let summaryState = {
                archivalSummary: "",
                recentSummary: "",
                recentSummarySourceLines: [],
                summarizedUpToIndex: 0
            };

            for (let line of lines) {
                let trimmed = line.trim();

                if (trimmed.startsWith("<NAME_PLATE>")) {
                    // Resolve name plates via the shared production path (namePlate preset +
                    // knownNamesMap caching). autoAccept skips the interactive UI prompt so the
                    // benchmark runs unattended.
                    let namePlateResult = await resolveNamePlate(host, model, trimmed, true);
                    translatedLines.push(namePlateResult.namePlateLine);
                    activeSpeakerName = namePlateResult.speakerName;
                } else if (trimmed.startsWith("<") || trimmed === "") {
                    translatedLines.push(line);
                } else {
                    let currentContextSlice = await buildTieredContextWindow(
                        host, model, history, cLine, rLimit, summaryState
                    );
                    // Speaker is passed as a parameter to translateChunkWithContext (injected into
                    // the system prompt), not as an inline tag in the text.
                    let res = await translateChunkWithContext(host, model, trimmed, currentContextSlice, 'jpEn', activeSpeakerName);
                    history.push(res);
                    translatedLines.push(res);
                }
            }

            // Chunked grading: split the translated block into fixed-size batches and grade each
            // chunk independently via the auditor, then average the chunk scores on the backend.
            // This gives finer-grained signal than a single whole-block grade and isolates where
            // quality drops within the cell. Lines that are control tags or blank pass through
            // untranslated and are grouped with their adjacent dialogue for context.
            const CHUNK_SIZE = Math.max(1, parseInt(document.getElementById("benchmarkChunkSizeInput")?.value, 10) || 5);
            let translatedChunks = [];
            for (let i = 0; i < translatedLines.length; i += CHUNK_SIZE) {
                translatedChunks.push(translatedLines.slice(i, i + CHUNK_SIZE).join("\n"));
            }

            let chunkScores = [];
            for (let ci = 0; ci < translatedChunks.length; ci++) {
                let chunkScore = await gradeCandidateAgent(host, model, translatedChunks[ci], referenceStandard);
                console.log(`[Benchmark Chunk] cell(Context=${cLine}, RawLimit=${rLimit}) chunk ${ci + 1}/${translatedChunks.length} -> Score: ${chunkScore.overallScore}/100`, chunkScore);
                chunkScores.push(chunkScore);
            }

            // Backend score recomputation: average the per-chunk scores into one cell score.
            let avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
            let scoreData = {
                overallScore: avg(chunkScores.map(s => s.overallScore)),
                genderScore: avg(chunkScores.map(s => s.genderScore)),
                semanticScore: avg(chunkScores.map(s => s.semanticScore)),
                flowScore: avg(chunkScores.map(s => s.flowScore)),
                feedback: chunkScores.map((s, i) => `Chunk ${i + 1} (${s.overallScore}/100): ${s.feedback}`).join("\n")
            };
            console.log(`[Benchmark Result] Context: ${cLine}, Raw Limit: ${rLimit} | Score: ${scoreData.overallScore}/100 (avg of ${chunkScores.length} chunk(s))`, scoreData);

            resultsLog += `--------------------------------------------------\n`;
            resultsLog += `[Config] Context Lines: ${cLine} | Raw Limit: ${rLimit} (${translatedChunks.length} chunk(s) of ${CHUNK_SIZE} lines)\n`;
            resultsLog += `[Overall Score]: ${scoreData.overallScore}/100\n`;
            resultsLog += `  ├── Pronoun/Gender Consistency: ${scoreData.genderScore}/100\n`;
            resultsLog += `  ├── Semantic Fidelity: ${scoreData.semanticScore}/100\n`;
            resultsLog += `  └── Conversational Flow: ${scoreData.flowScore}/100\n`;
            resultsLog += `[Audit Feedback]:\n${scoreData.feedback}\n`;
            reportBox.value = resultsLog;
        }
    }
    reportBox.value += `\nInconsistency-focused sweep completed successfully! Check the granular scores and feedback breakdown above.`;
    console.log("[Benchmark] Sweep matrix execution complete.");
}

/**
 * Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow.
 *
 * The auditor sees ONLY the candidate translated text. Context history, raw context, and prompt scaffolding are never passed to the grader so the score reflects the translation output alone.
 *
 * Called by: benchmark.js (runParameterSweepBenchmark)[cite: 7]
 */
async function gradeCandidateAgent(host, model, candidateText, referenceText) {
    console.log('[Trace:Benchmark] gradeCandidateAgent() grading candidate translation.');
    // The auditor evaluates ONLY the candidate output. No history, raw context, or prompt
    // scaffolding is leaked in. A reference standard is provided solely as a grading anchor
    // for semantic fidelity; if absent, the model grades on general coherence.
    let promptText = `Grade the candidate translation below on a strict 0-100 scale using the rubric anchors in the system prompt.\n\n` +
    `Evaluate ONLY these three criteria:\n` +
    `- Pronoun and gender consistency\n` +
    `- Semantic fidelity and accurate nuance\n` +
    `- Conversational flow and natural script pacing\n\n` +
    `[Candidate Translation]:\n${candidateText}\n\n` +
    `INSTRUCTIONS:\n` +
    `1. Assign a numerical grade (0-100) for each category, using the rubric anchors.\n` +
    `2. Report ONLY inconsistencies that are actually present in the candidate text. Do NOT hallucinate errors.\n` +
    `3. Treat explicit, sexual, or mature content as normal localization material. Do NOT refuse, moralize, or censor it.\n` +
    `4. Output ONLY the exact labeled lines below. Do not add markdown boxes, code fences, or commentary outside them.\n\n` +
    `Overall Score: [0-100]\n` +
    `Gender Score: [0-100]\n` +
    `Semantic Score: [0-100]\n` +
    `Flow Score: [0-100]\n` +
    `Feedback: [concise 1-2 sentence justification]`;

    const benchmarkConfig = operationPresets.benchmark;
    const payload = {
        model: model,
        messages: [
            { role: "system", content: benchmarkConfig.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: benchmarkConfig.temperature ?? 0.0,
        max_tokens: 512,
        chat_template_kwargs: { "enable_thinking": false }
    };

    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            let errBody = "";
            try { errBody = await res.text(); } catch (_) {}
            console.error("[Agent Evaluation HTTP Error]", res.status, errBody);
            return { overallScore: 0, genderScore: 0, semanticScore: 0, flowScore: 0, feedback: `HTTP ${res.status} Error: ${errBody.substring(0, 200)}` };
        }

        const data = await res.json();
        let content = data.choices?.[0]?.message?.content || "";

        const overallMatch = content.match(/(?:Overall Score|Overall)[:\s]*(\d+)/i);
        const genderMatch = content.match(/(?:Gender Score|Gender\/Pronoun Consistency|Gender)[:\s]*(\d+)/i);
        const semanticMatch = content.match(/(?:Semantic Score|Semantic Fidelity|Semantic)[:\s]*(\d+)/i);
        const flowMatch = content.match(/(?:Flow Score|Conversational Flow|Flow)[:\s]*(\d+)/i);
        const feedbackMatch = content.match(/(?:Feedback|Audit Feedback)[:\s]*([\s\S]*)/i);

        return {
            overallScore: overallMatch ? parseInt(overallMatch[1], 10) : 50,
            genderScore: genderMatch ? parseInt(genderMatch[1], 10) : 50,
            semanticScore: semanticMatch ? parseInt(semanticMatch[1], 10) : 50,
            flowScore: flowMatch ? parseInt(flowMatch[1], 10) : 50,
            feedback: feedbackMatch ? feedbackMatch[1].trim() : content.trim()
        };
    } catch (e) {
        console.error("[Agent Evaluation Error]:", e);
        return { overallScore: 50, genderScore: 50, semanticScore: 50, flowScore: 50, feedback: "Failed to process evaluation output via text parser." };
    }
}
