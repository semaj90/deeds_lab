# deeds_lab

Archived experimental code, reference implementations, and legacy API endpoints from [deeds-web-app](https://github.com/semaj90/deeds-web-app).

Extracted on February 14, 2026 during codebase consolidation (Session 27).

## Directory Structure

### `api-legacy/` (1,200 files)
Legacy API endpoints from `routes_parked/api/`. Replaced by active endpoints in `src/routes/(app)/api/` and `src/routes/api/`.

### `routes-reference/` (11 directories)
Reference implementations worth studying for future development:
- **chat/** — Alternative chat UI
- **chat-simple/** — Simplified chat interface
- **summarize/** — Document summarization UI
- **cuda-search/** — GPU-accelerated search (CUDA integration)
- **report-builder/** — Report generation tool
- **memory-palace/** — Memory/context visualization patterns
- **interactive-canvas/** — Canvas-based visualization experiments
- **nier-showcase/** — NieR/YoRHa UI component showcase
- **mcp-demo/** — MCP integration examples
- **agent-demo/** — XState/agent workflow patterns
- **mcp/** — MCP service routes

### `components-reference/`
- **AiAssistant.svelte.replaced** — Original AI assistant with XState v4 + Loki.js caching
- **AIButton.svelte.replaced** — FAB with keyboard shortcuts, haptic feedback (Svelte 5)
- **OptimizedMinIOUpload.svelte.disabled** — Parallel upload with retry, GPU, OCR pipeline

### `stores-reference/`
- **svelte4_stores/** — Svelte 4 store implementations (writable/derived) for migration reference

## Why This Exists

The main deeds-web-app accumulated 1,612+ parked route files during development. During Session 27 consolidation:
- **7 routes salvaged** and migrated to Svelte 5 (restored to active app)
- **~15 items archived here** as reference implementations
- **~1,400 files deleted** (stubs, corrupted, superseded)

## Status
Read-only reference material. No active development expected.