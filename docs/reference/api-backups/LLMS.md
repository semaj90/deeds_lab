# AGENTS.md — `deeds_labs/docs/reference/api-backups`

<!-- AGENTS-GEN v1 · do not edit below this line -->
<!-- generated: 2026-05-15T03:29:31.367Z · agents.md spec · regen: npm run agents:write -->

> Directory: deeds_labs/docs/reference/api-backups

## Snapshot

- 8 file(s), 0 handler(s)
- Audit score: _(no GPU audit)_
- TODOs: 3


## Files (8)

- `ref-ai-chat-sse-server.ts`
- `ref-ai-process-evidence-server.ts`
- `ref-evidence-upload-server.ts`
- `ref-rag-search-server.ts`
- `ref-v1-evidence-similar-server.ts`
- `ref-v1-legal-rag-server.ts`
- `ref-v1-legal-search-server.ts`
- `ref-v1-upload-presigned-server.ts`

## Tools

> MCP tools the Gemma4 agent should reach for inside this directory.
- kag.multi_lane_search
- graph.expand_neighborhood
- topology.same_som_cluster
- clusters.get_members
- context.build_kv_packet
- taxonomy.children
## Todos + Enhancements

- **[LOW]** [TODO] `ref-evidence-upload-server.ts`: TODO
- **[LOW]** [TODO] `ref-rag-search-server.ts`: TODO
- **[LOW]** [TODO] `ref-rag-search-server.ts`: TODO

_Synthesized from gate scan + KAG warnings + TODO comments. Regenerate: `npm run agents:write`._

## Retrieval / Rerank Hints

> Used by ACE context-assembler and Gemma4 agent for pre-retrieval path mapping and post-retrieval chunk scoring.

- **Cluster**: _(not yet indexed — run `graphify:batch` to assign)_
- **Paired tests**: 0/8 files have paired tests

## Agentic tool-calling — quick ACE hits

In-process tools the Gemma4 agent can call to dig deeper into this directory:

- `graph_search({ query: "api-backups", topK: 8 })` — files in this dir with tags, TODOs, audit flags
- `wiki_note_lookup({ query: "reference api-backups", limit: 5 })` — KAG narrative + audit score
- `audit_hotspots({ limit: 10 })` — if this dir is failing gates, surfaces the broader hotspot set
- `read_file({ filePath: "deeds_labs/docs/reference/api-backups/<file>" })` — fetch any file's contents (sandboxed to src/)


## How to use this file

Agents (Claude Code, Cursor, Codex, Aider) automatically pick up the nearest `AGENTS.md` when editing files in this tree. The root `AGENTS.md` provides repo-wide rules; this file overlays directory-specific signals from the Redis KAG cache.

Run `npm run agents:write` to regenerate after `npm run index:codebase:fast`.
