# Agent Context Handoff Manifest

Generated automatically via context manager.

## File: .github/copilot-instructions.md
```javascript
function in

function bodies

```

---

## File: .vscode/settings.json
```javascript
{
  "chat.maxTokens": 8192,
  "github.copilot.chat.instructions": [
    {
      "file": "./agent_handoff_prompt.md"
    },
    {
      "file": "./rate.txt"
    },
    {
      "file": "./agent_rate.txt"
    }
  ]
}
// ... [truncated for token budget safety]```

---

## File: README.txt
```javascript
# RPG Script & Scene Data Viewer, Editor & Translation Suite

A lightweight, single-file HTML5 web tool built for visual novel localizers, script editors, and AI translation researchers. It allows you to parse, compare, edit, and translate complex game script files locally using **LM Studio**.

---

## Key Features

* **Side-by-Side Dual-Pane Editor:** Load two script versions (e.g., original Japanese vs. translated English) to compare, edit, copy, and export files.
* **LM Studio Integration:** Leverages your local LLM server via OpenAI-compatible endpoints (http://127.0.0.1:1234).
* **Contextual Narrative Pipeline:**
  * **Sliding Context Window:** Keeps recent dialogue lines in memory to help the LLM maintain conversational context.
  * **Milestone Summarization:** Summarizes older context into short narrative milestones when line thresholds are exceeded.
  * **Interactive Name Plate Resolver:** Intercepts character names <NAME_PLATE> and prompts you for approved translations before continuing.
* **Stylization & Text Masking:**
  * Strips or delineates Japanese visual novel speech patterns (e.g., ！？, ――, stutters) so small LLMs aren't confused.
  * **AI Mapping Generator:** Automatically analyzes source scripts and suggests JSON key-value replacement rules.
* **Parameter Sweep & Benchmark Suite:**
  * Tests combinations of context lengths and raw limit thresholds.
  * Employs an AI grading agent to score candidate translations against a reference text for narrative flow, tone, and profanity fidelity.
* **Persistent Offline Caching:** Automatically caches loaded script files, UI selections, and settings in browser IndexedDB (ScriptParserCacheDB).

---

## Tool Dependencies & Requirements

No build tools, Node.js packages, or web servers are required to host the tool itself. It runs directly in any modern browser.

### 1. Client-Side Requirements
* **Browser:** Any modern web browser supporting ES6+, HTML5 IndexedDB, and Fetch API (e.g., Google Chrome, Brave, Micros
// ... [truncated for token budget safety]```

---

## File: agentContextManager.js
```javascript
function extractHybridSignatures

function scanDirectory

function generateHandoffPrompt

```

---

## File: agent_rate.txt
```javascript
Current Requests: 0
Estimated Tokens: ~0

// ... [truncated for token budget safety]```

---

## File: defalt_presets/benchmark_prompt.json
```javascript
{
  "name": "Benchmark Inconsistency Auditor",
  "temperature": 0.1,
  "maxTokens": 1024,
  "topP": 0.8,
  "repeatPenalty": 1.05,
  "systemPrompt": "You are an expert AI quality assurance auditor. Evaluate the translated script lines against the gold standard reference text. Provide a rigorous, granular multi-dimensional score checking semantic fidelity, tone shifts, and flow inconsistencies."
}
// ... [truncated for token budget safety]```

---

## File: defalt_presets/defalt_presets.json
```javascript
{
  "name": "Main Translation Engine",
  "temperature": 0.3,
  "maxTokens": 2048,
  "topP": 0.9,
  "repeatPenalty": 1.1,
  "systemPrompt": "You are a professional video game localization AI. Translate the provided Japanese script data cleanly and accurately into the target language, preserving original formatting, control tags, and variable placeholders."
}
// ... [truncated for token budget safety]```

---

## File: defalt_presets/japanese_to_english.json
```javascript
{
  "name": "Japanese to English Localization",
  "temperature": 0.35,
  "maxTokens": 2048,
  "topP": 0.9,
  "repeatPenalty": 1.1,
  "systemPrompt": "You are a specialized Japanese-to-English game localizer. Adapt natural phrasing, nuance, and character voice accurately while keeping technical script structure and line-by-line alignment intact."
}
// ... [truncated for token budget safety]```

---

## File: defalt_presets/name_plate_unique.json
```javascript
{
  "name": "Character Name Plate Translation",
  "temperature": 0.1,
  "maxTokens": 128,
  "topP": 0.8,
  "repeatPenalty": 1.0,
  "systemPrompt": "You are a specialized proper noun and character name localization engine. Translate or transliterate the given Japanese character name plate accurately and concisely into standard localized naming conventions."
}
// ... [truncated for token budget safety]```

---

## File: defalt_presets/qwen_stylization.json
```javascript
{
  "name": "Qwen2.5-3B-Instruct Stylization Mapper",
  "temperature": 0.2,
  "topP": 0.9,
  "repeatPenalty": 1.05,
  "systemPrompt": "You are a specialized stylization mapper. Analyze the provided game script and generate a JSON mapping of character names and unique speech patterns to standardized stylization keys. Keep the output strictly in valid JSON format: {\"source_pattern\": \"stylization_key\"}."
}

// ... [truncated for token budget safety]```

---

## File: defalt_presets/retry_translation.json
```javascript
{
  "name": "Retry Translation Recovery",
  "temperature": 0.2,
  "maxTokens": 2048,
  "topP": 0.85,
  "repeatPenalty": 1.15,
  "systemPrompt": "The previous translation attempt failed validation or formatting checks. Carefully re-translate the target segment, strictly ensuring that all brackets, control tags, and line markers match the source text without dropping or inventing content."
}
// ... [truncated for token budget safety]```

---

## File: index.html
```javascript
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="icon" href="data:,">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RPG Script & Scene Data Viewer & Editor (With Benchmark & Inconsistency Focus)</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <!-- Top control panel container handling file inputs and loader notifications -->
    <div class="top-panel">
        <div class="file-uploader-row">
            <label for="fileInput"><strong>Load JSON/JS Files:</strong></label>
            <input type="file" id="fileInput" accept=".js,.json" multiple onchange="loadFiles(event)">
            <div id="globalWarning" class="warning-box">⚠️ Warning: Less than 2 data files loaded!</div>
        </div>
        <div class="file-list-box" id="fileListBox">
            <em>No files loaded yet. Select multiple files above.</em>
        </div>
    </div>

    <!-- Master workspace container separating the sidebar navigation from editing panes -->
    <div class="container">
        <!-- Sidebar container managing loaded script IDs list selection -->
        <div class="sidebar">
            <h3>Script IDs</h3>
            <select id="scriptSelect" size="2" onchange="onSelectID()"></select>
        </div>

        <!-- Main workspace element housing comparison drop-downs and text editing components -->
        <div class="main-content">
            <!-- Comparison toolbar containing file selection controls and translation parameter setups -->
            <div class="compare-selectors">
                <label style="font-size: 13px; font-weight: bold;">Compare:</label>
                <select id="fileSelectLeft" onchange="onCompareSelectionChange()"></select>
                <span style="font-size: 13px; color: #64748b;">vs</span>
                <select id="fileSelectRight" onchange="onCompareSelectionChange()"></select>

                <div class="translate-config">
                    <
// ... [truncated for token budget safety]```

---

## File: js/benchmark.js
```javascript
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
    reportBox.value += `\n✨ Inconsistency-focused sweep completed successfully! Check the granular scores and feedback breakdown above.`;
    console.log("[Benchmark] Sweep matrix execution complete.");
}

/**
 * Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow.
 * Called by: benchmark.js (runParameterSweepBenchmark)[cite: 7]
 */
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
    reportBox.value += `\n✨ Inconsistency-focused sweep completed successfully! Check the granular scores and feedback breakdown above.`;
    console.log("[Benchmark] Sweep matrix execution complete.");
}

/**
 * Acts as an evaluation grading engine that prompts an AI model to score a candidate translation against a reference standard across gender consistency, semantic fidelity, and conversational flow.
 * Called by: benchmark.js (runParameterSweepBenchmark)[cite: 7]
 */
async function gradeCandidateAgent

```

---

## File: js/database.js
```javascript
function openDatabase

onupgradeneeded = (event) =>

onsuccess = (event) =>

onerror = (event) =>

async function saveFilesToCache

async function loadFilesFromCache

onsuccess = () =>

onerror = () =>

interface options

async function saveUIStateToCache

interface state

async function loadUIStateFromCache

onsuccess = () =>

onerror = () =>

```

---

## File: js/main.js
```javascript
export const state = {
    loadedFilesRegistry: [],
    currentDebugPage: 1,
    currentAbortController: null,
    debugMaxLinesLimit: 0,
    autoSkipNameModal: false,
    stylizationMode: "strip",
    pendingDiscoveredMappings: [],
    manualStepByStepMode: false,
    manualStepResolver: null,
    heavyStylizationMap: {
        "、": "",
        "！？": "!",
        "ッ！？": "!",
        "ッ！": "!",
        "――": "—",
        "ああぁ-ッ": "あー",
        "ビリビリィィ-ッ": "ビリビーッ"
    },
    activePreset: {
        temperature: 0.1,
        systemPrompt: "You are a precise game script translator with strict focus on semantic fidelity, tone consistency, and correct pronoun assignment. Output only the translation string.",
        stopStrings: ["Target text:", "Context history:", "Task:", "Translation:", "</current_input>"],
        topK: 40,
        topP: 1.0,
        repeatPenalty: 1.0
    }
};

import { loadFilesFromCache, loadUIStateFromCache } from './database.js';
import { initDraggableModal } from './ui.js';
import { refreshApplicationState, renderComparisonViews } from './parser.js';
import { loadFiles, removeFile, onSelectID, onCompareSelectionChange, saveEditsToMemory, injectTranslationToRight, downloadFile, updateBenchmarkSceneDropdown } from './parser.js';
import { fetchAiModels, translateViaAiServer, stopTranslation, generateStylizationMapWithAI } from './translator.js';
import { openDebugMenu, switchDebugPage, closeDebugMenu, closeDebugMenuWithoutSaving, saveStylizationMapFromView, commitApprovedMappingsToMap, deleteSelectedDiscoveredMappings, copyStylizationMapToClipboard, toggleDiscoveredSelection, setAllDiscoveredSelection, updateDiscoveredKey, updateDiscoveredVal, resolveNameModal, closeNameModal, resolveManualStepContinue, triggerStepRetranslation } from './ui.js';
import { runParameterSweepBenchmark } from './benchmark.js';

document.addEventListener('DOMContentLoaded', async () => {
    const cachedFiles = await loadFilesFromCache();
    if (cachedFiles && cachedFi
// ... [truncated for token budget safety]```

---

## File: js/parser.js
```javascript
function loadFiles

function checkFinishedReads

function removeFile

function parseContentToJSON

interface elements

function refreshApplicationState

function updateFileListUI

function updateFileDropdowns

function updateBenchmarkFileDropdown

function updateBenchmarkSceneDropdown

function updateMasterIDList

function onSelectID

function onCompareSelectionChange

function renderComparisonViews

function extractScriptText

function saveEditsToMemory

function commitTextToRightFile

function injectTranslationToRight

function downloadFile

```

---

## File: js/translator.js
```javascript
function loadSpecificPreset

async function fetchAiModels

function wrapTextToLines

function cleanModelOutput

async function summarizeOldContext

async function translateChunkWithContext

async function generateStylizationMapWithAI

function stopTranslation

async function translateViaAiServer

async function flushBuffer

```

---

## File: js/ui.js
```javascript
function initDraggableModal

function onMouseMove

function onMouseUp

function showError

function clearError

function openDebugMenu

function switchDebugPage

function updateDebugPageDisplay

function closeDebugMenu

function closeDebugMenuWithoutSaving

function saveStylizationMapFromView

function renderDiscoveredMappingsUI

function toggleDiscoveredSelection

function setAllDiscoveredSelection

function updateDiscoveredKey

function updateDiscoveredVal

function commitApprovedMappingsToMap

function deleteSelectedDiscoveredMappings

async function copyStylizationMapToClipboard

function promptUserForNameTranslation

activeNameResolver = (userConfirmedValue) =>

function resolveNameModal

function closeNameModal

function promptUserForManualStep

manualStepResolver = (action, newContextCount) =>

function resolveManualStepContinue

async function triggerStepRetranslation

```

---

## File: js_doc.txt
```javascript
interface options

interface state

interface elements

```

---

## File: rate.txt
```javascript
[System & Agent Metrics]
Rolling RPM: 0 / 15
Rolling TPM: 0 / 250000
Rolling RPD: 38 / 500

// ... [truncated for token budget safety]```

---

## File: styles.css
```javascript
/* @component ui-theme-root: Defines the global base styles, typography, flex container flow, and light background palette for the application body */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    display: flex;
    flex-direction: column;
    height: 92vh;
    gap: 12px;
    background-color: #f4f4f9;
}

/* @component top-panel-wrapper: Encloses the multi-file JSON/JS uploader and global warning status indicators */
.top-panel {
    background: white;
    padding: 12px 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* @component file-uploader-layout: Manages file input rows and dynamic loading controllers */
.file-uploader-row {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
}

/* @component file-list-box: Container tracking active uploaded file chips and status labels */
.file-list-box {
    font-size: 13px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 6px 10px;
    border-radius: 4px;
    color: #334155;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

/* @component file-tag-pill: Individual pill element showing loaded file names and removal actions */
.file-tag {
    background: #e2e8f0;
    padding: 3px 8px;
    border-radius: 4px;
    font-family: monospace;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.file-tag .remove-btn {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    padding: 0;
    line-height: 1;
}

.file-tag .remove-btn:hover { color: #dc2626; }

/* @component layout-container-core: Master split-pane wrapper holding the sidebar and main workspace editor */
.container {
    display: flex;
    flex: 1;
    gap: 15px;
    overflow: hidden;
}

/* @component sidebar-panel: Left column container housing script ID navigation lists */
.sidebar {
// ... [truncated for token budget safety]```

---

