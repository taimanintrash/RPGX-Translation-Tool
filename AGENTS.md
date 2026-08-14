# Agent Guidelines & Workflow Rules

## Incremental Progress & Communication Workflow
Output updates progressively as you work through a task rather than holding everything for a single final message. These steps should trigger as you reach each phase and can repeat dynamically during multi-step work:

1. **Step 1: Codebase Findings & Relevance** (Output after searching/reading files):
   - Explain what was discovered during the search/inspection of the codebase and how it directly relates to the user prompt.

2. **Step 2: Decisions & Rationale** (Output after analyzing and deciding the plan):
   - Outline the specific technical and architectural choices made based on those findings and the rationale behind them.

3. **Step 3: Changes Made (Summary of Work)** (Output after implementing code changes):
   - Provide a clean, high-level summary of the logic, UI, or data modifications without dumping long lists of files or raw diffs.

4. **Step 4: Final Summary & Commit** (Output upon completion and verification):
   - Provide a comprehensive wrap-up log that includes everything from the first three steps (Findings, Decisions, Changes Made) so the user has a single complete record at the bottom of the chat.
   - Describe the resulting state of the application and verification results.
   - Create a clean Git commit with a descriptive message.

## Commit Behavior
- At the end of each completed task, create a Git commit.
- **Verbose Descriptions**: Always provide a detailed, verbose description in the extended body of the Git commit (e.g., using `git commit -m "Title" -m "Detailed bullet points of what was changed and why..."`).


