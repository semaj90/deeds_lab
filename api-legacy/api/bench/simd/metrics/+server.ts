import type { simdBodyParser } from '$lib/server/simd-body-parser';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
export const GET: RequestHandler = async () => { const stats = simdBodyParser.getPerformanceStats(); return json({, ok: true, stats, simdEnabled, (simdBodyParser as any, simdEnabled).simdEnabled ?? undefined}$1, 