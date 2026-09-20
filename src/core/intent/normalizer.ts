/**
 * IntentNav-SCFR: Local-First Functional Intent Normalizer
 * Converts raw natural language into canonical (ActionType, TargetEntity, Constraints)
 */

import { NormalizedIntent, IntentConstraint, SensitivityHint } from '../../types/intent';
import { ActionType, TargetEntity } from '../../types/capability';

export class IntentNormalizer {
  /**
   * Normalizes a raw user goal string into a strongly-typed NormalizedIntent
   */
  public static normalize(rawGoal: string): NormalizedIntent {
    const input = rawGoal.toLowerCase().trim();
    const constraints: IntentConstraint[] = [];
    const sensitivityHints: SensitivityHint[] = [];

    // 1. Determine ActionType
    let actionType: ActionType = 'VIEW';
    if (
      /stop|disable|turn\s*off|opt\s*out|unsubscribe|mute|block|pause|switch\s*off|remove|revoke|terminate|disconnect|sign\s*out|log\s*out|end\s*session|invalidate|kill/i.test(input)
    ) {
      if (/account|membership|subscription|profile/i.test(input)) {
        actionType = 'DEACTIVATE_ACCOUNT';
      } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|security\s*key/i.test(input)) {
        actionType = 'REVOKE_ACCESS';
      } else if (/session|device|token|login|everywhere/i.test(input)) {
        actionType = 'REVOKE_ACCESS';
      } else {
        actionType = 'MODIFY_PREFERENCE';
      }
    } else if (/clear.*?(device|session|recognized)/i.test(input)) {
      actionType = 'REVOKE_ACCESS';
    } else if (/force\s*logout|sign\s*out\s*everywhere/i.test(input)) {
      actionType = 'REVOKE_ACCESS';
    } else if (/enable|turn\s*on|activate|opt\s*in/i.test(input)) {
      actionType = 'MODIFY_PREFERENCE';
    } else if (/export|download|backup|save\s*my\s*data|get\s*all\s*data|records\s*download/i.test(input)) {
      actionType = 'EXPORT_DATA';
    } else if (/delete|erase|close\s*account|remove\s*my\s*account|wipe|purge/i.test(input)) {
      actionType = 'DELETE';
    } else if (/break|hiatus|hibernate|hold|suspend/i.test(input)) {
      actionType = 'DEACTIVATE_ACCOUNT';
    } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|password|auth|security/i.test(input)) {
      if (/disable|turn\s*off|remove|revoke|terminate/i.test(input)) {
        actionType = 'REVOKE_ACCESS';
      } else {
        actionType = 'MODIFY_PREFERENCE';
      }
    } else if (/where|view|show|find|open|display/i.test(input)) {
      actionType = 'NAVIGATE';
    }

    // 2. Determine TargetEntity
    let targetEntity: TargetEntity = 'UNKNOWN';
    if (/all notification|every notification|all alert|all account notification|indiscriminately|turn off all/i.test(input)) {
      targetEntity = 'ALL_NOTIFICATIONS';
    } else if (/all security|every security|all account security/i.test(input)) {
      targetEntity = 'ALL_SECURITY';
    } else if (/all data|wipe all|erase all personal|every file/i.test(input)) {
      targetEntity = 'ALL_DATA';
    } else if (/invoice|receipt|statement|billing|payment/i.test(input)) {
      targetEntity = 'BILLING_PREFERENCES';
    } else if (/dark mode|night mode|theme|display palette|display theme/i.test(input)) {
      targetEntity = 'UI_THEME';
    } else if (/marketing|promot|newsletter|advertising|campaign|spam|commercial/i.test(input)) {
      targetEntity = 'MARKETING_NOTIFICATIONS';
    } else if (/export|download.*?(data|record|archive|information|everything)|everything.*?about me|personal\s*data|my\s*information|my\s*data|records download/i.test(input)) {
      targetEntity = 'PERSONAL_DATA_EXPORT';
    } else if (/2fa|two[-\s]*factor|two[-\s]*step|multi[-\s]*factor|mfa|authenticat|security\s*key/i.test(input)) {
      targetEntity = 'TWO_FACTOR_AUTH';
    } else if (/audit|sign-in log|access ledger|activity trail|audit trail|security event|login history/i.test(input)) {
      targetEntity = 'SECURITY_SETTINGS';
    } else if (/session|devices|active session|sign out all/i.test(input)) {
      targetEntity = 'SECURITY_SETTINGS';
    } else if (/security|password|login\s*alerts/i.test(input)) {
      targetEntity = 'SECURITY_SETTINGS';
    } else if (/pause|deactivate|close\s*account|delete\s*account|take\s*a\s*break|hiatus|hibernate|suspend|subscription\s*on\s*hold|account\s*membership/i.test(input)) {
      targetEntity = 'ACCOUNT_STATUS';
    } else if (/privacy|tracking|cookies|telemetry|analytics|data\s*sharing/i.test(input)) {
      targetEntity = 'PRIVACY_SETTINGS';
    } else if (/notification|alert|email|push/i.test(input)) {
      targetEntity = 'MARKETING_NOTIFICATIONS';
    }

    // 3. Extract Sensitivity Hints
    if (actionType === 'DELETE' || targetEntity === 'ACCOUNT_STATUS') {
      sensitivityHints.push('ACCOUNT_DELETION');
    }
    if (targetEntity === 'TWO_FACTOR_AUTH' || actionType === 'REVOKE_ACCESS') {
      sensitivityHints.push('SECURITY_CREDENTIAL');
    }
    if (targetEntity === 'PERSONAL_DATA_EXPORT') {
      sensitivityHints.push('CONTAINS_PII');
    }
    if (actionType === 'VIEW' || actionType === 'NAVIGATE') {
      sensitivityHints.push('LOW_RISK');
    }

    // 4. Normalized canonical goal phrase
    const normalizedGoal = `${actionType.toLowerCase().replace('_', ' ')} ${targetEntity
      .toLowerCase()
      .replace('_', ' ')}`;

    return {
      rawGoal,
      normalizedGoal,
      actionType,
      targetEntity,
      constraints,
      sensitivityHints,
      confidence: 0.92,
    };
  }
}

