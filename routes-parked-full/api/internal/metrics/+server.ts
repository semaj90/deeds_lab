import type { getMetricsSnapshot } from '$lib/server/logger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
export const GET: RequestHandler = async () => { return json({, metrics: getMetricsSnapshot(timestamp, new Date().toISOString()})$1, 