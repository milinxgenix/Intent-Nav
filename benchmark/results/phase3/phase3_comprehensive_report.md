# IntentNav-SCFR: Phase 3 Integrated Experimental Validation Report
**Run ID:** `PHASE3_RUN_1793031718997`
**Git Revision:** `bc4a34be60dc58e45dab60a657d4e0009ab77798` (Working tree dirty: true)
**Generated At:** 2026-10-26T16:21:59.533Z
**Platform:** darwin (arm64), Node: v20.17.0
**Browser:** Google Chrome 155.0.8059.86

## 1. Full-System Experiments (Step 14)
| System ID | System Name | Attempted | Completed | Correct Selection | Executed | Causally Verified | Decoy Triggered | Not Applicable |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **B1** | Fixed Selector Replay | 13 | 13 | 11 | 10 | 0 | 0 | 0 |
| **B2** | Keyword String Matching | 13 | 13 | 11 | 12 | 0 | 1 | 0 |
| **B3** | Semantic-Only Matching | 13 | 13 | 12 | 12 | 0 | 0 | 0 |
| **B4** | Intent-to-Page Navigation | 13 | 0 | 0 | 0 | 0 | 0 | 13 |
| **B5** | IntentNav-SCFR | 13 | 13 | 9 | 6 | 6 | 0 | 0 |

## 2. Controlled Ablation Studies (Step 15)
| Ablation ID | Mechanism Disabled | Trials | Target Correct | Executed | Causally Verified | Safety Gating Bypassed | Quarantined |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **BASELINE** | None (Full Production Prototype) | 13 | 9 | 6 | 6 | 0 | 2 |
| **NO_FINGERPRINT_INVARIANT** | CandidatePipeline: InvariantClosureEngine.verifyClosure | 13 | 9 | 6 | 6 | 0 | 2 |
| **NO_DRIFT_REBIND** | TypedDriftDetector & Candidate Re-binding Pipeline | 13 | 7 | 4 | 4 | 0 | 2 |
| **NO_NEGATIVE_EVIDENCE** | NegativeEvidenceStore: isKnownContradiction | 13 | 9 | 6 | 6 | 0 | 2 |
| **NO_RISK_GATING** | ExecutionAuthorizationEngine.evaluateAuthorization | 13 | 9 | 6 | 6 | 13 | 2 |
| **NO_CAUSAL_VERIFIER** | CausalTransitionVerifier: verifyTransitionAsync | 13 | 9 | 6 | 9 | 0 | 2 |
| **NO_QUARANTINE_ROLLBACK** | QuarantineController.quarantineFailedRoute & Route Demotion | 13 | 9 | 6 | 6 | 0 | 0 |

## 3. Computational Telemetry & Effects (Step 16)
- **End-to-End Latency:** Mean: 9.545 ms, Median: 8.91 ms, P95: 18.29 ms (Min: 0.03 ms, Max: 65.7 ms)
- **Heap Memory Delta:** Mean: 1.48 MB, Max: 11.22 MB
- **Process CPU Time:** Mean: 17.123 ms
- **Candidate Evaluations per Trial:** Mean: 8

## 4. Reproducibility Manifest (Step 17)
- **Dataset SHA-256:** `5ff5a72ea3f55c01f39148f172f97c6c6a27286e2f5e568caa6ffa5a15c2d0c6`
- **Mutation Config SHA-256:** `85895187be10d17e5291569f3f911c6ac6747aec9f0df378c66796c7ffeb5c8e`
- **Reproduction Command:** `node scripts/runPhase3Validation.js`