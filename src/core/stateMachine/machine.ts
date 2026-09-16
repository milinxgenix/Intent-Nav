/**
 * IntentNav-SCFR: Central State Machine & Controller
 * Implements the complete closed-loop navigation lifecycle
 */

import { NormalizedIntent } from '../../types/intent';
import { FunctionalCapabilityFingerprint } from '../../types/capability';
import { InterfaceStateNode, RouteVersion } from '../../types/state';
import { TypedDriftVector, DriftLocalizationResult } from '../../types/drift';
import { InvariantClosureResult } from '../../types/invariant';
import { CandidateRebindScore } from '../../types/ranking';
import { CausalVerificationResult, ActivationEventRecord, TransitionWitness } from '../../types/transition';
import { ExecutionAuthorizationDecision } from '../../types/authorization';
import { IntentNormalizer } from '../intent/normalizer';
import { CapabilityIntentResolver } from '../intent/resolver';
import { CapabilityGraphEngine } from '../graph/capabilityGraph';
import { RouteManager } from '../graph/routeManager';
import { TypedDriftDetector, ObservedElementFeatures } from '../drift/detector';
import { DriftClassifier } from '../drift/classifier';
import { CandidateEvaluationContext } from '../invariant/engine';
import { NegativeEvidenceStore } from '../contradiction/store';
import { CandidatePipeline } from '../candidate/pipeline';
import { CandidateRankingEngine } from '../ranking/engine';
import { WitnessCollector } from '../causal/witnessCollector';
import { CausalTransitionVerifier } from '../causal/verifier';
import { QuarantineController } from '../quarantine/controller';
import { RoutePromotionController } from '../quarantine/promotion';
import { ExecutionAuthorizationController } from '../authorization/controller';
import { AuditLogger } from '../audit/logger';

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
  | 'TRANSITION_VERIFYING'
  | 'VALIDATED_ROUTE'
  | 'EXECUTION_AUTHORIZATION'
  | 'CONFIRMATION_PENDING'
  | 'EXECUTED'
  | 'QUARANTINED'
  | 'ABSTAINED'
  | 'FAILED';

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
  verificationResult?: CausalVerificationResult | null;
  authorizationDecision?: ExecutionAuthorizationDecision;
  userConfirmationGranted?: boolean;
}

export class IntentNavMachine {
  public state: SystemMachineState = 'IDLE';
  public context: StateMachineContext = { currentState: 'IDLE' };

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

  // Registered capability catalog
  private capabilities: Map<string, FunctionalCapabilityFingerprint> = new Map();

  constructor(auditLogger?: AuditLogger) {
    this.graph = new CapabilityGraphEngine();
    this.routeManager = new RouteManager(this.graph);
    this.negativeEvidenceStore = new NegativeEvidenceStore();
    this.rankingEngine = new CandidateRankingEngine();
    this.candidatePipeline = new CandidatePipeline(
      this.negativeEvidenceStore,
      this.rankingEngine
    );
    this.witnessCollector = new WitnessCollector();
    this.causalVerifier = new CausalTransitionVerifier();
    this.quarantineController = new QuarantineController(
      this.routeManager,
      this.negativeEvidenceStore
    );
    this.promotionController = new RoutePromotionController(
      this.routeManager,
      this.quarantineController
    );
    this.auditLogger = auditLogger || new AuditLogger();
  }

  public registerCapability(cap: FunctionalCapabilityFingerprint): void {
    this.capabilities.set(cap.capabilityId, cap);
    this.graph.registerCapability(cap.capabilityId, cap.canonicalFunction);
  }

  public getRegisteredCapabilities(): FunctionalCapabilityFingerprint[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Primary Entry Point: Process a user natural-language goal
   */
  public async processIntent(
    rawGoal: string,
    observedFeatures: ObservedElementFeatures,
    availableCandidates: CandidateEvaluationContext[],
    userConfirmationGranted: boolean = false,
    mockWitnessesForVerification?: TransitionWitness[]
  ): Promise<StateMachineContext> {
    this.state = 'INTENT_RECEIVED';
    this.context = {
      currentState: this.state,
      rawGoal,
      userConfirmationGranted,
    };

    // 1. INTENT_NORMALIZATION
    const normalizedIntent = IntentNormalizer.normalize(rawGoal);
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
    this.context.activeRoute = activeRoute;

    // 4. TYPED DRIFT LOCALIZATION
    const driftVector = TypedDriftDetector.computeDrift(matchedCap, observedFeatures);
    const driftResult = DriftClassifier.classify(driftVector);
    this.context.driftVector = driftVector;
    this.context.driftResult = driftResult;
    this.state = 'DRIFT_CLASSIFIED';

    // 5. DECIDE IF REBIND RECOVERY REQUIRED
    let routeToAuthorize: RouteVersion | null = activeRoute;

    if (!activeRoute || driftResult.actionRequired === 'TRIGGER_REBIND_RECOVERY' || driftResult.actionRequired === 'TRIGGER_VALIDATION') {
      // TRIGGER RECOVERY: Process candidates through invariant closure
      this.state = 'CANDIDATE_DISCOVERY';
      this.context.candidateList = availableCandidates;

      const pipelineResult = this.candidatePipeline.processCandidates(
        matchedCap,
        availableCandidates
      );

      this.context.invariantResults = pipelineResult.invariantResults;
      this.context.rankedScores = pipelineResult.rankedScores;
      this.context.selectedCandidate = pipelineResult.selectedWinner;

      if (!pipelineResult.selectedWinner) {
        this.state = 'ABSTAINED';
        this.context.currentState = this.state;
        this.logAudit('ABSTAINED', 'All candidates failed invariant closure or contradiction filter');
        return this.context;
      }

      // Create PROVISIONAL route (QUARANTINE)
      this.state = 'PROVISIONAL_ROUTE';
      const provisionalRoute = this.routeManager.createProvisionalRoute(
        matchedCap.capabilityId,
        [
          {
            stepIndex: 1,
            fromStateId: 'CURRENT_PAGE',
            toStateId: 'TARGET_PANEL',
            actionDescription: `Interact with candidate ${pipelineResult.selectedWinner.candidateId}`,
          },
        ],
        pipelineResult.selectedWinner.scoreBreakdown.totalScore
      );
      this.context.provisionalRoute = provisionalRoute;

      // 6. CAUSAL TRANSITION VERIFICATION
      this.state = 'TRANSITION_VERIFYING';
      const activationEvent: ActivationEventRecord = {
        eventId: `act_${Date.now()}`,
        sequenceNumber: 1,
        timestamp: Date.now(),
        targetCandidateId: pipelineResult.selectedWinner.candidateId,
        eventType: 'click',
        initiatingCapabilityId: matchedCap.capabilityId,
      };
      this.witnessCollector.registerActivationEvent(activationEvent);

      // Collect or simulate witnesses
      let witnesses: TransitionWitness[] = [];
      if (mockWitnessesForVerification) {
        witnesses = mockWitnessesForVerification.map((w) => ({
          ...w,
          correlatedActivationEventId: w.correlatedActivationEventId ? activationEvent.eventId : null,
          timestamp: w.temporalDeltaMs > 0 && w.timestamp <= activationEvent.timestamp
            ? activationEvent.timestamp + w.temporalDeltaMs
            : w.timestamp,
        }));
      } else {
        // Default valid simulated multi-class witnesses
        this.witnessCollector.clear();
        this.witnessCollector.registerActivationEvent(activationEvent);
        const expectedDelta = matchedCap.transitionEvidence.expectedDelta;
        this.witnessCollector.recordWitness('DOM_MUTATION', { ...expectedDelta, modified: true }, activationEvent.timestamp + 50);
        this.witnessCollector.recordWitness('ACCESSIBILITY_STATE_MUTATION', { ...expectedDelta, stateChanged: true }, activationEvent.timestamp + 100);
        witnesses = this.witnessCollector.getWitnesses();
      }

      const verificationResult = this.causalVerifier.verifyTransition(
        {
          preStateFingerprint: matchedCap.transitionEvidence.preStateFingerprint,
          activationEventExpected: { eventType: 'click' },
          expectedStateDelta: matchedCap.transitionEvidence.expectedDelta,
          verificationWindowMs: matchedCap.transitionEvidence.verificationWindowMs,
          postStateFingerprint: matchedCap.transitionEvidence.postStateFingerprint,
        },
        activationEvent,
        witnesses
      );
      this.context.verificationResult = verificationResult;

      // 7. PROMOTION OR QUARANTINE
      const promoDecision = this.promotionController.evaluateAndPromote(
        matchedCap.capabilityId,
        provisionalRoute.routeId,
        verificationResult
      );

      if (!promoDecision.promoted) {
        this.state = 'QUARANTINED';
        this.context.currentState = this.state;
        this.logAudit('FAILED', promoDecision.reason);
        return this.context;
      }

      routeToAuthorize = promoDecision.route;
      this.context.activeRoute = routeToAuthorize;
      this.state = 'VALIDATED_ROUTE';
    }

    // 8. INDEPENDENT EXECUTION AUTHORIZATION
    this.state = 'EXECUTION_AUTHORIZATION';
    const invariantResultForWinner = this.context.selectedCandidate
      ? this.context.invariantResults?.[this.context.selectedCandidate.candidateId] || null
      : {
          candidateId: 'ACTIVE',
          status: 'PASS' as const,
          isEligibleForRanking: true,
          passedPredicates: [],
          failedPredicates: [],
          evaluatedTimestamp: Date.now(),
        };

    const authDecision = ExecutionAuthorizationController.authorize({
      fingerprint: matchedCap,
      capabilityConfidence: matchedCap.confidence.capabilityConfidence,
      routeConfidence: routeToAuthorize?.confidenceScore || 0.85,
      invariantResult: invariantResultForWinner,
      transitionResult: this.context.verificationResult || null,
      userConfirmationGranted,
      intent: this.context.normalizedIntent,
    });
    this.context.authorizationDecision = authDecision;

    // 9. FINAL EXECUTION DECISION
    if (authDecision.status === 'CONFIRMATION_REQUIRED') {
      this.state = 'CONFIRMATION_PENDING';
      this.context.currentState = this.state;
      this.logAudit('CONFIRMATION_PENDING', authDecision.policyReason);
      return this.context;
    }

    if (authDecision.status === 'AUTHORIZED') {
      this.state = 'EXECUTED';
      this.context.currentState = this.state;
      this.logAudit('EXECUTED', 'Navigation and execution completed successfully');
      return this.context;
    }

    if (authDecision.status === 'SUGGESTION_ONLY') {
      this.state = 'ABSTAINED';
      this.context.currentState = this.state;
      this.logAudit('SUGGESTED', authDecision.policyReason);
      return this.context;
    }

    this.state = 'ABSTAINED';
    this.context.currentState = this.state;
    this.logAudit('ABSTAINED', authDecision.policyReason);
    return this.context;
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
        capabilityConfidence: 0,
        routeConfidence: 0,
        evidenceQuorum: {
          hasSemanticEvidence: false,
          hasFunctionalInvariantEvidence: false,
          hasTransitionStateEvidence: false,
          quorumSatisfied: false,
        },
        requiresUserConfirmation: false,
        policyReason: failureReason || 'Abstained',
        evaluatedTimestamp: Date.now(),
      },
      userConfirmation: this.context.userConfirmationGranted ?? null,
      finalOutcome: outcome,
      failureReason,
    });
  }
}
