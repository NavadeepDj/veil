# Veil Midnight Contract Layer

This folder contains the first Compact contract shape for Veil's Midnight integration.

## Current Status

The contract source is present, but it has not been compiled in this workspace yet. On Windows, `compact --version` currently resolves to the built-in NTFS compression utility, not the Midnight Compact compiler.

## Public Ledger State

The contract intentionally stores only metadata that is safe to expose publicly:

- `studentCommitment`: a commitment proving a credential exists, not the student's identity.
- `proofVerified`: whether the local proof flow has been accepted.
- `latestComplaintHash`: SHA-256 hash of the private complaint payload.
- `disclosureState`: `0 = hidden`, `1 = student_requested`, `2 = committee_only`.
- `caseCounter`: monotonic public case event count.

## Never Store On-Chain

Do not add these to `export ledger` or circuit arguments:

- raw complaint text
- student name
- roll number
- email
- phone number
- evidence files
- direct wallet identity
- professor/staff names from the raw report

## Intended Demo Mapping

The current Next.js demo maps to these circuits:

- `Generate Midnight Proof` -> `registerStudentCommitment(commitment)`
- `Submit Protected Complaint` -> `logComplaint(complaintHash)`
- `Request Reveal` -> `requestReveal()`
- `Approve Committee Reveal` -> `approveCommitteeReveal()`

## Compiler Note

Install the real Midnight Compact compiler before compiling this contract. If `compact --version` prints an NTFS compression report, the compiler is not installed or not first on `PATH`.
