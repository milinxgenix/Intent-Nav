/**
 * IntentNav-SCFR: Computational Telemetry & Statistical Profiler
 * Phase 3, Step 16 Implementation
 *
 * Captures, computes, and statistically aggregates computational resources:
 * - End-to-end and stage-level latency in milliseconds
 * - Heap memory deltas with explicit units (bytes / MB)
 * - Process CPU execution time deltas (user and system microseconds)
 * - Candidate inspection, evaluation, and SHA-256 fingerprint computation counts
 * - Statistical distribution analysis (min, max, mean, median, p95, standard deviation)
 */

import { performance } from 'perf_hooks';
import {
  ComputationalTelemetry,
  StageLatenciesMs,
  StatisticalDistribution,
} from './types';

export interface ActiveProfile {
  startTime: number;
  startMemory: NodeJS.MemoryUsage;
  startCpu: NodeJS.CpuUsage;
  stageLatencies: StageLatenciesMs;
}

export class ComputationalProfiler {
  /**
   * Starts a high-resolution profiling session for a single trial.
   */
  public static startProfile(): ActiveProfile {
    return {
      startTime: performance.now(),
      startMemory: process.memoryUsage(),
      startCpu: process.cpuUsage(),
      stageLatencies: {},
    };
  }

  /**
   * Completes a profiling session and returns exact computational telemetry.
   */
  public static endProfile(
    profile: ActiveProfile,
    counts: {
      candidateCount?: number;
      evaluatedCandidateCount?: number;
      fingerprintComputationCount?: number;
    } = {}
  ): ComputationalTelemetry {
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    const endCpu = process.cpuUsage(profile.startCpu);

    const latencyMs = Number((endTime - profile.startTime).toFixed(2));
    const memoryBytes = endMemory.heapUsed - profile.startMemory.heapUsed;
    const memoryMb = Number((memoryBytes / (1024 * 1024)).toFixed(4));

    return {
      e2eLatencyMs: Math.max(0.01, latencyMs),
      stageLatenciesMs: profile.stageLatencies,
      candidateCount: counts.candidateCount || 0,
      evaluatedCandidateCount: counts.evaluatedCandidateCount || 0,
      fingerprintComputationCount: counts.fingerprintComputationCount || 0,
      heapMemoryDeltaBytes: memoryBytes,
      heapMemoryDeltaMb: memoryMb,
      cpuUserMicroseconds: endCpu.user,
      cpuSystemMicroseconds: endCpu.system,
    };
  }

  /**
   * Computes statistical distribution metrics over a numeric sample array.
   */
  public static computeDistribution(values: number[], unit: string): StatisticalDistribution {
    if (!values || values.length === 0) {
      return {
        sampleSize: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        p95: 0,
        stdDev: 0,
        unit,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const min = Number(sorted[0]!.toFixed(3));
    const max = Number(sorted[n - 1]!.toFixed(3));
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / n).toFixed(3));

    const mid = Math.floor(n / 2);
    const median = Number(
      (n % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2).toFixed(3)
    );

    const p95Index = Math.min(n - 1, Math.floor(n * 0.95));
    const p95 = Number(sorted[p95Index]!.toFixed(3));

    const variance =
      sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Number(Math.sqrt(variance).toFixed(3));

    return {
      sampleSize: n,
      min,
      max,
      mean,
      median,
      p95,
      stdDev,
      unit,
    };
  }
}

