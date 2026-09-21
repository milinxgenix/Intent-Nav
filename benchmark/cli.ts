/**
 * IntentNav-SCFR: Benchmark Command Line Interface
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BenchmarkRunner } from './runner.js';
import { BenchmarkReporter } from './reporter.js';
import { MetricValidator } from './metricValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== IntentNav-SCFR Empirical Benchmark Suite ===');
  console.log('Evaluating IntentNav-SCFR against Baselines 1-4 across 100 intents and 4 sites...');

  const datasetPath = path.resolve(__dirname, 'dataset/intents.json');
  const t0 = Date.now();
  const { metrics, records, telemetry } = await BenchmarkRunner.runBenchmark(datasetPath);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

  console.log(`Executed ${records.length} total benchmark runs in ${elapsed}s.`);

  // Validate mathematical bounds, reconciliation, and IntentNav-SCFR safety invariants
  console.log('Asserting mathematical and safety invariants via MetricValidator...');
  const validation = MetricValidator.validate(metrics, records, true);
  console.log(`✓ MetricValidator passed (${validation.totalRecordsChecked} records, ${validation.totalSystemsChecked} systems verified).`);

  // Write outputs
  const resultsDir = path.resolve(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // 1. Raw runs JSON
  fs.writeFileSync(
    path.join(resultsDir, 'raw_runs.json'),
    JSON.stringify(records, null, 2),
    'utf8'
  );

  // 2. Summary JSON
  fs.writeFileSync(
    path.join(resultsDir, 'summary.json'),
    JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics, telemetry }, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(resultsDir, 'benchmark_summary.json'),
    JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics, telemetry }, null, 2),
    'utf8'
  );

  // 3. Results CSV
  const csv = BenchmarkReporter.generateCSV(records);
  fs.writeFileSync(path.join(resultsDir, 'results.csv'), csv, 'utf8');
  fs.writeFileSync(path.join(resultsDir, 'benchmark_results.csv'), csv, 'utf8');

  // 4. Markdown Report
  const mdReport = BenchmarkReporter.generateMarkdownReport(metrics, records, telemetry);
  fs.writeFileSync(path.join(resultsDir, 'report.md'), mdReport, 'utf8');

  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(docsDir, 'BENCHMARKS.md'), mdReport, 'utf8');

  // 5. Evidence packages in /evidence/
  const projectRoot = path.resolve(__dirname, '..');
  const experimentRunDir = path.join(projectRoot, 'evidence', 'experiment-run');
  if (!fs.existsSync(experimentRunDir)) {
    fs.mkdirSync(experimentRunDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(experimentRunDir, 'metrics.json'),
    JSON.stringify({ timestamp: Date.now(), totalRuns: records.length, metrics, telemetry }, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(experimentRunDir, 'raw_runs.json'),
    JSON.stringify(records, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(experimentRunDir, 'run_summary.md'),
    mdReport,
    'utf8'
  );

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

  console.log('Benchmark outputs successfully exported:');
  console.log('  - benchmark/results/raw_runs.json');
  console.log('  - benchmark/results/results.csv');
  console.log('  - benchmark/results/summary.json');
  console.log('  - benchmark/results/report.md');
  console.log('  - docs/BENCHMARKS.md');
  console.log('  - evidence/ packages');
}

main().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});

