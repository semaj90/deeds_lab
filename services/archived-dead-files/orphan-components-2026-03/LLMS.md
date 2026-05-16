# AGENTS.md — `deeds_labs/services/archived-dead-files/orphan-components-2026-03`

<!-- AGENTS-GEN v1 · do not edit below this line -->
<!-- generated: 2026-05-15T03:29:31.367Z · agents.md spec · regen: npm run agents:write -->

> Directory: deeds_labs/services/archived-dead-files/orphan-components-2026-03

## Snapshot

- 34 file(s), 0 handler(s)
- Audit score: _(no GPU audit)_
- 🟠 hardcoded localhost: 2 · TODOs: 4


## Files (34)

- `AdminLayout.svelte`
- `AdminSidebar.svelte`
- `AIButtonPortal.svelte`
- `AISummaryButton.svelte`
- `AIToolbar.svelte`
- `BitsCombobox.svelte`
- `BitsUIAccessibilityWrapper.svelte`
- `CaseDetailPage.svelte`

## Tools

> MCP tools the Gemma4 agent should reach for inside this directory.
- kag.multi_lane_search
- graph.expand_neighborhood
- topology.same_som_cluster
- clusters.get_members
- context.build_kv_packet
- taxonomy.children
## Audit Gates

| Gate | Status | Detail |
|------|--------|--------|
| G21-24 | ✅ PASS | 34/34 clean ✅ |
| G20 | ✅ PASS | clean ✅ |
| G17 | ❌ FAIL | 2/34 files — use env.server.ts getters |

_Gates checked: G21-24, G20, G17. Run `npm run index:codebase:fast && npm run agents:write` to refresh._
## Todos + Enhancements

- **[HIGH]** [G17] Fix **G17** No hardcoded localhost URLs: 2/34 files — use env.server.ts getters
- **[LOW]** [TODO] `EnhancedMCPIntegration.svelte`: TODO
- **[LOW]** [TODO] `EvidenceCanvas.svelte`: TODO
- **[LOW]** [TODO] `MultiLLMOrchestrator.svelte`: TODO
- **[LOW]** [TODO] `UnifiedAIAssistant.svelte`: TODO

_Synthesized from gate scan + KAG warnings + TODO comments. Regenerate: `npm run agents:write`._

## Retrieval / Rerank Hints

> Used by ACE context-assembler and Gemma4 agent for pre-retrieval path mapping and post-retrieval chunk scoring.

- **Cluster**: _(not yet indexed — run `graphify:batch` to assign)_
- **Paired tests**: 0/34 files have paired tests

## Agentic tool-calling — quick ACE hits

In-process tools the Gemma4 agent can call to dig deeper into this directory:

- `graph_search({ query: "orphan-components-2026-03", topK: 8 })` — files in this dir with tags, TODOs, audit flags
- `wiki_note_lookup({ query: "archived-dead-files orphan-components-2026-03", limit: 5 })` — KAG narrative + audit score
- `audit_hotspots({ limit: 10 })` — if this dir is failing gates, surfaces the broader hotspot set
- `read_file({ filePath: "deeds_labs/services/archived-dead-files/orphan-components-2026-03/<file>" })` — fetch any file's contents (sandboxed to src/)


## How to use this file

Agents (Claude Code, Cursor, Codex, Aider) automatically pick up the nearest `AGENTS.md` when editing files in this tree. The root `AGENTS.md` provides repo-wide rules; this file overlays directory-specific signals from the Redis KAG cache.

Run `npm run agents:write` to regenerate after `npm run index:codebase:fast`.
