/**
 * IntentNav-SCFR: Phase 3 Integrated Experimental Validation Types
 * Steps 14–17 Implementation
 *
 * Defines canonical data types, descriptors, and results for:
 * - Step 14: Full-System Experiments
 * - Step 15: Controlled Ablation Studies
 * - Step 16: Computational Telemetry & Profiling
 * - Step 17: Reproducibility Dossier & Manifest
 */

import { BaselineSystemId } from '../baselines/registry';
import { MutationCategory } from '../mutations/types';

export interface StageLatenciesMs {
  normalization?: number;
  resolution?: number;
  driftClassification?: number;
  invariantClosure?: number;
  ranking?: number;
  authorization?: number;
  dispatch?: number;
  verification?: number;
}

export interface ComputationalTelemetry {
  e2eLatencyMs: number;
  stageLatenciesMs: StageLatenciesMs;
  candidateCount: number;
  evaluatedCandidateCount: number;
  fingerprintComputationCount: number;
  heapMemoryDeltaBytes: number;
  heapMemoryDeltaMb: number;
  cpuUserMicroseconds: number;
  cpuSystemMicroseconds: number;
}

export interface ExperimentRunProvenance {
  runId: string;
  timestamp: number;
  gitRevision: string;
  isWorkingTreeDirty: boolean;
  environmentType: 'MOCK_JSDOM' | 'REAL_CHROMIUM_HEADLESS';
  platform: string;
  arch: string;
  osRelease: string;
  nodeVersion: string;
  browserExecutable: string;
  browserVersion: string;
  datasetChecksumSha256: string;
  mutationConfigChecksumSha256: string;
  commandExecuted: string;
}

export interface FullSystemExperimentRecord {
  experimentId: string;
  runId: string;
  trialId: string;
  timestamp: number;
  systemId: BaselineSystemId;
  systemName: string;
  mutationId: string;
  category: MutationCategory;
  applicable: boolean;
  inapplicableReason?: string;
  selectedTargetId: string | null;
  targetSelectedCorrectly: boolean;
  executionAttempted: boolean;
  executionSucceeded: boolean;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'QUARANTINED' | 'NOT_APPLICABLE';
  trialStatus: 'SUCCESS' | 'FAILED' | 'INCOMPLETE' | 'NOT_APPLICABLE' | 'DECOY_TRIGGERED' | 'QUARANTINED' | 'ABSTAINED';
  causallyVerified: boolean;
  telemetry: ComputationalTelemetry;
  errorNotes?: string;
}

export type AblationMechanismId =
  | 'BASELINE'
  | 'NO_FINGERPRINT_INVARIANT'
  | 'NO_DRIFT_REBIND'
  | 'NO_NEGATIVE_EVIDENCE'
  | 'NO_RISK_GATING'
  | 'NO_CAUSAL_VERIFIER'
  | 'NO_QUARANTINE_ROLLBACK';

export interface AblationConfig {
  id: AblationMechanismId;
  name: string;
  description: string;
  mechanismDisabled: string;
  expectedConsequence: string;
}

export interface AblationExperimentRecord {
  experimentId: string;
  runId: string;
  trialId: string;
  timestamp: number;
  ablationId: AblationMechanismId;
  mechanismDisabled: string;
  mutationId: string;
  category: MutationCategory;
  selectedTargetId: string | null;
  targetSelectedCorrectly: boolean;
  executionAttempted: boolean;
  executionSucceeded: boolean;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'QUARANTINED' | 'NOT_APPLICABLE';
  trialStatus: 'SUCCESS' | 'FAILED' | 'INCOMPLETE' | 'NOT_APPLICABLE' | 'DECOY_TRIGGERED' | 'QUARANTINED' | 'ABSTAINED';
  causallyVerified: boolean;
  safetyGatingBypassed: boolean;
  quarantineTriggered: boolean;
  telemetry: ComputationalTelemetry;
  errorNotes?: string;
}

export interface StatisticalDistribution {
  sampleSize: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  stdDev: number;
  unit: string;
}

export interface ComputationalAnalysisReport {
  timestamp: number;
  totalTrialsMeasured: number;
  e2eLatencyDistribution: StatisticalDistribution;
  memoryDeltaMbDistribution: StatisticalDistribution;
  cpuTimeMsDistribution: StatisticalDistribution;
  candidateEvaluationsDistribution: StatisticalDistribution;
  fingerprintComputationsDistribution: StatisticalDistribution;
  perSystemLatency: Record<string, StatisticalDistribution>;
}

export interface ManifestArtifact {
  path: string;
  filename: string;
  sha256: string;
  sizeBytes: number;
  description: string;
}

export interface ReproducibilityManifest {
  manifestVersion: '1.0.0';
  generatedAt: string;
  provenance: ExperimentRunProvenance;
  totalTrials: {
    fullSystem: number;
    ablation: number;
    total: number;
  };
  artifacts: ManifestArtifact[];
  reproductionInstructions: {
    command: string;
    environmentPrerequisites: string[];
  };
}

