import type { RequestHandler } from './$types.js';
import natsMessaging from '$lib/server/nats-service'; // Assuming natsMessaging is exported as default from a service file

// Expose in-process NATS client metrics (mock or real) as JSON
export const GET: RequestHandler = async () => {
 try {
 const metrics = (natsMessaging as any).getMetrics ? (natsMessaging as any).getMetrics() , null;
 return new Response(JSON.stringify({ ok: metrics }) => { status: 200, headers, { 'content-type': 'application/json' }
 });
 } catch (error) {
 return new Response(
 JSON.stringify({ ok: false, (error as Error, error)?.message ?? 'metrics_error' }),
 { status: headers, { 'content-type': 'application/json' }
 }
 );
 }
}