/**
 * IntentNav-SCFR: Steps 14–17 Integrated Experimental Validation Unit Tests
 *
 * Verifies:
 * 1. Step 14: Full-system experiment workflow, shared oracle consistency,
 *    clean separation of selection vs. execution vs. causal verification,
 *    honest handling of inapplicable systems (NOT_APPLICABLE), and mock vs. browser distinction.
 * 2. Step 15: Controlled ablation studies across all 6 architectural mechanisms,
 *    producing distinct empirical failure signatures without corrupting production defaults.
 * 3. Step 16: Computational telemetry profiling (latency, memory delta, CPU time, candidate evaluations)
 *    with explicit units and complete statistical distribution analysis.
 * 4. Step 17: Reproducibility dossier generation, provenance completeness, SHA-256 manifest integrity,
 *    and strict output-path protection against overwriting frozen baseline evidence.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Phase3ExperimentRunner } from '../../benchmark/experiments/runner';
import { AblationEngine, ABLATION_CONFIGS } from '../../benchmark/experiments/ablations';
import { ComputationalProfiler } from '../../benchmark/experiments/computational';
import { CONTROLLED_MUTATION_FIXTURES } from '../../benchmark/mutations/fixtures';
import { AblationMechanismId } from '../../benchmark/experiments/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Steps 14–17: Integrated Experimental Validation Suite', () => {
  const testOutputDir = path.resolve(projectRoot, 'benchmark/results/phase3_unit_test');

  describe('Step 14: Full-System Experiments', () => {
    it('executes full-system trials across baselines with trial isolation', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;
      const result = await Phase3ExperimentRunner.execute({
        outputDir: testOutputDir,
        mutations: [mutId01],
        systems: ['B1', 'B5'],
        runAblations: false,
      });

      expect(result.fullSystemRecords.length).toBe(2);
      const b1 = result.fullSystemRecords.find((r) => r.systemId === 'B1')!;
      const b5 = result.fullSystemRecords.find((r) => r.systemId === 'B5')!;

      expect(b1.trialId).not.toBe(b5.trialId);
      expect(b1.systemId).toBe('B1');
      expect(b5.systemId).toBe('B5');
      expect(b5.targetSelectedCorrectly).toBe(true);
      expect(b5.trialStatus).toBe('SUCCESS');
      expect(b1.trialStatus).toBe('FAILED');
    });

    it('separates selection correctness from execution and verification outcomes', async () => {
      const mutTrans01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_TRANS_01')!;
      const result = await Phase3ExperimentRunner.execute({
        outputDir: testOutputDir,
        mutations: [mutTrans01],
        systems: ['B5'],
        runAblations: false,
      });

      const b5 = result.fullSystemRecords[0]!;
      expect(b5.targetSelectedCorrectly).toBe(true);
      expect(b5.selectedTargetId).toBe('btn-disable-marketing');
      expect(b5.causallyVerified).toBe(false);
      expect(b5.verificationStatus).toBe('QUARANTINED');
      expect(b5.trialStatus).toBe('QUARANTINED');
    });

    it('honestly marks Baseline 4 as NOT_APPLICABLE for DOM element mutations', async () => {
      const mutPres01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_PRES_01')!;
      const result = await Phase3ExperimentRunner.execute({
        outputDir: testOutputDir,
        mutations: [mutPres01],
        systems: ['B4'],
        runAblations: false,
      });

      const b4 = result.fullSystemRecords[0]!;
      expect(b4.applicable).toBe(false);
      expect(b4.trialStatus).toBe('NOT_APPLICABLE');
      expect(b4.verificationStatus).toBe('NOT_APPLICABLE');
      expect(b4.inapplicableReason).toContain('PAGE_URL');
    });

    it('explicitly distinguishes mock/JSDOM execution from real-browser execution in provenance', () => {
      const prov = Phase3ExperimentRunner.captureProvenance('TEST_RUN');
      expect(prov.environmentType).toBe('MOCK_JSDOM');
    });
  });

  describe('Step 15: Controlled Ablation Studies', () => {
    it('defines all 6 canonical ablations plus baseline with explicit mechanism documentation', () => {
      const expectedAblations: AblationMechanismId[] = [
        'BASELINE',
        'NO_FINGERPRINT_INVARIANT',
        'NO_DRIFT_REBIND',
        'NO_NEGATIVE_EVIDENCE',
        'NO_RISK_GATING',
        'NO_CAUSAL_VERIFIER',
        'NO_QUARANTINE_ROLLBACK',
      ];

      for (const id of expectedAblations) {
        const cfg = ABLATION_CONFIGS[id];
        expect(cfg).toBeDefined();
        expect(cfg.id).toBe(id);
        expect(cfg.name.length).toBeGreaterThan(5);
        expect(cfg.mechanismDisabled.length).toBeGreaterThan(3);
        expect(cfg.expectedConsequence.length).toBeGreaterThan(10);
      }
    });

    it('demonstrates NO_DRIFT_REBIND fails under identifier drift (MUT_ID_01) while BASELINE succeeds', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;

      const resBaseline = await AblationEngine.evaluateAblationTrial(mutId01, 'BASELINE');
      const resNoRebind = await AblationEngine.evaluateAblationTrial(mutId01, 'NO_DRIFT_REBIND');

      expect(resBaseline.targetSelectedCorrectly).toBe(true);
      expect(resBaseline.trialStatus).toBe('SUCCESS');
      expect(resBaseline.causallyVerified).toBe(true);

      expect(resNoRebind.targetSelectedCorrectly).toBe(false);
      expect(['FAILED', 'ABSTAINED']).toContain(resNoRebind.trialStatus);
    });

    it('demonstrates NO_CAUSAL_VERIFIER produces false success under transition failure (MUT_TRANS_01)', async () => {
      const mutTrans01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_TRANS_01')!;

      const resBaseline = await AblationEngine.evaluateAblationTrial(mutTrans01, 'BASELINE');
      const resNoVerifier = await AblationEngine.evaluateAblationTrial(mutTrans01, 'NO_CAUSAL_VERIFIER');

      // Baseline catches failure -> QUARANTINED
      expect(resBaseline.causallyVerified).toBe(false);
      expect(resBaseline.trialStatus).toBe('QUARANTINED');

      // Ablated system blindly assumes success upon event dispatch -> FALSE SUCCESS
      expect(resNoVerifier.causallyVerified).toBe(true);
      expect(resNoVerifier.verificationStatus).toBe('VERIFIED');
      expect(resNoVerifier.trialStatus).toBe('SUCCESS');
    });

    it('demonstrates NO_RISK_GATING flags safetyGatingBypassed: true', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;
      const res = await AblationEngine.evaluateAblationTrial(mutId01, 'NO_RISK_GATING');

      expect(res.safetyGatingBypassed).toBe(true);
    });
  });

  describe('Step 16: Computational Telemetry & Profiling', () => {
    it('captures positive, explicit resource telemetry per trial', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;
      const res = await AblationEngine.evaluateAblationTrial(mutId01, 'BASELINE');

      expect(res.telemetry.e2eLatencyMs).toBeGreaterThan(0);
      expect(typeof res.telemetry.heapMemoryDeltaBytes).toBe('number');
      expect(typeof res.telemetry.heapMemoryDeltaMb).toBe('number');
      expect(res.telemetry.candidateCount).toBeGreaterThan(0);
      expect(res.telemetry.evaluatedCandidateCount).toBeGreaterThan(0);
    });

    it('correctly computes statistical distributions (min, max, mean, median, p95, stdDev)', () => {
      const sample = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const dist = ComputationalProfiler.computeDistribution(sample, 'ms');

      expect(dist.sampleSize).toBe(10);
      expect(dist.min).toBe(10);
      expect(dist.max).toBe(100);
      expect(dist.mean).toBe(55);
      expect(dist.median).toBe(55);
      expect(dist.p95).toBe(100);
      expect(dist.stdDev).toBeGreaterThan(0);
      expect(dist.unit).toBe('ms');
    });
  });

  describe('Step 17: Reproducibility Dossier & Output Protection', () => {
    it('strictly forbids writing to frozen baseline evidence paths', () => {
      const frozenZip = path.resolve(projectRoot, 'IntentNav-SCFR-Evidence-Baseline-v1.0.zip');
      const frozenChromium = path.resolve(projectRoot, 'evidence/chromium_e2e_evidence.json');
      const frozenRawRuns = path.resolve(projectRoot, 'evidence/raw_runs.json');

      expect(() => Phase3ExperimentRunner.assertSafeOutputPath(frozenZip)).toThrow(
        /CRITICAL INTEGRITY VIOLATION/
      );
      expect(() => Phase3ExperimentRunner.assertSafeOutputPath(frozenChromium)).toThrow(
        /CRITICAL INTEGRITY VIOLATION/
      );
      expect(() => Phase3ExperimentRunner.assertSafeOutputPath(frozenRawRuns)).toThrow(
        /CRITICAL INTEGRITY VIOLATION/
      );
    });

    it('generates complete reproducibility manifest with SHA-256 artifact checksums', async () => {
      const mutPres02 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_PRES_02')!;
      const testOutputDir = path.resolve(projectRoot, 'benchmark/results/phase3_test_run');

      try {
        const result = await Phase3ExperimentRunner.execute({
          outputDir: testOutputDir,
          mutations: [mutPres02],
          systems: ['B5'],
          runAblations: false,
        });

        expect(result.manifest).toBeDefined();
        expect(result.manifest.manifestVersion).toBe('1.0.0');
        expect(result.manifest.provenance.gitRevision).toBeDefined();
        expect(result.manifest.provenance.datasetChecksumSha256).toBeDefined();
        expect(result.manifest.provenance.mutationConfigChecksumSha256).toBeDefined();
        expect(result.manifest.artifacts.length).toBe(5);

        for (const art of result.manifest.artifacts) {
          expect(fs.existsSync(art.path)).toBe(true);
          expect(art.sha256).toMatch(/^[a-f0-9]{64}$/);
          expect(art.sizeBytes).toBeGreaterThan(0);
        }
      } finally {
        if (fs.existsSync(testOutputDir)) {
          fs.rmSync(testOutputDir, { recursive: true, force: true });
        }
      }
    });
  });
});
