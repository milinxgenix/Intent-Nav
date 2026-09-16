/**
 * IntentNav-SCFR: Route Quarantine, Promotion, and Rollback Tests
 */

import { describe, it, expect } from 'vitest';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';
import { QuarantineController } from '../../src/core/quarantine/controller';
import { RoutePromotionController } from '../../src/core/quarantine/promotion';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { CausalVerificationResult } from '../../src/types/transition';

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
    };

    const promoResult = promotion.evaluateAndPromote('CAP_DISABLE_MARKETING', route.routeId, successVerification);

    expect(promoResult.promoted).toBe(true);
    expect(promoResult.route.status).toBe('ACTIVE_VALIDATED');
    expect(graph.getActiveRoute('CAP_DISABLE_MARKETING')?.routeId).toBe(route.routeId);
  });
});
