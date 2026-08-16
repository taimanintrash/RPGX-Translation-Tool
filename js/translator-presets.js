// translator-presets.js
// Operation preset definitions and the default-preset JSON loaders.
// Split out of translator.js so the preset/manifest concern is isolated from the
// translation pipeline and the LLM HTTP helpers. translator.js re-exports every
// symbol here so existing imports from ./translator.js (main.js, benchmark.js,
// ui.js) keep resolving unchanged.

import { showError } from './ui.js';

// Dictionary mapping distinct presets to individual operation parameters
export const operationPresets = {
    main: { temperature: 0.3, systemPrompt: "You are a professional video game localization AI. Translate cleanly and accurately." },
    benchmark: { temperature: 0.1, systemPrompt: "You are an expert AI quality assurance auditor reviewing script translation consistency." },
    jpEn: { temperature: 0.35, systemPrompt: "You are a specialized Japanese-to-English game localizer adapting natural nuance and character voice." },
    retry: { temperature: 0.2, systemPrompt: "The previous translation attempt failed validation. Carefully re-translate keeping tags and markers exact." },
    namePlate: { temperature: 0.1, systemPrompt: "You are a specialized proper noun and character name localization engine. Output transliterated name cleanly." },
    stylization: { temperature: 0.2, systemPrompt: "You are a specialized stylization mapper. Analyze the provided game script and generate a JSON mapping of character names and unique speech patterns to standardized stylization keys." },
    stylizationPunctuation: { temperature: 0.0, systemPrompt: "You are a Japanese punctuation normalization engine. Map Japanese punctuation marks and multi-character punctuation sequences to their English equivalents. Output only valid JSON pairs. Include both single characters and multi-character sequences like ellipses and dash repeats." },
    stylizationSounds: { temperature: 0.2, systemPrompt: "You are a Japanese onomatopoeia and sound effect translator for visual novel localization. Map Japanese sound effects and onomatopoeia to natural English equivalents. Each pattern must be 3 or more kana. Never output single kana, grammar particles, or dialogue." },
    stylizationTicks: { temperature: 0.2, systemPrompt: "You are a Japanese speech stutter and tick normalization engine for visual novel localization. Map repeated-kana stutters, gemination ticks, and character speech patterns to their English equivalents. Patterns must be repeated kana clusters or tick+punctuation combos. Translate ticks to English, never remove them (no empty replacements unless the pattern is pure gemination punctuation)." },
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
    { file: 'default_presets/stylization_punctuation.json', operationKey: 'stylizationPunctuation', label: 'Stylization Punctuation' },
    { file: 'default_presets/stylization_sounds.json', operationKey: 'stylizationSounds', label: 'Stylization Sounds' },
    { file: 'default_presets/stylization_ticks.json', operationKey: 'stylizationTicks', label: 'Stylization Ticks' },
    { file: 'default_presets/recent_summary.json', operationKey: 'recentSummary', label: 'Recent Scene Summary' },
    { file: 'default_presets/archival_summary.json', operationKey: 'archivalSummary', label: 'Archival Story State' },
    { file: 'default_presets/translation_validator.json', operationKey: 'validator', label: 'Translation Validator' }
];

/**
 * Maps a parsed preset JSON object onto an operation-specific configuration object,
 * logging (not error-bannering) the result. Used by the silent default-preset loader path
 * so startup does not spam the error banner for every loaded default.
 * Called by: translator-presets.js (loadAllDefaultPresets)
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

/**
 * Maps a parsed preset JSON object onto an operation-specific configuration object,
 * then surfaces a success banner. Used by the interactive (file-upload) preset path.
 * Called by: translator-presets.js (loadSpecificPreset, loadDefaultPreset)
 */
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
 * Loads and maps preset configurations from an uploaded JSON file for a specified operation type.
 * Called by: main.js (window.loadSpecificPreset wiring for HTML file-upload onchange handlers)
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
 * Called by: main.js (window.loadDefaultPreset wiring for HTML default-preset buttons)
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
 * Called by: main.js (DOMContentLoaded init)
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
