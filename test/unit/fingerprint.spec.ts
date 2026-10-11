/**
 * IntentNav-SCFR: Functional Capability Fingerprint & SHA-256 Identity Hardening Tests
 *
 * Verifies:
 * - Requirement 1 & Requirement 19 regression tests (TESTS A - E)
 * - Patent Hardening Step 2: Canonical Stable Representation + SHA-256 + Transition-Signature Binding (TESTS 1 - 15)
 * - Adversarial Capability Identity & Spoofing Resistance Tests
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  FingerprintConstructor,
  canonicalizeValue,
  CAPABILITY_FINGERPRINT_DOMAIN,
  TRANSITION_BINDING_DOMAIN,
  WITNESS_BINDING_DOMAIN,
} from '../../src/core/fingerprint/constructor';
import { AUTHORITATIVE_CAPABILITY_CATALOG, getAuthoritativeCapability } from '../../src/core/capability/catalog';
import { PromotionTokenAuthenticator } from '../../src/core/quarantine/tokenAuthenticator';
import { TransitionSignature } from '../../src/types/transition';
import { InvariantClosureEngine } from '../../src/core/invariant/engine';
import { NegativeEvidenceStore } from '../../src/core/contradiction/store';
import { PersistentCapabilityStore } from '../../src/core/storage/persistentStore';
import { CapabilityGraphEngine } from '../../src/core/graph/capabilityGraph';
import { RouteManager } from '../../src/core/graph/routeManager';

describe('FingerprintConstructor', () => {
  it('constructs a full FunctionalCapabilityFingerprint with all evidence channels and v2 SHA-256 identity', () => {
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
    expect(fingerprint.fingerprintVersion).toBe('v2');
    expect(fingerprint.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
    expect(fingerprint.transitionSignatureBinding).toMatch(/^tb_sha256_[0-9a-f]{64}$/);
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
    expect(fingerprint.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
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
      expect(fpA.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
      expect(fpA.fingerprintHash).toBe(fpB.fingerprintHash);
      // Verify visible labels are still preserved in evidence channels
      expect(fpA.semanticEvidence.visibleLabel).toBe('Turn off marketing emails');
      expect(fpB.semanticEvidence.visibleLabel).toBe(
        'Stop promotional commercial alerts and weekly bulletins'
      );
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
      expect(fpB.semanticEvidence.accessibleName).toBe(
        'Opt-out of all commercial bulletins and promotional notices'
      );
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

    // TEST E: Positive Chromium evidence contains a non-empty fingerprint hash matching the actual resolved capability fingerprint (with explicit v1->v2 version boundary)
    it('TEST E: Positive Chromium evidence contains a non-empty fingerprint hash matching the actual resolved capability fingerprint', () => {
      const evidencePath = path.resolve(__dirname, '../../evidence/chromium_e2e_evidence.json');
      expect(fs.existsSync(evidencePath)).toBe(true);

      const raw = fs.readFileSync(evidencePath, 'utf8');
      const data = JSON.parse(raw);
      expect(data.scenarios).toBeDefined();
      expect(data.scenarios.length).toBe(10);

      for (const scenario of data.scenarios) {
        expect(scenario.capabilityFingerprintHash).toBeDefined();

        // Find corresponding capability in catalog
        const catalogCap = AUTHORITATIVE_CAPABILITY_CATALOG.find(
          (c) => c.capabilityId === scenario.resolvedCapabilityId
        );
        expect(catalogCap).toBeDefined();
        expect(catalogCap!.fingerprintHash).toBeDefined();
        expect(catalogCap!.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
        expect(catalogCap!.fingerprintVersion).toBe('v2');

        // Verify recorded hash matches authoritative capability via explicit version-boundary check
        const matchResult = FingerprintConstructor.matchesCapabilityFingerprint(
          scenario.capabilityFingerprintHash,
          catalogCap!
        );
        expect(matchResult.matches).toBe(true);
        expect(['v2', 'v1_legacy']).toContain(matchResult.version);
        expect(matchResult.expectedV2Hash).toBe(catalogCap!.fingerprintHash);
      }
    });
  });

  describe('Patent Hardening Step 2: Canonical Stable Representation + SHA-256 + Transition-Signature Binding (TESTS 1-15)', () => {
    const sampleCapabilityInput = {
      canonicalFunction: 'disable_marketing_notifications',
      actionType: 'MODIFY_PREFERENCE',
      targetEntity: 'MARKETING_NOTIFICATIONS',
      role: 'switch',
      riskClass: 'REVERSIBLE',
      domainScope: 'account.settings.notifications',
      mandatoryPreStatePredicates: [
        { id: 'PRE_MARKETING_ENABLED', name: 'Marketing enabled' },
        { id: 'PRE_USER_AUTHENTICATED', name: 'User authenticated' },
      ],
      allowedStateDelta: [
        { property: 'marketing_notifications_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
        { property: 'marketing_emails_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
      ],
      expectedPostState: [
        { property: 'marketing_notifications_enabled', expectedValue: false },
        { property: 'audit_metadata', expectedValue: { channel: 'email', optedOut: true } },
      ],
      requiredContextPredicates: [
        { target: 'container', pattern: 'notifications', required: true },
        { target: 'ancestor', pattern: 'settings', required: true },
      ],
      forbiddenContextPredicates: [
        { target: 'sibling', pattern: 'delete_account', required: false },
      ],
    };

    it('TEST 1 — Determinism: Same capability definition -> identical canonical representation and identical SHA-256 fingerprint across repeated invocations', async () => {
      const canonical1 = FingerprintConstructor.buildCanonicalCapabilityRepresentation(
        sampleCapabilityInput
      );
      const canonical2 = FingerprintConstructor.buildCanonicalCapabilityRepresentation(
        structuredClone(sampleCapabilityInput)
      );
      expect(canonical1).toBe(canonical2);

      const syncHash1 = FingerprintConstructor.computeFingerprintHash(sampleCapabilityInput);
      const syncHash2 = FingerprintConstructor.computeFingerprintHash(sampleCapabilityInput);
      const asyncHash = await FingerprintConstructor.computeFingerprintHashAsync(
        sampleCapabilityInput
      );

      expect(syncHash1).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
      expect(syncHash1).toBe(syncHash2);
      expect(syncHash1).toBe(asyncHash);
    });

    it('TEST 2 — Key-Order Invariance: Same capability object with object keys in different order -> identical canonical representation and identical SHA-256 fingerprint', () => {
      const orderA = {
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        expectedPostState: [
          {
            property: 'nested_config',
            expectedValue: { alpha: 1, beta: 'two', gamma: { x: true, y: false } },
          },
        ],
      };

      const orderB = {
        riskClass: 'REVERSIBLE',
        role: 'switch',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        expectedPostState: [
          {
            expectedValue: { gamma: { y: false, x: true }, beta: 'two', alpha: 1 },
            property: 'nested_config',
          },
        ],
        actionType: 'MODIFY_PREFERENCE',
        canonicalFunction: 'disable_marketing_notifications',
      };

      const canonA = FingerprintConstructor.buildCanonicalCapabilityRepresentation(orderA);
      const canonB = FingerprintConstructor.buildCanonicalCapabilityRepresentation(orderB);
      expect(canonA).toBe(canonB);

      const hashA = FingerprintConstructor.computeFingerprintHash(orderA);
      const hashB = FingerprintConstructor.computeFingerprintHash(orderB);
      expect(hashA).toBe(hashB);
    });

    it('TEST 3 — Set-Order Invariance: Same capability with order-insensitive predicate sets in different order (and duplicates) -> identical SHA-256 fingerprint', () => {
      const inputOrder1 = {
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        mandatoryPreStatePredicates: [
          { id: 'PRE_A' },
          { id: 'PRE_B' },
          { id: 'PRE_C' },
        ],
        allowedStateDelta: [
          { property: 'prop_1', expectedChange: 'ENABLED_TO_DISABLED' },
          { property: 'prop_2', expectedChange: 'MODIFIED' },
        ],
        expectedPostState: [
          { property: 'prop_1', expectedValue: false },
          { property: 'prop_2', expectedValue: 'updated' },
        ],
        requiredContextPredicates: [
          { target: 'container', pattern: 'privacy' },
          { target: 'ancestor', pattern: 'main' },
        ],
        forbiddenContextPredicates: [
          { target: 'sibling', pattern: 'danger' },
          { target: 'container', pattern: 'billing' },
        ],
      };

      const inputOrder2 = {
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        mandatoryPreStatePredicates: [
          { id: 'PRE_C' },
          { id: 'PRE_A' },
          { id: 'PRE_B' },
          { id: 'PRE_A' }, // duplicate entry
        ],
        allowedStateDelta: [
          { property: 'prop_2', expectedChange: 'MODIFIED' },
          { property: 'prop_1', expectedChange: 'ENABLED_TO_DISABLED' },
        ],
        expectedPostState: [
          { property: 'prop_2', expectedValue: 'updated' },
          { property: 'prop_1', expectedValue: false },
        ],
        requiredContextPredicates: [
          { target: 'ancestor', pattern: 'main' },
          { target: 'container', pattern: 'privacy' },
        ],
        forbiddenContextPredicates: [
          { target: 'container', pattern: 'billing' },
          { target: 'sibling', pattern: 'danger' },
        ],
      };

      const hash1 = FingerprintConstructor.computeFingerprintHash(inputOrder1);
      const hash2 = FingerprintConstructor.computeFingerprintHash(inputOrder2);
      expect(hash1).toBe(hash2);
    });

    it('TEST 4 — Volatile ID / CSS Suppression: Same capability with different React/Vue/Tailwind/Emotion IDs and classes -> identical SHA-256 fingerprint', () => {
      const reactBtn = document.createElement('button');
      reactBtn.id = 'react-aria-9928172-:r1a:';
      reactBtn.className = 'css-1928abc sc-bdVaJa flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700';
      reactBtn.setAttribute('role', 'switch');

      const vueBtn = document.createElement('button');
      vueBtn.id = 'vue-uid-77123-88912';
      vueBtn.className = '_moduleHash99123 grid gap-2 text-sm border-gray-200 is-active';
      vueBtn.setAttribute('role', 'switch');

      const fpReact = FingerprintConstructor.fromElement(reactBtn, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      const fpVue = FingerprintConstructor.fromElement(vueBtn, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      expect(fpReact.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
      expect(fpReact.fingerprintHash).toBe(fpVue.fingerprintHash);
    });

    it('TEST 5 — Coordinate / Layout Invariance: Same capability moved to different coordinates / container layout -> identical SHA-256 fingerprint', () => {
      const container1 = document.createElement('div');
      const section1 = document.createElement('section');
      const btn1 = document.createElement('button');
      btn1.setAttribute('role', 'switch');
      section1.appendChild(btn1);
      container1.appendChild(section1);

      const container2 = document.createElement('main');
      const nav2 = document.createElement('aside');
      const form2 = document.createElement('form');
      const btn2 = document.createElement('button');
      btn2.setAttribute('role', 'switch');
      form2.appendChild(btn2);
      nav2.appendChild(form2);
      container2.appendChild(nav2);

      const fp1 = FingerprintConstructor.fromElement(btn1, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      const fp2 = FingerprintConstructor.fromElement(btn2, {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
      });

      // Also verify direct coordinate/bounding-box injection in raw input is stripped
      const rawWithCoordsA = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        coordinates: { x: 120, y: 450 },
        boundingBox: { top: 450, left: 120, width: 88, height: 32 },
        xpath: '/html/body/div[1]/section/button[1]',
      });

      const rawWithCoordsB = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        coordinates: { x: 940, y: 80 },
        boundingBox: { top: 80, left: 940, width: 240, height: 48 },
        xpath: '/html/body/main/aside/form/div[4]/button[2]',
      });

      expect(fp1.fingerprintHash).toBe(fp2.fingerprintHash);
      expect(rawWithCoordsA).toBe(rawWithCoordsB);
      expect(fp1.fingerprintHash).toBe(rawWithCoordsA);
    });

    it('TEST 6 — Cosmetic Label Variation vs Canonical Function: Same canonical capability with cosmetic visible/accessible label variation -> identical SHA-256 fingerprint', () => {
      const hashLabel1 = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        canonicalLabel: 'Marketing Emails',
        visibleLabel: 'Turn off marketing emails',
        accessibleName: 'Marketing email toggle',
      });

      const hashLabel2 = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
        canonicalLabel: 'Promotional Bulletins Opt-Out',
        visibleLabel: 'Unsubscribe from promotional alerts',
        accessibleName: 'Commercial bulletin switch',
      });

      expect(hashLabel1).toBe(hashLabel2);
    });

    it('TEST 7 — Action Type Sensitivity: Changing actionType -> different SHA-256 fingerprint', () => {
      const hModify = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'manage_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
      });
      const hDelete = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'manage_notifications',
        actionType: 'DELETE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
      });
      const hView = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'manage_notifications',
        actionType: 'VIEW',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
      });

      expect(hModify).not.toBe(hDelete);
      expect(hModify).not.toBe(hView);
      expect(hDelete).not.toBe(hView);
    });

    it('TEST 8 — Target Entity Sensitivity: Changing targetEntity -> different SHA-256 fingerprint', () => {
      const hMarketing = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
      });
      const hSecurity = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'TWO_FACTOR_AUTH',
        role: 'switch',
      });
      const hAccount = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'ACCOUNT_STATUS',
        role: 'switch',
      });

      expect(hMarketing).not.toBe(hSecurity);
      expect(hMarketing).not.toBe(hAccount);
      expect(hSecurity).not.toBe(hAccount);
    });

    it('TEST 9 — Risk Class Sensitivity: Changing riskClass -> different SHA-256 fingerprint', () => {
      const hReversible = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'modify_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'PRIVACY_SETTINGS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      const hSecuritySensitive = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'modify_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'PRIVACY_SETTINGS',
        role: 'switch',
        riskClass: 'SECURITY_SENSITIVE',
      });
      const hDestructive = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'modify_setting',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'PRIVACY_SETTINGS',
        role: 'switch',
        riskClass: 'DESTRUCTIVE',
      });

      expect(hReversible).not.toBe(hSecuritySensitive);
      expect(hReversible).not.toBe(hDestructive);
      expect(hSecuritySensitive).not.toBe(hDestructive);
    });

    it('TEST 10 — Pre-State / Post-State Predicate Sensitivity: Changing mandatory pre-state or expected post-state predicate (including structured object values) -> different SHA-256 fingerprint', () => {
      const base = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        mandatoryPreStatePredicates: [{ id: 'PRE_MKT_ON' }],
        expectedPostState: [
          { property: 'marketing_notifications_enabled', expectedValue: false },
          { property: 'config', expectedValue: { frequency: 'never', paused: true } },
        ],
      });

      const changedPre = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        mandatoryPreStatePredicates: [{ id: 'PRE_MKT_OFF' }],
        expectedPostState: [
          { property: 'marketing_notifications_enabled', expectedValue: false },
          { property: 'config', expectedValue: { frequency: 'never', paused: true } },
        ],
      });

      const changedPostPrimitive = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        mandatoryPreStatePredicates: [{ id: 'PRE_MKT_ON' }],
        expectedPostState: [
          { property: 'marketing_notifications_enabled', expectedValue: true },
          { property: 'config', expectedValue: { frequency: 'never', paused: true } },
        ],
      });

      // Specifically verifies that nested object expectedValue is NOT collapsed into "[object Object]"
      const changedPostNestedObject = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        mandatoryPreStatePredicates: [{ id: 'PRE_MKT_ON' }],
        expectedPostState: [
          { property: 'marketing_notifications_enabled', expectedValue: false },
          { property: 'config', expectedValue: { frequency: 'weekly', paused: false } },
        ],
      });

      expect(changedPre).not.toBe(base);
      expect(changedPostPrimitive).not.toBe(base);
      expect(changedPostNestedObject).not.toBe(base);
    });

    it('TEST 11 — Allowed Delta Sensitivity: Changing allowed state delta -> different SHA-256 fingerprint', () => {
      const deltaDisable = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_marketing',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        allowedStateDelta: [
          { property: 'marketing_notifications_enabled', expectedChange: 'ENABLED_TO_DISABLED' },
        ],
      });

      const deltaEnable = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_marketing',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        allowedStateDelta: [
          { property: 'marketing_notifications_enabled', expectedChange: 'DISABLED_TO_ENABLED' },
        ],
      });

      const deltaDifferentProp = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'toggle_marketing',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        allowedStateDelta: [
          { property: 'account_deactivated', expectedChange: 'DISABLED_TO_ENABLED' },
        ],
      });

      expect(deltaDisable).not.toBe(deltaEnable);
      expect(deltaDisable).not.toBe(deltaDifferentProp);
      expect(deltaEnable).not.toBe(deltaDifferentProp);
    });

    it('TEST 12 — Transition Signature Binding Sensitivity: Changing TransitionSignature -> different transition binding and rejected token verification if mismatched', () => {
      const capFp = FingerprintConstructor.computeFingerprintHash(sampleCapabilityInput);

      const sigA: TransitionSignature = {
        preStateFingerprint: 'STATE_PRE_MKT_ON',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { marketing_notifications_enabled: false },
        verificationWindowMs: 2000,
        postStateFingerprint: 'STATE_POST_MKT_OFF',
      };

      const sigB: TransitionSignature = {
        ...sigA,
        expectedStateDelta: { marketing_notifications_enabled: true },
      };

      const sigC: TransitionSignature = {
        ...sigA,
        postStateFingerprint: 'STATE_POST_DEACTIVATED',
      };

      const tbA = FingerprintConstructor.computeTransitionSignatureHash(sigA, capFp);
      const tbB = FingerprintConstructor.computeTransitionSignatureHash(sigB, capFp);
      const tbC = FingerprintConstructor.computeTransitionSignatureHash(sigC, capFp);

      expect(tbA).toMatch(/^tb_sha256_[0-9a-f]{64}$/);
      expect(tbA).not.toBe(tbB);
      expect(tbA).not.toBe(tbC);
      expect(tbB).not.toBe(tbC);

      // Verify PromotionTokenAuthenticator rejects mismatched TransitionSignature
      const auth = new PromotionTokenAuthenticator();
      const token = auth.issueToken({
        routeId: 'route_mkt_v1',
        capabilityId: 'CAP_DISABLE_MARKETING',
        capabilityFingerprintHash: capFp,
        activationEventId: 'act_evt_101',
        verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
        transitionSignature: sigA,
      });

      const validOutcome = auth.verifyToken(token, {
        expectedRouteId: 'route_mkt_v1',
        expectedCapabilityId: 'CAP_DISABLE_MARKETING',
        expectedCapabilityFingerprintHash: capFp,
        expectedTransitionSignature: sigA,
      });
      expect(validOutcome.valid).toBe(true);

      const mismatchOutcome = auth.verifyToken(token, {
        expectedRouteId: 'route_mkt_v1',
        expectedCapabilityId: 'CAP_DISABLE_MARKETING',
        expectedCapabilityFingerprintHash: capFp,
        expectedTransitionSignature: sigB,
      });
      expect(mismatchOutcome.valid).toBe(false);
      expect(mismatchOutcome.failedCheck).toBe('TRANSITION_BINDING_MISMATCH');
    });

    it('TEST 13 — Runtime Context Independence: Changing activationEventId, issuedTimestamp, or runtime witness ID -> does NOT change persistent capability fingerprint identity, while properly changing runtime token bindings', () => {
      const fpRun1 = FingerprintConstructor.computeFingerprintHash({
        ...sampleCapabilityInput,
        activationEventId: 'act_run_001',
        issuedTimestamp: 1700000001000,
        witnessId: 'wit_dom_001',
        sessionToken: 'sess_abc',
      });

      const fpRun2 = FingerprintConstructor.computeFingerprintHash({
        ...sampleCapabilityInput,
        activationEventId: 'act_run_999',
        issuedTimestamp: 1850009999000,
        witnessId: 'wit_dom_999',
        sessionToken: 'sess_xyz',
      });

      // Persistent capability identity MUST remain invariant across runtime executions
      expect(fpRun1).toBe(fpRun2);

      // Meanwhile, runtime promotion tokens MUST change when runtime execution context changes
      const auth = new PromotionTokenAuthenticator();
      const sig: TransitionSignature = {
        preStateFingerprint: 'STATE_PRE_MKT_ON',
        activationEventExpected: { eventType: 'click' },
        expectedStateDelta: { marketing_notifications_enabled: false },
        verificationWindowMs: 2000,
        postStateFingerprint: 'STATE_POST_MKT_OFF',
      };

      const tok1 = auth.issueToken({
        routeId: 'route_mkt_v1',
        capabilityId: 'CAP_DISABLE_MARKETING',
        capabilityFingerprintHash: fpRun1,
        activationEventId: 'act_run_001',
        verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
        transitionSignature: sig,
        issuedTimestamp: 1700000001000,
      });

      const tok2 = auth.issueToken({
        routeId: 'route_mkt_v1',
        capabilityId: 'CAP_DISABLE_MARKETING',
        capabilityFingerprintHash: fpRun2,
        activationEventId: 'act_run_999',
        verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
        transitionSignature: sig,
        issuedTimestamp: 1850009999000,
      });

      expect(tok1.capabilityFingerprintHash).toBe(tok2.capabilityFingerprintHash);
      expect(tok1.transitionBinding).toBe(tok2.transitionBinding);
      expect(tok1.witnessDigest).not.toBe(tok2.witnessDigest);
      expect(tok1.signatureHash).not.toBe(tok2.signatureHash);
    });

    it('TEST 14 — Domain Separation: Identical structural data hashed under capability domain vs transition domain vs witness domain -> produces distinct digests', () => {
      const baseFields = {
        identifier: 'SHARED_TEST_IDENTIFIER',
        value: 'SHARED_TEST_VALUE',
      };

      const capDomainJson = canonicalizeValue({
        ...baseFields,
        domain: CAPABILITY_FINGERPRINT_DOMAIN,
      });
      const transDomainJson = canonicalizeValue({
        ...baseFields,
        domain: TRANSITION_BINDING_DOMAIN,
      });
      const witnessDomainJson = canonicalizeValue({
        ...baseFields,
        domain: WITNESS_BINDING_DOMAIN,
      });

      const capDigest = FingerprintConstructor.sha256HexSync(capDomainJson);
      const transDigest = FingerprintConstructor.sha256HexSync(transDomainJson);
      const witnessDigest = FingerprintConstructor.sha256HexSync(witnessDomainJson);

      expect(capDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(transDigest).toMatch(/^[0-9a-f]{64}$/);
      expect(witnessDigest).toMatch(/^[0-9a-f]{64}$/);

      expect(capDigest).not.toBe(transDigest);
      expect(capDigest).not.toBe(witnessDigest);
      expect(transDigest).not.toBe(witnessDigest);
    });

    it('TEST 15 — Known SHA-256 Test Vectors & Large-Sample 2,500-Capability Collision Resistance Check', async () => {
      // 15a: Verify standard NIST FIPS 180-4 SHA-256 test vectors
      const emptyDigestSync = FingerprintConstructor.sha256HexSync('');
      const emptyDigestAsync = await FingerprintConstructor.sha256HexAsync('');
      expect(emptyDigestSync).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
      expect(emptyDigestAsync).toBe(emptyDigestSync);

      const abcDigestSync = FingerprintConstructor.sha256HexSync('abc');
      const abcDigestAsync = await FingerprintConstructor.sha256HexAsync('abc');
      expect(abcDigestSync).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      );
      expect(abcDigestAsync).toBe(abcDigestSync);

      // 15b: Verify exact canonical capability representation against independent Node OpenSSL SHA-256
      const canonicalStr = FingerprintConstructor.buildCanonicalCapabilityRepresentation({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      const expectedIndependentSha256 = crypto
        .createHash('sha256')
        .update(canonicalStr, 'utf8')
        .digest('hex');
      const computedCapFp = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_marketing_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });
      expect(computedCapFp).toBe(`capfp_sha256_${expectedIndependentSha256}`);

      // 15c: Large-sample collision check across 2,500 distinct canonical capability specifications
      const actions = ['MODIFY_PREFERENCE', 'TOGGLE', 'VIEW', 'EXPORT_DATA', 'REVOKE_ACCESS'];
      const entities = [
        'MARKETING_NOTIFICATIONS',
        'PRIVACY_SETTINGS',
        'SECURITY_SETTINGS',
        'TWO_FACTOR_AUTH',
        'PERSONAL_DATA_EXPORT',
      ];
      const roles = ['switch', 'button', 'checkbox', 'menuitem', 'link'];
      const risks = ['READ_ONLY', 'REVERSIBLE', 'SECURITY_SENSITIVE', 'DESTRUCTIVE'];

      const seenCanonicalStrings = new Set<string>();
      const seenFingerprintHashes = new Set<string>();
      const totalSampleCount = 2500;

      for (let i = 0; i < totalSampleCount; i++) {
        const spec = {
          canonicalFunction: `canonical_capability_fn_${Math.floor(i / 20)}`,
          actionType: actions[i % actions.length]!,
          targetEntity: `${entities[Math.floor(i / 5) % entities.length]!}_SCOPE_${i % 25}`,
          role: roles[Math.floor(i / 25) % roles.length]!,
          riskClass: risks[Math.floor(i / 125) % risks.length]!,
          mandatoryPreStatePredicates: [{ id: `PRE_CHECK_${i}` }],
          allowedStateDelta: [{ property: `state_field_${i % 50}`, expectedChange: 'MODIFIED' }],
          expectedPostState: [{ property: `state_field_${i % 50}`, expectedValue: i }],
        };

        const canon = FingerprintConstructor.buildCanonicalCapabilityRepresentation(spec);
        const fp = FingerprintConstructor.computeFingerprintHash(spec);

        seenCanonicalStrings.add(canon);
        seenFingerprintHashes.add(fp);
      }

      expect(seenCanonicalStrings.size).toBe(totalSampleCount);
      expect(seenFingerprintHashes.size).toBe(totalSampleCount);
    });
  });

  describe('Section 8: Adversarial Capability Identity & Spoofing Resistance Tests', () => {
    it('Adversarial 1: Decoy control with same visible label ("Disable notifications") but broader/destructive target produces distinct fingerprint and is rejected by invariant/contradiction gates', () => {
      const legitimateCap = getAuthoritativeCapability('CAP_DISABLE_MARKETING')!;
      expect(legitimateCap).toBeDefined();

      // Decoy element has identical visible label and role, but targets ALL_NOTIFICATIONS / ACCOUNT_STATUS
      const decoyFpHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'disable_all_account_notifications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'ALL_NOTIFICATIONS',
        role: 'switch',
        riskClass: 'REVERSIBLE',
      });

      expect(decoyFpHash).not.toBe(legitimateCap.fingerprintHash);

      // Verify InvariantClosureEngine rejects decoy candidate
      const closureResult = InvariantClosureEngine.evaluateCandidate(legitimateCap, {
        candidateId: 'cand_decoy_broad',
        candidateLabel: 'Disable notifications',
        observedRole: 'switch',
        observedActionType: 'MODIFY_PREFERENCE',
        observedTargetEntity: 'ALL_NOTIFICATIONS',
        containerSemantics: ['notifications', 'settings'],
        observedState: { marketing_notifications_enabled: true },
        candidateFingerprintHash: decoyFpHash,
      });

      expect(closureResult.status).toBe('CONTRADICTED');
      expect(closureResult.isEligibleForRanking).toBe(false);

      // And NegativeEvidenceStore records the v2 SHA-256 candidateFingerprintHash
      const contradictionStore = new NegativeEvidenceStore();
      const recordedNeg = contradictionStore.recordContradiction(
        'cand_decoy_broad',
        'WRONG_TARGET_ENTITY',
        'TARGET_ENTITY_MATCH',
        'Decoy targets ALL_NOTIFICATIONS instead of MARKETING_NOTIFICATIONS',
        {},
        { fingerprintHash: decoyFpHash, capabilityId: legitimateCap.capabilityId }
      );
      expect(recordedNeg.candidateFingerprintHash).toBe(decoyFpHash);
      expect(recordedNeg.candidateFingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);
    });

    it('Adversarial 2: Destructive control disguised with benign styling preserves DESTRUCTIVE capability identity and high-risk confirmation gating', () => {
      const disguisedBtn = document.createElement('button');
      disguisedBtn.id = 'safe-green-action-btn';
      disguisedBtn.className = 'btn-success bg-emerald-500 text-white harmless-looking-utility';
      disguisedBtn.setAttribute('aria-label', 'Refresh Profile Status');
      disguisedBtn.textContent = 'Continue';

      const fp = FingerprintConstructor.fromElement(disguisedBtn, {
        capabilityId: 'CAP_DEACTIVATE_ACCOUNT',
        canonicalFunction: 'deactivate_account',
        actionType: 'DEACTIVATE_ACCOUNT',
        targetEntity: 'ACCOUNT_STATUS',
      });

      expect(fp.riskMetadata.riskClass).toBe('DESTRUCTIVE');
      expect(fp.riskMetadata.destructive).toBe(true);
      expect(fp.riskMetadata.requiresConfirmation).toBe(true);
      expect(fp.fingerprintHash).toMatch(/^capfp_sha256_[0-9a-f]{64}$/);

      // Must NOT match a benign READ_ONLY or REVERSIBLE capability fingerprint
      const benignFpHash = FingerprintConstructor.computeFingerprintHash({
        canonicalFunction: 'deactivate_account',
        actionType: 'VIEW',
        targetEntity: 'ACCOUNT_STATUS',
        role: 'button',
        riskClass: 'READ_ONLY',
      });
      expect(fp.fingerprintHash).not.toBe(benignFpHash);
    });

    it('Adversarial 3: Spoofed DOM attribute attempting to imitate another capability ID does not alter functional fingerprint computation or bypass invariant closure', () => {
      const spoofedElement = document.createElement('button');
      spoofedElement.id = 'CAP_DISABLE_MARKETING';
      spoofedElement.setAttribute('data-capability-id', 'CAP_DISABLE_MARKETING');
      spoofedElement.setAttribute('data-fingerprint-hash', 'capfp_sha256_' + 'a'.repeat(64));
      spoofedElement.setAttribute('role', 'button');
      spoofedElement.textContent = 'Deactivate Account Permanently';

      const actualConstructedFp = FingerprintConstructor.fromElement(spoofedElement, {
        capabilityId: 'CAP_OBSERVED_DESTRUCTIVE',
        canonicalFunction: 'deactivate_account',
        actionType: 'DEACTIVATE_ACCOUNT',
        targetEntity: 'ACCOUNT_STATUS',
      });

      const marketingCap = getAuthoritativeCapability('CAP_DISABLE_MARKETING')!;
      expect(actualConstructedFp.fingerprintHash).not.toBe(marketingCap.fingerprintHash);
      expect(actualConstructedFp.riskMetadata.riskClass).toBe('DESTRUCTIVE');
    });

    it('Adversarial 4: Mutated capability fingerprint attached to a stored capability or promotion token is detected and rejected', async () => {
      const marketingCap = getAuthoritativeCapability('CAP_DISABLE_MARKETING')!;
      const forgedFp =
        'capfp_sha256_' +
        (marketingCap.fingerprintHash!.endsWith('0')
          ? marketingCap.fingerprintHash!.slice('capfp_sha256_'.length, -1) + '1'
          : marketingCap.fingerprintHash!.slice('capfp_sha256_'.length, -1) + '0');

      // 4a: matchesCapabilityFingerprint detects tampered v2 hash
      const matchCheck = FingerprintConstructor.matchesCapabilityFingerprint(
        forgedFp,
        marketingCap
      );
      expect(matchCheck.matches).toBe(false);
      expect(matchCheck.version).toBe('v2');

      // 4b: PromotionTokenAuthenticator & RouteManager reject token with mutated capabilityFingerprintHash
      const graph = new CapabilityGraphEngine();
      const auth = new PromotionTokenAuthenticator();
      const routeManager = new RouteManager(graph, auth);

      const provisional = routeManager.createProvisionalRoute(
        'CAP_DISABLE_MARKETING',
        [
          {
            stepIndex: 1,
            fromStateId: 'STATE_A',
            toStateId: 'STATE_B',
            actionDescription: 'Toggle marketing switch',
          },
        ],
        0.91
      );

      const validToken = auth.issueToken({
        routeId: provisional.routeId,
        capabilityId: 'CAP_DISABLE_MARKETING',
        capabilityFingerprintHash: marketingCap.fingerprintHash,
        activationEventId: 'act_evt_valid_1',
        verifiedWitnessClasses: ['DOM_MUTATION', 'APPLICATION_STATE_MUTATION'],
      });

      // Mutate capabilityFingerprintHash on token after issuance -> rejected by both structural check and HMAC
      const tamperedToken = {
        ...validToken,
        capabilityFingerprintHash: forgedFp,
      };

      const verifyOutcome = routeManager.verifyPromotionToken(
        'CAP_DISABLE_MARKETING',
        provisional.routeId,
        tamperedToken,
        {
          expectedCapabilityFingerprintHash: marketingCap.fingerprintHash,
        }
      );
      expect(verifyOutcome.valid).toBe(false);
      expect(verifyOutcome.failedCheck).toBe('CAPABILITY_FINGERPRINT_MISMATCH');

      // Even if caller does not pass expectedCapabilityFingerprintHash, HMAC-SHA-256 catches the mutation!
      const hmacOnlyOutcome = routeManager.verifyPromotionToken(
        'CAP_DISABLE_MARKETING',
        provisional.routeId,
        tamperedToken
      );
      expect(hmacOnlyOutcome.valid).toBe(false);
      expect(hmacOnlyOutcome.failedCheck).toBe('HMAC_SIGNATURE_INVALID');

      // 4c: PersistentCapabilityStore automatically heals/migrates legacy v1 fingerprint on hydration
      const storeKey = 'test_step2_migration_store';
      PersistentCapabilityStore.resetNodeFallbackStorage();
      const store = new PersistentCapabilityStore(storeKey);
      await store.init();

      const legacyCapCopy = JSON.parse(JSON.stringify(marketingCap));
      legacyCapCopy.fingerprintHash = 'fph_71553e85';
      delete legacyCapCopy.fingerprintVersion;
      await store.saveCapability(legacyCapCopy);

      const reloadedCap = await store.getCapability('CAP_DISABLE_MARKETING');
      expect(reloadedCap).not.toBeNull();
      expect(reloadedCap!.fingerprintVersion).toBe('v2');
      expect(reloadedCap!.fingerprintHash).toBe(marketingCap.fingerprintHash);
    });
  });
});
