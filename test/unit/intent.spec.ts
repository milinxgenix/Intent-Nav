/**
 * IntentNav-SCFR: Intent Normalization & Functional Resolution Tests
 * Proves: Flow is Intent -> Capability Identity -> Candidate Route
 * (NEVER intent -> DOM selector or URL directly)
 */

import { describe, it, expect } from 'vitest';
import { IntentNormalizer } from '../../src/core/intent/normalizer';
import { CapabilityIntentResolver } from '../../src/core/intent/resolver';
import { FunctionalCapabilityFingerprint } from '../../src/types/capability';

describe('IntentNormalizer & CapabilityIntentResolver', () => {
  it('normalizes natural language goal into functional tuple', () => {
    const raw = 'I want to stop promotional emails';
    const normalized = IntentNormalizer.normalize(raw);

    expect(normalized.actionType).toBe('MODIFY_PREFERENCE');
    expect(normalized.targetEntity).toBe('MARKETING_NOTIFICATIONS');
    expect(normalized.rawGoal).toBe(raw);
  });

  it('normalizes data export requests and identifies PII sensitivity hint', () => {
    const raw = 'Download everything you have about me';
    const normalized = IntentNormalizer.normalize(raw);

    expect(normalized.actionType).toBe('EXPORT_DATA');
    expect(normalized.targetEntity).toBe('PERSONAL_DATA_EXPORT');
    expect(normalized.sensitivityHints).toContain('CONTAINS_PII');
  });

  it('normalizes 2FA modification requests and identifies security credential hint', () => {
    const raw = 'Turn off two-factor authentication';
    const normalized = IntentNormalizer.normalize(raw);

    expect(normalized.actionType).toBe('REVOKE_ACCESS');
    expect(normalized.targetEntity).toBe('TWO_FACTOR_AUTH');
    expect(normalized.sensitivityHints).toContain('SECURITY_CREDENTIAL');
  });

  it('resolves normalized intent to persistent capability identity, not DOM selector or URL', () => {
    const normalized = IntentNormalizer.normalize('Stop promotional emails');

    const capabilities: FunctionalCapabilityFingerprint[] = [
      {
        capabilityId: 'CAP_DISABLE_MARKETING',
        canonicalFunction: 'disable_marketing_communications',
        actionType: 'MODIFY_PREFERENCE',
        targetEntity: 'MARKETING_NOTIFICATIONS',
        semanticEvidence: {
          canonicalLabel: 'Disable marketing emails',
          semanticSynonyms: ['stop promotional emails'],
          accessibleName: 'Marketing email notifications switch',
          role: 'switch',
          visibleLabel: 'Marketing Communications',
          sectionMeaning: 'Notifications',
          actionDescription: 'Turn off marketing communication',
        },
      } as any,
      {
        capabilityId: 'CAP_EXPORT_DATA',
        canonicalFunction: 'export_personal_data',
        actionType: 'EXPORT_DATA',
        targetEntity: 'PERSONAL_DATA_EXPORT',
        semanticEvidence: {
          canonicalLabel: 'Export personal data',
          semanticSynonyms: ['download my data'],
          accessibleName: 'Export personal data',
          role: 'button',
          visibleLabel: 'Download Data',
          sectionMeaning: 'Privacy',
          actionDescription: 'Export personal data',
        },
      } as any,
    ];

    const matches = CapabilityIntentResolver.resolve(normalized, capabilities);

    expect(matches[0]?.capabilityId).toBe('CAP_DISABLE_MARKETING');
    expect(matches[0]?.isTargetMatched).toBe(true);
    expect(matches[0]?.matchScore).toBeGreaterThan(0.8);
    // Verified: Resolution yields capabilityId, not selector or URL!
  });
});
