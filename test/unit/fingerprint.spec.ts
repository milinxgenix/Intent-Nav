/**
 * IntentNav-SCFR: Functional Capability Fingerprint Tests
 */

import { describe, it, expect } from 'vitest';
import { FingerprintConstructor } from '../../src/core/fingerprint/constructor';

describe('FingerprintConstructor', () => {
  it('constructs a full FunctionalCapabilityFingerprint with all evidence channels', () => {
    const button = document.createElement('button');
    button.setAttribute('role', 'switch');
    button.setAttribute('aria-label', 'Marketing Notifications');
    button.textContent = 'Disable marketing';

    const fingerprint = FingerprintConstructor.fromElement(button, {
      capabilityId: 'CAP_DISABLE_MARKETING',
      canonicalFunction: 'disable_marketing_communications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
      semanticSynonyms: ['stop promotional emails', 'turn off marketing alerts'],
    });

    expect(fingerprint.capabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(fingerprint.actionType).toBe('MODIFY_PREFERENCE');
    expect(fingerprint.targetEntity).toBe('MARKETING_NOTIFICATIONS');
    expect(fingerprint.semanticEvidence.role).toBe('switch');
    expect(fingerprint.semanticEvidence.semanticSynonyms).toContain('stop promotional emails');
    expect(fingerprint.transitionEvidence.witnessClasses).toContain('DOM_MUTATION');
    expect(fingerprint.riskMetadata.riskClass).toBe('REVERSIBLE');
    expect(fingerprint.riskMetadata.requiresConfirmation).toBe(false);
  });

  it('assigns high-risk metadata and flags confirmation requirement for destructive capabilities', () => {
    const button = document.createElement('button');
    button.textContent = 'Deactivate Account';

    const fingerprint = FingerprintConstructor.fromElement(button, {
      capabilityId: 'CAP_DEACTIVATE',
      canonicalFunction: 'deactivate_user_account',
      actionType: 'DEACTIVATE_ACCOUNT',
      targetEntity: 'ACCOUNT_STATUS',
      riskClass: 'DESTRUCTIVE',
    });

    expect(fingerprint.riskMetadata.riskClass).toBe('DESTRUCTIVE');
    expect(fingerprint.riskMetadata.requiresConfirmation).toBe(true);
  });
});
