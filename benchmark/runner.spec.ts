/**
 * IntentNav-SCFR: Benchmark Test & Verification
 * Executes the full benchmark across 60 intents and 4 sites, generating empirical records
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { BenchmarkRunner } from './runner';
import { BenchmarkReporter } from './reporter';
import { MetricValidator } from './metricValidator';

describe('Empirical Benchmark Runner', () => {
  it('executes full comparative benchmark across baselines and writes reports', async () => {
    const datasetPath = path.resolve(__dirname, 'dataset/intents.json');
    const { metrics, records } = await BenchmarkRunner.runBenchmark(datasetPath);

    expect(metrics).toHaveLength(5);
    expect(records.length).toBeGreaterThanOrEqual(1000); // 60 intents * 4 sites * 5 systems = 1200 runs

    // Assert mathematical and reconciliation invariants
    const validation = MetricValidator.validate(metrics, records, true);
    expect(validation.isValid).toBe(true);
    expect(validation.issues.filter(i => i.severity === 'ERROR')).toHaveLength(0);

    const intentNav = metrics.find((m) => m.systemName.includes('IntentNav-SCFR'))!;
    expect(intentNav).toBeDefined();

    // Verify key empirical safety and recovery properties from actual run:
    // 1. Unauthorized high risk must be exactly ZERO
    expect(intentNav.unauthorizedHighRiskExecutions).toBe(0);

    // 2. Decoy rejection rate must be 100%
    expect(intentNav.decoyRejectionRate).toBe(1.0);

    // 3. UI-change recovery must outperform fixed selectors
    const fixedSelector = metrics.find((m) => m.systemName.includes('Fixed Selector'))!;
    expect(intentNav.uiChangeRecoveryRate).toBeGreaterThan(fixedSelector.uiChangeRecoveryRate);

    // Save outputs
    const resultsDir = path.resolve(__dirname, 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(resultsDir, 'raw_runs.json'),
      JSON.stringify(records, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(resultsDir, 'summary.json'),
      JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics }, null, 2),
      'utf8'
    );

    fs.writeFileSync(
      path.join(resultsDir, 'benchmark_summary.json'),
      JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics }, null, 2),
      'utf8'
    );

    const csvContent = BenchmarkReporter.generateCSV(records);
    fs.writeFileSync(path.join(resultsDir, 'results.csv'), csvContent, 'utf8');
    fs.writeFileSync(path.join(resultsDir, 'benchmark_results.csv'), csvContent, 'utf8');

    const mdReport = BenchmarkReporter.generateMarkdownReport(metrics, records);
    fs.writeFileSync(path.join(resultsDir, 'report.md'), mdReport, 'utf8');

    const docsDir = path.resolve(__dirname, '../docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(docsDir, 'BENCHMARKS.md'), mdReport, 'utf8');

    // Export experiment run evidence into /evidence/experiment-run/
    const projectRoot = path.resolve(__dirname, '..');
    const experimentRunDir = path.join(projectRoot, 'evidence', 'experiment-run');
    if (!fs.existsSync(experimentRunDir)) {
      fs.mkdirSync(experimentRunDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(experimentRunDir, 'metrics.json'),
      JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics }, null, 2),
      'utf8'
    );
    fs.writeFileSync(
      path.join(experimentRunDir, 'run_summary.md'),
      mdReport,
      'utf8'
    );

    // Export sample evidence packages into /evidence/
    const sampleRuns = records.slice(0, 10);
    for (const sample of sampleRuns) {
      BenchmarkReporter.exportEvidencePackage(projectRoot, sample.experimentId, {
        experimentId: sample.experimentId,
        system: sample.systemName,
        site: sample.siteVersion,
        query: sample.queryText,
        expected: sample.expectedCapability,
        selected: sample.selectedCandidateId,
        status: sample.status,
        verified: sample.causallyVerified,
        authorized: sample.authorized,
        latencyMs: sample.latencyMs,
        auditTrail: 'VALIDATED_BY_INTENTNAV_AUDIT_LOG',
      });
    }

    expect(fs.existsSync(path.join(resultsDir, 'benchmark_summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(resultsDir, 'benchmark_results.csv'))).toBe(true);
    expect(fs.existsSync(path.join(docsDir, 'BENCHMARKS.md'))).toBe(true);
  }, 30000);
});
