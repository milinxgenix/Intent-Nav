/**
 * IntentNav-SCFR: Route Quarantine, Promotion, and Rollback Tests
 */

import { describe, it, expect } from 'vitest';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';
import { QuarantineController } from '../../src/core/quarantine/controller';
import { RoutePromotionController } from '../../src/core/quarantine/promotion';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { defaultTokenAuthenticator } from '../../src/core/quarantine/tokenAuthenticator';
import { CausalVerificationResult, WitnessClass, TransitionVerificationToken } from '../../src/types/transition';

describe('QuarantineController & RoutePromotionController', () => {
  it('strictly quarantines provisional routes and denies active status without verified transition', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);
    const negStore = new NegativeEvidenceStore();
    const quarantine = new QuarantineController(routeManager, negStore);
    const promotion = new RoutePromotionController(routeManager, quarantine);

    // Create route in PROVISIONAL state
    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.85);
    expect(route.status).toBe('PROVISIONAL');
    expect(quarantine.isUnderQuarantine(route.status)).toBe(true);

    // Failed verification attempt
    const failedVerification: CausalVerificationResult = {
      signature: {} as any,
      activationEvent: {} as any,
      observedWitnesses: [],
      verifiedWitnessClasses: [],
      status: 'FAILED_MISSING_WITNESSES',
      causallyVerified: false,
      durationMs: 1500,
      explanation: 'No witnesses',
    };

    const promoResult = promotion.evaluateAndPromote('CAP_DISABLE_MARKETING', route.routeId, failedVerification);

    expect(promoResult.promoted).toBe(false);
    expect(promoResult.route.status).toBe('QUARANTINED');
    expect(negStore.isKnownContradiction(route.routeId)).toBe(true);
  });

  it('promotes provisional route to ACTIVE_VALIDATED upon successful transition verification', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);
    const negStore = new NegativeEvidenceStore();
    const quarantine = new QuarantineController(routeManager, negStore);
    const promotion = new RoutePromotionController(routeManager, quarantine);

    const route = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.92);

    const successVerification: CausalVerificationResult = {
      signature: {} as any,
      activationEvent: {} as any,
      observedWitnesses: [{} as any, {} as any],
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      status: 'VERIFIED',
      causallyVerified: true,
      durationMs: 80,
      explanation: 'Causal transition verified',
      verificationToken: defaultTokenAuthenticator.issueToken({
        tokenId: 'tok_test_1',
        routeId: route.routeId,
        capabilityId: 'CAP_DISABLE_MARKETING',
        activationEventId: 'act_1',
        verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'],
      }),
    };

    const promoResult = promotion.evaluateAndPromote('CAP_DISABLE_MARKETING', route.routeId, successVerification);

    expect(promoResult.promoted).toBe(true);
    expect(promoResult.route.status).toBe('ACTIVE_VALIDATED');
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')?.routeId).toBe(route.routeId);
  });

  it('adversarially rejects route promotion when token routeId or capabilityId does not match the target route', () => {
    const graph = new CapabilityGraphEngine();
    const routeManager = new RouteManager(graph);

    const routeA = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.90);
    const routeB = routeManager.createProvisionalRoute('CAP_DISABLE_MARKETING', [], 0.88);

    // Token minted for Route A
    const tokenRouteA: TransitionVerificationToken = defaultTokenAuthenticator.issueToken({
      tokenId: 'tok_route_a',
      routeId: routeA.routeId,
      capabilityId: 'CAP_DISABLE_MARKETING',
      activationEventId: 'act_123',
      verifiedWitnessClasses: ['DOM_MUTATION', 'ACCESSIBILITY_STATE_MUTATION'] as WitnessClass[],
    });

    // Adversarial attack 1: Try to promote Route B using Token A
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeB.routeId, tokenRouteA);
    }).toThrow(/INVARIANT VIOLATION: Token routeId '.*' does not match target routeId/);

    // Adversarial attack 2: Try to promote Route A for CAP_EXPORT_DATA using Token for CAP_DISABLE_MARKETING
    expect(() => {
      routeManager.promoteToActive('CAP_EXPORT_DATA', routeA.routeId, tokenRouteA);
    }).toThrow(/INVARIANT VIOLATION: Token capabilityId '.*' does not match route capabilityId/);

    // Adversarial attack 3: Token with <2 witness classes
    const singleClassToken: TransitionVerificationToken = {
      ...tokenRouteA,
      verifiedWitnessClasses: ['DOM_MUTATION'] as WitnessClass[],
    };
    expect(() => {
      routeManager.promoteToActive('CAP_DISABLE_MARKETING', routeA.routeId, singleClassToken);
    }).toThrow(/INVARIANT VIOLATION: Token does not demonstrate the required quorum/);
  });
});

