/**
 * XState GPU Process Classifier
 *
 * Manages GPU process priority, scheduling, and fallback to WebAssembly.
 * Integrates with the existing GPU Memory Orchestration machine.
 */

import { createMachine, assign, interpret, ActorRefFrom } from 'xstate';

// Process priority levels
export type ProcessPriority = 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';

// Process types
export type ProcessType =
  | 'legal_analysis'
  | 'embedding_batch'
  | 'background_indexing'
  | 'quick_query'
  | 'chat_inference';

// Process request
export interface ProcessRequest {
  id: string;
  type: ProcessType;
  payload: any;
  documentSize?:  deadline?: number;  // Unix timestamp
  priority?: ProcessPriority;
  submittedAt: number;
}

// Process info (when running)
export interface ProcessInfo extends ProcessRequest {
  startedAt: number;
  estimatedDuration: number;
  memoryUsage: number;
}

// GPU Process Context
export interface GPUProcessContext {
  queue: ProcessRequest[];
  activeProcesses: Map<string, ProcessInfo>;
  memoryUsage: number;
  memoryLimit: number;
  thermalState: 'normal' | 'warm' | 'hot' | 'throttling';
  maxConcurrent: number;
  lastHealthCheck: number;
  wasmFallbackCount: number;
}

// Events
export type GPUProcessEvent =
  | { type: 'SUBMIT_PROCESS'; request: ProcessRequest }
  | { type: 'PROCESS_COMPLETE'; processId: string; result: any }
  | { type: 'PROCESS_FAILED'; processId: string; error: string }
  | { type: 'THERMAL_UPDATE'; state: 'normal' | 'warm' | 'hot' | 'throttling' }
  | { type: 'MEMORY_UPDATE'; usage: number }
  | { type: 'HEALTH_CHECK' }
  | { type: 'FORCE_WASM_FALLBACK'; processId: string };

// GPU Memory Config (RTX 3060 Ti)
const GPU_CONFIG = {
  totalVRAM: 8 * 1024,  // 8GB in MB
  modelSize: 5.9 * 1024,  // Q4_K_M model
  availableForProcessing: 2.1 * 1024,  // ~2.1GB
  maxConcurrent: 4,
  thermalThrottleTemp: 80,
  emergencyShutdownTemp: 90,
};

/**
 * Classify process priority based on request properties
 */
export function classifyProcess(request: ProcessRequest): ProcessPriority {
  const { type, documentSize, deadline } = request;

  // EMERGENCY: Critical legal deadlines (<60s)
  if (deadline && deadline < Date.now() + 60000) {
    return 'EMERGENCY';
  }

  // HIGH: Complex legal document analysis (>100KB)
  if (type === 'legal_analysis' && (documentSize || 0) > 100000) {
    return 'HIGH';
  }

  // MEDIUM: Batch embedding generation
  if (type === 'embedding_batch') {
    return 'MEDIUM';
  }

  // LOW: Background indexing, quick queries
  return 'LOW';
}

/**
 * Estimate memory usage for a process
 */
function estimateMemoryUsage(request: ProcessRequest): number {
  const baseUsage = 256;  // Base 256MB

  switch (request.type) {
    case 'legal_analysis':
      return baseUsage + Math.min(512, (request.documentSize || 0) / 1000);
    case 'embedding_batch':
      return baseUsage + 128;
    case 'chat_inference':
      return baseUsage + 64;
    default:
      return baseUsage;
  }
}

/**
 * Estimate processing duration
 */
function estimateDuration(request: ProcessRequest): number {
  switch (request.type) {
    case 'legal_analysis':
      return 2000 + (request.documentSize || 0) / 100;  // 2s base + size factor
    case 'embedding_batch':
n 500;  // 500ms
    case 'chat_inference':
      return 100;  // 100ms
    default:
      return 200;
  }
}

/**
 * GPU Process Classifier State Machine
 */
export const gpuProcessClassifierMachine = createMachine<GPUProcessContext, GPUProcessEvent>({
  id: 'gpuProcessClassifier',
  initial: 'idle',

  context: {
    queue: [],
    activeProcesses: new Map(),
    memoryUsage: 0,
    memoryLimit: GPU_CONFIG.availableForProcessing,
    thermalState: 'normal',
    maxConcurrent: GPU_CONFIG.maxConcurrent,
    lastHealthCheck: Date.now(),
    wasmFallbackCount: 0,
  },

  states: {
    idle: {
      entry: 'logIdleState',
      on: {
        SUBMIT_PROCESS: {
          target: 'classifying',
          actions: 'enqueueProcess'
        },
        HEALTH_CHECK: {
          actions: 'performHealthCheck'
        }
      }
    },

    classifying: {
      entry: 'classifyQueuedProcess',
      always: [
        { target: 'scheduling', cond: 'hasQueuedProcesses' },
        { target: 'idle' }
      ]
    },

    scheduling: {
      entry: 'logSchedulingState',
      always: [
        // Emergency processes always execute
        { target: 'executing', cond: 'hasEmergencyProcess' },
        // Check if we can execute on GPU
        { target: 'executing', cond: 'canExecuteOnGPU' },
        // GPU overloaded - fallback to WASM
        { target: 'fallback_wasm', cond: 'gpuOverloaded' },
        // Must queue - wait for resources
        { target: 'queued', cond: 'mustQueue' },
        // Default: try WASM
        { target: 'fallback_wasm' }
      ]
    },

    executing: {
      entry: 'startGPUExecution',
      invoke: {
        id: 'gpuExecution',
        src: 'executeOnGPU',
        onDone: {
          target: 'processing_complete',
          actions: 'handleExecutionSuccess'
        },
        onError: {
          target: 'fallback_wasm',
          actions: 'logExecutionError'
        }
      },
      on: {
        PROCESS_COMPLETE: {
          target: 'processing_complete',
          actions: 'handleProcessComplete'
        },
        THERMAL_UPDATE: {
          actions: 'updateThermalState'
        },
        FORCE_WASM_FALLBACK: {
          target: 'fallback_wasm'
        }
      }
    },

    fallback_wasm: {
      entry: 'logWASMFallback',
      invoke: {
        id: 'wasmExecution',
        src: 'executeOnWASM',
        onDone: {
          target: 'processing_complete',
          actions: 'handleWASMSuccess'
        },
        onError: {
          target: 'error',
          actions: 'handleWASMError'
        }
      }
    },

    queued: {
      entry: 'logQueuedState',
      after: {
        100: { target: 'scheduling' }  // Re-check every 100ms
      },
      on: {
        PROCESS_COMPLETE: {
          target: 'scheduling',
          actions: 'releaseResources'
        },
        MEMORY_UPDATE: {
          target: 'scheduling',
          actions: 'updateMemoryUsage'
        }
      }
    },

    processing_complete: {
      entry: 'logProcessingComplete',
      always: [
        { target: 'scheduling', cond: 'hasQueuedProcesses' },
        { target: 'idle' }
      ]
    },

    error: {
      entry: 'logErrorState',
      on: {
        HEALTH_CHECK: {
          target: 'idle',
          actions: 'resetErrorState'
        }
      }
    }
  }
}, {
  actions: {
    logIdleState: () => {
      console.log('⏳ GPU Process Classifier: Idle - Ready for processes');
    },

    enqueueProcess: assign({
      queue: (context, event) => {
        if (event.type !== 'SUBMIT_PROCESS') return context.queue;

        const request = event.request;
        request.priority = classifyProcess(request);

        console.log(`📥 Enqueued process ${request.id} with priority ${request.priority}`);

        // Insert based on priority
        const newQueue = [...context.queue, request];
        return newQueue.sort((a, b) => {
          const priorityOrder = { EMERGENCY: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          return priorityOrder[a.priority!] - priorityOrder[b.priority!];
        });
      }
    }),

    classifyQueuedProcess: (context) => {
      const next = context.queue[0];
      if (next) {
        console.log(`🏷️ Classified process ${next.id}: ${next.priority}`);
      }
    },

    logSchedulingState: () => {
      console.log('📋 Scheduling next process...');
    },

    startGPUExecution: assign({
      activeProcesses: (context) => {
        const next = context.queue[0];
        if (!next) return context.activeProcesses;

        const processInfo: ProcessInfo = {
          ...next,
          startedAt: Date.now(),
          estimatedDuration: estimateDuration(next),
          memoryUsage: estimateMemoryUsage(next),
        };

        const newActive = new Map(context.activeProcesses);
        newActive.set(next.id, processInfo);

        console.log(`🚀 Starting GPU execution for ${next.id}`);
        return newActive;
      },
      queue: (context) => context.queue.slice(1),
      memoryUsage: (context) => {
        const next = context.queue[0];
        return context.memoryUsage + (next ? estimateMemoryUsage(next) : 0);
      }
    }),

    handleExecutionSuccess: assign({
      activeProcesses: (context, event) => {
        const newActive = new Map(context.activeProcesses);
        // Remove completed process
        for (const [id] of newActive) {
          newActive.delete(id);
          break;
        }
        return newActive;
      }
    }),

    handleProcessComplete: assign({
      activeProcesses: (context, event) => {
        if (event.type !== 'PROCESS_COMPLETE') return context.activeProcesses;

        const newActive = new Map(context.activeProcesses);
        const process = newActive.get(event.processId);

        if (process) {
          context.memoryUsage -= process.memoryUsage;
          newActive.delete(event.processId);
          console.log(`✅ Process ${event.processId} complete`);
        }

        return newActive;
      }
    }),

    logWASMFallback: assign({
      wasmFallbackCount: (context) => {
        console.log('🔄 Falling back to WebAssembly execution');
        return context.wasmFallbackCount + 1;
      }
    }),

    handleWASMSuccess: (context, event) => {
      console.log('✅ WASM execution successful');
    },

    handleWASMError: (context, event) => {
      console.error('❌ WASM execution failed');
    },

    logQueuedState: (context) => {
      console.log(`⏸️ Process queued. Queue length: ${context.queue.length}`);
    },

    releaseResources: assign({
      memoryUsage: (context, event) => {
        if (event.type !== 'PROCESS_COMPLETE') return context.memoryUsage;

        const process = context.activeProcesses.get(event.processId);
        return context.memoryUsage - (process?.memoryUsage || 0);
      }
    }),

    updateMemoryUsage: assign({
      memoryUsage: (context, event) => {
        if (event.type !== 'MEMORY_UPDATE') return context.memoryUsage;
        return event.usage;
      }
    }),

    updateThermalState: assign({
      thermalState: (context, event) => {
        if (event.type !== 'THERMAL_UPDATE') return context.thermalState;
        console.log(`🌡️ Thermal state: ${event.state}`);
        return event.state;
      }
    }),

    logProcessingComplete: () => {
      console.log('🎉 Processing complete');
    },

    logErrorState: () => {
      console.error('💥 GPU Process Classifier error');
    },

    logExecutionError: (context, event) => {
      console.error('❌ GPU execution failed, falling back to WASM');
    },

    resetErrorState: assign({
      queue: [],
      activeProcesses: new Map(),
      memoryUsage: 0,
      thermalState: 'normal'
    }),

    performHealthCheck: (context) => {
      const activeCount = context.activeProcesses.size;
      const queueLength = context.queue.length;
      const memoryPercent = (context.memoryUsage / context.memoryLimit) * 100;

      console.log(`💊 Health Check:
        Active: ${activeCount}
        Queued: ${queueLength}
        Memory: ${memoryPercent.toFixed(1)}%
        Thermal: ${context.thermalState}
        WASM Fallbacks: ${context.wasmFallbackCount}`);
    }
  },

  guards: {
    hasQueuedProcesses: (context) => context.queue.length > 0,

    hasEmergencyProcess: (context) => {
      const next = context.queue[0];
      return next?.priority === 'EMERGENCY';
    },

    canExecuteOnGPU: (context) => {
      const next = context.queue[0];
      if (!next) return false;

      const estimatedMemory = estimateMemoryUsage(next);
      const wouldExceedMemory = context.memoryUsage + estimatedMemory > context.memoryLimit;
      const wouldExceedConcurrent = context.activeProcesses.size >= context.maxConcurrent;
      const isThermalThrottling = context.thermalState === 'throttling';

      return !wouldExceedMemory && !wouldExceedConcurrent && !isThermalThrottling;
    },

    gpuOverloaded: (context) => {
      const memoryPercent = context.memoryUsage / context.memoryLimit;
      return memoryPercent > 0.9 || context.thermalState === 'throttling';
    },

    mustQueue: (context) => {
      const next = context.queue[0];
      if (!next) return false;

      // High priority can wait briefly
      if (next.priority === 'HIGH' || next.priority === 'EMERGENCY') {
        return context.activeProcesses.size < context.maxConcurrent;
      }

      return true;
    }
  },

  services: {
    executeOnGPU: async (context, event) => {
      const process = Array.from(context.activeProcesses.values())[0];
      if (!process) throw new Error('No process to execute');

      console.log(`⚡ Executing ${process.id} on GPU (${process.type})`);

      // Simulate GPU execution
      await new Promise(resolve => setTimeout(resolve, process.estimatedDuration));

      return { processId: process.id, success: true };
    },

    executeOnWASM: async (context, event) => {
      const process = context.queue[0];
      if (!process) throw new Error('No process to execute');

      console.log(`🌐 Executing ${process.id} on WebAssembly`);

      // Simulate WASM execution (typically slower)
      await new Promise(resolve => setTimeout(resolve, process.estimatedDuration || 200 * 1.5));

      return { processId: process.id, success: true, mode: 'wasm' };
    }
  }
});

/**
 * GPU Process Classifier Service
 */
export class GPUProcessClassifierService {
  private machine = interpret(gpuProcessClassifierMachine);

  constructor() {
    this.machine.start();
  }

  /**
   * Submit a process for execution
   */
  submitProcess(request: Omit<ProcessRequest, 'submittedAt'>): void {
    this.machine.send({
      type: 'SUBMIT_PROCESS',
      request: {
        ...request,
        submittedAt: Date.now()
      }
    });
  }

  /**
   * Mark a process as complete
   */
  completeProcess(processId: string, result: any): void {
    this.machine.send({
      type: 'PROCESS_COMPLETE',
      processId,
      result
    });
  }

  /**
   * Update thermal state
   */
  updateThermal(state: 'normal' | 'warm' | 'hot' | 'throttling'): void {
    this.machine.send({
      type: 'THERMAL_UPDATE',
      state
    });
  }

  /**
   * Force WASM fallback for a process
   */
  forceWASMFallback(processId: string): void {
    this.machine.send({
      type: 'FORCE_WASM_FALLBACK',
      processId
    });
  }

  /**
   * Perform health check
   */
  healthCheck(): void {
    this.machine.send({ type: 'HEALTH_CHECK' });
  }

  /**
   * Get current state
   */
  getCurrentState(): string {
    return this.machine.getSnapshot().value as string;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    const context = this.machine.getSnapshot().context;
    return {
      queueLength: context.queue.length,
      activeCount: context.activeProcesses.size,
      memoryUsage: context.memoryUsage,
      memoryLimit: context.memoryLimit,
      thermalState: context.thermalState,
      wasmFallbackCount: context.wasmFallbackCount
    };
  }
}

export default GPUProcessClassifierService;
