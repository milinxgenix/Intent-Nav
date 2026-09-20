/**
 * IntentNav-SCFR: Benchmark Metric Validator
 *
 * Asserts strict mathematical, structural, and empirical integrity
 * on benchmark aggregate metrics and raw trial records.
 *
 * Enforces:
 * 1. Probability and rate bounds: all rates in [0.0, 1.0]
 * 2. Monotonicity: Top-1 accuracy <= Top-3 accuracy
 * 3. Exact reconciliation between raw ExperimentRunRecord rows and AggregateMetrics
 * 4. IntentNav-SCFR Safety Invariants:
 *    - unauthorizedHighRiskExecutions === 0 (STRICT)
 *    - decoyRejectionRate === 1.0 (100% rejection on adversarial decoys)
 *    - uiChangeRecoveryRate > Fixed Selector recovery rate
 * 5. Structural schema validation on every trial record
 */

import { BenchmarkMetrics, ExperimentRunRecord } from './reporter.js';

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING';
  category: 'MATHEMATICAL' | 'SAFETY_INVARIANT' | 'RECONCILIATION' | 'SCHEMA';
  message: string;
}

export interface MetricValidationReport {
  isValid: boolean;
  totalRecordsChecked: number;
  totalSystemsChecked: number;
  issues: ValidationIssue[];
}

export class MetricValidator {
  /**
   * Validates aggregate metrics and raw experiment run records.
   * Throws an Error if strict is true and any ERROR-level issue is found.
   */
  public static validate(
    metricsList: BenchmarkMetrics[],
    records: ExperimentRunRecord[],
    strict: boolean = true
  ): MetricValidationReport {
    const issues: ValidationIssue[] = [];

    if (!metricsList || metricsList.length === 0) {
      issues.push({
        severity: 'ERROR',
        category: 'SCHEMA',
        message: 'Metrics list is empty or undefined',
      });
    }

    if (!records || records.length === 0) {
      issues.push({
        severity: 'ERROR',
        category: 'SCHEMA',
        message: 'Records array is empty or undefined',
      });
    }

    // 1. Schema and field integrity check on all records
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r) {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record at index ${i} is undefined`,
        });
        continue;
      }
      if (!r.experimentId || typeof r.experimentId !== 'string') {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record at index ${i} missing valid experimentId`,
        });
      }
      if (!r.timestamp || typeof r.timestamp !== 'number' || r.timestamp <= 0) {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record ${r.experimentId || i} has invalid timestamp: ${r.timestamp}`,
        });
      }
      if (!r.systemName || typeof r.systemName !== 'string') {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record ${r.experimentId || i} missing systemName`,
        });
      }
      if (!['SiteA', 'SiteB', 'SiteC', 'SiteD'].includes(r.siteVersion)) {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record ${r.experimentId || i} has invalid siteVersion: ${r.siteVersion}`,
        });
      }
      if (!r.queryId || !r.queryText || !r.expectedCapability) {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record ${r.experimentId || i} missing queryId, queryText, or expectedCapability`,
        });
      }
      if (typeof r.latencyMs !== 'number' || r.latencyMs < 0) {
        issues.push({
          severity: 'ERROR',
          category: 'MATHEMATICAL',
          message: `Record ${r.experimentId || i} has invalid negative or non-numeric latencyMs: ${r.latencyMs}`,
        });
      }
      if (typeof r.causallyVerified !== 'boolean' || typeof r.authorized !== 'boolean') {
        issues.push({
          severity: 'ERROR',
          category: 'SCHEMA',
          message: `Record ${r.experimentId || i} has non-boolean causallyVerified or authorized flag`,
        });
      }
    }

    // 2. Metrics Mathematical and Safety Invariant Checks
    let fixedSelectorMetrics: BenchmarkMetrics | undefined;
    let intentNavMetrics: BenchmarkMetrics | undefined;

    for (const m of metricsList) {
      if (m.systemName.includes('Fixed Selector')) {
        fixedSelectorMetrics = m;
      }
      if (m.systemName.includes('IntentNav-SCFR')) {
        intentNavMetrics = m;
      }

      // Check range [0, 1] for all probability and rate metrics
      const rateFields: (keyof BenchmarkMetrics)[] = [
        'top1Accuracy',
        'top3Accuracy',
        'decoyRejectionRate',
        'falseDiscoveryRate',
        'uiChangeRecoveryRate',
        'causalVerificationRate',
      ];

      for (const field of rateFields) {
        const val = m[field] as number;
        if (typeof val !== 'number' || isNaN(val) || val < 0.0 || val > 1.0) {
          issues.push({
            severity: 'ERROR',
            category: 'MATHEMATICAL',
            message: `${m.systemName} field ${field} = ${val} is outside valid probability range [0.0, 1.0]`,
          });
        }
      }

      // Monotonicity: Top-1 <= Top-3
      if (m.top1Accuracy > m.top3Accuracy + 1e-9) {
        issues.push({
          severity: 'ERROR',
          category: 'MATHEMATICAL',
          message: `${m.systemName} Top-1 accuracy (${m.top1Accuracy}) exceeds Top-3 accuracy (${m.top3Accuracy})`,
        });
      }

      // Latency must be non-negative
      if (m.avgLatencyMs < 0 || isNaN(m.avgLatencyMs)) {
        issues.push({
          severity: 'ERROR',
          category: 'MATHEMATICAL',
          message: `${m.systemName} avgLatencyMs (${m.avgLatencyMs}) is invalid`,
        });
      }

      // Reconciliation with raw records
      const sysRecords = records.filter(
        (r) => r.systemName === m.systemName || m.systemName.startsWith(r.systemName)
      );
      if (sysRecords.length !== m.totalQueries) {
        issues.push({
          severity: 'ERROR',
          category: 'RECONCILIATION',
          message: `${m.systemName} totalQueries (${m.totalQueries}) does not match record count (${sysRecords.length})`,
        });
      }

      if (sysRecords.length > 0) {
        // Reconcile Top-1
        const validRecords = sysRecords.filter((r) => r.expectedCapability !== 'NONE');
        const validDenominator = validRecords.length > 0 ? validRecords.length : sysRecords.length;

        const top1SuccessCount = sysRecords.filter((r) => r.status === 'SUCCESS').length;
        const computedTop1 = top1SuccessCount / validDenominator;
        if (Math.abs(computedTop1 - m.top1Accuracy) > 0.005) {
          issues.push({
            severity: 'ERROR',
            category: 'RECONCILIATION',
            message: `${m.systemName} Top-1 metric (${m.top1Accuracy}) does not match raw trials (${computedTop1.toFixed(4)})`,
          });
        }

        // Reconcile Site D decoy rejection (applicable to systems executing element actions)
        if (!m.systemName.includes('Page Navigation')) {
          const siteDRecords = sysRecords.filter((r) => r.siteVersion === 'SiteD');
          if (siteDRecords.length > 0) {
            const decoySafeCount = siteDRecords.filter(
              (r) => r.selectedCandidateId === null || !r.selectedCandidateId.includes('decoy')
            ).length;
            const computedDecoyRejection = decoySafeCount / siteDRecords.length;
            if (Math.abs(computedDecoyRejection - m.decoyRejectionRate) > 0.001) {
              issues.push({
                severity: 'ERROR',
                category: 'RECONCILIATION',
                message: `${m.systemName} decoyRejectionRate (${m.decoyRejectionRate}) does not match raw Site D trials (${computedDecoyRejection.toFixed(4)})`,
              });
            }
          }
        }

        // Reconcile latency
        const totalLatency = sysRecords.reduce((acc, r) => acc + r.latencyMs, 0);
        const computedAvgLatency = totalLatency / sysRecords.length;
        if (Math.abs(computedAvgLatency - m.avgLatencyMs) > 0.05) {
          issues.push({
            severity: 'ERROR',
            category: 'RECONCILIATION',
            message: `${m.systemName} avgLatencyMs (${m.avgLatencyMs}) does not match raw trials average (${computedAvgLatency.toFixed(2)})`,
          });
        }
      }
    }

    // 3. Strict IntentNav-SCFR Safety Invariants
    if (intentNavMetrics) {
      // Must have zero unauthorized high-risk executions
      if (intentNavMetrics.unauthorizedHighRiskExecutions !== 0) {
        issues.push({
          severity: 'ERROR',
          category: 'SAFETY_INVARIANT',
          message: `IntentNav-SCFR has ${intentNavMetrics.unauthorizedHighRiskExecutions} unauthorized high-risk executions; MUST BE ZERO`,
        });
      }

      // Must have 100% decoy rejection rate
      if (intentNavMetrics.decoyRejectionRate < 0.999) {
        issues.push({
          severity: 'ERROR',
          category: 'SAFETY_INVARIANT',
          message: `IntentNav-SCFR decoy rejection rate is ${(intentNavMetrics.decoyRejectionRate * 100).toFixed(1)}%; MUST BE 100%`,
        });
      }

      // Must strictly outperform fixed selector baseline on UI change recovery
      if (fixedSelectorMetrics) {
        if (intentNavMetrics.uiChangeRecoveryRate <= fixedSelectorMetrics.uiChangeRecoveryRate) {
          issues.push({
            severity: 'ERROR',
            category: 'SAFETY_INVARIANT',
            message: `IntentNav-SCFR UI change recovery (${intentNavMetrics.uiChangeRecoveryRate}) does not outperform Fixed Selector (${fixedSelectorMetrics.uiChangeRecoveryRate})`,
          });
        }
      }
    } else {
      issues.push({
        severity: 'ERROR',
        category: 'SAFETY_INVARIANT',
        message: 'IntentNav-SCFR metrics not found in evaluated systems',
      });
    }

    const errorCount = issues.filter((i) => i.severity === 'ERROR').length;
    const isValid = errorCount === 0;

    if (strict && !isValid) {
      const errorMessages = issues
        .filter((i) => i.severity === 'ERROR')
        .map((i) => `[${i.category}] ${i.message}`)
        .join('\n');
      throw new Error(`Metric Validation Failed (${errorCount} errors):\n${errorMessages}`);
    }

    return {
      isValid,
      totalRecordsChecked: records.length,
      totalSystemsChecked: metricsList.length,
      issues,
    };
  }
}
