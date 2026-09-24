/**
 * IntentNav-SCFR: Generic Capability Taxonomy & Production Pipeline Test
 *
 * Verifies that the production architecture processes arbitrary capabilities
 * conforming to the generic capability schema without requiring hardcoded
 * mock-site vocabulary special cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';
import { createDeclarativePredicate } from '../../src/core/invariant/predicates';
import { createFunctionalCapability } from '../../src/core/capability/catalog';
import { FingerprintConstructor } from '../../src/core/fingerprint/constructor';
import { IntentNormalizer } from '../../src/core/intent/normalizer';
import { CapabilityIntentResolver } from '../../src/core/intent/resolver';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';
import { CandidateRankingEngine } from '../../src/core/ranking/engine';
import { IntentNavMachine, ExecutionDispatcher } from '../../src/core/stateMachine/machine';
import { TransitionWitness } from '../../src/types/transition';

describe('Generic Capability Taxonomy & Domain Independence', () => {
  let genericCapability: FunctionalCapabilityFingerprint;

  beforeEach(() => {
    // Define a NEW capability completely outside the 9 benchmark/mock catalog entries
    // Uses domain: media playback preferences (AUDIO_AUTOPLAY)
    genericCapability = createFunctionalCapability({
      capabilityId: 'CAP_AUDIO_AUTOPLAY',
      canonicalFunction: 'disable_media_autoplay',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MEDIA_AUTOPLAY',
      mandatoryPreStatePredicates: [
        createDeclarativePredicate({
          id: 'PRE_AUTOPLAY_ENABLED',
          name: 'Autoplay currently active',
          description: 'Autoplay must be enabled prior to disabling',
          source: 'PRE_STATE',
          property: 'autoplay_enabled',
          operator: 'EQUALS',
          expectedValue: true,
        }),
      ],
      allowedStateDelta: [
        {
          property: 'autoplay_enabled',
          expectedChange: 'ENABLED_TO_DISABLED',
        },
      ],
      expectedPostState: [
        {
          property: 'autoplay_enabled',
          expectedValue: false,
        },
      ],
      requiredContextPredicates: [
        {
          target: 'container',
          pattern: 'media|playback|audio',
          required: true,
        },
      ],
      forbiddenContextPredicates: [
        {
          target: 'container',
          pattern: 'delete_account|billing',
          required: false,
        },
      ],
      semanticEvidence: {
        canonicalLabel: 'Disable Media Autoplay',
        semanticSynonyms: [
          'turn off media autoplay',
          'stop auto playback',
          'disable video autoplay',
          'prevent autoplay media',
        ],
        accessibleName: 'Disable autoplay switch',
        role: 'switch',
        visibleLabel: 'Autoplay Media',
        sectionMeaning: 'Playback Settings',
        actionDescription: 'Toggle media autoplay from enabled to disabled',
      },
      contextEvidence: {
        ancestorRelationships: ['section[Playback Settings]'],
        nearbyText: ['Automatically play videos when scrolling'],
        surroundingLabels: ['Autoplay Media'],
        containerSemantics: ['playback', 'media'],
        menuPanelRelationships: ['Playback'],
        relativeStructuralRelationships: ['form > div > label > input[type=checkbox]'],
        urlSemantics: '/settings/playback',
      },
      transitionEvidence: {
        preStateFingerprint: 'STATE_PRE_AUTOPLAY_ON',
        activationEventCharacteristics: { eventType: 'click', bubbles: true, cancelable: true },
        expectedDelta: { autoplay_enabled: false },
        postStateFingerprint: 'STATE_POST_AUTOPLAY_OFF',
        historicalTransitionObservations: 5,
        witnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION', 'APPLICATION_STATE_MUTATION'],
        verificationWindowMs: 2000,
      },
      riskMetadata: {
        riskClass: 'REVERSIBLE',
        reversible: true,
        financial: false,
        security: false,
        destructive: false,
        requiresConfirmation: false,
      },
    });
  });

  it('1. Represents and finger-hashes a generic capability without mock catalog entries', () => {
    expect(genericCapability.capabilityId).toBe('CAP_AUDIO_AUTOPLAY');
    expect(genericCapability.targetEntity).toBe('MEDIA_AUTOPLAY');
    expect(genericCapability.actionType).toBe('MODIFY_PREFERENCE');
    expect(genericCapability.fingerprintHash).toBeDefined();
    expect(typeof genericCapability.fingerprintHash).toBe('string');
    expect(genericCapability.fingerprintHash!.startsWith('fph_')).toBe(true);

    // Determinism check: recomputing fingerprint yields identical hash
    const recomputedHash = FingerprintConstructor.computeFingerprintHash({
      canonicalFunction: genericCapability.canonicalFunction,
      actionType: genericCapability.actionType,
      targetEntity: genericCapability.targetEntity,
      role: genericCapability.semanticEvidence.role,
      riskClass: genericCapability.riskMetadata.riskClass,
      mandatoryPreStatePredicates: genericCapability.mandatoryPreStatePredicates,
      allowedStateDelta: genericCapability.allowedStateDelta,
      expectedPostState: genericCapability.expectedPostState,
      requiredContextPredicates: genericCapability.requiredContextPredicates,
      forbiddenContextPredicates: genericCapability.forbiddenContextPredicates,
    });
    expect(genericCapability.fingerprintHash).toBe(recomputedHash);
  });

  it('2. Dynamically normalizes and resolves intent for generic capability', () => {
    const rawGoal = 'Turn off media autoplay';

    // Normalizer consumes known target entities dynamically
    const normalized = IntentNormalizer.normalize(rawGoal, [genericCapability.targetEntity]);
    expect(normalized.actionType).toBe('MODIFY_PREFERENCE');
    expect(normalized.targetEntity).toBe('MEDIA_AUTOPLAY');

    // Resolver resolves without any hardcoded dictionary
    const matches = CapabilityIntentResolver.resolve(normalized, [genericCapability]);
    expect(matches.length).toBe(1);
    expect(matches[0]?.capabilityId).toBe('CAP_AUDIO_AUTOPLAY');
    expect(matches[0]?.isActionMatched).toBe(true);
    expect(matches[0]?.isTargetMatched).toBe(true);
    expect(matches[0]?.matchScore).toBeGreaterThanOrEqual(0.80);
  });

  it('3. Generates candidates from DOM with generic data-target attribute', () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app-state" data-application-state='{"autoplay_enabled": true}'></div>
          <section role="region" aria-label="Playback Settings">
            <h2>Playback Preferences</h2>
            <p>Automatically play videos when scrolling</p>
            <button role="switch" aria-label="Disable autoplay switch" aria-checked="true" data-target="MEDIA_AUTOPLAY">
              Disable Autoplay
            </button>
          </section>
          <section role="region" aria-label="Account Danger Zone">
            <button role="button" aria-label="Delete media history" data-target="MEDIA_HISTORY">
              Delete History
            </button>
          </section>
        </body>
      </html>
    `);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    expect(candidates.length).toBe(2);

    const targetCand = candidates.find((c) => c.observedTargetEntity === 'MEDIA_AUTOPLAY');
    expect(targetCand).toBeDefined();
    expect(targetCand?.observedRole).toBe('switch');
    expect(targetCand?.observedActionType).toBe('MODIFY_PREFERENCE');
    expect(targetCand?.observedState?.['autoplay_enabled']).toBe(true);
    expect(targetCand?.observedState?.['checked']).toBe(true);

    dom.window.close();
  });

  it('4. Gating & Invariant Closure correctly admits valid generic target and rejects decoys', () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app-state" data-application-state='{"autoplay_enabled": true}'></div>
          <section role="region" aria-label="Playback Settings">
            <button role="switch" aria-label="Disable autoplay switch" aria-checked="true" data-target="MEDIA_AUTOPLAY">
              Disable Autoplay
            </button>
          </section>
          <section role="region" aria-label="Billing Settings">
            <button role="switch" aria-label="Disable autoplay in invoices" aria-checked="true" data-target="BILLING_AUTOPLAY">
              Billing Switch
            </button>
          </section>
          <section role="region" aria-label="Account Deletion">
            <button role="button" aria-label="Delete media library" data-target="DELETE_MEDIA">
              Delete Media
            </button>
          </section>
        </body>
      </html>
    `);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    expect(candidates.length).toBe(3);

    const validCandidate = candidates.find((c) => c.observedTargetEntity === 'MEDIA_AUTOPLAY')!;
    const billingDecoy = candidates.find((c) => c.observedTargetEntity === 'BILLING_AUTOPLAY')!;
    const deleteDecoy = candidates.find((c) => c.observedTargetEntity === 'DELETE_MEDIA')!;

    // 1. Genuine target passes all 10 invariant classes
    const validResult = InvariantClosureEngine.evaluateCandidate(genericCapability, validCandidate);
    expect(validResult.status).toBe('PASS');
    expect(validResult.isEligibleForRanking).toBe(true);
    expect(validResult.failedPredicates.length).toBe(0);

    // 2. Billing decoy fails target entity match and container context
    const billingResult = InvariantClosureEngine.evaluateCandidate(genericCapability, billingDecoy);
    expect(['FAIL', 'CONTRADICTED']).toContain(billingResult.status);
    expect(billingResult.isEligibleForRanking).toBe(false);

    // 3. Delete decoy fails action type (DELETE vs MODIFY_PREFERENCE) and forbidden context
    const deleteResult = InvariantClosureEngine.evaluateCandidate(genericCapability, deleteDecoy);
    expect(['FAIL', 'CONTRADICTED']).toContain(deleteResult.status);
    expect(deleteResult.isEligibleForRanking).toBe(false);

    dom.window.close();
  });

  it('5. Ranks eligible generic candidates correctly via evidence model', () => {
    const candidateContext = {
      candidateId: 'cand_media_autoplay',
      candidateLabel: 'Disable autoplay switch',
      observedActionType: 'MODIFY_PREFERENCE',
      observedTargetEntity: 'MEDIA_AUTOPLAY',
      observedRole: 'switch',
      containerSemantics: ['playback', 'media'],
      ancestors: ['section[Playback Settings]'],
      nearbyText: ['Automatically play videos when scrolling'],
      observedState: { autoplay_enabled: true, checked: true, disabled: false },
    };

    const rankingEngine = new CandidateRankingEngine();
    const scores = rankingEngine.rankCandidates(genericCapability, [candidateContext]);

    expect(scores.length).toBe(1);
    expect(scores[0]?.candidateId).toBe('cand_media_autoplay');
    expect(scores[0]?.scoreBreakdown.totalScore).toBeGreaterThan(0.70);
    expect(scores[0]?.scoreBreakdown.semanticFit).toBeGreaterThan(0.60);
    expect(scores[0]?.scoreBreakdown.transitionFit).toBeGreaterThan(0.80);
  });

  it('6. Full Closed-Loop State Machine processes generic capability end-to-end', async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app-state" data-application-state='{"autoplay_enabled": true}'></div>
          <section role="region" aria-label="Playback Settings">
            <button role="switch" aria-label="Disable autoplay switch" aria-checked="true" data-target="MEDIA_AUTOPLAY">
              Disable Autoplay
            </button>
          </section>
        </body>
      </html>
    `);

    const machine = new IntentNavMachine();
    await machine.init();

    // Register our generic capability into the state machine
    machine.registerCapability(genericCapability);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    const candId = candidates[0]?.candidateId || 'cand_target';

    // Setup generic mock dispatcher with 2 independent witness classes
    const mockDispatcher: ExecutionDispatcher = {
      dispatchActivation: async () => ({
        success: true,
        elementFound: true,
        eventDispatched: true,
        stateChanged: true,
        activationEvent: {
          eventId: 'act_generic_001',
          sequenceNumber: 1,
          timestamp: Date.now(),
          targetCandidateId: candId,
          eventType: 'click',
          initiatingCapabilityId: 'CAP_AUDIO_AUTOPLAY',
        },
      }),
      collectWitnesses: async () => {
        const now = Date.now();
        const witnesses: TransitionWitness[] = [
          {
            witnessId: 'wit_dom_generic',
            witnessClass: 'DOM_MUTATION',
            sequenceNumber: 1,
            timestamp: now + 50,
            observedDelta: { autoplay_enabled: false },
            correlatedActivationEventId: 'act_generic_001',
            temporalDeltaMs: 50,
            isCausallyCorrelated: true,
            correlationExplanation: 'DOM mutation observed within window',
          },
          {
            witnessId: 'wit_app_generic',
            witnessClass: 'APPLICATION_STATE_MUTATION',
            sequenceNumber: 2,
            timestamp: now + 60,
            observedDelta: { autoplay_enabled: false },
            correlatedActivationEventId: 'act_generic_001',
            temporalDeltaMs: 60,
            isCausallyCorrelated: true,
            correlationExplanation: 'Application state mutation observed within window',
          },
        ];
        return witnesses;
      },
      observePostState: async () => ({
        stateId: 'STATE_POST_AUTOPLAY_OFF',
        stateType: 'PAGE',
        urlPattern: '/settings/playback',
        domStructuralHash: 'hash_autoplay_off',
        semanticLandmarks: ['Playback Settings'],
        activeModalsOrDialogs: [],
        activeTabs: [],
        timestamp: Date.now(),
        observedApplicationState: { autoplay_enabled: false },
      }),
    };

    machine.setDefaultDispatcher(mockDispatcher);

    const context = await machine.processIntent(
      'Turn off media autoplay',
      {
        tag: 'button',
        role: 'switch',
        accessibleName: 'Disable autoplay switch',
        containerSemantics: ['playback', 'media'],
      },
      candidates,
      false, // reversible, does not require manual confirmation
      mockDispatcher
    );

    // Closed-loop verification checks
    expect(context.currentState).toBe('EXECUTED');
    expect(context.resolvedCapability?.capabilityId).toBe('CAP_AUDIO_AUTOPLAY');
    expect(context.selectedCandidate?.candidateId).toBe(candidates[0]?.candidateId);
    expect(context.causalVerified).toBe(true);
    expect(context.postStateVerified).toBe(true);
    expect(context.activeRoute?.status).toBe('ACTIVE_VALIDATED');
    expect(context.validationRecord).toBeDefined();
    expect(context.validationRecord?.transitionSignature).toBeDefined();
    expect(context.validationRecord?.causalVerificationResult?.causallyVerified).toBe(true);

    dom.window.close();
  });

  it('7. Invariant safety: Rejects generic candidate if pre-state already equals post-state', () => {
    // Autoplay is ALREADY disabled (false)
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app-state" data-application-state='{"autoplay_enabled": false}'></div>
          <section role="region" aria-label="Playback Settings">
            <button role="switch" aria-label="Disable autoplay switch" aria-checked="false" data-target="MEDIA_AUTOPLAY">
              Disable Autoplay
            </button>
          </section>
        </body>
      </html>
    `);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    expect(candidates.length).toBe(1);

    const targetCand = candidates[0]!;
    const closureResult = InvariantClosureEngine.evaluateCandidate(genericCapability, targetCand);

    // Pre-state predicate requires autoplay_enabled === true; should FAIL
    expect(closureResult.status).toBe('FAIL');
    expect(closureResult.isEligibleForRanking).toBe(false);
    expect(closureResult.rejectionReason).toContain('Pre-state predicate');

    dom.window.close();
  });
});
