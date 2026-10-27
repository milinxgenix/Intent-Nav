/**
 * IntentNav-SCFR: Step 11 Benchmark Integrity, Memory Lifecycle, and Run Isolation Unit Tests
 *
 * Verifies:
 * 1. Provenance metadata completeness (unique runId/trialId, git revision, runtime, platform, dataset SHA-256, config).
 * 2. Strict state isolation (STRICT_TRIAL_ISOLATION ensures no cross-trial leakage of routes, negative evidence, or state).
 * 3. Contamination detection (checkStateIsolation identifies contaminated machines before execution).
 * 4. Intentional session learning tracking (sessionLearning flag, sessionId tracking vs accidental leakage).
 * 5. Incomplete trials and missing metadata handling (explicit flags, never silently dropped).
 * 6. Memory and CPU lifecycle units (explicit MB, ms units, CALIBRATION_PENDING status, settling/warmup).
 * 7. Frozen evidence and patent requirements output-path protection.
 * 8. MetricValidator schema, reconciliation, and provenance enforcement.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BenchmarkRunner } from '../../benchmark/runner';
import { BenchmarkReporter, BenchmarkMetrics, ExperimentRunRecord } from '../../benchmark/reporter';
import { MetricValidator } from '../../benchmark/metricValidator';
import { IntentNavMachine } from '../../src/core/stateMachine/machine';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const intentsPath = path.resolve(__dirname, '../../benchmark/dataset/intents.json');

describe('Step 11: Benchmark Integrity, Memory Lifecycle, and Run Isolation Suite', () => {
  describe('1. Experiment Provenance & Metadata Completeness', () => {
    it('captures complete environment, Git revision, platform, dataset hash, and config provenance', async () => {
      // Run with filter for a small subset (1 intent across all 4 sites) to verify provenance and safety invariants
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA', 'SiteB', 'SiteC', 'SiteD'],
        intentsFilter: (i) => i.id === 'INT-001',
        warmupRuns: 0,
        isolationMode: 'STRICT_TRIAL_ISOLATION',
      });

      const { telemetry, records, metrics } = result;

      expect(telemetry.provenance).toBeDefined();
      const prov = telemetry.provenance!;

      // Unique run identifier
      expect(prov.runId).toBeDefined();
      expect(typeof prov.runId).toBe('string');
      expect(prov.runId.length).toBeGreaterThan(5);

      // Git revision present (either valid 40-char SHA or fallback)
      expect(prov.gitRevision).toBeDefined();
      expect(typeof prov.gitRevision).toBe('string');

      // Platform, architecture, runtime
      expect(prov.platform).toContain(process.platform);
      expect(prov.arch).toBe(process.arch);
      expect(prov.nodeVersion).toBe(process.version);
      expect(prov.browserVersion).toBe('JSDOM-Simulated-Environment');

      // Dataset metadata and SHA-256 integrity hash
      expect(prov.datasetMetadata).toBeDefined();
      expect(prov.datasetMetadata.datasetName).toBe('intents.json');
      expect(prov.datasetMetadata.datasetHash).toMatch(/^[0-9a-f]{64}$/);
      expect(prov.datasetMetadata.datasetVersion).toBe('v1.0');
      expect(prov.datasetMetadata.totalIntents).toBe(100);

      // Benchmark configuration
      expect(prov.config).toBeDefined();
      expect(prov.config.sites).toEqual(['SiteA', 'SiteB', 'SiteC', 'SiteD']);
      expect(prov.config.isolationMode).toBe('STRICT_TRIAL_ISOLATION');
      expect(prov.config.calibrationStatus).toBe('CALIBRATION_PENDING');
      expect(prov.config.targetOutputDir).toBe('benchmark/results/phase3');

      // Memory and CPU explicit units
      expect(telemetry.memory.heapUnit).toBe('MB');
      expect(telemetry.cpu.cpuUnit).toBe('ms');

      // Validate through MetricValidator (strict validation with all 4 sites)
      const validation = MetricValidator.validate(metrics, records, true, telemetry);
      expect(validation.isValid).toBe(true);
      expect(validation.issues.filter((i) => i.severity === 'ERROR')).toHaveLength(0);
    });

    it('generates distinct run IDs across separate benchmark invocations', async () => {
      const res1 = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001',
      });
      const res2 = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001',
      });

      expect(res1.telemetry.provenance?.runId).not.toEqual(res2.telemetry.provenance?.runId);
    });
  });

  describe('2. State Isolation & Contamination Detection', () => {
    it('verifies that a fresh IntentNavMachine has zero contamination', () => {
      const machine = new IntentNavMachine();
      AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));

      const isolation = BenchmarkRunner.checkStateIsolation(machine);
      expect(isolation.isClean).toBe(true);
      expect(isolation.activeRouteCount).toBe(0);
      expect(isolation.totalRouteCount).toBe(0);
      expect(isolation.negativeEvidenceCount).toBe(0);
      expect(isolation.edgeCount).toBe(0);
      expect(isolation.violations).toHaveLength(0);
    });

    it('detects contamination when negative evidence exists in store', () => {
      const machine = new IntentNavMachine();
      AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));

      // Inject negative evidence contradiction
      machine.negativeEvidenceStore.recordContradiction(
        'candidate_test_leak',
        'INCOMPATIBLE_POSTSTATE',
        'INV_POST_STATE_01',
        'Simulated negative evidence for contamination check'
      );

      const isolation = BenchmarkRunner.checkStateIsolation(machine);
      expect(isolation.isClean).toBe(false);
      expect(isolation.negativeEvidenceCount).toBe(1);
      expect(isolation.violations.some((v) => v.includes('negative evidence'))).toBe(true);
    });

    it('detects contamination when provisional or active routes exist in graph', () => {
      const machine = new IntentNavMachine();
      AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));

      // Inject a provisional route
      machine.routeManager.createProvisionalRoute(
        'CAP_DISABLE_MARKETING',
        [{ stepIndex: 1, fromStateId: 's1', toStateId: 's2', actionDescription: 'click' }],
        0.95
      );

      const isolation = BenchmarkRunner.checkStateIsolation(machine);
      expect(isolation.isClean).toBe(false);
      expect(isolation.totalRouteCount).toBe(1);
      expect(isolation.violations.some((v) => v.includes('routes attached'))).toBe(true);
    });

    it('enforces STRICT_TRIAL_ISOLATION so trial execution does not leak into subsequent trials', async () => {
      // Execute 2 sequential trials under strict isolation
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001' || i.id === 'INT-002',
        isolationMode: 'STRICT_TRIAL_ISOLATION',
      });

      const b5Records = result.records.filter((r) => r.systemName.includes('IntentNav-SCFR'));
      expect(b5Records).toHaveLength(2);

      // Verify that both trials executed in clean isolation
      expect(b5Records[0]!.sessionLearning).toBe(false);
      expect(b5Records[1]!.sessionLearning).toBe(false);
      expect(b5Records[0]!.trialId).not.toEqual(b5Records[1]!.trialId);
    });
  });

  describe('3. Intentional Session Learning vs Accidental Leakage', () => {
    it('tracks session learning explicitly when INTENTIONAL_SESSION_LEARNING is configured', async () => {
      const customSessionId = 'session_test_multiturn_101';
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001' || i.id === 'INT-002',
        isolationMode: 'INTENTIONAL_SESSION_LEARNING',
        sessionId: customSessionId,
      });

      expect(result.telemetry.provenance?.config.isolationMode).toBe('INTENTIONAL_SESSION_LEARNING');

      // All records should be tagged with sessionLearning: true and the sessionId
      for (const record of result.records) {
        expect(record.sessionLearning).toBe(true);
        expect(record.sessionId).toBe(customSessionId);
      }
    });
  });

  describe('4. Incomplete Trials and Missing Metadata Handling', () => {
    it('marks trials with explicit incomplete and missingMetadata flags on error without dropping records', () => {
      const metrics: BenchmarkMetrics[] = [
        {
          systemName: 'Baseline 1: Fixed Selector Replay',
          totalQueries: 1,
          top1Accuracy: 0,
          top3Accuracy: 0,
          decoyRejectionRate: 1.0,
          falseDiscoveryRate: 0,
          uiChangeRecoveryRate: 0,
          simulatedTransitionValidationRate: 0,
          causalVerificationRate: 0,
          unauthorizedHighRiskExecutions: 0,
          avgLatencyMs: 0,
        },
        {
          systemName: 'IntentNav-SCFR (Invention Prototype)',
          totalQueries: 1,
          top1Accuracy: 0,
          top3Accuracy: 0,
          decoyRejectionRate: 1.0,
          falseDiscoveryRate: 0,
          uiChangeRecoveryRate: 1.0,
          simulatedTransitionValidationRate: 0,
          causalVerificationRate: 0,
          unauthorizedHighRiskExecutions: 0,
          avgLatencyMs: 0,
        },
      ];

      const records: ExperimentRunRecord[] = [
        {
          experimentId: 'EXP_TEST_INCOMPLETE_B1',
          runId: 'run_test_err',
          trialId: 'trial_test_err_B1',
          trialIndex: 1,
          timestamp: Date.now(),
          systemName: 'Baseline 1: Fixed Selector Replay',
          siteVersion: 'SiteA',
          queryId: 'INT-001',
          queryText: 'Disable marketing emails',
          expectedCapability: 'CAP_DISABLE_MARKETING',
          selectedCandidateId: null,
          status: 'INCOMPLETE',
          incomplete: true,
          missingMetadata: true,
          transitionValidated: false,
          causallyVerified: false,
          authorized: false,
          latencyMs: 0,
          memoryDeltaMb: 0,
          notes: 'Simulated network timeout during live DOM capture',
        },
        {
          experimentId: 'EXP_TEST_INCOMPLETE_B5',
          runId: 'run_test_err',
          trialId: 'trial_test_err_B5',
          trialIndex: 1,
          timestamp: Date.now(),
          systemName: 'IntentNav-SCFR (Invention Prototype)',
          siteVersion: 'SiteA',
          queryId: 'INT-001',
          queryText: 'Disable marketing emails',
          expectedCapability: 'CAP_DISABLE_MARKETING',
          selectedCandidateId: null,
          status: 'INCOMPLETE',
          incomplete: true,
          missingMetadata: true,
          transitionValidated: false,
          causallyVerified: false,
          authorized: false,
          latencyMs: 0,
          memoryDeltaMb: 0,
          notes: 'Simulated network timeout during live DOM capture',
        },
      ];

      const validation = MetricValidator.validate(metrics, records, false);
      expect(validation.isValid).toBe(true);
      expect(validation.totalRecordsChecked).toBe(2);
    });

    it('rejects incomplete records if marked status SUCCESS', () => {
      const metrics: BenchmarkMetrics[] = [
        {
          systemName: 'IntentNav-SCFR (Invention Prototype)',
          totalQueries: 1,
          top1Accuracy: 1.0,
          top3Accuracy: 1.0,
          decoyRejectionRate: 1.0,
          falseDiscoveryRate: 0,
          uiChangeRecoveryRate: 1.0,
          simulatedTransitionValidationRate: 1.0,
          causalVerificationRate: 1.0,
          unauthorizedHighRiskExecutions: 0,
          avgLatencyMs: 50,
        },
      ];

      const corruptedRecord: ExperimentRunRecord = {
        experimentId: 'EXP_TEST_CORRUPTED_B5',
        runId: 'run_test_corrupt',
        trialId: 'trial_test_corrupt_B5',
        trialIndex: 1,
        timestamp: Date.now(),
        systemName: 'IntentNav-SCFR (Invention Prototype)',
        siteVersion: 'SiteA',
        queryId: 'INT_001',
        queryText: 'Disable marketing emails',
        expectedCapability: 'CAP_DISABLE_MARKETING',
        selectedCandidateId: 'btn-1',
        status: 'SUCCESS', // Incompatible with incomplete: true
        incomplete: true,
        missingMetadata: true,
        transitionValidated: true,
        causallyVerified: true,
        authorized: true,
        latencyMs: 50,
      };

      expect(() => MetricValidator.validate(metrics, [corruptedRecord], true)).toThrow(
        /is marked incomplete but has status SUCCESS/
      );
    });
  });

  describe('5. Unique Trial Identifiers and MetricValidator Checks', () => {
    it('enforces uniqueness of trialId across all records', () => {
      const metrics: BenchmarkMetrics[] = [
        {
          systemName: 'Baseline 1: Fixed Selector Replay',
          totalQueries: 2,
          top1Accuracy: 0,
          top3Accuracy: 0,
          decoyRejectionRate: 1.0,
          falseDiscoveryRate: 0,
          uiChangeRecoveryRate: 0,
          simulatedTransitionValidationRate: 0,
          causalVerificationRate: 0,
          unauthorizedHighRiskExecutions: 0,
          avgLatencyMs: 0,
        },
      ];

      const duplicateTrialId = 'trial_duplicate_001_B1';
      const records: ExperimentRunRecord[] = [
        {
          experimentId: 'EXP_0001_B1',
          trialId: duplicateTrialId,
          timestamp: Date.now(),
          systemName: 'Baseline 1: Fixed Selector Replay',
          siteVersion: 'SiteA',
          queryId: 'INT_001',
          queryText: 'query 1',
          expectedCapability: 'CAP_DISABLE_MARKETING',
          selectedCandidateId: null,
          status: 'FAILED',
          transitionValidated: false,
          causallyVerified: false,
          authorized: false,
          latencyMs: 0,
        },
        {
          experimentId: 'EXP_0002_B1',
          trialId: duplicateTrialId, // DUPLICATE!
          timestamp: Date.now() + 10,
          systemName: 'Baseline 1: Fixed Selector Replay',
          siteVersion: 'SiteB',
          queryId: 'INT_002',
          queryText: 'query 2',
          expectedCapability: 'CAP_DISABLE_MARKETING',
          selectedCandidateId: null,
          status: 'FAILED',
          transitionValidated: false,
          causallyVerified: false,
          authorized: false,
          latencyMs: 0,
        },
      ];

      expect(() => MetricValidator.validate(metrics, records, true)).toThrow(/Duplicate trialId detected/);
    });
  });

  describe('6. Output-Path Protection and Phase 3 Package Isolation', () => {
    it('throws error when trying to write to frozen baseline evidence files', () => {
      const frozenFiles = BenchmarkReporter.FROZEN_EVIDENCE_FILES;
      expect(frozenFiles.length).toBeGreaterThanOrEqual(6);

      for (const frozen of frozenFiles) {
        expect(() => BenchmarkReporter.assertSafeOutputPath(frozen)).toThrow(
          /BENCHMARK INTEGRITY VIOLATION: Cannot overwrite frozen baseline evidence file/
        );
        expect(() => BenchmarkReporter.assertSafeOutputPath(`/absolute/path/${frozen}`)).toThrow(
          /BENCHMARK INTEGRITY VIOLATION: Cannot overwrite frozen baseline evidence file/
        );
        expect(() => MetricValidator.validateOutputPath(frozen)).toThrow(
          /BENCHMARK INTEGRITY VIOLATION/
        );
      }
    });

    it('throws error when trying to write to authoritative patent requirements directory', () => {
      expect(() =>
        BenchmarkReporter.assertSafeOutputPath('docs/patent-requirements/v6.docx')
      ).toThrow(/BENCHMARK INTEGRITY VIOLATION: Cannot write to authoritative patent requirements/);

      expect(() =>
        BenchmarkReporter.assertSafeOutputPath('docs/patent-requirements/new_report.md')
      ).toThrow(/BENCHMARK INTEGRITY VIOLATION: Cannot write to authoritative patent requirements/);
    });

    it('permits writing to dedicated Phase 3 output directories', () => {
      expect(() => BenchmarkReporter.assertSafeOutputPath('benchmark/results/phase3/results.json')).not.toThrow();
      expect(() => BenchmarkReporter.assertSafeOutputPath('benchmark/results/phase3/summary.csv')).not.toThrow();
      expect(() => MetricValidator.validateOutputPath('benchmark/results/phase3/report.md')).not.toThrow();
    });

    it('exports complete Phase 3 package cleanly to dedicated output path', () => {
      const tempPhase3Dir = path.resolve(__dirname, '../../benchmark/results/phase3_test_tmp');
      try {
        const dummyMetrics: BenchmarkMetrics[] = [
          {
            systemName: 'IntentNav-SCFR (Invention Prototype)',
            totalQueries: 1,
            top1Accuracy: 1.0,
            top3Accuracy: 1.0,
            decoyRejectionRate: 1.0,
            falseDiscoveryRate: 0,
            uiChangeRecoveryRate: 1.0,
            simulatedTransitionValidationRate: 1.0,
            causalVerificationRate: 1.0,
            unauthorizedHighRiskExecutions: 0,
            avgLatencyMs: 12.5,
          },
        ];

        const dummyRecord: ExperimentRunRecord = {
          experimentId: 'EXP_TEST_001_B5',
          runId: 'run_test_phase3',
          trialId: 'trial_test_phase3_001_B5',
          trialIndex: 1,
          timestamp: Date.now(),
          systemName: 'IntentNav-SCFR (Invention Prototype)',
          siteVersion: 'SiteA',
          queryId: 'INT_001',
          queryText: 'Disable marketing emails',
          expectedCapability: 'CAP_DISABLE_MARKETING',
          selectedCandidateId: 'btn-test',
          status: 'SUCCESS',
          transitionValidated: true,
          causallyVerified: true,
          authorized: true,
          latencyMs: 12.5,
          memoryDeltaMb: 0.12,
        };

        const paths = BenchmarkReporter.exportPhase3Package(
          tempPhase3Dir,
          dummyMetrics,
          [dummyRecord]
        );

        expect(fs.existsSync(paths.rawRunsPath)).toBe(true);
        expect(fs.existsSync(paths.summaryPath)).toBe(true);
        expect(fs.existsSync(paths.csvPath)).toBe(true);
        expect(fs.existsSync(paths.reportPath)).toBe(true);
      } finally {
        if (fs.existsSync(tempPhase3Dir)) {
          fs.rmSync(tempPhase3Dir, { recursive: true, force: true });
        }
      }
    });
  });
});
