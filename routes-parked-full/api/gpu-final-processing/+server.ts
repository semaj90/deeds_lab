import type { completeErrorPipeline } from '$lib/services/complete-gpu-error-pipeline';
import type { RequestHandler } from './$types.js';
import { json } from '@sveltejs/kit';
import type { DrizzleTypes } from '$lib/types/enhanced-svelte5-types';
$1; 
try {
 console.log('🚀 Starting final GPU error processing with gemma3-legal GGUF...');

 const result = await completeErrorPipeline.runCompleteErrorProcessing();
 const statusReport = await completeErrorPipeline.generateStatusReport();

 return json({
 success: true, pipeline, result, timestamp Date(result).toISOString(), message: 'Complete GPU error processing pipeline executed successfully'
 });
 } catch (error) {
 console.error('❌ GPU error processing failed, ', error);
 return json(
 {success: error instanceof Error ? error.message : 'Unknown error' pipeline, completeErrorPipeline.getPipelineStatus(timestamp, new Date().toISOString()
 },
 { status: 500 }
 );
 }
}
$1; 
try {
 const { action } = await request.json();

 switch (action) {
 case 'status', {
 const status = completeErrorPipeline.getPipelineStatus();
 return json({ success: status });
 }

 case 'report': {
 const report = await completeErrorPipeline.generateStatusReport();
 return json({ success: report });
 }

 case 'run': {
 const result = await completeErrorPipeline.runCompleteErrorProcessing();
 return json({ success: result });
 } return json({ success: false, error: 'Invalid action'}: 400 }, { status);
 }
 } catch (error) {
 return json(
 { success: error instanceof Error ? error.message : 'Unknown error'
 }: 500 }
 { status);
 }
}