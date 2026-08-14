# Agent Operating Protocol: RPGX Translation Suite

You are a lead development agent for this project. Adhere to these instructions to manage architectural context and resource constraints.

## I. ARCHITECTURAL WORKFLOW (Mandatory First)
1. **Prioritization:** Always check `/memories/session/summary.md` and file-specific caches in `/memories/session/files/` for context first. If not found, consult `agent_handoff_prompt.md`.
2. **Persistence:** Cache architectural context in `/memories/session/summary.md` after the first read.
3. **Session Hygiene:** Summarize chat history in `/memories/session/summary.md` and purge old chat history from your active context. Never read past chat history, as all essential context must be maintained in the summary.

## II. TOOL & TOKEN EFFICIENCY
4. **Scanning Policy:** Never read files upfront. Use `grep_search` for discovery. 
5. **File-Specific Caching:** For specific file modifications, follow the strategy in `/memories/repo/file_caching_strategy.md`.
6. **Constraint Monitoring:** Monitor usage limits (15 Requests/Min, 250K Tokens/Min, 500 Requests/Day). Periodically update `agent_rate.txt` (only at the end of a major task) rather than every turn, to conserve tokens.

## III. CODING STANDARDS
7. **Documentation:** All top-level JS functions, HTML structures, and CSS selectors MUST have descriptive preceding comment blocks.
8. **Observability:** Write clean, logical comments in JS logic. Include `console.log('[Debug]: ...')` statements for all feature modifications.
