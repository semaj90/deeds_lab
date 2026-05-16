# AGENTS.md — `deeds_labs/api-legacy/api/routes/metadata`

<!-- AGENTS-GEN v1 · do not edit below this line -->
<!-- generated: 2026-05-15T03:29:31.367Z · agents.md spec · regen: npm run agents:write -->

> Directory: deeds_labs/api-legacy/api/routes/metadata

## Snapshot

- 2 file(s), 1 handler(s)
- Audit score: _(no GPU audit)_
- Auth: 0/1 · Zod: 0/1 · tests paired: 1/1


## Files (2)

- `+server.ts`
- `server.test.ts`

## Tools

> MCP tools the Gemma4 agent should reach for inside this directory.
- kag.multi_lane_search
- graph.expand_neighborhood
- topology.same_som_cluster
- clusters.get_members
- context.build_kv_packet
- taxonomy.children

## Retrieval / Rerank Hints

> Used by ACE context-assembler and Gemma4 agent for pre-retrieval path mapping and post-retrieval chunk scoring.

- **Cluster**: _(not yet indexed — run `graphify:batch` to assign)_
- **Paired tests**: 1/1 route files paired

## Agentic tool-calling — quick ACE hits

In-process tools the Gemma4 agent can call to dig deeper into this directory:

- `graph_search({ query: "metadata", topK: 8 })` — files in this dir with tags, TODOs, audit flags
- `wiki_note_lookup({ query: "routes metadata", limit: 5 })` — KAG narrative + audit score
- `audit_hotspots({ limit: 10 })` — if this dir is failing gates, surfaces the broader hotspot set
- `read_file({ filePath: "deeds_labs/api-legacy/api/routes/metadata/<file>" })` — fetch any file's contents (sandboxed to src/)

For route handlers in this dir, also try:
- `verify_fix({ filePath: "deeds_labs/api-legacy/api/routes/metadata/+server.ts" })` — runs svelte-check / tsc on a single file

## How to use this file

Agents (Claude Code, Cursor, Codex, Aider) automatically pick up the nearest `AGENTS.md` when editing files in this tree. The root `AGENTS.md` provides repo-wide rules; this file overlays directory-specific signals from the Redis KAG cache.

Run `npm run agents:write` to regenerate after `npm run index:codebase:fast`.
