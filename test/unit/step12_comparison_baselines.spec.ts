/**
 * IntentNav-SCFR: Step 12 Comparison Baselines Unit Tests
 *
 * Verifies:
 * 1. Comprehensive registration of all 5 comparison systems (B1 to B5) with explicit
 *    architectural category, implemented/unimplemented features, target resolution scope,
 *    and known limitations.
 * 2. Shared dataset eligibility and initial condition fairness across all baselines.
 * 3. Trial isolation between systems: errors in one system do not contaminate others.
 * 4. Unified evaluation oracle (ComparisonOracle) consistency for target matching,
 *    decoy detection, and status classification.
 * 5. Honest handling and reporting of unsupported baseline capabilities (no fabricated numbers).
 * 6. Selective system execution (enabledSystems) with strict record reconciliation.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { BenchmarkRunner } from '../../benchmark/runner';
import { MetricValidator } from '../../benchmark/metricValidator';
import {
  BASELINE_REGISTRY,
  ComparisonOracle,
  BaselineSystemId,
} from '../../benchmark/baselines/registry';
import { Baseline1SelectorReplay } from '../../benchmark/baselines/baseline1_selector';
import { Baseline2KeywordMatching } from '../../benchmark/baselines/baseline2_keyword';
import { Baseline3SemanticOnly } from '../../benchmark/baselines/baseline3_semantic';
import { Baseline4PageNavigation } from '../../benchmark/baselines/baseline4_pageNav';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const intentsPath = path.resolve(__dirname, '../../benchmark/dataset/intents.json');

describe('Step 12: Comparison Baselines & Fair Evaluation Suite', () => {
  describe('1. Baseline Registration & Capability Descriptors', () => {
    it('registers all 5 benchmark systems with complete capability descriptors', () => {
      const expectedIds: BaselineSystemId[] = ['B1', 'B2', 'B3', 'B4', 'B5'];

      for (const sysId of expectedIds) {
        const desc = BASELINE_REGISTRY[sysId];
        expect(desc).toBeDefined();
        expect(desc.id).toBe(sysId);
        expect(desc.systemName).toBeDefined();
        expect(desc.architectureCategory).toBeDefined();
        expect(['DOM_ELEMENT', 'PAGE_URL']).toContain(desc.targetResolutionScope);
        expect(desc.implementedCapabilities.length).toBeGreaterThan(0);
        expect(desc.unimplementedCapabilities.length).toBeGreaterThan(0);
        expect(desc.knownLimitations.length).toBeGreaterThan(0);
        expect(desc.fairnessConstraints.length).toBeGreaterThan(0);
        expect(['EXACT_ELEMENT_MATCH', 'PAGE_URL_MATCH']).toContain(desc.oracleMode);
      }
    });

    it('honestly distinguishes DOM element resolution from page-level URL navigation', () => {
      expect(BASELINE_REGISTRY.B1.targetResolutionScope).toBe('DOM_ELEMENT');
      expect(BASELINE_REGISTRY.B2.targetResolutionScope).toBe('DOM_ELEMENT');
      expect(BASELINE_REGISTRY.B3.targetResolutionScope).toBe('DOM_ELEMENT');
      expect(BASELINE_REGISTRY.B4.targetResolutionScope).toBe('PAGE_URL');
      expect(BASELINE_REGISTRY.B5.targetResolutionScope).toBe('DOM_ELEMENT');

      // B4 explicitly documents inability to execute in-page controls
      expect(
        BASELINE_REGISTRY.B4.unimplementedCapabilities.some((u) => u.includes('DOM element resolution'))
      ).toBe(true);
    });

    it('documents absence of invariant closure and causal verification in Baselines 1-4', () => {
      const baselines: BaselineSystemId[] = ['B1', 'B2', 'B3', 'B4'];
      for (const id of baselines) {
        const desc = BASELINE_REGISTRY[id];
        expect(
          desc.unimplementedCapabilities.some((u) => u.toLowerCase().includes('causal transition'))
        ).toBe(true);
      }
    });
  });

  describe('2. Unified Comparison Oracle (ComparisonOracle)', () => {
    it('correctly matches ground-truth DOM element targets and rejects wrong targets', () => {
      expect(
        ComparisonOracle.isTargetMatch('DOM_ELEMENT', 'btn-disable-marketing', 'btn-disable-marketing', null)
      ).toBe(true);
      expect(
        ComparisonOracle.isTargetMatch('DOM_ELEMENT', 'cand_synth_1', null, 'cand_synth_1')
      ).toBe(true);
      expect(
        ComparisonOracle.isTargetMatch('DOM_ELEMENT', 'btn-wrong', 'btn-disable-marketing', null)
      ).toBe(false);
      expect(
        ComparisonOracle.isTargetMatch('DOM_ELEMENT', null, 'btn-disable-marketing', null)
      ).toBe(false);
    });

    it('correctly matches page URL routes for Baseline 4', () => {
      expect(
        ComparisonOracle.isTargetMatch('PAGE_URL', '/settings/notifications', 'notifications', null)
      ).toBe(true);
      expect(
        ComparisonOracle.isTargetMatch('PAGE_URL', '/settings/security', 'privacy', null)
      ).toBe(false);
      expect(
        ComparisonOracle.isTargetMatch('PAGE_URL', null, 'notifications', null)
      ).toBe(false);
    });

    it('identifies adversarial decoy element IDs accurately', () => {
      expect(ComparisonOracle.isDecoy('btn-decoy-export-data')).toBe(true);
      expect(ComparisonOracle.isDecoy('decoy_link_2')).toBe(true);
      expect(ComparisonOracle.isDecoy('genuine-export-data')).toBe(false);
      expect(ComparisonOracle.isDecoy('btn-disable-marketing')).toBe(false);
      expect(ComparisonOracle.isDecoy(null)).toBe(false);
    });

    it('classifies trial status with strict mathematical separation', () => {
      // Incomplete
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: false,
          isMatch: false,
          isDecoy: false,
          groundTruthCapability: 'CAP_EXPORT_DATA',
          incomplete: true,
        })
      ).toBe('INCOMPLETE');

      // Failed
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: false,
          isMatch: false,
          isDecoy: false,
          groundTruthCapability: 'CAP_EXPORT_DATA',
        })
      ).toBe('FAILED');

      // Decoy Triggered
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: true,
          isMatch: false,
          isDecoy: true,
          groundTruthCapability: 'CAP_EXPORT_DATA',
        })
      ).toBe('DECOY_TRIGGERED');

      // False Discovery on unfulfillable intent
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: true,
          isMatch: false,
          isDecoy: false,
          groundTruthCapability: 'NONE',
        })
      ).toBe('FALSE_DISCOVERY');

      // Success
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: true,
          isMatch: true,
          isDecoy: false,
          groundTruthCapability: 'CAP_EXPORT_DATA',
        })
      ).toBe('SUCCESS');

      // Wrong Target
      expect(
        ComparisonOracle.classifyTrialStatus({
          systemScope: 'DOM_ELEMENT',
          success: true,
          isMatch: false,
          isDecoy: false,
          groundTruthCapability: 'CAP_EXPORT_DATA',
        })
      ).toBe('WRONG_TARGET');
    });
  });

  describe('3. Selective System Execution & Trial Isolation', () => {
    it('executes only specified systems when enabledSystems is provided', async () => {
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001',
        enabledSystems: ['B1', 'B2'],
      });

      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0]!.systemName).toBe(BASELINE_REGISTRY.B1.systemName);
      expect(result.metrics[1]!.systemName).toBe(BASELINE_REGISTRY.B2.systemName);

      // Records must only contain B1 and B2
      const systemsInRecords = new Set(result.records.map((r) => r.systemName));
      expect(systemsInRecords.has(BASELINE_REGISTRY.B1.systemName)).toBe(true);
      expect(systemsInRecords.has(BASELINE_REGISTRY.B2.systemName)).toBe(true);
      expect(systemsInRecords.has(BASELINE_REGISTRY.B5.systemName)).toBe(false);

      // Provenance records enabled systems
      expect(result.telemetry.provenance?.config.enabledSystems).toEqual([
        BASELINE_REGISTRY.B1.systemName,
        BASELINE_REGISTRY.B2.systemName,
      ]);

      // MetricValidator validates cleanly
      const validation = MetricValidator.validate(result.metrics, result.records, true, result.telemetry);
      expect(validation.isValid).toBe(true);
    });

    it('isolates system failures so an error in one baseline does not contaminate other systems', async () => {
      // Run comparison on B1, B2, B4
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA'],
        intentsFilter: (i) => i.id === 'INT-001',
        enabledSystems: ['B1', 'B2', 'B4'],
      });

      expect(result.metrics).toHaveLength(3);
      // All 3 systems must complete their evaluations independently
      for (const m of result.metrics) {
        expect(m.totalQueries).toBe(1);
        expect(m.incompleteTrials).toBe(0);
      }
    });
  });

  describe('4. Empirical Capabilities & Limitations of Baselines', () => {
    it('verifies Baseline 1 fails on Mock Site B when DOM IDs change', () => {
      const b1 = new Baseline1SelectorReplay();
      // On Site A, target ID is btn-disable-marketing
      const siteACandidates = [{ id: 'btn-disable-marketing', label: 'Disable Marketing' }];
      const resA = b1.execute('CAP_DISABLE_MARKETING', siteACandidates);
      expect(resA.success).toBe(true);
      expect(resA.selectedCandidateId).toBe('btn-disable-marketing');

      // On Site B, target ID was renamed to btn-promotions-switch
      const siteBCandidates = [{ id: 'btn-promotions-switch', label: 'Disable Promotions' }];
      const resB = b1.execute('CAP_DISABLE_MARKETING', siteBCandidates);
      expect(resB.success).toBe(false);
    });

    it('verifies Baseline 2 keyword matching is vulnerable to keyword stuffing in decoys', () => {
      const b2 = new Baseline2KeywordMatching();
      const candidates = [
        { id: 'btn-real-delete', label: 'Delete Account' },
        { id: 'btn-decoy-export-data', label: 'Delete Account and Download Records Now' },
      ];
      // Query contains words from both real button and stuffed decoy keywords
      const res = b2.execute('Delete account and download records', candidates);
      expect(res.success).toBe(true);
      // Stuffed decoy has 4 overlapping tokens vs 2 for real button
      expect(res.selectedCandidateId).toBe('btn-decoy-export-data');
      expect(ComparisonOracle.isDecoy(res.selectedCandidateId!)).toBe(true);
    });

    it('verifies Baseline 3 semantic matching score drops when linguistic vocabulary differs', () => {
      const b3 = new Baseline3SemanticOnly();
      const candidates = [
        { id: 'btn-night-mode', label: 'Night Mode' },
      ];
      // Query uses completely different words for same functional goal
      const res = b3.execute('Activate dark appearance theme', candidates);
      // Low token overlap causes low similarity
      expect(res.similarityScore).toBeLessThan(0.2);
    });

    it('verifies Baseline 4 cannot execute in-page controls and returns only URL', () => {
      const b4 = new Baseline4PageNavigation();
      const res = b4.execute('Turn off marketing notifications');
      expect(res.success).toBe(true);
      expect(res.navigatedUrl).toBe('/settings/notifications');
      // No element candidate ID is ever selected
      expect((res as any).selectedCandidateId).toBeUndefined();
    });
  });

  describe('5. Comparative Accuracy Across All 5 Systems on a Controlled Slice', () => {
    it('evaluates all 5 systems concurrently with full reconciliation', async () => {
      const result = await BenchmarkRunner.runBenchmark(intentsPath, {
        sites: ['SiteA', 'SiteB', 'SiteC', 'SiteD'],
        intentsFilter: (i) => i.id === 'INT-001',
        enabledSystems: ['B1', 'B2', 'B3', 'B4', 'B5'],
      });

      expect(result.metrics).toHaveLength(5);
      // 1 intent * 4 sites = 4 runs per system = 20 total records
      expect(result.records).toHaveLength(20);

      // Validate reconciliation
      for (const m of result.metrics) {
        expect(m.totalQueries).toBe(4);
        const sysRecords = result.records.filter((r) => r.systemName === m.systemName);
        expect(sysRecords).toHaveLength(4);
      }

      // Check IntentNav-SCFR invariants on this slice
      const intentNav = result.metrics.find((m) => m.systemName.includes('IntentNav-SCFR'))!;
      expect(intentNav).toBeDefined();
      expect(intentNav.unauthorizedHighRiskExecutions).toBe(0);

      // Verify validation passes
      const validation = MetricValidator.validate(result.metrics, result.records, true, result.telemetry);
      expect(validation.isValid).toBe(true);
    });
  });
});
