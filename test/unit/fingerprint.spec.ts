/**
 * IntentNav-SCFR: Functional Capability Fingerprint Tests
 * Verifies persistent capability identity invariance against volatile UI presentation (Req 1 & 19).
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FingerprintConstructor } from '../../src/core/fingerprint/constructor';
import { AUTHORITATIVE_CAPABILITY_CATALOG } from '../../src/core/capability/catalog';

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

  describe('Requirement 1 & Requirement 19 Regression Tests', () => {
    // TEST A: Same functional capability, different visible label -> same fingerprint.
    it('TEST A: Same functional capability, different visible label -> same fingerprint', () => {
      const elA = document.createElement('button');
      elA.setAttribute('role', 'switch');
      elA.textContent = 'Turn off marketing emails';

      const elB = document.createElement('button');
      elB.setAttribute('role', 'switch');
      elB.textContent = 'Stop promotional commercial alerts and weekly bulletins';

      const fpA = FingerprintConstructor.fromElement(elA, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      const fpB = FingerprintConstructor.fromElement(elB, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      expect(fpA.fingerprintHash).toBeDefined();
      expect(fpB.fingerprintHash).toBeDefined();
      expect(fpA.fingerprintHash).toBe(fpB.fingerprintHash);
      // Verify visible labels are still preserved in evidence channels
      expect(fpA.semanticEvidence.visibleLabel).toBe('Turn off marketing emails');
      expect(fpB.semanticEvidence.visibleLabel).toBe('Stop promotional commercial alerts and weekly bulletins');
    });

    // TEST B: Same functional capability, different accessible label -> same fingerprint.
    it('TEST B: Same functional capability, different accessible label -> same fingerprint', () => {
      const elA = document.createElement('button');
      elA.setAttribute('role', 'switch');
      elA.setAttribute('aria-label', 'Disable marketing notifications');

      const elB = document.createElement('button');
      elB.setAttribute('role', 'switch');
      elB.setAttribute('aria-label', 'Opt-out of all commercial bulletins and promotional notices');

      const fpA = FingerprintConstructor.fromElement(elA, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      const fpB = FingerprintConstructor.fromElement(elB, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      expect(fpA.fingerprintHash).toBe(fpB.fingerprintHash);
      // Accessible names remain intact in supporting evidence channels
      expect(fpA.semanticEvidence.accessibleName).toBe('Disable marketing notifications');
      expect(fpB.semanticEvidence.accessibleName).toBe('Opt-out of all commercial bulletins and promotional notices');
    });

    // TEST C: Same functional capability, different volatile DOM identifier -> same fingerprint
    it('TEST C: Same functional capability, different volatile DOM identifier -> same fingerprint where that identifier is not functionally relevant', () => {
      const elA = document.createElement('button');
      elA.id = 'static_marketing_toggle_btn_01';
      elA.className = 'btn btn-primary active-style';
      elA.setAttribute('role', 'switch');

      const elB = document.createElement('button');
      elB.id = ':r9_random_guid_82910:';
      elB.className = 'css-sc92h1 tw-p-4 tw-bg-indigo-600 dynamic-772';
      elB.setAttribute('role', 'switch');

      const fpA = FingerprintConstructor.fromElement(elA, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      const fpB = FingerprintConstructor.fromElement(elB, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      expect(fpA.fingerprintHash).toBe(fpB.fingerprintHash);
    });

    // TEST D: Different genuinely functional field -> different fingerprint
    it('TEST D: Different genuinely functional field -> different fingerprint', () => {
      const baseHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });

      // Different actionType
      const diffActionHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'DELETE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      expect(diffActionHash).not.toBe(baseHash);

      // Different targetEntity
      const diffEntityHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'ACCOUNT_STATUS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      expect(diffEntityHash).not.toBe(baseHash);

      // Different role
      const diffRoleHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'button',
        riskClass: 'REVERSIBLE',
      });
      expect(diffRoleHash).not.toBe(baseHash);

      // Different canonicalFunction
      const diffFunctionHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'delete_personal_account',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      expect(diffFunctionHash).not.toBe(baseHash);

      // Different riskClass
      const diffRiskHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'DESTRUCTIVE',
      });
      expect(diffRiskHash).not.toBe(baseHash);

      // Different mandatoryPreStatePredicates
      const diffPreHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        mandatoryPreStatePredicates: [{ id: 'PRE_SPECIFIC_STATE_CHECK' }],
      });
      expect(diffPreHash).not.toBe(baseHash);
    });

    // TEST E: Positive Chromium evidence contains a non-empty fingerprint hash matching the actual resolved capability fingerprint
    it('TEST E: Positive Chromium evidence contains a non-empty fingerprint hash matching the actual resolved capability fingerprint', () => {
      const evidencePath = path.resolve(__dirname, '../../evidence/chromium_e2e_evidence.json');
      expect(fs.existsSync(evidencePath)).toBe(true);

      const raw = fs.readFileSync(evidencePath, 'utf8');
      const data = JSON.parse(raw);
      expect(data.scenarios).toBeDefined();
      expect(data.scenarios.length).toBe(10);

      for (const scenario of data.scenarios) {
        // Assert non-empty fingerprint hash formatted as fph_
        expect(scenario.capabilityFingerprintHash).toBeDefined();
        expect(scenario.capabilityFingerprintHash).toMatch(/^fph_[0-9a-f]+$/);

        // Find corresponding capability in catalog
        const catalogCap = AUTHORITATIVE_CAPABILITY_CATALOG.find(
          (c) => c.capabilityId === scenario.resolvedCapabilityId
        );
        expect(catalogCap).toBeDefined();
        expect(catalogCap!.fingerprintHash).toBeDefined();
        expect(catalogCap!.fingerprintHash).toMatch(/^fph_[0-9a-f]+$/);

        // Positive evidence hash must strictly match the resolved capability fingerprint hash
        expect(scenario.capabilityFingerprintHash).toBe(catalogCap!.fingerprintHash);
      }
    });
  });
});
