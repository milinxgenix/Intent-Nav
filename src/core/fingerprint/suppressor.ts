/**
 * IntentNav-SCFR: Volatile Feature Suppressor
 * Strips and down-weights transient presentation tokens, framework IDs, utility CSS, and coordinates.
 */

export interface SuppressionResult {
  cleanedText: string;
  cleanedRole: string;
  sanitizedAttributes: Record<string, string>;
  isSuppressedId: boolean;
  isSuppressedClass: boolean;
  relativeStructuralPath: string;
  featureWeights: {
    functionalRoleWeight: number;      // High (0.9 - 1.0)
    canonicalSemanticWeight: number;   // High (0.85 - 0.95)
    relativeHierarchyWeight: number;   // Medium (0.6 - 0.75)
    attributeWeight: number;           // Low to Medium (0.3 - 0.5)
    presentationWeight: number;        // Heavily suppressed (0.0 - 0.05)
  };
}

// Patterns matching framework-generated volatile IDs
const VOLATILE_ID_PATTERNS = [
  /^react-aria-/,
  /^ember\d+/,
  /^_ngcontent-/,
  /^vue-/,
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i, // UUID
  /^[a-f0-9]{16,}$/i, // Long hex hashes
  /^gen_\d+/,
  /^dyn-id-/,
  /:r[0-9a-z]+:/i, // React 18 useId format: :r1:, :r2:
  /-\d{5,}$/, // Ending in random numbers
];

// Patterns matching volatile styling classes
const VOLATILE_CLASS_PATTERNS = [
  /^css-[a-z0-9]+/i, // Emotion / styled
  /^sc-[a-zA-Z0-9]+/i, // styled-components
  /^jsx-[0-9]+/i, // styled-jsx
  /^_[a-z0-9]{5,}$/i, // CSS modules random hash
  /^(p|m|px|py|pt|pb|pl|pr|w|h|text|bg|border|flex|grid|col|row|gap)-/i, // Tailwind / utility CSS
  /^(items|justify|content|self)-/i, // Flex alignment utilities
  /^(flex|grid|block|inline|hidden|relative|absolute|fixed)$/i, // Layout utilities
  /^[a-z]-\d+/i, // Atomic shorthand: x-19, y-20
  /^(hover:|focus:|active:|disabled:|dark:)/i, // Pseudo-class utilities
  /^(is-|has-)/i, // State toggles
];

export class VolatileFeatureSuppressor {
  /**
   * Checks if a DOM ID is volatile/transient
   */
  public static isVolatileId(id: string | null | undefined): boolean {
    if (!id || typeof id !== 'string') return true;
    const trimmed = id.trim();
    if (trimmed.length === 0) return true;
    return VOLATILE_ID_PATTERNS.some((pattern) => pattern.test(trimmed));
  }

  /**
   * Cleans CSS class string, removing styling and transient utility classes
   */
  public static sanitizeClasses(classString: string | null | undefined): string[] {
    if (!classString || typeof classString !== 'string') return [];
    const classes = classString.split(/\s+/).filter(Boolean);
    return classes.filter((cls) => {
      // Retain only semantic classes (e.g. 'btn-privacy', 'menu-notifications', 'settings-panel')
      return !VOLATILE_CLASS_PATTERNS.some((pattern) => pattern.test(cls));
    });
  }

  /**
   * Computes a stable relative structural path rather than absolute coordinates
   */
  public static computeRelativePath(element: Element): string {
    const segments: string[] = [];
    let curr: Element | null = element;
    let depth = 0;

    while (curr && curr.tagName.toLowerCase() !== 'body' && depth < 6) {
      const tag = curr.tagName.toLowerCase();
      const role = curr.getAttribute('role');
      const ariaLabel = curr.getAttribute('aria-label');
      const testId = curr.getAttribute('data-testid') || curr.getAttribute('data-capability');

      let descriptor = tag;
      if (testId) {
        descriptor += `[data-key="${testId}"]`;
      } else if (role) {
        descriptor += `[role="${role}"]`;
      } else if (ariaLabel) {
        descriptor += `[aria-label="${ariaLabel.slice(0, 20)}"]`;
      }

      // Sibling relative index among same tag
      let siblingIndex = 1;
      let prev = curr.previousElementSibling;
      while (prev) {
        if (prev.tagName.toLowerCase() === tag) {
          siblingIndex++;
        }
        prev = prev.previousElementSibling;
      }
      descriptor += `:nth-of-type(${siblingIndex})`;

      segments.unshift(descriptor);
      curr = curr.parentElement;
      depth++;
    }

    return segments.join(' > ');
  }

  /**
   * Evaluates and suppresses an element's features, returning normalized invariant properties
   */
  public static suppressVolatileFeatures(element: Element): SuppressionResult {
    const rawId = element.getAttribute('id') || '';
    const rawClass = element.getAttribute('class') || '';
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    const visibleText = (element.textContent || '').trim().replace(/\s+/g, ' ');

    const isSuppressedId = this.isVolatileId(rawId);
    const sanitizedClasses = this.sanitizeClasses(rawClass);
    const relativePath = this.computeRelativePath(element);

    const sanitizedAttributes: Record<string, string> = {};
    if (!isSuppressedId && rawId.length > 0) {
      sanitizedAttributes['id'] = rawId;
    }
    if (sanitizedClasses.length > 0) {
      sanitizedAttributes['semantic-class'] = sanitizedClasses.join(' ');
    }

    // Capture persistent accessibility attributes
    const ariaRole = element.getAttribute('role');
    if (ariaRole) sanitizedAttributes['role'] = ariaRole;

    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) sanitizedAttributes['aria-label'] = ariaLabel;

    const ariaExpanded = element.getAttribute('aria-expanded');
    if (ariaExpanded !== null) sanitizedAttributes['aria-expanded'] = ariaExpanded;

    const ariaChecked = element.getAttribute('aria-checked');
    if (ariaChecked !== null) sanitizedAttributes['aria-checked'] = ariaChecked;

    return {
      cleanedText: visibleText,
      cleanedRole: role,
      sanitizedAttributes,
      isSuppressedId,
      isSuppressedClass: sanitizedClasses.length === 0 && rawClass.length > 0,
      relativeStructuralPath: relativePath,
      featureWeights: {
        functionalRoleWeight: 0.95,
        canonicalSemanticWeight: 0.90,
        relativeHierarchyWeight: 0.70,
        attributeWeight: 0.40,
        presentationWeight: 0.02, // Extremely low weight for presentation / IDs / CSS
      },
    };
  }
}

