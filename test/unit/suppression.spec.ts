/**
 * IntentNav-SCFR: Volatile Feature Suppression Tests
 * Proves that changing DOM IDs, CSS classes, positions, or styling tokens
 * does not destroy the persistent functional capability identity.
 */

import { describe, it, expect } from 'vitest';
import { VolatileFeatureSuppressor } from '../../src/core/fingerprint/suppressor';

describe('VolatileFeatureSuppressor', () => {
  it('detects and suppresses volatile framework IDs', () => {
    expect(VolatileFeatureSuppressor.isVolatileId('ember1294')).toBe(true);
    expect(VolatileFeatureSuppressor.isVolatileId('react-aria-918237-1')).toBe(true);
    expect(VolatileFeatureSuppressor.isVolatileId('_ngcontent-c42')).toBe(true);
    expect(VolatileFeatureSuppressor.isVolatileId('dyn-id-827364')).toBe(true);
    expect(VolatileFeatureSuppressor.isVolatileId('b8f9e012-7c3a-4f51-9e2d-3c8a7f1a9e5b')).toBe(true);
    expect(VolatileFeatureSuppressor.isVolatileId(':r1:')).toBe(true);

    // Semantic persistent IDs should NOT be suppressed
    expect(VolatileFeatureSuppressor.isVolatileId('notifications-toggle')).toBe(false);
    expect(VolatileFeatureSuppressor.isVolatileId('privacy-settings')).toBe(false);
  });

  it('sanitizes styling and utility CSS classes while preserving semantic classes', () => {
    const rawClass = 'px-4 py-2 bg-blue-500 hover:bg-blue-600 css-19zpn93 sc-bdVaJa is-active btn-notifications';
    const sanitized = VolatileFeatureSuppressor.sanitizeClasses(rawClass);

    expect(sanitized).toContain('btn-notifications');
    expect(sanitized).not.toContain('px-4');
    expect(sanitized).not.toContain('css-19zpn93');
    expect(sanitized).not.toContain('sc-bdVaJa');
  });

  it('computes stable relative hierarchy path rather than relying on absolute coordinates', () => {
    const container = document.createElement('main');
    container.setAttribute('role', 'main');

    const section = document.createElement('section');
    section.setAttribute('aria-label', 'Notifications');
    container.appendChild(section);

    const button = document.createElement('button');
    button.setAttribute('role', 'switch');
    button.setAttribute('id', ':r99:'); // Volatile ID
    button.className = 'css-192837 text-white p-2'; // Volatile styling classes
    button.textContent = 'Disable marketing emails';
    section.appendChild(button);

    document.body.appendChild(container);

    const result = VolatileFeatureSuppressor.suppressVolatileFeatures(button);

    expect(result.isSuppressedId).toBe(true);
    expect(result.isSuppressedClass).toBe(true);
    expect(result.cleanedRole).toBe('switch');
    expect(result.cleanedText).toBe('Disable marketing emails');
    expect(result.featureWeights.presentationWeight).toBeLessThan(0.05);
    expect(result.featureWeights.functionalRoleWeight).toBeGreaterThan(0.90);
  });
});

