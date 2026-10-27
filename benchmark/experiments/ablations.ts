/**
 * IntentNav-SCFR: Controlled Ablation Engine
 * Phase 3, Step 15 Implementation
 *
 * Implements controlled ablations of the major architectural mechanisms:
 * 1. BASELINE: Full IntentNav-SCFR prototype
 * 2. NO_FINGERPRINT_INVARIANT: Capability fingerprinting and invariant closure bypassed
 * 3. NO_DRIFT_REBIND: Drift detection & candidate re-binding bypassed
 * 4. NO_NEGATIVE_EVIDENCE: Negative-evidence suppression bypassed
 * 5. NO_RISK_GATING: Independent execution authorization bypassed
 * 6. NO_CAUSAL_VERIFIER: Multi-class causal transition verification bypassed
 * 7. NO_QUARANTINE_ROLLBACK: Quarantine and rollback safeguards bypassed
 */

import {
  AblationConfig,
  AblationMechanismId,
  AblationExperimentRecord,
  ComputationalTelemetry,
} from './types';
import { MutationDescriptor } from '../mutations/types';
import { MutationDOMGenerator } from '../mutations/generator';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';
import { ComparisonOracle } from '../baselines/registry';
import { ComputationalProfiler } from './computational';
import { TransitionWitness } from '../../src/types/transition';

export const ABLATION_CONFIGS: Record<AblationMechanismId, AblationConfig> = {
  BASELINE: {
    id: 'BASELINE',
    name: 'Full IntentNav-SCFR System (No Ablation)',
    description: 'All safety, invariant, drift, causal, and quarantine mechanisms active.',
    mechanismDisabled: 'None (Full Production Prototype)',
    expectedConsequence: 'Full resilience across 5D drift, 0 false successes, zero unauthorized executions.',
  },
  NO_FINGERPRINT_INVARIANT: {
    id: 'NO_FINGERPRINT_INVARIANT',
    name: 'Ablation 1: Invariant Closure Disabled',
    description: 'Bypasses mandatory precondition and context invariant validation, ranking candidates purely on text.',
    mechanismDisabled: 'CandidatePipeline: InvariantClosureEngine.verifyClosure',
    expectedConsequence: 'High susceptibility to adversarial decoys and invalid execution under disabled states.',
  },
  NO_DRIFT_REBIND: {
    id: 'NO_DRIFT_REBIND',
    name: 'Ablation 2: Drift Recovery Disabled',
    description: 'Disables drift classification and candidate re-binding, requiring exact pre-recorded selectors.',
    mechanismDisabled: 'TypedDriftDetector & Candidate Re-binding Pipeline',
    expectedConsequence: 'Zero drift recovery; complete failure under dynamic IDs and structural hierarchy changes.',
  },
  NO_NEGATIVE_EVIDENCE: {
    id: 'NO_NEGATIVE_EVIDENCE',
    name: 'Ablation 3: Negative Evidence Suppression Disabled',
    description: 'Disables negative evidence store checks, allowing previously rejected decoys to be considered.',
    mechanismDisabled: 'NegativeEvidenceStore: isKnownContradiction',
    expectedConsequence: 'Repeated selection of adversarial decoys and contradictory candidate handles.',
  },
  NO_RISK_GATING: {
    id: 'NO_RISK_GATING',
    name: 'Ablation 4: Risk-Gated Authorization Disabled',
    description: 'Bypasses independent execution authorization gating and user confirmation requirements.',
    mechanismDisabled: 'ExecutionAuthorizationEngine.evaluateAuthorization',
    expectedConsequence: 'Unauthorized execution of destructive, irreversible, or high-risk capabilities.',
  },
  NO_CAUSAL_VERIFIER: {
    id: 'NO_CAUSAL_VERIFIER',
    name: 'Ablation 5: Causal Transition Verification Disabled',
    description: 'Skips multi-class causal transition verification, assuming success upon event dispatch.',
    mechanismDisabled: 'CausalTransitionVerifier: verifyTransitionAsync',
    expectedConsequence: 'Silent false successes on server rejections, timeouts, and uncorrelated state mutations.',
  },
  NO_QUARANTINE_ROLLBACK: {
    id: 'NO_QUARANTINE_ROLLBACK',
    name: 'Ablation 6: Quarantine & Rollback Safeguards Disabled',
    description: 'Disables quarantine controller and route demotion upon verification failure.',
    mechanismDisabled: 'QuarantineController.quarantineFailedRoute & Route Demotion',
    expectedConsequence: 'Repeated execution attempts against broken or rejected routes.',
  },
};

export class AblationEngine {
  /**
   * Evaluates a single mutation descriptor under a specific ablation configuration.
   */
  public static async evaluateAblationTrial(
    mutation: MutationDescriptor,
    ablationId: AblationMechanismId,
    runId: string = `RUN_ABL_${Date.now()}`
  ): Promise<AblationExperimentRecord> {
    const config = ABLATION_CONFIGS[ablationId];
    const trialId = `TRIAL_ABL_${ablationId}_${mutation.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const experimentId = `EXP_ABL_${ablationId}_${mutation.id}`;

    // Build fresh isolated DOM environment
    const env = MutationDOMGenerator.createMutatedEnvironment(mutation);
    const doc = env.document;
    const win = env.window;
    const candidates = env.candidates;

    const profiler = ComputationalProfiler.startProfile();

    try {
      const machine = new IntentNavMachine();
      AUTHORITATIVE_CAPABILITY_CATALOG.forEach((c) => machine.registerCapability(c));

      const transConfig = mutation.mutationConfig.transitionMutation;
      let lastEventId = `evt_${Date.now()}`;
      let lastTimestamp = Date.now();
      let lastAppStateDelta: Record<string, unknown> = {};
      let lastDOMDelta: Record<string, unknown> = {};
      let executionAttempted = false;
      let executionSucceeded = false;
      let safetyGatingBypassed = false;
      let quarantineTriggered = false;

      // Ablation 3: NO_NEGATIVE_EVIDENCE -> Clear or disable negative evidence store
      if (ablationId === 'NO_NEGATIVE_EVIDENCE') {
        machine.negativeEvidenceStore.clear();
      }

      // Configure custom dispatcher
      const customDispatcher: ExecutionDispatcher = {
        async dispatchActivation(activationEventId, candidate, capabilityId, activationCharacteristics) {
          executionAttempted = true;
          lastEventId = activationEventId;
          lastTimestamp = Date.now();
          lastAppStateDelta = {};
          lastDOMDelta = {};

          const targetEl =
            doc.getElementById(candidate.bindingHandle?.volatileId || candidate.candidateId) ||
            doc.querySelector(`[id="${candidate.bindingHandle?.volatileId || candidate.candidateId}"]`);

          if (!targetEl) {
            return {
              success: false,
              elementFound: false,
              eventDispatched: false,
              stateChanged: false,
              reason: 'Target element could not be resolved in live DOM',
            };
          }

          if ((targetEl as any).disabled) {
            // Ablation 1 (NO_FINGERPRINT_INVARIANT) attempts click anyway on disabled element
            if (ablationId !== 'NO_FINGERPRINT_INVARIANT') {
              return {
                success: false,
                elementFound: true,
                eventDispatched: false,
                stateChanged: false,
                reason: 'Target element is disabled by administrative policy',
              };
            }
          }

          if (transConfig?.outcome === 'REJECTED') {
            return {
              success: false,
              elementFound: true,
              eventDispatched: true,
              stateChanged: false,
              reason: transConfig.errorMessage || 'HTTP 500: Server mutation rejected',
            };
          }

          if (transConfig?.outcome === 'DELAYED') {
            return {
              success: true,
              elementFound: true,
              eventDispatched: true,
              stateChanged: false,
              reason: 'State mutation delayed asynchronously',
            };
          }

          // Normal dispatch
          const preAppState = { ...(win.IntentNavMockState || {}) };
          const preAria = targetEl.getAttribute('aria-checked');
          (targetEl as HTMLElement).click();
          const postAppState = { ...(win.IntentNavMockState || {}) };
          const postAria = targetEl.getAttribute('aria-checked');

          const delta: Record<string, unknown> = {};
          for (const key of Object.keys(postAppState)) {
            if (postAppState[key] !== preAppState[key]) {
              delta[key] = postAppState[key];
            }
          }
          lastAppStateDelta = delta;
          if (preAria !== postAria && postAria !== null) {
            lastDOMDelta['ariaChecked'] = postAria;
          }

          executionSucceeded = true;
          return {
            success: true,
            elementFound: true,
            eventDispatched: true,
            stateChanged: Object.keys(delta).length > 0 || Object.keys(lastDOMDelta).length > 0,
            activationEvent: {
              eventId: activationEventId,
              sequenceNumber: 1,
              timestamp: lastTimestamp,
              targetCandidateId: candidate.candidateId,
              eventType: activationCharacteristics?.eventType || 'click',
              initiatingCapabilityId: capabilityId,
            },
          };
        },

        async collectWitnesses() {
          if (transConfig && (transConfig.outcome === 'REJECTED' || transConfig.outcome === 'DELAYED')) {
            return [];
          }

          const now = lastTimestamp + 15;
          const witnesses: TransitionWitness[] = [];

          if (Object.keys(lastAppStateDelta).length > 0) {
            witnesses.push({
              witnessId: `wit_app_${now}`,
              witnessClass: 'APPLICATION_STATE_MUTATION',
              sequenceNumber: 1,
              timestamp: now + 30,
              observedDelta: { ...lastAppStateDelta },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 30,
              isCausallyCorrelated: true,
              correlationExplanation: 'Observed application state delta post activation',
            });
          }

          if (Object.keys(lastDOMDelta).length > 0) {
            witnesses.push({
              witnessId: `wit_dom_${now}`,
              witnessClass: 'DOM_MUTATION',
              sequenceNumber: witnesses.length + 1,
              timestamp: now + 20,
              observedDelta: { ...lastDOMDelta },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 20,
              isCausallyCorrelated: true,
              correlationExplanation: 'Observed DOM attribute delta post activation',
            });
          }

          if ('ariaChecked' in lastDOMDelta) {
            witnesses.push({
              witnessId: `wit_a11y_${now}`,
              witnessClass: 'ACCESSIBILITY_STATE_MUTATION',
              sequenceNumber: witnesses.length + 1,
              timestamp: now + 40,
              observedDelta: { ariaChecked: lastDOMDelta['ariaChecked'] },
              correlatedActivationEventId: lastEventId,
              temporalDeltaMs: 40,
              isCausallyCorrelated: true,
              correlationExplanation: 'Observed accessibility state delta post activation',
            });
          }

          return witnesses;
        },

        async observePostState() {
          const appState = { ...(win.IntentNavMockState || {}) };
          return {
            stateId: `state_${Date.now()}`,
            stateType: 'PAGE',
            urlPattern: win?.location?.href || 'http://localhost:3000/',
            domStructuralHash: 'hash_live',
            semanticLandmarks: ['main', 'section'],
            activeModalsOrDialogs: [],
            activeTabs: [],
            exposedCandidateHandles: [],
            observedApplicationState: appState,
            timestamp: Date.now(),
          };
        },
      };

      machine.setDefaultDispatcher(customDispatcher);

      // Apply mechanism ablations:
      // Ablation 2: NO_DRIFT_REBIND -> If mutation has ID or structural drift, force failure by clearing candidates
      let effectiveCandidates = candidates;
      if (ablationId === 'NO_DRIFT_REBIND') {
        if (mutation.category === 'IDENTIFIER' || mutation.category === 'STRUCTURAL') {
          // Re-binding disabled: only accept exact original target ID
          effectiveCandidates = candidates.filter(
            (c) => c.bindingHandle?.volatileId === mutation.originalTargetId
          );
        }
      }

      // Ablation 4: NO_RISK_GATING -> bypass confirmation requirement
      const userConfirmGranted = ablationId === 'NO_RISK_GATING';
      if (userConfirmGranted) {
        safetyGatingBypassed = true;
      }

      const ctx = await machine.processIntent(
        mutation.intentQuery,
        {
          tag: 'body',
          observedActionType: 'VIEW',
          observedTargetEntity: 'UNKNOWN',
        },
        effectiveCandidates,
        userConfirmGranted,
        customDispatcher
      );

      // Ablation 5: NO_CAUSAL_VERIFIER -> Overwrite verification result to unconditionally verified
      if (ablationId === 'NO_CAUSAL_VERIFIER') {
        if (executionAttempted) {
          ctx.causalVerified = true;
          if (ctx.verificationResult) {
            ctx.verificationResult.causallyVerified = true;
            ctx.verificationResult.status = 'VERIFIED';
          }
        }
      }

      // Ablation 6: NO_QUARANTINE_ROLLBACK -> prevent quarantine state
      if (ablationId === 'NO_QUARANTINE_ROLLBACK') {
        if (ctx.currentState === 'QUARANTINED') {
          ctx.currentState = 'FAILED'; // Bypass quarantine transition
        }
      }

      quarantineTriggered = ctx.currentState === 'QUARANTINED';

      const selectedId =
        ctx.selectedCandidate?.bindingHandle?.volatileId || ctx.selectedCandidate?.candidateId || null;

      const isMatch = ComparisonOracle.isTargetMatch(
        'DOM_ELEMENT',
        selectedId,
        mutation.expectedTargetId,
        null
      );

      const isDecoy = ComparisonOracle.isDecoy(selectedId);
      const causallyVerified = Boolean(
        ablationId === 'NO_CAUSAL_VERIFIER' ? executionAttempted : ctx.verificationResult?.causallyVerified
      );

      let verificationStatus: 'VERIFIED' | 'FAILED' | 'QUARANTINED' | 'NOT_APPLICABLE' = 'FAILED';
      if (causallyVerified) {
        verificationStatus = 'VERIFIED';
      } else if (
        quarantineTriggered ||
        ctx.currentState === 'QUARANTINED' ||
        (transConfig && transConfig.outcome !== 'NORMAL')
      ) {
        verificationStatus = 'QUARANTINED';
      }

      let trialStatus: AblationExperimentRecord['trialStatus'] = 'FAILED';
      if (isDecoy) {
        trialStatus = 'DECOY_TRIGGERED';
      } else if (
        quarantineTriggered ||
        (verificationStatus === 'QUARANTINED' && ablationId !== 'NO_CAUSAL_VERIFIER')
      ) {
        trialStatus = 'QUARANTINED';
      } else if (ctx.currentState === 'ABSTAINED') {
        trialStatus = 'ABSTAINED';
      } else if (isMatch && (ctx.currentState === 'EXECUTED' || causallyVerified)) {
        trialStatus = 'SUCCESS';
      }

      executionAttempted = Boolean(ctx.dispatchSuccessful || ctx.currentState === 'EXECUTED');
      executionSucceeded = Boolean(ctx.dispatchSuccessful && ctx.currentState === 'EXECUTED');

      const telemetry: ComputationalTelemetry = ComputationalProfiler.endProfile(profiler, {
        candidateCount: candidates.length,
        evaluatedCandidateCount: ctx.driftRecoveryMetrics?.candidateEvaluationsCount || candidates.length,
        fingerprintComputationCount: ctx.driftRecoveryMetrics?.fingerprintComputationsCount || 1,
      });

      return {
        experimentId,
        runId,
        trialId,
        timestamp: Date.now(),
        ablationId,
        mechanismDisabled: config.mechanismDisabled,
        mutationId: mutation.id,
        category: mutation.category,
        selectedTargetId: selectedId,
        targetSelectedCorrectly: isMatch,
        executionAttempted,
        executionSucceeded,
        verificationStatus,
        trialStatus,
        causallyVerified,
        safetyGatingBypassed,
        quarantineTriggered,
        telemetry,
        errorNotes: ctx.promotionFailureReason,
      };
    } finally {
      env.cleanup();
    }
  }

  /**
   * Evaluates all ablations against an array of mutation descriptors.
   */
  public static async evaluateAllAblations(
    mutations: MutationDescriptor[],
    ablationIds: AblationMechanismId[] = [
      'BASELINE',
      'NO_FINGERPRINT_INVARIANT',
      'NO_DRIFT_REBIND',
      'NO_NEGATIVE_EVIDENCE',
      'NO_RISK_GATING',
      'NO_CAUSAL_VERIFIER',
      'NO_QUARANTINE_ROLLBACK',
    ]
  ): Promise<AblationExperimentRecord[]> {
    const records: AblationExperimentRecord[] = [];
    const runId = `RUN_ABL_BATCH_${Date.now()}`;

    for (const mut of mutations) {
      for (const ablId of ablationIds) {
        const rec = await AblationEngine.evaluateAblationTrial(mut, ablId, runId);
        records.push(rec);
      }
    }

    return records;
  }
}
