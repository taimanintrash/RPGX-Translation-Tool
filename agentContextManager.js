const fs = require('fs');
const path = require('path');

// --- Configuration ---
const CONFIG = {
    outputFile: 'agent_handoff_prompt.md',
    validExtensions: ['.js', '.html', '.css', '.txt', '.json', '.env', '.md'],
    ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', 'logs'],
    ignoreFiles: [
        'agent_handoff_prompt.md',
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.env',
        '.env.local',
        '.DS_Store'
    ],
    // 2000 characters roughly equals a 500-token ceiling per file
    maxTokensPerFile: 2000
};

// --- Hybrid Signature Extractor ---
function extractHybridSignatures(fileContent) {
    const lines = fileContent.split('\n');
    const signatures = [];
    
    // Regex pattern targeting JS/TS functions, classes, and methods
    const pattern = /(\/\*\*[\s\S]*?\*\/)?\s*(?:async\s+)?(function\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+)\s*[:=]\s*(?:async\s+)?\(.*?\)\s*=>|(?:class|interface)\s+([a-zA-Z0-9_$]+))/g;
    
    let match;
    while ((match = pattern.exec(fileContent)) !== null) {
        // FIXED: Added fallback empty string for the ternary operator
        const commentBlock = match[1] ? match[1].trim() : "";
        const funcName = match[2] || match[4] || match[5] || "anonymous";
        
        signatures.push({
            name: funcName,
            docstring: commentBlock,
            snippet: match[0].trim()
        });
    }
    
    return signatures;
}

// --- Directory Scanner ---
function scanDirectory(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            if (!CONFIG.ignoreDirs.includes(file)) {
                scanDirectory(filePath, fileList);
            }
        } else {
            const ext = path.extname(file);
            if (CONFIG.validExtensions.includes(ext) && !CONFIG.ignoreFiles.includes(file)) {
                fileList.push(filePath);
            }
        }
    });
    
    return fileList;
}

// --- Main Builder ---
function generateHandoffPrompt() {
    console.log("Scanning project files...");
    const files = scanDirectory('.');
    let markdownOutput = `# Agent Context Handoff Manifest\n\nGenerated automatically via context manager.\n\n`;

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        markdownOutput += `## File: ${file}\n\`\`\`javascript\n`;
        
        const signatures = extractHybridSignatures(content);
        if (signatures.length > 0) {
            signatures.forEach(sig => {
                if (sig.docstring) markdownOutput += `${sig.docstring}\n`;
                markdownOutput += `${sig.snippet}\n\n`;
            });
        } else {
            // Fallback tier capped at ~500 tokens (2000 characters) for non-code files
            markdownOutput += content.slice(0, CONFIG.maxTokensPerFile) + "\n// ... [truncated for token budget safety]";
        }
        
        markdownOutput += `\`\`\`\n\n---\n\n`;
    });

    fs.writeFileSync(CONFIG.outputFile, markdownOutput);
    console.log(`Handoff prompt successfully compiled to ${CONFIG.outputFile} within token budget constraints.`);
}

generateHandoffPrompt();