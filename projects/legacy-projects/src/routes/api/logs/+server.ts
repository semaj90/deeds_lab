import { json } from '@sveltejs/kit';
import { redis } from '$lib/server/cache/redis';

export const POST = async ({ request }) => {
  const body = await request.json();
  try {
    // append a timestamp and store in Redis list
    await redis.lpush('logs:ai', JSON.stringify({ ...body, timestamp: Date.now() }));
  } catch (err) {
    // swallow redis errors but still return ok for resiliency
    console.warn('Failed to write log to redis', err);
  }
  return json({ success: true });
};
