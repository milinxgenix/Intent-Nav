/**
 * IntentNav-SCFR: Step 7 — Generic Capability Acquisition Unit Tests
 *
 * Verifies:
 * 1. Discovery and acquisition of previously unseen interface capabilities.
 * 2. Deterministic domain-separated SHA-256 fingerprinting.
 * 3. Invariant separation: Capability Identity != Concrete DOM Instance (BindingHandle).
 * 4. Rejection of sensitive credentials, hidden elements, ambiguous controls, volatile-only hashes.
 * 5. Safe refusal: Discovery does NOT automatically grant execution authorization.
 */

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { CapabilityAcquisitionEngine } from '../../src/core/capability/acquisition';
import { CandidateGenerator } from '../../src/core/candidate/generator';
import { ExecutionAuthorizationController } from '../../src/core/authorization/controller';

describe('Step 7: Generic Capability Acquisition Engine', () => {
  it('acquires previously unseen interface capabilities from arbitrary DOM elements', () => {
    const dom = new JSDOM(`
      <section role="region" aria-label="Cloud Sync Preferences">
        <h3>Automatic Cloud Backup</h3>
        <p>Keep your files synchronized with cloud servers automatically.</p>
        <button role="switch" aria-checked="true" aria-label="Toggle Automatic Cloud Backup">
          Automatic Cloud Backup
        </button>
      </section>
    `);

    const result = CapabilityAcquisitionEngine.discoverFromDOM(dom.window.document, '/settings/cloud');

    expect(result.acquiredCapabilities.length).toBe(1);
    const cap = result.acquiredCapabilities[0]!;

    expect(cap.capabilityId).toContain('CAP_MODIFY_PREFERENCE');
    expect(cap.actionType).toBe('MODIFY_PREFERENCE');
    expect(cap.fingerprintVersion).toBe('v2');
    expect(cap.fingerprintHash).toMatch(/^capfp_sha256_[a-f0-9]{64}$/);
    expect(cap.provenance.source).toBe('DISCOVERED');
    expect(cap.semanticEvidence.accessibleName).toBe('Toggle Automatic Cloud Backup');
  });

  it('produces identical SHA-256 fingerprint hashes for repeated equivalent capabilities across different sessions', () => {
    const dom1 = new JSDOM(`
      <div role="group" aria-label="Data Privacy">
        <button role="switch" aria-checked="true" aria-label="Telemetry Data Sharing" id="volatile_session_111">
          Telemetry Data Sharing
        </button>
      </div>
    `);

    const dom2 = new JSDOM(`
      <div role="group" aria-label="Data Privacy">
        <button role="switch" aria-checked="true" aria-label="Telemetry Data Sharing" id="volatile_session_999">
          Telemetry Data Sharing
        </button>
      </div>
    `);

    const res1 = CapabilityAcquisitionEngine.discoverFromDOM(dom1.window.document);
    const res2 = CapabilityAcquisitionEngine.discoverFromDOM(dom2.window.document);

    expect(res1.acquiredCapabilities.length).toBe(1);
    expect(res2.acquiredCapabilities.length).toBe(1);

    const cap1 = res1.acquiredCapabilities[0]!;
    const cap2 = res2.acquiredCapabilities[0]!;

    expect(cap1.fingerprintHash).toBe(cap2.fingerprintHash);
    expect(cap1.canonicalFunction).toBe(cap2.canonicalFunction);
  });

  it('preserves distinction between capability identity and concrete DOM instance (BindingHandle)', () => {
    const dom = new JSDOM(`
      <form role="form" aria-label="Audio Controls">
        <button role="button" aria-label="Mute Microphone" id="btn_mic_vol_42">
          Mute Mic
        </button>
      </form>
    `);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    expect(candidates.length).toBe(1);

    const cand = candidates[0]!;
    const cap = CapabilityAcquisitionEngine.acquireCapability(cand);

    expect(cap.fingerprintHash).toBeDefined();
    expect(cap.fingerprintHash).not.toBe(cand.bindingHandle?.handleId);
    expect(cap.fingerprintHash).not.toBe(cand.bindingHandle?.volatileId);
    expect(cand.bindingHandle?.volatileId).toBe('btn_mic_vol_42');
  });

  it('rejects sensitive credential and password elements from acquisition', () => {
    const dom = new JSDOM(`
      <form>
        <label for="pwd">Enter New Master Password</label>
        <input type="password" id="pwd" name="master_password" autocomplete="current-password" />
      </form>
    `);

    const result = CapabilityAcquisitionEngine.discoverFromDOM(dom.window.document);
    expect(result.acquiredCapabilities.length).toBe(0);
    expect(result.discoveredCandidates.length).toBe(0);
  });

  it('rejects inaccessible and hidden elements from acquisition', () => {
    const dom = new JSDOM(`
      <div>
        <button disabled aria-label="Disabled Action">Unavailable</button>
        <button aria-hidden="true" aria-label="Hidden Action">Secret</button>
      </div>
    `);

    const result = CapabilityAcquisitionEngine.discoverFromDOM(dom.window.document);
    expect(result.acquiredCapabilities.length).toBe(0);
    expect(result.rejectedCandidates.length).toBeGreaterThan(0);
    expect(result.rejectedCandidates.some((r) => r.reason === 'ELEMENT_INACCESSIBLE_OR_HIDDEN')).toBe(true);
  });

  it('rejects ambiguous controls with blank labels and no context', () => {
    const dom = new JSDOM(`
      <div>
        <button id="btn_xyz"></button>
      </div>
    `);

    const candidates = CandidateGenerator.generateFromDOM(dom.window.document);
    const eligibility = CapabilityAcquisitionEngine.evaluateEligibility(candidates[0]!);

    expect(eligibility.eligible).toBe(false);
    expect(eligibility.rejectionReason).toBe('AMBIGUOUS_SEMANTICS');
  });

  it('does NOT silently grant execution authorization merely because a capability was discovered', () => {
    const dom = new JSDOM(`
      <div role="region" aria-label="Account Administration">
        <button role="button" aria-label="Permanently Erase Customer Records">
          Permanently Erase Customer Records
        </button>
      </div>
    `);

    const result = CapabilityAcquisitionEngine.discoverFromDOM(dom.window.document);
    expect(result.acquiredCapabilities.length).toBe(1);

    const cap = result.acquiredCapabilities[0]!;
    expect(cap.riskMetadata.requiresConfirmation).toBe(true);
    expect(cap.riskMetadata.destructive).toBe(true);

    const authDecision = ExecutionAuthorizationController.authorize({
      fingerprint: cap,
      capabilityConfidence: cap.confidence.capabilityConfidence,
      routeConfidence: 0.85,
      invariantResult: null,
      transitionResult: null,
      userConfirmationGranted: false,
    });

    expect(authDecision.status).not.toBe('AUTHORIZED');
    expect(authDecision.requiresUserConfirmation).toBe(true);
  });
});
