# IntentNav-SCFR Patent Requirements

## Purpose

This directory contains the authoritative patent/disclosure documents
for the IntentNav-SCFR implementation.

The three documents describe different iterations/versions of the
same invention and contain some variations in claim wording and
technical limitations.

## Authoritative Documents

1. `v6.docx`
2. `patent.docx`
3. `INTENTNAV-SCFR_AUDITED_IDF-B_DISCLOSURE_Merged_Final_v3.docx`

## Interpretation Priority

`v6.docx` has the highest priority when there is a direct conflict
between versions.

However, the implementation must NOT ignore additional compatible
technical limitations disclosed in the other two documents.

Therefore:

- Read all three documents.
- Extract all claims and technical limitations.
- Preserve all technically compatible requirements.
- If requirements are compatible, implement both.
- If a requirement appears only in one document, retain it unless it
  directly conflicts with the controlling v6 requirement.
- If there is a genuine conflict, v6 controls the implementation.
- Record every conflict instead of silently resolving it.

## Implementation Target

The final implementation target is the complete set of technically
compatible requirements across all three documents, with v6 controlling
genuine conflicts.

## Important Development Rule

Do not assume that a requirement is satisfied because a similarly
named class, function, interface, or documentation section exists.

For each requirement distinguish:

- MISSING
- PARTIAL
- IMPLEMENTED
- UNIT TESTED
- INTEGRATION TESTED
- BROWSER E2E TESTED
- EMPIRICALLY VERIFIED

Do not fabricate test results, benchmark results, screenshots, logs,
or empirical evidence.

## Required Traceability

The development process should produce:

- `docs/CLAIM_RECONCILIATION.md`
- `docs/CLAIM_TRACEABILITY_MATRIX.md`
- `docs/REQUIREMENTS_GAP_AUDIT.md`
- `docs/FINAL_VALIDATION_REPORT.md`

These documents should trace:

Patent claim
→ Technical limitation
→ Implementation
→ Test
→ Browser E2E evidence
→ Empirical evidence

The original DOCX files remain the authoritative source documents.