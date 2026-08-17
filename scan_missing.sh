#!/usr/bin/env bash

MANIFEST="FUNCTION_MANIFEST.md"
JS_DIR="js"
DOCS_DIR="docs"
REPORT="$DOCS_DIR/missing_report.md"

if [ ! -f "$MANIFEST" ]; then
    echo "Error: Manifest file '$MANIFEST' not found!"
    exit 1
fi

if [ ! -d "$DOCS_DIR" ]; then
    echo "Error: Directory '$DOCS_DIR' does not exist!"
    exit 1
fi

echo "==> Scanning for functions and piping report to $REPORT..."

python3 -c '
import re, os, glob

manifest_path = "FUNCTION_MANIFEST.md"
js_dir = "js"

with open(manifest_path, "r", encoding="utf-8") as m:
    manifest_text = m.read()

func_def_pattern = r"(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{|(?:export\s+)?(?:async\s+)?const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>\s*\{"

all_functions = set()
file_contents = {}

for file_path in glob.glob(os.path.join(js_dir, "**/*.js"), recursive=True):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        file_contents[file_path] = content
        for match in re.finditer(func_def_pattern, content):
            name = match.group(1) or match.group(2)
            if name:
                all_functions.add(name)

print("# Function Manifest Audit Report\n")
print("--------------------------------------------------\n")

full_pattern = r"(/\*\*(.*?)\*/)?\s*(?:export\s+)?(?:async\s+)?(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)\s*\{([^}]*)\}"

missing_count = 0
error_count = 0

for file_path, content in file_contents.items():
    matches = re.finditer(full_pattern, content, re.DOTALL)
    for match in matches:
        jsdoc = match.group(2)
        func_name = match.group(3) or match.group(4)
        body = match.group(5)
        
        if not func_name:
            continue
            
        is_in_manifest = f"### {func_name} —" in manifest_text or f"### {func_name} " in manifest_text
        
        desc = ""
        callers = ""
        has_caller_line = False
        
        if jsdoc:
            lines = [line.strip().lstrip("*").strip() for line in jsdoc.split("\n")]
            desc_lines = []
            for line in lines:
                if line.startswith("Called by:"):
                    has_caller_line = True
                    callers = line.replace("Called by:", "").strip()
                elif line:
                    desc_lines.append(line)
            if desc_lines:
                desc = " ".join(desc_lines)
                
        has_desc = bool(desc and desc != "No description provided.")
        if not callers:
            callers = "(none)"

        has_no_description = not has_desc
        has_improper_callers = not has_caller_line or callers == "(none)"
        is_fully_valid = not has_no_description and not has_improper_callers
        
        if not is_in_manifest:
            missing_count += 1
            print(f"### [MISSING] {func_name}")
            print(f"- **File:** `{file_path}`")
            
            if has_no_description:
                error_count += 1
                print(f"- **Error 1:** No description detected in JSDoc.")
            if has_improper_callers:
                error_count += 1
                print(f"- **Error 2:** Improperly formatted or missing 'Called by:' line.")
            
            used_functions = []
            for other_func in all_functions:
                if other_func == func_name:
                    continue
                if re.search(r"\b" + re.escape(other_func) + r"\s*\(", body):
                    used_functions.append(other_func)
                    
            callees_str = ", ".join(sorted(list(set(used_functions)))) if used_functions else "(none)"
            final_desc = desc if has_desc else "No description provided."
            
            print(f"\n**Suggested Manifest Block:**")
            print(f"```markdown")
            print(f"### {func_name} — {final_desc}")
            print(f"#### What function call it:")
            print(f"- {callers}")
            print(f"#### What functions are used in it :")
            print(f"- {callees_str}")
            print(f"```\n---\n")
            
        elif not is_fully_valid:
            print(f"### [WARNING] Existing Function: {func_name}")
            print(f"- **File:** `{file_path}`")
            if has_no_description:
                error_count += 1
                print(f"- **Error 1:** No description detected in JSDoc.")
            if has_improper_callers:
                error_count += 1
                print(f"- **Error 2:** Improperly formatted or missing 'Called by:' line.")
            print(f"\n---\n")

print(f"**Scan Summary:** Found {missing_count} missing function(s) and {error_count} documentation error(s).")
' > "$REPORT"

echo "==> Report successfully written to $REPORT"