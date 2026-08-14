import { state } from './main.js';
import { extractScriptText } from './parser.js';
import { translateChunkWithContext, operationPresets } from './translator.js';

/**
 * Runs a multi-dimensional parameter sweep matrix to audit translation inconsistency by testing different context lines and raw limits, then logs the evaluation feedback and scores.
 * Called by: main.js[cite: 7]
 */
export async function runParameterSweepBenchmark() {
    const host = document.getElementById("aiServerHost").value.trim().replace(/\/+$/, "");
    const model = document.getElementById("aiModel").value;
    const targetLang = document.getElementById("targetLanguage").value;
    const sourceText = document.getElementById("outputAreaLeft").value;

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
    let lines = sourceText.split("\n").slice(0, 15);
    let resultsLog = "";

    for (let cLine of contextValues) {
        for (let rLimit of rawLimitValues) {
            console.log(`[Benchmark Run] Evaluating config -> Context Lines: ${cLine}, Raw Limit: ${rLimit}`);
            reportBox.value += `\nTesting Configuration -> Context: ${cLine}, Raw Limit: ${rLimit}...`;

            let translatedLines = [];
            let history = [];

            for (let line of lines) {
                let trimmed = line.trim();
                if (trimmed.startsWith("<") || trimmed === "") {
                    translatedLines.push(line);
                } else {
                    let res = await translateChunkWithContext(host, model, targetLang, trimmed, history.slice(-cLine));
                    history.push(res);
                    translatedLines.push(res);
                }
            }

            let candidateOutput = translatedLines.join("\n");
            let scoreData = await gradeCandidateAgent(host, model, candidateOutput, referenceStandard);
            console.log(`[Benchmark Result] Context: ${cLine}, Raw Limit: ${rLimit} | Score: ${scoreData.overallScore}/100`, scoreData);

            resultsLog += `--------------------------------------------------\n`;
            resultsLog += `[Config] Context Lines: ${cLine} | Raw Limit: ${rLimit}\n`;
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
 * Called by: benchmark.js (runParameterSweepBenchmark)[cite: 7]
 */
async function gradeCandidateAgent(host, model, candidateText, referenceText) {
    let promptText = `You are a strict, objective translation evaluation auditor. Your task is to grade the candidate translation against the reference text or source standards on a strict scale from 1 to 100 (where 100 is flawless and 0 is complete failure).\n\n` +
    `Evaluate specifically across these criteria:\n` +
    `- Pronoun and gender consistency\n` +
    `- Semantic fidelity and accurate nuance\n` +
    `- Conversational flow and natural script pacing\n\n` +
    `[Reference Standard]:\n${referenceText || "N/A (Judge based on general coherence, grammar, and natural dialogue flow)"}\n\n` +
    `[Candidate Translation Output]:\n${candidateText}\n\n` +
    `INSTRUCTIONS:\n` +
    `1. Provide numerical grades (0-100) for each category.\n` +
    `2. Output your response using ONLY the exact label lines below. Do not add markdown boxes, code fences, or extra commentary outside of them.\n\n` +
    `Overall Score: [0-100]\n` +
    `Gender Score: [0-100]\n` +
    `Semantic Score: [0-100]\n` +
    `Flow Score: [0-100]\n` +
    `Feedback: [Provide a concise 1-2 sentence justification for your grading decisions]`;

    const benchmarkConfig = operationPresets.benchmark;
    const payload = {
        model: model,
        messages: [
            { role: "system", content: benchmarkConfig.systemPrompt },
            { role: "user", content: promptText }
        ],
        stream: false,
        temperature: benchmarkConfig.temperature ?? 0.0,
        max_tokens: 300,
        chat_template_kwargs: { "enable_thinking": false }
    };

    try {
        const res = await fetch(`${host}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error("[Agent Evaluation HTTP Error]", res.status);
            return { overallScore: 0, genderScore: 0, semanticScore: 0, flowScore: 0, feedback: `HTTP ${res.status} Error` };
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