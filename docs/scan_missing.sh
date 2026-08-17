#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$SCRIPT_DIR/FUNCTION_MANIFEST.md"
JS_DIR="$SCRIPT_DIR/../js"
REPORT="$SCRIPT_DIR/missing_report.md"

if [ ! -f "$MANIFEST" ]; then
    echo "Error: Manifest file '$MANIFEST' not found!"
    exit 1
fi

if [ ! -d "$JS_DIR" ]; then
    echo "Error: JavaScript directory '$JS_DIR' does not exist!"
    exit 1
fi

echo "==> Generating Agent-actionable report at $REPORT..."

export MANIFEST_PATH="$MANIFEST"
export JS_DIR_PATH="$JS_DIR"

python3 << 'EOF' > "$REPORT"
import re, os, glob

manifest_path = os.environ.get("MANIFEST_PATH", "")
js_dir = os.environ.get("JS_DIR_PATH", "")

with open(manifest_path, "r", encoding="utf-8") as m:
    manifest_text = m.read()

# 1. Parse Manifest
manifest_data = {}
manifest_blocks = re.split(r"(?m)^###\s+", manifest_text)
for block in manifest_blocks[1:]:
    lines = block.strip().split("\n")
    first_line = lines[0].strip()
    
    match = re.match(r"([a-zA-Z0-9_$]+)\s*(?:—|-)\s*(.*)", first_line)
    if match:
        func_name = match.group(1)
        desc = match.group(2).strip()
        callers_str = ""
        caller_match = re.search(r"#### What function call it:\s*\n(.*?)(?=\n####|$)", block, re.DOTALL)
        if caller_match:
            callers_str = caller_match.group(1).replace("-", "").replace("\n", " ").strip()
            
        manifest_data[func_name] = {
            "desc": desc,
            "callers": callers_str
        }

# 2. Extract JS Functions
functions_info = {}
all_found_functions = set()
pattern = r"(/\*\*.*?\*/)?\s*(?:export\s+)?(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>)"

for file_path in glob.glob(os.path.join(js_dir, "**/*.js"), recursive=True):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        matches = list(re.finditer(pattern, content, re.DOTALL))
        for i, match in enumerate(matches):
            jsdoc = match.group(1)
            func_name = match.group(2) or match.group(3)
            if not func_name:
                continue
            # A `const NAME = ... =>` match is a real (module-scope) function only
            # when the `const`/`export const` begins at column 0 of its source line.
            # Indented const-arrow assignments are in-function local variables
            # (e.g. `const isNameEntry = (val) => ...`), not manifest-eligible
            # functions, so they are skipped to avoid false-positive "missing"
            # entries. The `function NAME(...)` branch is unaffected because
            # nested function declarations are still real functions.
            if match.group(3):
                line_start = content.rfind("\n", 0, match.start()) + 1
                if content[line_start:match.start()].startswith((" ", "\t")):
                    continue
            # The regex's non-greedy JSDoc capture can span multiple comment
            # blocks when a module-level doc (with its own /** */) sits ahead of
            # code and then this function's real JSDoc. Trim the capture to the
            # last single /** ... */ block so the description reflects this
            # function's own JSDoc, not a far-away module doc.
            if jsdoc and jsdoc.count("/**") > 1:
                last_open = jsdoc.rfind("/**")
                jsdoc = jsdoc[last_open:]
                
            start_idx = match.end()
            end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content)
            body = content[start_idx:end_idx]
            
            desc = ""
            stated_callers = ""
            if jsdoc:
                jsdoc_clean = jsdoc.replace("/**", "").replace("*/", "").strip()
                lines = [line.strip().lstrip("*").strip() for line in jsdoc_clean.split("\n")]
                desc_lines = []
                for line in lines:
                    if line.lower().startswith("called by:"):
                        stated_callers = re.sub(r"(?i)^called by:\s*", "", line).strip()
                    elif line:
                        desc_lines.append(line)
                desc = " ".join(desc_lines)
            
            functions_info[func_name] = {
                "file": os.path.basename(file_path),
                "desc": desc,
                "stated_callers": stated_callers,
                "body": body
            }
            all_found_functions.add(func_name)

# 3. Reverse Call Graph
actual_callers = {f: set() for f in all_found_functions}
actual_callees = {f: set() for f in all_found_functions}

for caller_name, info in functions_info.items():
    body = info["body"]
    for possible_callee in all_found_functions:
        if possible_callee == caller_name: continue
        if re.search(r"\b" + re.escape(possible_callee) + r"\s*\(", body):
            actual_callers[possible_callee].add(caller_name)
            actual_callees[caller_name].add(possible_callee)

# 4. Generate Agent-Ready Report
print("# Function Manifest Audit Report\n")
print("This report contains machine-parseable update directives for both source `.js` files and `FUNCTION_MANIFEST.md`.\n")
print("-" * 50 + "\n")

missing_count = 0
error_count = 0

def normalize_str(s):
    return re.sub(r"[\W_]+", "", s.lower())

for func_name, info in functions_info.items():
    desc = info["desc"]
    file_name = info["file"]
    is_in_manifest = func_name in manifest_data
    
    errors = []
    warnings = []
    
    if not desc:
        errors.append("No description detected in JSDoc.")
    if not info["stated_callers"]:
        errors.append("Missing 'Called by' in JSDoc.")
        
    if is_in_manifest:
        m_data = manifest_data[func_name]
        if normalize_str(desc) != normalize_str(m_data["desc"]):
            warnings.append(f"Description mismatch. JSDoc: '{desc}' vs Manifest: '{m_data['desc']}'")
    else:
        missing_count += 1
        errors.insert(0, "Missing from Manifest.")

    if errors or warnings or not is_in_manifest:
        status = "[MISSING]" if not is_in_manifest else "[ACTION REQUIRED]"
        print(f"### {status} {func_name}")
        print(f"- **Target File:** `js/{file_name}`")
        for err in errors:
            error_count += 1
            print(f"- **Error:** {err}")
        for warn in warnings:
            error_count += 1
            print(f"- **Warning:** {warn}")
        
        # Determine best available description & callers
        best_desc = desc or (manifest_data[func_name]["desc"] if is_in_manifest and manifest_data[func_name]["desc"] else "No description provided.")
        detected_callers = ", ".join(sorted(list(actual_callers[func_name]))) if actual_callers[func_name] else "(none)"
        callees_str = ", ".join(sorted(list(actual_callees[func_name]))) if actual_callees[func_name] else "(none)"
        
        print("\n**Suggested JSDoc Fix (for JS file):**")
        print("```javascript")
        print("/**")
        print(f" * {best_desc}")
        print(f" * Called by: {file_name} ({detected_callers})")
        print(" */")
        print("```")
        
        print("\n**Suggested Manifest Block (for FUNCTION_MANIFEST.md):**")
        print("```markdown")
        print(f"### {func_name} — {best_desc}")
        print("#### What function call it:")
        print(f"- {file_name} ({detected_callers})")
        print("#### What functions are used in it :")
        print(f"- {callees_str}")
        print("```")
        print("\n---\n")

print(f"**Scan Summary:** Found {missing_count} missing function(s) and {error_count} issue(s).")
EOF

echo "==> Report successfully written to $REPORT"