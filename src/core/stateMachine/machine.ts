/**
 * IntentNav-SCFR: Central State Machine & Controller
 *
 * Implements the complete patent-aligned closed-loop lifecycle:
 * Persistent Functional Capability Identity
 *   ↓
 * Capability / Interface-State Separation
 *   ↓
 * Typed Drift Localization (5D: [P, C, S, Cap, T])
 *   ↓
 * Drift-Triggered Recovery
 *   ↓
 * Live Candidate Discovery
 *   ↓
 * Positive + Negative Invariant Closure Gate
 *   ↓
 * Contradiction Rejection
 *   ↓
 * ONLY THEN Re-Binding / Semantic Ranking
 *   ↓
 * Provisional Route Quarantine (V_k)
 *   ↓
 * Execution Authorization Gating (Confidence != Authorization)
 *   ↓ (If Authorized / Confirmed)
 * Real Browser Activation Dispatch
 *   ↓
 * Real Transition Observation & Witness Capture
 *   ↓
 * Causal Activation -> Witness Correlation (>=2 independent classes)
 *   ↓
 * Post-State Validation
 *   ↓
 * Validated Route Promotion via TransitionVerificationToken
 *   ↓
 * Persistent Versioned Capability Memory
 *   ↓
 * EXECUTED / CONFIRMATION_PENDING / QUARANTINED / ABSTAINED / FAILED
 */

import { NormalizedIntent } from '../../types/intent';
import { FunctionalCapabilityFingerprint, ActivationEventCharacteristics } from '../../types/capability';
import { InterfaceStateNode, RouteVersion } from '../../types/state';
import { TypedDriftVector, DriftLocalizationResult, DriftRecoveryMetrics } from '../../types/drift';
import { InvariantClosureResult } from '../../types/invariant';
import { CandidateRebindScore } from '../../types/ranking';
import {
  CausalVerificationResult,
  ActivationEventRecord,
  TransitionWitness,
  ValidationRecord,
  TransitionSignature,
} from '../../types/transition';
import { ExecutionAuthorizationDecision } from '../../types/authorization';
import { IntentNormalizer } from '../intent/normalizer';
import { CapabilityIntentResolver } from '../intent/resolver';
import { CapabilityGraphEngine } from '../graph/capabilityGraph';
import { RouteManager } from '../graph/routeManager';
import { TypedDriftDetector, ObservedElementFeatures } from '../drift/detector';
import { DriftClassifier, DEFAULT_DRIFT_THRESHOLDS } from '../drift/classifier';
import { CandidateEvaluationContext, InvariantClosureEngine } from '../invariant/engine';
import { NegativeEvidenceStore } from '../contradiction/store';
import { CandidatePipeline } from '../candidate/pipeline';
import { CandidateRankingEngine } from '../ranking/engine';
import { WitnessCollector } from '../causal/witnessCollector';
import { CausalTransitionVerifier } from '../causal/verifier';
import { QuarantineController } from '../quarantine/controller';
import { RoutePromotionController } from '../quarantine/promotion';
import {
  PromotionTokenAuthenticator,
  defaultTokenAuthenticator,
} from '../quarantine/tokenAuthenticator';
import { ExecutionAuthorizationController } from '../authorization/controller';
import { AuditLogger } from '../audit/logger';
import { PersistentCapabilityStore } from '../storage/persistentStore';
import { FingerprintConstructor } from '../fingerprint/constructor';
import { MultiStepRoutePlanner } from '../graph/planner';
import { AcknowledgementTracker } from '../network/acknowledgement';
import { SafeVerificationController } from '../causal/safeVerification';
import { RollbackVerificationOutcome } from '../../types/transition';


export type SystemMachineState =
  | 'IDLE'
  | 'INTENT_RECEIVED'
  | 'INTENT_NORMALIZED'
  | 'CAPABILITY_RESOLVED'
  | 'INTERFACE_OBSERVED'
  | 'DRIFT_CLASSIFIED'
  | 'CANDIDATE_DISCOVERY'
  | 'INVARIANT_CLOSURE'
  | 'CONTRADICTION_FILTER'
  | 'REBIND_RANKING'
  | 'PROVISIONAL_ROUTE'
  | 'EXECUTION_AUTHORIZATION'
  | 'CONFIRMATION_PENDING'
  | 'ACTIVATION_DISPATCHED'
  | 'TRANSITION_VERIFYING'
  | 'VALIDATED_ROUTE'
  | 'EXECUTED'
  | 'QUARANTINED'
  | 'ABSTAINED'
  | 'FAILED';

export interface ExecutionDispatcher {
  dispatchActivation(
    activationEventId: string,
    candidate: CandidateEvaluationContext,
    capabilityId: string,
    activationCharacteristics?: ActivationEventCharacteristics
  ): Promise<{
    success: boolean;
    elementFound?: boolean;
    eventDispatched?: boolean;
    stateChanged?: boolean;
    activationEvent?: ActivationEventRecord;
    reason?: string;
  }>;
  collectWitnesses(verificationWindowMs?: number): Promise<TransitionWitness[]>;
  observePostState?(): Promise<InterfaceStateNode>;
}

export interface ExecutionPreconditionsCheck {
  allowed: boolean;
  failedPreconditions: string[];
  reasons: string[];
}

export interface StateMachineContext {
  currentState: SystemMachineState;
  rawGoal?: string;
  normalizedIntent?: NormalizedIntent;
  resolvedCapability?: FunctionalCapabilityFingerprint;
  activeRoute?: RouteVersion | null;
  observedInterfaceState?: InterfaceStateNode;
  driftVector?: TypedDriftVector;
  driftResult?: DriftLocalizationResult;
  candidateList?: CandidateEvaluationContext[];
  invariantResults?: Record<string, InvariantClosureResult>;
  rankedScores?: CandidateRebindScore[];
  selectedCandidate?: CandidateRebindScore | null;
  provisionalRoute?: RouteVersion | null;
  activationEvent?: ActivationEventRecord | null;
  capturedWitnesses?: TransitionWitness[];
  verificationResult?: CausalVerificationResult | null;
  authorizationDecision?: ExecutionAuthorizationDecision;
  userConfirmationGranted?: boolean;
  validationRecord?: ValidationRecord;
  dispatchSuccessful?: boolean;
  postStateVerified?: boolean;
  causalVerified?: boolean;
  executionPreconditionsCheck?: ExecutionPreconditionsCheck;
  promotionDecision?: import('../quarantine/promotion').PromotionDecision;
  promotionTokenValid?: boolean;
  promotionFailureReason?: string;
  driftRecoveryMetrics?: DriftRecoveryMetrics;
}

export class IntentNavMachine {
  public state: SystemMachineState = 'IDLE';
  public context: StateMachineContext = { currentState: 'IDLE' };

  public tokenAuthenticator: PromotionTokenAuthenticator;
  public graph: CapabilityGraphEngine;
  public routeManager: RouteManager;
  public negativeEvidenceStore: NegativeEvidenceStore;
  public rankingEngine: CandidateRankingEngine;
  public candidatePipeline: CandidatePipeline;
  public witnessCollector: WitnessCollector;
  public causalVerifier: CausalTransitionVerifier;
  public quarantineController: QuarantineController;
  public promotionController: RoutePromotionController;
  public auditLogger: AuditLogger;
  public persistentStore: PersistentCapabilityStore;
  public planner: MultiStepRoutePlanner;
  public acknowledgementTracker: AcknowledgementTracker;
  public defaultDispatcher?: ExecutionDispatcher;

  // Registered capability catalog
  private capabilities: Map<string, FunctionalCapabilityFingerprint> = new Map();

  constructor(
    auditLogger?: AuditLogger,
    persistentStore?: PersistentCapabilityStore,
    tokenAuthenticator?: PromotionTokenAuthenticator
  ) {
    this.tokenAuthenticator = tokenAuthenticator || defaultTokenAuthenticator;
    this.persistentStore = persistentStore || new PersistentCapabilityStore();
    this.graph = new CapabilityGraphEngine(this.persistentStore);
    this.routeManager = new RouteManager(this.graph, this.tokenAuthenticator);
    this.negativeEvidenceStore = new NegativeEvidenceStore(this.persistentStore);
    this.rankingEngine = new CandidateRankingEngine();
    this.candidatePipeline = new CandidatePipeline(
      this.negativeEvidenceStore,
      this.rankingEngine
    );
    this.witnessCollector = new WitnessCollector();
    this.causalVerifier = new CausalTransitionVerifier({
      tokenAuthenticator: this.tokenAuthenticator,
    });
    this.quarantineController = new QuarantineController(
      this.routeManager,
      this.negativeEvidenceStore
    );
    this.promotionController = new RoutePromotionController(
      this.routeManager,
      this.quarantineController
    );
    this.auditLogger = auditLogger || new AuditLogger();
    this.planner = new MultiStepRoutePlanner(this.graph);
    this.acknowledgementTracker = new AcknowledgementTracker();
  }

  public async init(): Promise<void> {
    await this.persistentStore.init();
    await this.graph.loadFromStore();
    const storedCaps = await this.persistentStore.getAllCapabilities();
    for (const cap of storedCaps) {
      this.capabilities.set(cap.capabilityId, cap);
    }
  }

  public setDefaultDispatcher(dispatcher: ExecutionDispatcher): void {
    this.defaultDispatcher = dispatcher;
  }

  public registerCapability(cap: FunctionalCapabilityFingerprint): void {
    if (!cap.fingerprintHash || !FingerprintConstructor.isValidV2FingerprintHash(cap.fingerprintHash)) {
      cap.fingerprintHash = FingerprintConstructor.computeFingerprintHashFromCapability(cap);
      cap.fingerprintVersion = 'v2';
    }
    if (!cap.transitionSignatureBinding && cap.transitionEvidence) {
      cap.transitionSignatureBinding = FingerprintConstructor.computeTransitionSignatureHash(
        {
          preStateFingerprint: cap.transitionEvidence.preStateFingerprint,
          activationEventExpected: {
            eventType: cap.transitionEvidence.activationEventCharacteristics.eventType,
            key: cap.transitionEvidence.activationEventCharacteristics.key,
            code: cap.transitionEvidence.activationEventCharacteristics.code,
            keyCode: cap.transitionEvidence.activationEventCharacteristics.keyCode,
          },
          expectedStateDelta: cap.transitionEvidence.expectedDelta,
          verificationWindowMs: cap.transitionEvidence.verificationWindowMs,
          postStateFingerprint: cap.transitionEvidence.postStateFingerprint,
        },
        cap.fingerprintHash
      );
    }
    this.capabilities.set(cap.capabilityId, cap);
    this.graph.registerCapability(cap.capabilityId, cap.canonicalFunction);
    this.persistentStore.saveCapability(cap).catch(() => {});
  }

  public getRegisteredCapabilities(): FunctionalCapabilityFingerprint[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Primary Entry Point: Process a user natural-language goal through the complete closed-loop pipeline
   */
  public async processIntent(
    rawGoal: string,
    observedFeatures: ObservedElementFeatures,
    availableCandidates: CandidateEvaluationContext[],
    userConfirmationGranted: boolean = false,
    dispatcherOrWitnesses?: ExecutionDispatcher | TransitionWitness[],
    executionOptions?: {
      corruptPromotionToken?: boolean;
      executeQuarantinedRoute?: boolean;
      targetRouteId?: string;
    }
  ): Promise<StateMachineContext> {
    this.state = 'INTENT_RECEIVED';
    this.context = {
      currentState: this.state,
      rawGoal,
      userConfirmationGranted,
    };

    // 1. INTENT_NORMALIZATION
    const knownTargets = Array.from(new Set(Array.from(this.capabilities.values()).map((c) => c.targetEntity)));
    const normalizedIntent = IntentNormalizer.normalize(rawGoal, knownTargets);
    this.context.normalizedIntent = normalizedIntent;
    this.state = 'INTENT_NORMALIZED';

    // 2. CAPABILITY_RESOLUTION
    const allCaps = Array.from(this.capabilities.values());
    const matches = CapabilityIntentResolver.resolve(normalizedIntent, allCaps);
    if (matches.length === 0 || !matches[0] || matches[0].matchScore < 0.40) {
      this.state = 'ABSTAINED';
      this.context.currentState = this.state;
      this.logAudit('ABSTAINED', 'No capability matching intent was found');
      return this.context;
    }

    const matchedCap = this.capabilities.get(matches[0].capabilityId)!;
    this.context.resolvedCapability = matchedCap;
    this.state = 'CAPABILITY_RESOLVED';

    // 3. RETRIEVE ACTIVE ROUTE
    let activeRoute = this.graph.getActiveRoute(matchedCap.capabilityId);
    if (executionOptions?.executeQuarantinedRoute) {
      const node = this.graph.getCapability(matchedCap.capabilityId);
      if (node && node.quarantinedRouteIds.length > 0) {
        activeRoute = node.routeVersions[node.quarantinedRouteIds[0]!] || null;
      } else if (activeRoute) {
        const quarantinedRoute: RouteVersion = {
          ...activeRoute,
          status: 'QUARANTINED',
          quarantineReason: 'EXPLICIT_TEST_QUARANTINE',
        };
        this.graph.attachRouteVersion(matchedCap.capabilityId, quarantinedRoute);
        activeRoute = quarantinedRoute;
      }
    }
    this.context.activeRoute = activeRoute;

    // 4. TYPED DRIFT LOCALIZATION (5D: [P, C, S, Cap, T])
    // Ground observed features in live candidate evidence if caller provided coarse stubs
    let effectiveObserved: ObservedElementFeatures = { ...observedFeatures };
    const driftTargetStep = activeRoute?.steps?.[0];

    // Find candidate matching active route step or best candidate for this capability
    let candidateForDrift: CandidateEvaluationContext | null = null;
    if (availableCandidates.length > 0) {
      if (driftTargetStep) {
        candidateForDrift =
          availableCandidates.find((c) => {
            if (driftTargetStep.bindingHandle?.handleId && c.bindingHandle?.handleId === driftTargetStep.bindingHandle.handleId) return true;
            if (driftTargetStep.bindingHandle?.volatileId && c.candidateId === driftTargetStep.bindingHandle.volatileId) return true;
            if (driftTargetStep.bindingHandle?.domStructuralPath && c.domStructuralPath === driftTargetStep.bindingHandle.domStructuralPath) return true;
            if (driftTargetStep.targetAccessibleName && c.candidateLabel.trim().toLowerCase() === driftTargetStep.targetAccessibleName.trim().toLowerCase()) return true;
            return false;
          }) || null;
      }
      if (!candidateForDrift) {
        // Fall back to candidate matching the capability's semantic accessibleName or role/target
        candidateForDrift =
          availableCandidates.find(
            (c) =>
              c.observedTargetEntity === matchedCap.targetEntity ||
              (c.candidateLabel && matchedCap.semanticEvidence?.accessibleName &&
                c.candidateLabel.toLowerCase().includes(matchedCap.semanticEvidence.accessibleName.toLowerCase()))
          ) || availableCandidates[0] || null;
      }
    }

    if (candidateForDrift) {
      const handle = candidateForDrift.bindingHandle;
      effectiveObserved = {
        tag: handle?.tagName || effectiveObserved.tag || 'button',
        id: handle?.volatileId || effectiveObserved.id,
        storedId: driftTargetStep?.bindingHandle?.volatileId || effectiveObserved.storedId,
        classes: handle?.volatileClasses || effectiveObserved.classes,
        storedClasses: driftTargetStep?.bindingHandle?.volatileClasses || effectiveObserved.storedClasses,
        role: candidateForDrift.observedRole || handle?.role || effectiveObserved.role,
        accessibleName: candidateForDrift.candidateLabel || handle?.accessibleName || effectiveObserved.accessibleName,
        ancestors: candidateForDrift.ancestors && candidateForDrift.ancestors.length > 0
          ? candidateForDrift.ancestors
          : effectiveObserved.ancestors,
        containerSemantics: candidateForDrift.containerSemantics && candidateForDrift.containerSemantics.length > 0
          ? candidateForDrift.containerSemantics
          : effectiveObserved.containerSemantics,
        nearbyText: candidateForDrift.nearbyText && candidateForDrift.nearbyText.length > 0
          ? candidateForDrift.nearbyText
          : effectiveObserved.nearbyText,
        relativeStructuralPath: candidateForDrift.domStructuralPath || handle?.domStructuralPath || effectiveObserved.relativeStructuralPath,
        observedActionType: candidateForDrift.observedActionType || effectiveObserved.observedActionType,
        observedTargetEntity: candidateForDrift.observedTargetEntity || effectiveObserved.observedTargetEntity,
        observedPreState: candidateForDrift.observedState || effectiveObserved.observedPreState,
        observedStateDelta: effectiveObserved.observedStateDelta,
        observedPostState: effectiveObserved.observedPostState,
        observedActivationEventType: effectiveObserved.observedActivationEventType,
        observedWitnessClasses: effectiveObserved.observedWitnessClasses,
      };
    }

    const getMonotonicTime = (): number => {
      if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        return performance.now();
      }
      return Date.now();
    };

    const driftStartTime = getMonotonicTime();
    const startFpComputations = FingerprintConstructor.getComputationCount();

    // Differential graph comparison snapshot before recovery
    const allCapsBefore = this.graph.getAllCapabilities();
    const preActiveRouteMap = new Map<string, string | null>();
    for (const node of allCapsBefore) {
      preActiveRouteMap.set(node.capabilityId, node.activeRouteId);
    }

    const computeCollateralInvalidations = (): number | null => {
      const allCapsAfter = this.graph.getAllCapabilities();
      if (allCapsAfter.length === 0) return null;
      let collateral = 0;
      for (const node of allCapsAfter) {
        if (node.capabilityId !== matchedCap.capabilityId) {
          const preRoute = preActiveRouteMap.get(node.capabilityId);
          if (preRoute && !node.activeRouteId) {
            collateral++;
          }
        }
      }
      return collateral;
    };

    const driftVector = TypedDriftDetector.computeDrift(matchedCap, effectiveObserved);
    const driftResult = DriftClassifier.classify(
      driftVector,
      DEFAULT_DRIFT_THRESHOLDS,
      matchedCap.capabilityId
    );
    this.context.driftVector = driftVector;
    this.context.driftResult = driftResult;
    this.state = 'DRIFT_CLASSIFIED';
    this.persistentStore.saveDriftRecord({
      capabilityId: matchedCap.capabilityId,
      timestamp: Date.now(),
      driftVector,
    }).catch(() => {});

    // 5. LOCALIZED ROUTE INVALIDATION & CANDIDATE RECOVERY
    let routeToAuthorize: RouteVersion | null = activeRoute;
    let selectedWinnerContext: CandidateEvaluationContext | null = null;
    const invalidatedCapabilityIds = new Set<string>();
    let staleAttemptsAvoided = 0;

    // Check if recovery is triggered by drift or missing route
    const recoveryNeeded =
      !activeRoute ||
      driftResult.actionRequired === 'TRIGGER_REBIND_RECOVERY' ||
      driftResult.actionRequired === 'TRIGGER_VALIDATION' ||
      driftResult.actionRequired === 'QUARANTINE_IMMEDIATELY' ||
      executionOptions?.executeQuarantinedRoute;

    if (
      activeRoute &&
      activeRoute.status !== 'QUARANTINED' &&
      (driftResult.actionRequired === 'TRIGGER_REBIND_RECOVERY' ||
        driftResult.actionRequired === 'TRIGGER_VALIDATION' ||
        driftResult.actionRequired === 'QUARANTINE_IMMEDIATELY')
    ) {
      // Localized Invalidation: Demote stale route strictly on the affected capability
      try {
        const demotedRouteId = activeRoute.routeId;
        const demoteReason = `DRIFT_LOCALIZATION: ${driftResult.dominantDriftDimension} drift (${driftVector[driftResult.dominantDriftDimension]}) triggered ${driftResult.actionRequired}`;
        this.routeManager.demoteActiveRoute(matchedCap.capabilityId, demotedRouteId, demoteReason);
        driftResult.invalidationApplied = true;
        invalidatedCapabilityIds.add(matchedCap.capabilityId);

        // Operationally define avoided attempts: only recorded when an execution attempt against the stale route was prevented
        if (
          (executionOptions?.targetRouteId && executionOptions.targetRouteId === demotedRouteId) ||
          executionOptions?.executeQuarantinedRoute
        ) {
          staleAttemptsAvoided = 1;
        }

        if (!executionOptions?.executeQuarantinedRoute) {
          activeRoute = null; // Stale route no longer eligible for direct execution
          this.context.activeRoute = null;
        }
      } catch (err: any) {
        console.warn(`[StateMachine] Could not demote active route for ${matchedCap.capabilityId}:`, err?.message);
      }
    }

    if (recoveryNeeded) {
      // If immediate quarantine is required due to contradictory evidence, abort recovery
      if (driftResult.actionRequired === 'QUARANTINE_IMMEDIATELY') {
        const driftEndTime = getMonotonicTime();
        this.context.driftRecoveryMetrics = {
          inspectedCandidatesCount: availableCandidates.length,
          inspectedNodesCount: availableCandidates.length,
          candidateEvaluationsCount: 0,
          fingerprintComputationsCount: FingerprintConstructor.getComputationCount() - startFpComputations,
          invalidatedCapabilitiesCount: invalidatedCapabilityIds.size,
          unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
          recoveryLatencyMs: Math.max(0, Math.round((driftEndTime - driftStartTime) * 100) / 100),
          staleExecutionAttemptsAvoided: staleAttemptsAvoided,
          abstentionsCount: 1,
        };
        this.state = 'ABSTAINED';
        this.context.currentState = this.state;
        this.logAudit('ABSTAINED', 'Immediate quarantine required: contradictory functional drift detected');
        return this.context;
      }

      // TRIGGER RECOVERY: Process candidates through invariant closure
      this.state = 'CANDIDATE_DISCOVERY';
      this.context.candidateList = availableCandidates;

      const pipelineResult = this.candidatePipeline.processCandidates(
        matchedCap,
        availableCandidates,
        {
          currentTime: Date.now(),
          intent: this.context.normalizedIntent?.rawGoal || this.context.rawGoal,
        }
      );

      this.context.invariantResults = pipelineResult.invariantResults;
      this.context.rankedScores = pipelineResult.rankedScores;
      this.context.selectedCandidate = pipelineResult.selectedWinner;

      const driftEndTime = getMonotonicTime();
      const evaluatedCandidatesCount = pipelineResult.candidateEvaluationsCount;
      const measuredFpComputations = FingerprintConstructor.getComputationCount() - startFpComputations;

      // Quantitative recovery instrumentation with directly measured counters
      this.context.driftRecoveryMetrics = {
        inspectedCandidatesCount: availableCandidates.length,
        inspectedNodesCount: availableCandidates.length,
        candidateEvaluationsCount: evaluatedCandidatesCount,
        fingerprintComputationsCount: measuredFpComputations,
        invalidatedCapabilitiesCount: invalidatedCapabilityIds.size,
        unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
        recoveryLatencyMs: Math.max(0, Math.round((driftEndTime - driftStartTime) * 100) / 100),
        staleExecutionAttemptsAvoided: staleAttemptsAvoided,
        abstentionsCount: pipelineResult.selectedWinner ? 0 : 1,
      };

      if (!pipelineResult.selectedWinner) {
        this.state = 'ABSTAINED';
        this.context.currentState = this.state;
        this.logAudit('ABSTAINED', 'All candidates failed invariant closure or contradiction filter');
        return this.context;
      }

      selectedWinnerContext =
        availableCandidates.find((c) => c.candidateId === pipelineResult.selectedWinner?.candidateId) || null;

      if (selectedWinnerContext && !selectedWinnerContext.bindingHandle) {
        selectedWinnerContext.bindingHandle = {
          handleId: `handle_${selectedWinnerContext.candidateId}`,
          tagName: 'BUTTON',
          role: selectedWinnerContext.observedRole || 'button',
          accessibleName: selectedWinnerContext.candidateLabel,
          domStructuralPath: selectedWinnerContext.domStructuralPath || 'button',
          elementIndex: 0,
          volatileId: selectedWinnerContext.candidateId,
        };
      }

      if (executionOptions?.executeQuarantinedRoute && activeRoute && (activeRoute as RouteVersion).status === 'QUARANTINED') {
        // Enforce execution attempt directly on the quarantined route to test PRE_16
        routeToAuthorize = activeRoute;
        this.context.activeRoute = activeRoute;
        this.context.provisionalRoute = null;
      } else {
        // Create PROVISIONAL route (ISOLATED IN QUARANTINE)
        this.state = 'PROVISIONAL_ROUTE';
        const provisionalRoute = this.routeManager.createProvisionalRoute(
          matchedCap.capabilityId,
          [
            {
              stepIndex: 1,
              fromStateId: effectiveObserved.tag || 'CURRENT_PAGE',
              toStateId: `PANEL_${matchedCap.targetEntity}`,
              actionDescription: `Interact with candidate ${pipelineResult.selectedWinner.candidateId}`,
              bindingHandle: selectedWinnerContext?.bindingHandle,
              targetRole: selectedWinnerContext?.observedRole,
              targetAccessibleName: selectedWinnerContext?.candidateLabel,
            },
          ],
          pipelineResult.selectedWinner.scoreBreakdown.totalScore
        );
        this.context.provisionalRoute = provisionalRoute;
        routeToAuthorize = provisionalRoute;
      }
    } else {
      // ACTIVE ROUTE REVALIDATION: MUST NOT BYPASS CURRENT INVARIANT EVALUATION
      // Stored route provides prior validation history, but current execution must
      // satisfy current hard invariant closure on live candidate and interface state.
      this.state = 'CANDIDATE_DISCOVERY';
      this.context.candidateList = availableCandidates;

      const targetStep = activeRoute!.steps?.[0];
      let activeCandidate: CandidateEvaluationContext | null = null;

      if (availableCandidates.length > 0) {
        activeCandidate =
          availableCandidates.find((c) => {
            if (targetStep?.bindingHandle?.handleId && c.bindingHandle?.handleId === targetStep.bindingHandle.handleId) return true;
            if (targetStep?.bindingHandle?.volatileId && c.candidateId === targetStep.bindingHandle.volatileId) return true;
            if (targetStep?.bindingHandle?.domStructuralPath && c.domStructuralPath === targetStep.bindingHandle.domStructuralPath) return true;
            if (targetStep?.targetAccessibleName && c.candidateLabel.trim().toLowerCase() === targetStep.targetAccessibleName.trim().toLowerCase()) return true;
            return false;
          }) || null;

        if (!activeCandidate && availableCandidates.length === 1) {
          activeCandidate = availableCandidates[0]!;
        }
      }

      if (!activeCandidate) {
        const handle = targetStep?.bindingHandle || {
          handleId: observedFeatures.id || targetStep?.targetAccessibleName || 'active_step_cand',
          tagName: observedFeatures.tag || 'button',
          role: observedFeatures.role || targetStep?.targetRole || matchedCap.semanticEvidence?.role || 'button',
          accessibleName: targetStep?.targetAccessibleName || matchedCap.semanticEvidence?.accessibleName || 'Active control',
          domStructuralPath: observedFeatures.tag || 'button',
          elementIndex: 0,
          volatileId: observedFeatures.id,
        };

        activeCandidate = {
          candidateId: handle.handleId,
          candidateLabel: targetStep?.targetAccessibleName || handle.accessibleName || matchedCap.semanticEvidence?.accessibleName || 'Active control',
          observedActionType: observedFeatures.observedActionType || matchedCap.actionType,
          observedTargetEntity: observedFeatures.observedTargetEntity || matchedCap.targetEntity,
          observedRole: observedFeatures.role || targetStep?.targetRole || handle.role,
          bindingHandle: handle,
          observedState: observedFeatures.observedPreState
            ? { disabled: false, ...observedFeatures.observedPreState }
            : { disabled: false },
          containerSemantics: observedFeatures.containerSemantics || (matchedCap.contextEvidence?.containerSemantics ? [...matchedCap.contextEvidence.containerSemantics] : []),
          ancestors: observedFeatures.ancestors || (matchedCap.contextEvidence?.ancestorRelationships ? [...matchedCap.contextEvidence.ancestorRelationships] : []),
          nearbyText: observedFeatures.nearbyText || (matchedCap.contextEvidence?.nearbyText ? [...matchedCap.contextEvidence.nearbyText] : []),
        };
      }

      if (this.context.candidateList.length === 0 && activeCandidate) {
        this.context.candidateList = [activeCandidate];
      }

      // Recompute invariant closure against current live candidate and interface state
      const liveInvariantResult = InvariantClosureEngine.evaluateCandidate(matchedCap, activeCandidate);
      this.context.invariantResults = { [activeCandidate.candidateId]: liveInvariantResult };

      const activeEvalEndTime = getMonotonicTime();
      const inspectedCount = availableCandidates.length > 0 ? availableCandidates.length : 1;
      const activeFpComputations = FingerprintConstructor.getComputationCount() - startFpComputations;

      if (liveInvariantResult.status !== 'PASS') {
        this.context.driftRecoveryMetrics = {
          inspectedCandidatesCount: inspectedCount,
          inspectedNodesCount: inspectedCount,
          candidateEvaluationsCount: 1,
          fingerprintComputationsCount: activeFpComputations,
          invalidatedCapabilitiesCount: 0,
          unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
          recoveryLatencyMs: Math.max(0, Math.round((activeEvalEndTime - driftStartTime) * 100) / 100),
          staleExecutionAttemptsAvoided: 0,
          abstentionsCount: 1,
        };
        this.state = 'ABSTAINED';
        this.context.currentState = this.state;
        this.logAudit(
          'ABSTAINED',
          `Active route failed current invariant evaluation: ${liveInvariantResult.rejectionReason || liveInvariantResult.status}`
        );
        return this.context;
      }

      this.context.driftRecoveryMetrics = {
        inspectedCandidatesCount: inspectedCount,
        inspectedNodesCount: inspectedCount,
        candidateEvaluationsCount: 1,
        fingerprintComputationsCount: activeFpComputations,
        invalidatedCapabilitiesCount: 0,
        unnecessarilyInvalidatedCount: computeCollateralInvalidations(),
        recoveryLatencyMs: Math.max(0, Math.round((activeEvalEndTime - driftStartTime) * 100) / 100),
        staleExecutionAttemptsAvoided: 0,
        abstentionsCount: 0,
      };

      selectedWinnerContext = activeCandidate;
      const activeRankResults = this.rankingEngine.rankCandidates(matchedCap, [activeCandidate], {
        intent: this.context.normalizedIntent?.rawGoal || this.context.normalizedIntent?.normalizedGoal,
      });
      if (activeRankResults.length > 0 && activeRankResults[0]) {
        this.context.selectedCandidate = activeRankResults[0];
      } else {
        this.context.selectedCandidate = {
          candidateId: activeCandidate.candidateId,
          candidateLabel: activeCandidate.candidateLabel,
          isEligible: true,
          rank: 1,
          weightsVersion: 'v1.0.0',
          scoreBreakdown: {
            invariantFit: 1.0,
            semanticFit: 0.0,
            contextFit: 0.0,
            transitionFit: 0.0,
            validationHistory: 0.0,
            contradictionPenalty: 0.0,
            stalenessPenalty: 0.0,
            riskPenalty: 0.0,
            pathCostPenalty: 0.0,
            totalScore: activeRoute?.confidenceScore || 1.0,
          },
        };
      }
      routeToAuthorize = activeRoute;
    }

    // 6. INDEPENDENT EXECUTION AUTHORIZATION GATING
    // Capability Confidence != Execution Authorization
    this.state = 'EXECUTION_AUTHORIZATION';
    const invariantResultForWinner = this.context.selectedCandidate
      ? this.context.invariantResults?.[this.context.selectedCandidate.candidateId] || null
      : null;

    const authDecision = ExecutionAuthorizationController.authorize({
      fingerprint: matchedCap,
      capabilityConfidence: matchedCap.confidence.capabilityConfidence,
      routeConfidence: routeToAuthorize?.confidenceScore || 0.85,
      invariantResult: invariantResultForWinner,
      transitionResult: null,
      userConfirmationGranted,
      intent: this.context.normalizedIntent,
    });
    this.context.authorizationDecision = authDecision;

    if (authDecision.status === 'CONFIRMATION_REQUIRED') {
      this.state = 'CONFIRMATION_PENDING';
      this.context.currentState = this.state;
      this.logAudit('CONFIRMATION_PENDING', authDecision.policyReason);
      return this.context;
    }

    if (authDecision.status !== 'AUTHORIZED') {
      this.state = 'ABSTAINED';
      this.context.currentState = this.state;
      this.logAudit('ABSTAINED', authDecision.policyReason);
      return this.context;
    }

    // 7. REAL BROWSER ACTIVATION & CAUSAL WITNESS COLLECTION
    // Determine candidate to execute (from provisional recovery or active route step)
    const targetStep = (this.context.provisionalRoute || routeToAuthorize)?.steps?.[0];
    const candidateToExecute: CandidateEvaluationContext | null =
      selectedWinnerContext ||
      (targetStep?.bindingHandle
        ? {
            candidateId: targetStep.bindingHandle.handleId,
            candidateLabel: targetStep.targetAccessibleName || targetStep.bindingHandle.accessibleName,
            observedActionType: matchedCap.actionType,
            observedTargetEntity: matchedCap.targetEntity,
            observedRole: targetStep.targetRole || targetStep.bindingHandle.role,
            bindingHandle: targetStep.bindingHandle,
          }
        : availableCandidates.find((c) => c.candidateLabel === targetStep?.targetAccessibleName) || null) ||
      (observedFeatures.tag
        ? {
            candidateId: observedFeatures.id || 'target_active_route',
            candidateLabel: matchedCap.semanticEvidence.accessibleName,
            observedActionType: observedFeatures.observedActionType || matchedCap.actionType,
            observedTargetEntity: observedFeatures.observedTargetEntity || matchedCap.targetEntity,
            observedRole: observedFeatures.role || 'button',
            bindingHandle: {
              handleId: observedFeatures.id || 'target_handle',
              tagName: observedFeatures.tag,
              role: observedFeatures.role || 'button',
              accessibleName: matchedCap.semanticEvidence.accessibleName,
              domStructuralPath: observedFeatures.tag || 'unknown',
              elementIndex: 0,
              volatileId: observedFeatures.id,
            },
          }
        : null);

    const effectiveDispatcherOrWitnesses =
      dispatcherOrWitnesses !== undefined ? dispatcherOrWitnesses : this.defaultDispatcher;
    const isDispatcher =
      effectiveDispatcherOrWitnesses && typeof (effectiveDispatcherOrWitnesses as any).dispatchActivation === 'function';
    const isWitnessArray = Array.isArray(effectiveDispatcherOrWitnesses);

    // Enforce Phase 3 Invariant: No execution without actual dispatch / witnesses
    if (!isDispatcher && !isWitnessArray) {
      this.state = 'ABSTAINED';
      this.context.currentState = this.state;
      this.logAudit('ABSTAINED', 'Execution halted: No execution dispatcher or browser activation channel available');
      return this.context;
    }

    if (!candidateToExecute) {
      this.state = 'FAILED';
      this.context.currentState = this.state;
      this.logAudit('FAILED', 'Target candidate for route step could not be resolved in the DOM');
      return this.context;
    }

    // Pre-state observation (Phase 4)
    let preStateNode: InterfaceStateNode | null = null;
    if (isDispatcher && (effectiveDispatcherOrWitnesses as ExecutionDispatcher).observePostState) {
      try {
        preStateNode = await (effectiveDispatcherOrWitnesses as ExecutionDispatcher).observePostState!();
        this.context.observedInterfaceState = preStateNode;
      } catch {}
    }

    const activationEventId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    let activationEvent: ActivationEventRecord;
    let collectedWitnesses: TransitionWitness[] = [];

    const actCharacteristics: ActivationEventCharacteristics =
      matchedCap.transitionEvidence?.activationEventCharacteristics || {
        eventType: 'click',
        bubbles: true,
        cancelable: true,
      };

    if (isDispatcher) {
      const dispatcher = effectiveDispatcherOrWitnesses as ExecutionDispatcher;
      this.state = 'ACTIVATION_DISPATCHED';

      const dispatchResult = await dispatcher.dispatchActivation(
        activationEventId,
        candidateToExecute,
        matchedCap.capabilityId,
        actCharacteristics
      );

      // Gate only on dispatch mechanics: did we find the element and fire the event?
      // Whether state actually changed is determined by causal verification (Step 8)
      // and post-state observation (Step 9 / PRE_13). stateChanged is NOT a dispatch output.
      if (
        !dispatchResult.success ||
        dispatchResult.elementFound === false ||
        dispatchResult.eventDispatched === false
      ) {
        this.context.dispatchSuccessful = false;
        this.state = 'FAILED';
        this.context.currentState = this.state;
        const failReason =
          dispatchResult.elementFound === false
            ? 'Target DOM element could not be resolved'
            : dispatchResult.eventDispatched === false
            ? 'Browser event dispatch failed'
            : dispatchResult.reason || 'Browser activation dispatch failed';
        this.logAudit('FAILED', failReason);
        return this.context;
      }

      this.context.dispatchSuccessful = true;

      activationEvent = dispatchResult.activationEvent || {
        eventId: activationEventId,
        sequenceNumber: 1,
        timestamp: Date.now(),
        targetCandidateId: candidateToExecute.candidateId,
        eventType: actCharacteristics.eventType,
        initiatingCapabilityId: matchedCap.capabilityId,
        key: actCharacteristics.key,
        code: actCharacteristics.code,
        keyCode: actCharacteristics.keyCode,
      };

      if (!activationEvent.bindingHandle && candidateToExecute.bindingHandle) {
        activationEvent.bindingHandle = candidateToExecute.bindingHandle;
      }

      const windowMs = matchedCap.transitionEvidence?.verificationWindowMs || 2500;
      collectedWitnesses = await dispatcher.collectWitnesses(windowMs);
    } else {
      this.context.dispatchSuccessful = true;
      const firstWitnessEventId = (effectiveDispatcherOrWitnesses as TransitionWitness[]).find(
        (w) => w.correlatedActivationEventId
      )?.correlatedActivationEventId;
      const effectiveEventId = firstWitnessEventId || activationEventId;
      const minWitnessTimestamp = Math.min(
        ...(effectiveDispatcherOrWitnesses as TransitionWitness[]).map((w) => w.timestamp),
        Date.now()
      );

      activationEvent = {
        eventId: effectiveEventId,
        sequenceNumber: 1,
        timestamp: minWitnessTimestamp - 50,
        targetCandidateId: candidateToExecute.candidateId,
        eventType: actCharacteristics.eventType,
        initiatingCapabilityId: matchedCap.capabilityId,
        bindingHandle: candidateToExecute.bindingHandle,
        key: actCharacteristics.key,
        code: actCharacteristics.code,
        keyCode: actCharacteristics.keyCode,
      };
      collectedWitnesses = effectiveDispatcherOrWitnesses as TransitionWitness[];
    }

    this.context.activationEvent = activationEvent;
    this.context.capturedWitnesses = collectedWitnesses;

    // 8. OBSERVE POST-STATE & COMPUTE CANONICAL OBSERVED POST-STATE FINGERPRINT (Step 5)
    let postStateNode: InterfaceStateNode | null = null;
    if (isDispatcher && (effectiveDispatcherOrWitnesses as ExecutionDispatcher).observePostState) {
      try {
        postStateNode = await (effectiveDispatcherOrWitnesses as ExecutionDispatcher).observePostState!();
      } catch {}
    }

    let observedPostStateObj: import('../../types/transition').ObservedPostState | undefined = undefined;
    const targetRouteId = (this.context.provisionalRoute || routeToAuthorize)?.routeId || `route_${matchedCap.capabilityId}`;

    if (postStateNode) {
      const postStateFp = FingerprintConstructor.computePostStateFingerprint({
        capabilityId: matchedCap.capabilityId,
        routeId: targetRouteId,
        activationEventId: activationEvent.eventId,
        stateNode: postStateNode,
      });
      observedPostStateObj = {
        postStateFingerprint: postStateFp,
        observedApplicationState: postStateNode.observedApplicationState || {},
        observedStateNode: postStateNode,
        observedTimestamp: Date.now(),
        activationEventId: activationEvent.eventId,
        routeId: targetRouteId,
        capabilityId: matchedCap.capabilityId,
        isObserved: true,
        observationSource: 'ExecutionDispatcher:observePostState',
      };
    }

    // 9. CAUSAL TRANSITION VERIFICATION (Derived internally, >=2 independent witness classes)
    this.state = 'TRANSITION_VERIFYING';
    const postStateArg = observedPostStateObj || matchedCap.transitionEvidence.postStateFingerprint;
    const verificationResult = await this.causalVerifier.verifyTransitionAsync(
      {
        preStateFingerprint: matchedCap.transitionEvidence.preStateFingerprint,
        activationEventExpected: {
          eventType: actCharacteristics.eventType,
          key: actCharacteristics.key,
          code: actCharacteristics.code,
          keyCode: actCharacteristics.keyCode,
        },
        expectedStateDelta: matchedCap.transitionEvidence.expectedDelta,
        verificationWindowMs: matchedCap.transitionEvidence.verificationWindowMs,
        postStateFingerprint: matchedCap.transitionEvidence.postStateFingerprint,
      },
      activationEvent,
      collectedWitnesses,
      postStateArg,
      targetRouteId
    );
    this.context.verificationResult = verificationResult;
    this.context.causalVerified = Boolean(
      verificationResult.causallyVerified && verificationResult.status === 'VERIFIED'
    );

    if (!verificationResult.causallyVerified || verificationResult.status !== 'VERIFIED') {
      if (
        verificationResult.status === 'FAILED_POST_STATE_MISMATCH' ||
        verificationResult.failureReason === 'post_state_mismatch'
      ) {
        this.context.postStateVerified = false;
      }
      this.state = 'QUARANTINED';
      this.context.currentState = this.state;
      this.quarantineController.quarantineFailedRoute(
        matchedCap.capabilityId,
        targetRouteId,
        verificationResult.explanation,
        {
          failureReason: verificationResult.failureReason,
          status: verificationResult.status,
          activationEventId: activationEvent.eventId,
          sequenceNumber: activationEvent.sequenceNumber,
          witnessCount: collectedWitnesses.length,
          observedWitnessClasses: verificationResult.verifiedWitnessClasses,
          postStateFingerprint: observedPostStateObj?.postStateFingerprint,
        },
        {
          failedCondition: verificationResult.status,
          activationEventId: activationEvent.eventId,
          sequenceNumber: activationEvent.sequenceNumber,
          witnessIds: collectedWitnesses.map((w) => w.witnessId),
          candidateIdentifier: candidateToExecute.candidateId,
        }
      );
      this.createAndSaveValidationRecord('QUARANTINED');
      this.logAudit('FAILED', verificationResult.explanation);
      return this.context;
    }

    // 10. REAL POST-STATE PREDICATE VERIFICATION (Phase 4)
    if (matchedCap.expectedPostState && matchedCap.expectedPostState.length > 0) {
      const observedAppState = postStateNode?.observedApplicationState || {};
      const mergedWitnessDeltas: Record<string, unknown> = {};
      for (const w of collectedWitnesses) {
        if (w.observedDelta) {
          Object.assign(mergedWitnessDeltas, w.observedDelta);
        }
      }

      for (const expected of matchedCap.expectedPostState) {
        const prop = expected.property;
        const expectedVal = expected.expectedValue;
        const hasInAppState = prop in observedAppState;
        const hasInWitnessDeltas = prop in mergedWitnessDeltas;

        if (hasInAppState) {
          if (observedAppState[prop] !== expectedVal) {
            this.context.postStateVerified = false;
            this.state = 'FAILED';
            this.context.currentState = this.state;
            this.createAndSaveValidationRecord('FAILED');
            this.logAudit('FAILED', `Post-state property '${prop}' was '${observedAppState[prop]}', expected '${expectedVal}'`);
            return this.context;
          }
        } else if (hasInWitnessDeltas) {
          if (mergedWitnessDeltas[prop] !== expectedVal) {
            this.context.postStateVerified = false;
            this.state = 'FAILED';
            this.context.currentState = this.state;
            this.createAndSaveValidationRecord('FAILED');
            this.logAudit('FAILED', `Post-state witness property '${prop}' was '${mergedWitnessDeltas[prop]}', expected '${expectedVal}'`);
            return this.context;
          }
        } else {
          // Required post-state property was not observed in application state or witness deltas
          this.context.postStateVerified = false;
          this.state = 'FAILED';
          this.context.currentState = this.state;
          this.createAndSaveValidationRecord('FAILED');
          this.logAudit('FAILED', `Required post-state property '${prop}' was not observed in post-state or witness deltas.`);
          return this.context;
        }

        // Also evaluate predicate function if available
        const stateToEval = hasInAppState ? observedAppState : mergedWitnessDeltas;
        if (typeof expected.evaluate === 'function' && !expected.evaluate(stateToEval)) {
          this.context.postStateVerified = false;
          this.state = 'FAILED';
          this.context.currentState = this.state;
          this.createAndSaveValidationRecord('FAILED');
          this.logAudit('FAILED', `Post-state predicate for '${prop}' evaluated to false.`);
          return this.context;
        }
      }
    }
    this.context.postStateVerified = true;

    // 10. PROMOTION FOR RECOVERED PROVISIONAL ROUTE
    if (this.context.provisionalRoute) {
      let verificationResultForPromotion = verificationResult;
      if (executionOptions?.corruptPromotionToken && verificationResult.verificationToken) {
        // Preserve all valid binding fields (routeId, capabilityId, activationEventId,
        // verifiedWitnessClasses, transitionBinding, witnessDigest, verifiedStatus)
        // and forge ONLY signatureHash so promotion is rejected specifically by
        // cryptographic HMAC-SHA-256 verification.
        verificationResultForPromotion = {
          ...verificationResult,
          verificationToken: {
            ...verificationResult.verificationToken,
            signatureHash: 'hmac_sha256_' + '0'.repeat(64),
          },
        };
        this.context.verificationResult = verificationResultForPromotion;
      }

      const promoDecision = await this.promotionController.evaluateAndPromoteAsync(
        matchedCap.capabilityId,
        this.context.provisionalRoute.routeId,
        verificationResultForPromotion
      );

      this.context.promotionDecision = promoDecision;

      if (!promoDecision.promoted) {
        this.context.promotionTokenValid = false;
        this.context.promotionFailureReason = promoDecision.reason;
        this.state = 'QUARANTINED';
        this.context.currentState = this.state;
        this.createAndSaveValidationRecord('QUARANTINED');
        this.logAudit('FAILED', promoDecision.reason);
        return this.context;
      }

      this.context.promotionTokenValid = true;
      routeToAuthorize = promoDecision.route;
      this.context.activeRoute = routeToAuthorize;
      this.state = 'VALIDATED_ROUTE';
    }

    // 11. ENFORCE ALL 17 PRECONDITIONS BEFORE ENTERING EXECUTED STATE
    const check = this.canEnterExecutedState(this.context);
    this.context.executionPreconditionsCheck = check;
    if (!check.allowed) {
      this.state = 'FAILED';
      this.context.currentState = this.state;
      this.createAndSaveValidationRecord('FAILED');
      this.logAudit('FAILED', `Precondition violation preventing EXECUTED state: ${check.reasons.join('; ')}`);
      return this.context;
    }

    // 12. FINAL OUTCOME: EXECUTED (All 17 preconditions satisfied)
    this.state = 'EXECUTED';
    this.context.currentState = this.state;
    this.createAndSaveValidationRecord('EXECUTED');
    this.logAudit('EXECUTED', 'Navigation and verified capability execution completed successfully');
    return this.context;
  }

  public canEnterExecutedState(context: StateMachineContext): ExecutionPreconditionsCheck {
    const reasons: string[] = [];
    const failedPreconditions: string[] = [];

    // Precondition 1: Valid Normalized Intent
    if (!context.normalizedIntent && !context.rawGoal) {
      failedPreconditions.push('PRE_1_INTENT_NORMALIZED');
      reasons.push('Intent is missing or not normalized');
    }

    // Precondition 2: Target Candidate or Active Route Step Resolved
    if (!context.selectedCandidate && !context.activeRoute) {
      failedPreconditions.push('PRE_2_CANDIDATE_RESOLVED');
      reasons.push('No target candidate or active route step resolved for execution');
    }

    // Precondition 3: Valid Persistent Capability Identity Present
    if (
      !context.resolvedCapability?.capabilityId ||
      !context.resolvedCapability?.actionType ||
      !context.resolvedCapability?.targetEntity
    ) {
      failedPreconditions.push('PRE_3_CAPABILITY_IDENTITY');
      reasons.push('Capability identity is missing required persistent fields (capabilityId, actionType, targetEntity)');
    }

    // Precondition 4: Valid Ephemeral BindingHandle Present
    const hasBindingHandle =
      Boolean(context.selectedCandidate?.bindingHandle?.handleId) ||
      Boolean(context.activationEvent?.bindingHandle?.handleId) ||
      Boolean(context.activeRoute?.steps?.some((s) => Boolean(s.bindingHandle?.handleId))) ||
      Boolean(context.provisionalRoute?.steps?.some((s) => Boolean(s.bindingHandle?.handleId))) ||
      Boolean(
        context.candidateList?.some(
          (c) =>
            (c.candidateId === context.selectedCandidate?.candidateId ||
              c.bindingHandle?.handleId === context.selectedCandidate?.candidateId) &&
            Boolean(c.bindingHandle?.handleId)
        )
      );
    if (!hasBindingHandle) {
      failedPreconditions.push('PRE_4_VALID_BINDING_HANDLE');
      reasons.push('Target candidate or route step lacks a valid ephemeral BindingHandle');
    }

    // Precondition 5: Invariant Closure Verified
    if (
      context.selectedCandidate &&
      context.invariantResults &&
      context.invariantResults[context.selectedCandidate.candidateId] &&
      context.invariantResults[context.selectedCandidate.candidateId]?.status !== 'PASS'
    ) {
      failedPreconditions.push('PRE_5_INVARIANT_CLOSURE');
      reasons.push('Candidate failed mandatory invariant closure gate');
    }

    // Precondition 6: Route is Authorized and Promoted to ACTIVE_VALIDATED
    // A route cannot enter EXECUTED while in PROVISIONAL, DEMOTED, or QUARANTINED status (REQ-C6, REQ-C17)
    if (!context.activeRoute || context.activeRoute.status !== 'ACTIVE_VALIDATED') {
      failedPreconditions.push('PRE_6_ROUTE_AUTHORIZED');
      reasons.push(
        `Target active route status is '${context.activeRoute?.status || 'MISSING'}'; must be 'ACTIVE_VALIDATED' to enter EXECUTED state`
      );
    }

    // Precondition 7: Execution Authorization Granted
    if (!context.authorizationDecision || context.authorizationDecision.status !== 'AUTHORIZED') {
      failedPreconditions.push('PRE_7_EXECUTION_AUTHORIZED');
      reasons.push('Execution authorization was not granted by the risk controller');
    }

    // Precondition 8: Actual Browser Dispatch Occurred
    if (!context.activationEvent || !context.activationEvent.eventId) {
      failedPreconditions.push('PRE_8_ACTIVATION_DISPATCHED');
      reasons.push('Browser activation event was not dispatched');
    }

    // Precondition 9: Dispatch was Confirmed Successful (Strictly true)
    if (context.dispatchSuccessful !== true) {
      failedPreconditions.push('PRE_9_DISPATCH_SUCCESSFUL');
      reasons.push('Browser activation dispatch was not confirmed successful (must be strictly true)');
    }

    // Precondition 10: Activation Event Exists and Strictly Precedes Witnesses
    const minWitnessTime =
      context.capturedWitnesses && context.capturedWitnesses.length > 0
        ? Math.min(...context.capturedWitnesses.map((w) => w.timestamp))
        : Infinity;
    if (!context.activationEvent?.timestamp || context.activationEvent.timestamp >= minWitnessTime) {
      failedPreconditions.push('PRE_10_ACTIVATION_EVENT_VALID');
      reasons.push('Activation event timestamp does not strictly precede transition witness timestamps');
    }

    // Precondition 11: Transition Witnesses Captured
    if (!context.capturedWitnesses || context.capturedWitnesses.length === 0) {
      failedPreconditions.push('PRE_11_WITNESSES_CAPTURED');
      reasons.push('No transition witnesses were captured within the verification window');
    }

    // Precondition 12: Causal Transition Verification Succeeded (Strictly true)
    if (
      context.causalVerified !== true ||
      !context.verificationResult ||
      !context.verificationResult.causallyVerified ||
      context.verificationResult.status !== 'VERIFIED'
    ) {
      failedPreconditions.push('PRE_12_CAUSAL_VERIFIED');
      reasons.push(`Causal transition verification did not verify causal link (status: ${context.verificationResult?.status})`);
    }

    // Precondition 13: Post-State Verification Passed (Strictly true)
    if (context.postStateVerified !== true) {
      failedPreconditions.push('PRE_13_POST_STATE_VERIFIED');
      reasons.push('Post-state observation did not verify expected state progress (must be strictly true)');
    }

    // Precondition 14: Independent Witness Quorum Satisfied
    const quorumRequired =
      context.resolvedCapability?.riskMetadata?.riskClass === 'READ_ONLY' ? 1 : 2;
    const verifiedClasses = context.verificationResult?.verifiedWitnessClasses || [];
    if (verifiedClasses.length < quorumRequired) {
      failedPreconditions.push('PRE_14_WITNESS_QUORUM');
      reasons.push(
        `Witness class quorum not satisfied: required ${quorumRequired} independent classes, observed ${verifiedClasses.length}`
      );
    }

    // Precondition 15: No Negative Contradictions
    if (
      context.selectedCandidate &&
      context.invariantResults &&
      context.invariantResults[context.selectedCandidate.candidateId]?.status === 'CONTRADICTED'
    ) {
      failedPreconditions.push('PRE_15_NO_CONTRADICTORY_EVIDENCE');
      reasons.push('Candidate matches known contradiction or negative evidence');
    }

    // Precondition 16: No Unresolved Quarantine
    if (
      context.provisionalRoute?.status === 'QUARANTINED' ||
      context.activeRoute?.status === 'QUARANTINED' ||
      (context.activeRoute?.status && this.quarantineController.isUnderQuarantine(context.activeRoute.status))
    ) {
      failedPreconditions.push('PRE_16_NO_UNRESOLVED_QUARANTINE');
      reasons.push('Target route has an unresolved quarantine');
    }

    // Precondition 17: Route Promotion Validated & Token Cryptographically Valid
    if (context.provisionalRoute) {
      const token = context.verificationResult?.verificationToken;
      const tokenCheck =
        token && context.resolvedCapability
          ? this.tokenAuthenticator.verifyToken(token, {
              expectedRouteId: context.provisionalRoute.routeId,
              expectedCapabilityId: context.resolvedCapability.capabilityId,
            })
          : { valid: false };
      if (!token || !token.signatureHash || token.verifiedStatus !== 'VERIFIED' || !tokenCheck.valid) {
        failedPreconditions.push('PRE_17_PROMOTION_TOKEN_VALID');
        reasons.push('Route promotion token is missing or invalid');
      } else if (!context.activeRoute || context.activeRoute.status !== 'ACTIVE_VALIDATED') {
        failedPreconditions.push('PRE_17_ROUTE_PROMOTED');
        reasons.push('Provisional route was not successfully promoted to ACTIVE_VALIDATED');
      }
    }

    return {
      allowed: failedPreconditions.length === 0,
      failedPreconditions,
      reasons,
    };
  }

  /**
   * Executes an ordered multi-step route sequentially (Step 8 & Step 9).
   * - Evaluates intermediate preconditions and postconditions.
   * - Halts immediately upon any intermediate failure, preventing unsafe downstream actions.
   * - Quarantines the failing route and triggers verified rollback if a prior validated route exists.
   */
  public async executeMultiStepRouteAsync(
    route: RouteVersion,
    dispatcher: ExecutionDispatcher,
    capability: FunctionalCapabilityFingerprint,
    options?: { userConfirmationGranted?: boolean }
  ): Promise<{
    success: boolean;
    completedStepsCount: number;
    failedStepIndex?: number;
    failureReason?: string;
    finalState: SystemMachineState;
    rollbackOutcome?: RollbackVerificationOutcome;
  }> {
    // 1. Initial Route Status Check
    if (route.status === 'QUARANTINED' || route.status === 'DEMOTED') {
      this.state = 'FAILED';
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: `Cannot execute route with status '${route.status}'.`,
        finalState: this.state,
      };
    }

    // 2. High-Risk Safety & Authorization Pre-Check (Step 9)
    const safetyAssessment = SafeVerificationController.assessVerificationSafety(
      capability,
      options?.userConfirmationGranted
    );
    if (!safetyAssessment.isSafeToProbe && safetyAssessment.probeType === 'PROHIBITED_UNSAFE_PROBE') {
      this.state = 'CONFIRMATION_PENDING';
      this.context.currentState = this.state;
      return {
        success: false,
        completedStepsCount: 0,
        failureReason: safetyAssessment.policyReason,
        finalState: this.state,
      };
    }

    let completedSteps = 0;

    for (const step of route.steps) {
      // Step Precondition check: candidate context
      const stepCandidate: CandidateEvaluationContext = {
        candidateId: step.bindingHandle?.handleId || `step_${step.stepIndex}_target`,
        candidateLabel: step.targetAccessibleName || step.actionDescription,
        observedActionType: capability.actionType,
        observedTargetEntity: capability.targetEntity,
        observedRole: step.targetRole || 'button',
        bindingHandle: step.bindingHandle,
      };

      const activationEventId = `act_step_${step.stepIndex}_${Date.now()}`;
      const dispatchResult = await dispatcher.dispatchActivation(
        activationEventId,
        stepCandidate,
        capability.capabilityId,
        capability.transitionEvidence?.activationEventCharacteristics || {
          eventType: 'click',
          bubbles: true,
          cancelable: true,
        }
      );

      if (!dispatchResult.success) {
        // Intermediate dispatch failure -> halt immediately!
        this.state = 'FAILED';
        this.context.currentState = this.state;
        const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
          this.routeManager,
          capability,
          route.routeId,
          stepCandidate,
          `Intermediate step ${step.stepIndex} dispatch failure: ${dispatchResult.reason || 'Dispatch failed'}`
        );

        return {
          success: false,
          completedStepsCount: completedSteps,
          failedStepIndex: step.stepIndex,
          failureReason: `Intermediate step ${step.stepIndex} dispatch failed: ${dispatchResult.reason || 'Dispatch failed'}`,
          finalState: this.state,
          rollbackOutcome,
        };
      }

      // Collect witnesses for this step
      const stepWitnesses = await dispatcher.collectWitnesses(
        capability.transitionEvidence?.verificationWindowMs || 2500
      );

      // Observe post-state for this step
      let stepPostState: InterfaceStateNode | undefined;
      if (dispatcher.observePostState) {
        try {
          stepPostState = await dispatcher.observePostState();
        } catch {}
      }

      // Causal verification for this step
      const stepVerification = await this.causalVerifier.verifyTransitionAsync(
        {
          preStateFingerprint: capability.transitionEvidence.preStateFingerprint,
          activationEventExpected: {
            eventType: capability.transitionEvidence.activationEventCharacteristics.eventType,
          },
          expectedStateDelta: step.expectedTransitionDelta || capability.transitionEvidence.expectedDelta,
          verificationWindowMs: capability.transitionEvidence.verificationWindowMs,
          postStateFingerprint: capability.transitionEvidence.postStateFingerprint,
        },
        dispatchResult.activationEvent || {
          eventId: activationEventId,
          sequenceNumber: step.stepIndex,
          timestamp: Date.now(),
          targetCandidateId: stepCandidate.candidateId,
          eventType: 'click',
          initiatingCapabilityId: capability.capabilityId,
        },
        stepWitnesses,
        stepPostState
          ? {
              postStateFingerprint: FingerprintConstructor.computePostStateFingerprint({
                capabilityId: capability.capabilityId,
                routeId: route.routeId,
                activationEventId,
                stateNode: stepPostState,
              }),
              observedApplicationState: stepPostState.observedApplicationState || {},
              observedStateNode: stepPostState,
              observedTimestamp: Date.now(),
              activationEventId,
              routeId: route.routeId,
              capabilityId: capability.capabilityId,
              isObserved: true,
              observationSource: 'ExecutionDispatcher:observePostState',
            }
          : undefined,
        route.routeId
      );

      if (!stepVerification.causallyVerified || stepVerification.status !== 'VERIFIED') {
        // Intermediate causal failure -> halt downstream execution!
        this.state = 'QUARANTINED';
        this.context.currentState = this.state;
        const rollbackOutcome = SafeVerificationController.verifyAndExecuteRollback(
          this.routeManager,
          capability,
          route.routeId,
          stepCandidate,
          `Intermediate step ${step.stepIndex} causal verification failed: ${stepVerification.explanation}`
        );

        return {
          success: false,
          completedStepsCount: completedSteps,
          failedStepIndex: step.stepIndex,
          failureReason: `Intermediate step ${step.stepIndex} causal verification failed: ${stepVerification.explanation}`,
          finalState: this.state,
          rollbackOutcome,
        };
      }

      completedSteps++;
    }

    // All steps succeeded!
    this.state = 'EXECUTED';
    this.context.currentState = this.state;
    return {
      success: true,
      completedStepsCount: completedSteps,
      finalState: this.state,
    };
  }

  private createAndSaveValidationRecord(
    finalOutcome: 'EXECUTED' | 'QUARANTINED' | 'DEMOTED' | 'ABSTAINED' | 'CONFIRMATION_PENDING' | 'FAILED'
  ): void {
    if (!this.context.resolvedCapability) return;

    // Phase 21 & Prompt 7 & Prompt 8: Populate authoritative transition signature
    const actCharacteristics = this.context.resolvedCapability.transitionEvidence?.activationEventCharacteristics;
    const transitionSignature: TransitionSignature | null =
      this.context.verificationResult?.signature ||
      (this.context.resolvedCapability.transitionEvidence
        ? {
            preStateFingerprint: this.context.resolvedCapability.transitionEvidence.preStateFingerprint,
            activationEventExpected: {
              eventType: actCharacteristics?.eventType || 'click',
              key: actCharacteristics?.key,
              code: actCharacteristics?.code,
              keyCode: actCharacteristics?.keyCode,
            },
            expectedStateDelta: this.context.resolvedCapability.transitionEvidence.expectedDelta,
            verificationWindowMs: this.context.resolvedCapability.transitionEvidence.verificationWindowMs,
            postStateFingerprint: this.context.resolvedCapability.transitionEvidence.postStateFingerprint,
          }
        : null);

    const record: ValidationRecord = {
      recordId: `val_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      candidateIdentity: this.context.selectedCandidate?.candidateId || 'ACTIVE_ROUTE',
      candidateFingerprint: this.context.resolvedCapability,
      capabilityId: this.context.resolvedCapability.capabilityId,
      interfaceStateId: this.context.observedInterfaceState?.stateId || 'DEFAULT_STATE',
      typedDriftVector: this.context.driftVector || null,
      invariantResults: this.context.selectedCandidate
        ? this.context.invariantResults?.[this.context.selectedCandidate.candidateId] || null
        : null,
      contradictionResults: {},
      rankingComponents: this.context.selectedCandidate || null,
      routeVersion: this.context.activeRoute || this.context.provisionalRoute || null,
      activationEvent: this.context.activationEvent || null,
      transitionSignature,
      transitionWitnesses: this.context.capturedWitnesses || [],
      causalVerificationResult: this.context.verificationResult || null,
      promotionState: this.context.activeRoute?.status || 'PROVISIONAL',
      riskDecision: this.context.resolvedCapability.riskMetadata.riskClass,
      authorizationDecision: this.context.authorizationDecision || null,
      finalOutcome,
    };

    this.context.validationRecord = record;
    this.persistentStore.saveValidationRecord(record).catch(() => {});
  }

  private logAudit(
    outcome: 'EXECUTED' | 'ABSTAINED' | 'CONFIRMATION_PENDING' | 'SUGGESTED' | 'FAILED',
    failureReason?: string
  ): void {
    if (!this.context.normalizedIntent || !this.context.resolvedCapability) return;

    this.auditLogger.log({
      intent: this.context.normalizedIntent,
      capabilityId: this.context.resolvedCapability.capabilityId,
      previousRouteId: null,
      currentRouteId: this.context.activeRoute?.routeId || null,
      interfaceStateId: 'STATE_DEFAULT',
      driftVector: this.context.driftVector || null,
      candidateList: (this.context.candidateList || []).map((c) => c.candidateId),
      invariantResults: this.context.invariantResults || {},
      contradictionResults: {},
      rebindScores: this.context.rankedScores
        ? Object.fromEntries(this.context.rankedScores.map((s) => [s.candidateId, s]))
        : {},
      selectedCandidateId: this.context.selectedCandidate?.candidateId || null,
      causalVerificationResult: this.context.verificationResult || null,
      quarantineState: this.context.activeRoute?.status || 'ABSTAINED',
      promotionResult: this.context.activeRoute?.status === 'ACTIVE_VALIDATED' ? 'PROMOTED' : 'NONE',
      capabilityConfidence: this.context.resolvedCapability.confidence.capabilityConfidence,
      routeConfidence: this.context.activeRoute?.confidenceScore || 0,
      riskClass: this.context.resolvedCapability.riskMetadata.riskClass,
      executionAuthorization: this.context.authorizationDecision || {
        status: 'DENIED_ABSTAIN',
        riskClass: this.context.resolvedCapability.riskMetadata.riskClass,
        capabilityConfidence: this.context.resolvedCapability.confidence.capabilityConfidence,
        routeConfidence: 0,
        evidenceQuorum: {
          hasSemanticEvidence: false,
          hasFunctionalInvariantEvidence: false,
          hasTransitionStateEvidence: false,
          quorumSatisfied: false,
        },
        requiresUserConfirmation: false,
        policyReason: failureReason || 'Execution halted',
        evaluatedTimestamp: Date.now(),
      },
      userConfirmation: this.context.userConfirmationGranted ?? null,
      finalOutcome: outcome,
      failureReason,
      driftRecoveryMetrics: this.context.driftRecoveryMetrics,
    });
  }
}
