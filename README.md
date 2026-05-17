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

Complaint redaction and triage run through `/api/process-complaint`. The main UI calls Midnight devnet APIs for on-chain proof registration, complaint hash logging, and selective disclosure state.

Raw complaint text is never stored on-chain — only commitments, hashes, proof flags, and disclosure state.

## Midnight Devnet (local)

1. Start the stack:

```bash
docker compose up -d
```

2. Deploy the contract and write `.env.local`:

```bash
npm run deploy:local
```

Run `npm install` once so `postinstall` patches `@midnight-ntwrk/compact-js` (its `package.json` points at a missing CJS file). If `npm run deploy:local` still fails on **Node 24** with a `tslib` error, use **Node 20 LTS** for Midnight scripts, or deploy via the app: start `npm run dev`, open `http://localhost:3000/api/deploy`, then restart dev. From WSL, use Node/npm either fully in WSL or fully on Windows — not mixed.

3. Use the home page — credential, proof, complaint submit, and reveal buttons submit real contract transactions when the banner shows **Midnight live**.

Contract source: `contracts/veil.compact` (compiled output in `contracts/managed/veil/`).
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
