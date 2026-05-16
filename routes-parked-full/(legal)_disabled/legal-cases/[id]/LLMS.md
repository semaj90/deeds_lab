# AGENTS.md — `deeds_labs/routes-parked-full/(legal)_disabled/legal-cases/[id]`

<!-- AGENTS-GEN v1 · do not edit below this line -->
<!-- generated: 2026-05-15T03:29:31.367Z · agents.md spec · regen: npm run agents:write -->

> Directory: deeds_labs/routes-parked-full/(legal)_disabled/legal-cases/[id]

## Snapshot

- 2 file(s), 0 handler(s)
- Audit score: _(no GPU audit)_
- TODOs: 1


## Files (2)

- `+page.server.ts`
- `+page.svelte`

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
| G21-24 | ✅ PASS | 1/1 clean ✅ |
| G20 | ✅ PASS | clean ✅ |

_Gates checked: G21-24, G20. Run `npm run index:codebase:fast && npm run agents:write` to refresh._
## Todos + Enhancements

- **[LOW]** [TODO] `+page.svelte`: TODO

_Synthesized from gate scan + KAG warnings + TODO comments. Regenerate: `npm run agents:write`._

## Retrieval / Rerank Hints

> Used by ACE context-assembler and Gemma4 agent for pre-retrieval path mapping and post-retrieval chunk scoring.

- **Cluster**: _(not yet indexed — run `graphify:batch` to assign)_
- **Paired tests**: 0/2 files have paired tests

## Agentic tool-calling — quick ACE hits

In-process tools the Gemma4 agent can call to dig deeper into this directory:

- `graph_search({ query: "[id]", topK: 8 })` — files in this dir with tags, TODOs, audit flags
- `wiki_note_lookup({ query: "legal-cases [id]", limit: 5 })` — KAG narrative + audit score
- `audit_hotspots({ limit: 10 })` — if this dir is failing gates, surfaces the broader hotspot set
- `read_file({ filePath: "deeds_labs/routes-parked-full/(legal)_disabled/legal-cases/[id]/<file>" })` — fetch any file's contents (sandboxed to src/)


## How to use this file

Agents (Claude Code, Cursor, Codex, Aider) automatically pick up the nearest `AGENTS.md` when editing files in this tree. The root `AGENTS.md` provides repo-wide rules; this file overlays directory-specific signals from the Redis KAG cache.

Run `npm run agents:write` to regenerate after `npm run index:codebase:fast`.
