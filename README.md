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
4. AI privacy processor redacts personal details.
5. Admin sees only the sanitized complaint, category, severity, and case hash.
6. Student can selectively reveal identity to a committee if needed.

## Current Scope

This base version uses a mock Midnight proof flow so the product demo works end to end first. The contract-shaped state is already represented in the UI:

- `studentCommitment`
- `proofVerified`
- `complaintHash`
- `disclosureState`

Raw complaint text is not intended to be stored on-chain. A real Midnight integration should store commitments, hashes, permission states, and verification results only.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
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
