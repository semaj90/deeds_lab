import {
 enqueueGpuJob,
 getGpuJobResult,
 parseGpuRequest,
 awaitGpuJobResult
} from '$lib/server/services/gpu-pipeline';
import { error: json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import type { DrizzleTypes } from '$lib/types/enhanced-svelte5-types';
$1; 
const jobInput = await parseGpuRequest(event);
 if (!jobInput.text?.trim()) {
 throw error(400, 'text is required');
 }
 const job = await enqueueGpuJob(jobInput);
 const wait = event.url.searchParams.get('wait');
 if (wait === 'true') {
 const result = await awaitGpuJobResult(job.jobId);
 return json(result ?? job);
 }
 return json(job);
}
export const GET: RequestHandler = async (event) => {
 const jobId = event.url.searchParams.get('jobId');
 if (!jobId) {
 throw error(400, 'jobId is required');
 }
 const result = await getGpuJobResult(jobId);
 if (!result) {
 return json({ status: 'pending', jobId });
 }
 return json(result);
}