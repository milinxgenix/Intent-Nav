/**
 * IntentNav-SCFR: BindingHandle vs Persistent Capability Identity Tests
 *
 * Phase 10 Invariant:
 * 1. Persistent capability identity is derived from canonical functional semantics.
 * 2. BindingHandle is a volatile execution mechanism to resolve DOM elements.
 * 3. Volatile DOM IDs and CSS class changes NEVER alter capability identity.
 * 4. Different functional semantics with identical/similar presentation produce DIFFERENT capability interpretations.
 */

import { describe, it, expect } from 'vitest';
import { FingerprintConstructor } from '../../src/core/fingerprint/constructor';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';

describe('BindingHandle vs Persistent Capability Identity Separation', () => {
  it('proves that DOM ID changes + CSS class changes with same functional semantics => SAME capability identity', () => {
    // Original Element (Site A Style)
    const originalEl = document.createElement('button');
    originalEl.id = 'clean-stable-id';
    originalEl.className = 'btn btn-primary';
    originalEl.setAttribute('role', 'switch');
    originalEl.setAttribute('aria-label', 'Marketing Notifications Toggle');
    originalEl.textContent = 'Disable marketing emails';

    const originalFingerprint = FingerprintConstructor.fromElement(originalEl, {
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_communications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    // Perturbed Element (Site C Style: completely scrambled framework ID and CSS-in-JS classes)
    const driftedEl = document.createElement('button');
    driftedEl.id = ':r9_random_guid_82910:';
    driftedEl.className = 'css-sc92h1 tw-p-4 tw-bg-indigo-600 tw-rounded-lg dynamic-class-772';
    driftedEl.setAttribute('role', 'switch');
    driftedEl.setAttribute('aria-label', 'Marketing Notifications Toggle');
    driftedEl.textContent = 'Disable marketing emails';

    const driftedFingerprint = FingerprintConstructor.fromElement(driftedEl, {
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_communications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    // Persistent capability identity must remain identical
    expect(driftedFingerprint.capabilityId).toBe(originalFingerprint.capabilityId);
    expect(driftedFingerprint.canonicalFunction).toBe(originalFingerprint.canonicalFunction);
    expect(driftedFingerprint.actionType).toBe(originalFingerprint.actionType);
    expect(driftedFingerprint.targetEntity).toBe(originalFingerprint.targetEntity);

    // Now test CandidateGenerator extraction:
    const doc = document.implementation.createHTMLDocument('Test');
    doc.body.appendChild(driftedEl);

    const candidates = CandidateGenerator.generateFromDOM(doc);
    expect(candidates.length).toBe(1);
    const candidate = candidates[0]!;

    // BindingHandle captures volatile execution info
    expect(candidate.bindingHandle).toBeDefined();
    expect(candidate.bindingHandle?.volatileId).toBe(':r9_random_guid_82910:');
    expect(candidate.bindingHandle?.volatileClasses).toContain('css-sc92h1');

    // But candidate functional evaluation matches the persistent capability!
    const closure = InvariantClosureEngine.evaluateCandidate(originalFingerprint, candidate);
    expect(closure.status).toBe('PASS');
    expect(closure.isEligibleForRanking).toBe(true);
  });

  it('proves that different functional semantics with similar presentation => DIFFERENT candidate/capability interpretation', () => {
    // Capability Target: Disable marketing notifications
    const targetFingerprint = FingerprintConstructor.fromElement(document.createElement('button'), {
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_communications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
    });

    // Decoy Element with identical styling and similar label, but different functional target (ALL_NOTIFICATIONS)
    const decoyEl = document.createElement('button');
    decoyEl.id = 'clean-button-id';
    decoyEl.className = 'btn btn-primary';
    decoyEl.setAttribute('role', 'switch');
    decoyEl.setAttribute('aria-label', 'Disable All Account Notifications');
    decoyEl.textContent = 'Disable all communications';

    const doc = document.implementation.createHTMLDocument('Test Decoy');
    doc.body.appendChild(decoyEl);

    const candidates = CandidateGenerator.generateFromDOM(doc);
    expect(candidates.length).toBe(1);
    const decoyCandidate = candidates[0]!;

    // Invariant closure must REJECT the candidate because target entity does not match MARKETING_NOTIFICATIONS
    const closure = InvariantClosureEngine.evaluateCandidate(targetFingerprint, decoyCandidate);
    expect(closure.status).not.toBe('PASS');
    expect(closure.isEligibleForRanking).toBe(false);
    expect(closure.rejectionReason).toMatch(/Target Entity Mismatch|Mandatory invariant failed|Candidate targets forbidden entity/i);
  });
});
