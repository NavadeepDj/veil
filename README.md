# Veil

Veil is a privacy-preserving AI complaint management MVP for schools and colleges.

A student can prove they are eligible to report a complaint without exposing their identity, submit a sensitive complaint, and let the system produce a sanitized case summary for administrators. Identity stays hidden unless the student chooses selective disclosure for an authorized committee.

## Magic Moment

> Verified student. Hidden identity. Actionable complaint.

The demo focuses on one memorable interaction: the system verifies that the reporter is a real student while keeping the student's name, roll number, email, and other personal details out of the admin workflow.

## MVP Flow

1. Issue a private student credential.
2. Generate a Midnight-style proof of eligibility.
3. Submit a sensitive complaint.
4. Privacy processor redacts personal details and prepares AI-ready triage data.
5. Admin sees only the sanitized complaint, category, severity, and case hash.
6. Student can selectively reveal identity to a committee if needed.

## Current Scope

This base version uses a mock Midnight proof flow so the product demo works end to end first. Complaint redaction and triage now run through a local API route at `/api/process-complaint`, giving the app a real privacy-processing boundary before admin review. The contract-shaped state is represented in the UI:

- `studentCommitment`
- `proofVerified`
- `complaintHash`
- `disclosureState`

Raw complaint text is not intended to be stored on-chain. A real Midnight integration should store commitments, hashes, permission states, and verification results only.


## Midnight DApp Status

Veil is currently dApp-shaped with a mock Midnight UI and a first Compact contract source in `contracts/veil.compact`. The contract is intentionally small and only models public/provable privacy metadata: student commitment, proof status, complaint hash, disclosure state, and case counter.

The contract is not compiled in this workspace yet. On Windows, `compact --version` may resolve to the built-in NTFS compression utility. Install the real Midnight Compact compiler and ensure it is first on `PATH` before compiling.
## Optional Midnight Skills

Midnight skills are local agent reference material and are not committed to the app source. To install them locally, run:

```bash
npx skills add Kali-Decoder/Midnight-skills
```

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Next.js API route for privacy processing
- Vitest privacy regression tests
- Midnight integration planned for private proof and selective disclosure state

## Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`:

```powershell
npm.cmd install
npm.cmd run dev
```

Run checks:

```powershell
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```
