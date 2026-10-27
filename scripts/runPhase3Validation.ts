/**
 * IntentNav-SCFR: Phase 3 Integrated Experimental Validation Reproduction Script
 * Steps 14–17 Execution Entrypoint
 *
 * Runs full-system comparison baseline experiments, controlled ablations,
 * computational resource telemetry, and produces a versioned reproducibility dossier.
 *
 * Usage:
 *   node scripts/runPhase3Validation.mjs
 */

import { Phase3ExperimentRunner } from '../benchmark/experiments/runner';

async function main() {
  console.log('================================================================');
  console.log('IntentNav-SCFR: Phase 3 Integrated Experimental Validation (Steps 14–17)');
  console.log('================================================================\n');

  console.log('[Phase 3] Starting integrated experiment execution...');
  const t0 = Date.now();

  const result = await Phase3ExperimentRunner.execute();

  const durationSec = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`\n[Phase 3] Execution completed in ${durationSec}s.`);
  console.log(`[Phase 3] Run ID: ${result.provenance.runId}`);
  console.log(`[Phase 3] Full-System Trials: ${result.fullSystemRecords.length}`);
  console.log(`[Phase 3] Ablation Trials: ${result.ablationRecords.length}`);
  console.log(`[Phase 3] Total Trials: ${result.manifest.totalTrials.total}`);
  console.log(`[Phase 3] Output Directory: ${result.outputFiles.outputDir}`);
  console.log(`[Phase 3] Manifest Checksum (manifest.json): ${result.outputFiles.manifestPath}`);

  console.log('\n--- Output Artifacts Generated ---');
  for (const artifact of result.manifest.artifacts) {
    console.log(`  - ${artifact.filename} (${artifact.sizeBytes} bytes, SHA256: ${artifact.sha256.substring(0, 16)}...)`);
  }

  console.log('\n================================================================');
  console.log('>>> ALL PHASE 3 EXPERIMENTS (STEPS 14-17) REPRODUCED SUCCESSFULLY! <<<');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[Phase 3 Error] Validation execution failed:', err);
  process.exit(1);
});

