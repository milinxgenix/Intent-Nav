/**
 * IntentNav-SCFR: Risk Classifier
 * Classifies capabilities and actions into LOW, MEDIUM, or HIGH risk categories
 */

import { RiskClass, ActionType, TargetEntity } from '../../types/capability';

export class RiskClassifier {
  /**
   * Classifies the operational risk category
   */
  public static classifyRisk(
    actionType: ActionType,
    targetEntity: TargetEntity,
    explicitRiskClass?: RiskClass
  ): { riskClass: RiskClass; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; isDestructive: boolean } {
    if (explicitRiskClass) {
      if (['DESTRUCTIVE', 'IRREVERSIBLE', 'FINANCIAL', 'SECURITY_SENSITIVE'].includes(explicitRiskClass)) {
        return { riskClass: explicitRiskClass, riskLevel: 'HIGH', isDestructive: true };
      }
      if (['MEDIUM_IMPACT', 'SENSITIVE', 'REVERSIBLE'].includes(explicitRiskClass)) {
        return { riskClass: explicitRiskClass, riskLevel: 'MEDIUM', isDestructive: false };
      }
      return { riskClass: explicitRiskClass, riskLevel: 'LOW', isDestructive: false };
    }

    // High risk actions and entities
    if (
      actionType === 'DELETE' ||
      actionType === 'DEACTIVATE_ACCOUNT' ||
      actionType === 'REVOKE_ACCESS' ||
      targetEntity === 'ACCOUNT_STATUS' ||
      targetEntity === 'TWO_FACTOR_AUTH'
    ) {
      const riskClass: RiskClass =
        actionType === 'DELETE'
          ? 'DESTRUCTIVE'
          : targetEntity === 'TWO_FACTOR_AUTH'
          ? 'SECURITY_SENSITIVE'
          : 'DESTRUCTIVE';
      return { riskClass, riskLevel: 'HIGH', isDestructive: true };
    }

    // Medium risk actions: preference changes, notification settings, data export
    if (
      actionType === 'MODIFY_PREFERENCE' ||
      actionType === 'TOGGLE' ||
      actionType === 'EXPORT_DATA' ||
      targetEntity === 'MARKETING_NOTIFICATIONS' ||
      targetEntity === 'PERSONAL_DATA_EXPORT'
    ) {
      const riskClass: RiskClass =
        actionType === 'EXPORT_DATA' ? 'SENSITIVE' : 'REVERSIBLE';
      return { riskClass, riskLevel: 'MEDIUM', isDestructive: false };
    }

    // Low risk: read-only navigation, viewing settings
    return { riskClass: 'READ_ONLY', riskLevel: 'LOW', isDestructive: false };
  }
}

