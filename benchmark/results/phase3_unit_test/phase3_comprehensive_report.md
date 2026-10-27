# IntentNav-SCFR: Phase 3 Integrated Experimental Validation Report
**Run ID:** `PHASE3_RUN_1793116910946`
**Git Revision:** `bc4a34be60dc58e45dab60a657d4e0009ab77798` (Working tree dirty: true)
**Generated At:** 2026-10-27T16:01:51.122Z
**Platform:** darwin (arm64), Node: v20.17.0
**Browser:** Google Chrome 156.0.8078.48

## 1. Full-System Experiments (Step 14)
| System ID | System Name | Attempted | Completed | Correct Selection | Executed | Causally Verified | Decoy Triggered | Not Applicable |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **B1** | Fixed Selector Replay | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **B2** | Keyword String Matching | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **B3** | Semantic-Only Matching | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **B4** | Intent-to-Page Navigation | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| **B5** | IntentNav-SCFR | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 2. Controlled Ablation Studies (Step 15)
| Ablation ID | Mechanism Disabled | Trials | Target Correct | Executed | Causally Verified | Safety Gating Bypassed | Quarantined |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |

## 3. Computational Telemetry & Effects (Step 16)
- **End-to-End Latency:** Mean: 0.14 ms, Median: 0.14 ms, P95: 0.14 ms (Min: 0.14 ms, Max: 0.14 ms)
- **Heap Memory Delta:** Mean: 0.004 MB, Max: 0.004 MB
- **Process CPU Time:** Mean: 0.127 ms
- **Candidate Evaluations per Trial:** Mean: 0

## 4. Reproducibility Manifest (Step 17)
- **Dataset SHA-256:** `5ff5a72ea3f55c01f39148f172f97c6c6a27286e2f5e568caa6ffa5a15c2d0c6`
- **Mutation Config SHA-256:** `85895187be10d17e5291569f3f911c6ac6747aec9f0df378c66796c7ffeb5c8e`
- **Reproduction Command:** `node scripts/runPhase3Validation.js`