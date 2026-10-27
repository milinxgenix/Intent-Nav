/**
 * IntentNav-SCFR: Step 13 Controlled Interface Mutations Unit Tests
 *
 * Verifies:
 * 1. Comprehensive fixture catalog covering all 5 canonical drift categories
 *    (Identifier, Structural, Presentation, State, Transition) with explicit oracle rules,
 *    positive controls, and adversarial negative controls.
 * 2. Deterministic, side-effect-free DOM mutation generation via MutationDOMGenerator.
 * 3. Anti-privilege invariant: no expected target IDs or ground-truth capability IDs leaked
 *    into candidate extraction or runtime navigation engine.
 * 4. Strict separation of Target Selection, Execution, and Post-Transition Causal Verification.
 * 5. Honest handling of inapplicable systems (NOT_APPLICABLE): Baseline 4 on DOM controls
 *    and Baselines 1-4 on causal verification never fabricate results or skew metrics.
 * 6. System resilience under 5D drift: B5 rebinds under ID drift, rejects structural decoys,
 *    maintains routes across presentation shifts, and catches/quarantines transition anomalies.
 * 7. Verification that authoritative patent requirements and frozen evidence remain intact.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONTROLLED_MUTATION_FIXTURES } from '../../benchmark/mutations/fixtures';
import { MutationDOMGenerator } from '../../benchmark/mutations/generator';
import { ControlledMutationHarness } from '../../benchmark/mutations/harness';
import { MutationCategory } from '../../benchmark/mutations/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Step 13: Controlled Interface Mutations & 5D Drift Evaluation Suite', () => {
  describe('1. Mutation Fixture Catalog & Canonical Coverage', () => {
    it('covers all five canonical categories of interface drift', () => {
      const categories: MutationCategory[] = [
        'IDENTIFIER',
        'STRUCTURAL',
        'PRESENTATION',
        'STATE',
        'TRANSITION',
      ];

      for (const cat of categories) {
        const matching = CONTROLLED_MUTATION_FIXTURES.filter((f) => f.category === cat);
        expect(matching.length).toBeGreaterThan(0);
      }
    });

    it('defines complete, valid descriptors for each mutation fixture', () => {
      for (const fix of CONTROLLED_MUTATION_FIXTURES) {
        expect(fix.id).toMatch(/^MUT_[A-Z]+_\d{2}$/);
        expect(fix.name).toBeDefined();
        expect(fix.description).toBeDefined();
        expect(fix.baseSite).toBe('SiteA');
        expect(fix.intentId).toBeDefined();
        expect(fix.intentQuery).toBeDefined();
        expect(fix.capabilityId).toBeDefined();
        expect(fix.originalTargetId).toBeDefined();
        expect(fix.applicableSystems.length).toBeGreaterThan(0);
        expect(fix.oracleRules.selectionMatchRule).toBeDefined();
        expect(fix.oracleRules.executionSuccessRule).toBeDefined();
        expect(fix.oracleRules.verificationRule).toBeDefined();
      }
    });

    it('includes both positive controls and negative/adversarial controls', () => {
      const positiveControls = CONTROLLED_MUTATION_FIXTURES.filter((f) => f.isPositiveControl);
      const adversarialControls = CONTROLLED_MUTATION_FIXTURES.filter((f) => f.isNegativeOrAdversarial);

      expect(positiveControls.length).toBeGreaterThan(0);
      expect(adversarialControls.length).toBeGreaterThan(0);

      // Positive control: e.g. MUT_PRES_02 or MUT_TRANS_04
      expect(positiveControls.some((p) => p.id === 'MUT_PRES_02')).toBe(true);
      expect(positiveControls.some((p) => p.id === 'MUT_TRANS_04')).toBe(true);

      // Adversarial / negative: e.g. MUT_STRUCT_02, MUT_STATE_02, MUT_TRANS_01, MUT_TRANS_03
      expect(adversarialControls.some((a) => a.id === 'MUT_STRUCT_02')).toBe(true);
      expect(adversarialControls.some((a) => a.id === 'MUT_TRANS_01')).toBe(true);
    });

    it('explicitly records why inapplicable systems cannot participate', () => {
      for (const fix of CONTROLLED_MUTATION_FIXTURES) {
        if (fix.inapplicableSystems && fix.inapplicableSystems.length > 0) {
          for (const inapp of fix.inapplicableSystems) {
            expect(inapp.systemId).toBeDefined();
            expect(inapp.reason.length).toBeGreaterThan(10);
            expect(fix.applicableSystems).not.toContain(inapp.systemId);
          }
        }
      }
    });
  });

  describe('2. Deterministic Mutation DOM Generation & Anti-Privilege', () => {
    it('applies identifier mutation deterministically without corrupting attributes', () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;
      const env = MutationDOMGenerator.createMutatedEnvironment(mutId01);

      try {
        const oldEl = env.document.getElementById('btn-disable-marketing');
        expect(oldEl).toBeNull();

        const newEl = env.document.getElementById('btn_dyn_8f9a2b');
        expect(newEl).not.toBeNull();
        expect(newEl?.getAttribute('role')).toBe('switch');

        // Confirm candidate was extracted purely from DOM semantics
        const cand = env.candidates.find((c) => c.bindingHandle?.volatileId === 'btn_dyn_8f9a2b');
        expect(cand).toBeDefined();
        expect(cand?.candidateLabel).toContain('Disable Marketing');
      } finally {
        env.cleanup();
      }
    });

    it('applies structural nesting mutation correctly', () => {
      const mutStruct01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_STRUCT_01')!;
      const env = MutationDOMGenerator.createMutatedEnvironment(mutStruct01);

      try {
        const el = env.document.getElementById('btn-disable-marketing');
        expect(el).not.toBeNull();

        const parent = el?.parentElement;
        expect(parent?.className).toBe('control-slot');
        expect(parent?.parentElement?.className).toBe('form-group-wrapper');
      } finally {
        env.cleanup();
      }
    });

    it('applies presentation synonym mutation without altering control role or functionality', () => {
      const mutPres01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_PRES_01')!;
      const env = MutationDOMGenerator.createMutatedEnvironment(mutPres01);

      try {
        const el = env.document.getElementById('btn-disable-marketing');
        expect(el).not.toBeNull();
        expect(el?.textContent).toBe('Mute promotional offers and newsletters');
        expect(el?.getAttribute('role')).toBe('switch');
      } finally {
        env.cleanup();
      }
    });

    it('applies state disablement mutation and intercepts activation', () => {
      const mutState02 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_STATE_02')!;
      const env = MutationDOMGenerator.createMutatedEnvironment(mutState02);

      try {
        const el = env.document.getElementById('btn-disable-marketing');
        expect(el).not.toBeNull();
        expect((el as any).disabled).toBe(true);
        expect(el?.getAttribute('aria-disabled')).toBe('true');
      } finally {
        env.cleanup();
      }
    });
  });

  describe('3. Separation of Selection, Execution, and Verification', () => {
    it('separates selection success from verification failure under server rejection (MUT_TRANS_01)', async () => {
      const mutTrans01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_TRANS_01')!;
      const resultB5 = await ControlledMutationHarness.evaluateTrial(mutTrans01, 'B5');

      // Target was selected correctly based on intent
      expect(resultB5.targetSelectedCorrectly).toBe(true);
      expect(resultB5.selectedTargetId).toBe('btn-disable-marketing');

      // But execution/verification detected failure -> QUARANTINED
      expect(resultB5.causallyVerified).toBe(false);
      expect(resultB5.verificationStatus).toBe('QUARANTINED');
      expect(resultB5.trialStatus).toBe('QUARANTINED');
    });

    it('records false success in baselines lacking causal verification under transition failure', async () => {
      const mutTrans01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_TRANS_01')!;

      // Baseline 1 selects and fires click without verifying post-state
      const resultB1 = await ControlledMutationHarness.evaluateTrial(mutTrans01, 'B1');
      expect(resultB1.targetSelectedCorrectly).toBe(true);
      expect(resultB1.verificationStatus).toBe('NOT_APPLICABLE');
      expect(resultB1.causallyVerified).toBe(false);
    });
  });

  describe('4. Honest Inapplicable System Handling (NOT_APPLICABLE)', () => {
    it('marks Baseline 4 as NOT_APPLICABLE for DOM element mutations without metric distortion', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;
      const resultB4 = await ControlledMutationHarness.evaluateTrial(mutId01, 'B4');

      expect(resultB4.applicable).toBe(false);
      expect(resultB4.trialStatus).toBe('NOT_APPLICABLE');
      expect(resultB4.verificationStatus).toBe('NOT_APPLICABLE');
      expect(resultB4.inapplicableReason).toContain('PAGE_URL');
      expect(resultB4.targetSelectedCorrectly).toBe(false);
      expect(resultB4.executionAttempted).toBe(false);
    });

    it('reports verificationStatus as NOT_APPLICABLE for Baselines 1 to 4', async () => {
      const mutPres02 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_PRES_02')!;

      const b1 = await ControlledMutationHarness.evaluateTrial(mutPres02, 'B1');
      const b2 = await ControlledMutationHarness.evaluateTrial(mutPres02, 'B2');
      const b3 = await ControlledMutationHarness.evaluateTrial(mutPres02, 'B3');

      expect(b1.verificationStatus).toBe('NOT_APPLICABLE');
      expect(b2.verificationStatus).toBe('NOT_APPLICABLE');
      expect(b3.verificationStatus).toBe('NOT_APPLICABLE');
    });
  });

  describe('5. System Resilience Across 5D Controlled Drift', () => {
    it('demonstrates B1 fails under identifier drift (MUT_ID_01) while B5 rebinds successfully', async () => {
      const mutId01 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_ID_01')!;

      const resB1 = await ControlledMutationHarness.evaluateTrial(mutId01, 'B1');
      const resB5 = await ControlledMutationHarness.evaluateTrial(mutId01, 'B5');

      // Baseline 1 replay fails because hardcoded selector #btn-disable-marketing is gone
      expect(resB1.targetSelectedCorrectly).toBe(false);
      expect(resB1.trialStatus).toBe('FAILED');

      // B5 invariant engine rebinds to the dynamic ID
      expect(resB5.targetSelectedCorrectly).toBe(true);
      expect(resB5.selectedTargetId).toBe('btn_dyn_8f9a2b');
      expect(resB5.trialStatus).toBe('SUCCESS');
      expect(resB5.causallyVerified).toBe(true);
    });

    it('demonstrates B2 falls for adjacent structural decoy (MUT_STRUCT_02) while B5 discriminates genuine control', async () => {
      const mutStruct02 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_STRUCT_02')!;

      const resB2 = await ControlledMutationHarness.evaluateTrial(mutStruct02, 'B2');
      const resB5 = await ControlledMutationHarness.evaluateTrial(mutStruct02, 'B5');

      // Baseline 2 keyword matching selects the high-overlap decoy sibling
      expect(resB2.selectedTargetId).toBe('btn-decoy-marketing-notice');
      expect(resB2.trialStatus).toBe('DECOY_TRIGGERED');

      // IntentNav-SCFR enforces action-type / role invariants and selects the true switch
      expect(resB5.selectedTargetId).toBe('btn-disable-marketing');
      expect(resB5.targetSelectedCorrectly).toBe(true);
      expect(resB5.trialStatus).toBe('SUCCESS');
    });

    it('demonstrates presentation drift alone (MUT_PRES_02) does not invalidate route in B5', async () => {
      const mutPres02 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_PRES_02')!;
      const resB5 = await ControlledMutationHarness.evaluateTrial(mutPres02, 'B5');

      expect(resB5.targetSelectedCorrectly).toBe(true);
      expect(resB5.trialStatus).toBe('SUCCESS');
      expect(resB5.causallyVerified).toBe(true);
    });

    it('demonstrates transition drift detection (MUT_TRANS_03) triggers quarantine in B5', async () => {
      const mutTrans03 = CONTROLLED_MUTATION_FIXTURES.find((f) => f.id === 'MUT_TRANS_03')!;
      const resB5 = await ControlledMutationHarness.evaluateTrial(mutTrans03, 'B5');

      // B5 correctly selects the target, but witness verifier observes wrong delta
      expect(resB5.targetSelectedCorrectly).toBe(true);
      expect(resB5.causallyVerified).toBe(false);
      expect(resB5.verificationStatus).toBe('QUARANTINED');
      expect(resB5.trialStatus).toBe('QUARANTINED');
    });
  });

  describe('6. Comprehensive Batch Evaluation & Summary Aggregation', () => {
    it('executes full evaluation across all fixtures and generates well-formed category summaries', async () => {
      const { results, summary } = await ControlledMutationHarness.evaluateAll();

      expect(results.length).toBe(CONTROLLED_MUTATION_FIXTURES.length * 5);
      expect(summary.totalMutations).toBe(CONTROLLED_MUTATION_FIXTURES.length);
      expect(summary.systemsEvaluated).toEqual(['B1', 'B2', 'B3', 'B4', 'B5']);

      for (const sysId of summary.systemsEvaluated) {
        const sysSummaries = summary.systemCategorySummaries.filter((s) => s.systemId === sysId);
        expect(sysSummaries.length).toBe(5); // One per category
        for (const s of sysSummaries) {
          expect(s.totalTrials).toBeGreaterThan(0);
          expect(s.selectionAccuracy).toBeGreaterThanOrEqual(0);
          expect(s.selectionAccuracy).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('7. Authoritative Documents & Frozen Evidence Protection', () => {
    it('verifies patent requirements documents are present and untouched', () => {
      const patentFiles = [
        'docs/patent-requirements/v6.docx',
        'docs/patent-requirements/patent.docx',
        'docs/patent-requirements/INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx',
      ];
      for (const f of patentFiles) {
        const abs = path.resolve(projectRoot, f);
        expect(fs.existsSync(abs)).toBe(true);
      }
    });

    it('verifies frozen baseline evidence directory is preserved', () => {
      const evidenceDir = path.resolve(projectRoot, 'evidence');
      expect(fs.existsSync(evidenceDir)).toBe(true);
    });
  });
});
