"use client";

import { useMemo, useState } from "react";

type ProcessedComplaint = {
  sanitized: string;
  category: string;
  severity: string;
  summary: string;
  redactions: string[];
  complaintHash: string;
  nextAction: string;
};

const sampleComplaint =
  "My name is Priya Nair, roll number CSE-22-104. Professor Kumar from CSE-A threatened to fail me after I refused to meet him alone after class. Please do not reveal my identity because I am scared this will affect my grades.";

const categoryRules = [
  { category: "Harassment", words: ["harass", "threat", "alone", "scared", "professor"] },
  { category: "Safety Risk", words: ["violence", "unsafe", "attack", "stalk", "threat"] },
  { category: "Discrimination", words: ["caste", "religion", "gender", "race", "discrimination"] },
  { category: "Academic Abuse", words: ["fail", "grades", "marks", "attendance", "internal"] },
  { category: "Bullying", words: ["bully", "ragging", "humiliate", "mock", "group"] },
];

function hashText(text: string) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }

  return `0x${Math.abs(hash).toString(16).padStart(8, "0")}${text.length
    .toString(16)
    .padStart(4, "0")}`;
}

function addRedaction(redactions: Set<string>, label: string) {
  redactions.add(label);
}

function processComplaint(rawComplaint: string): ProcessedComplaint {
  const redactions = new Set<string>();
  let sanitized = rawComplaint.trim();

  const replacements: Array<{ label: string; pattern: RegExp; value: string }> = [
    {
      label: "student name",
      pattern: /\b(my name is|i am|this is)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/gi,
      value: "$1 [student identity redacted]",
    },
    {
      label: "roll number",
      pattern: /\b(?:roll(?:\s+number|\s+no\.?|\s+id)?|student\s+id)\s*[:#-]?\s*[A-Z]{2,5}[- ]?\d{2}[- ]?\d{2,5}\b/gi,
      value: "[student identifier redacted]",
    },
    {
      label: "school email",
      pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      value: "[school email redacted]",
    },
    {
      label: "phone number",
      pattern: /(?:\+?91[-\s]?)?[6-9]\d{9}\b/g,
      value: "[phone redacted]",
    },
    {
      label: "faculty name",
      pattern: /\b(?:professor|prof\.?|dr\.?)\s+[A-Z][a-z]+\b/gi,
      value: "faculty member",
    },
    {
      label: "section detail",
      pattern: /\b(?:CSE|ECE|EEE|ME|IT|AIML|DS)[-\s]?[A-Z]\b/g,
      value: "[department section redacted]",
    },
  ];

  replacements.forEach(({ label, pattern, value }) => {
    if (pattern.test(sanitized)) {
      addRedaction(redactions, label);
      sanitized = sanitized.replace(pattern, value);
    }
  });

  const lower = sanitized.toLowerCase();
  const matches = categoryRules
    .map((rule) => ({
      category: rule.category,
      score: rule.words.filter((word) => lower.includes(word)).length,
    }))
    .sort((left, right) => right.score - left.score);

  const category = matches[0]?.score ? matches[0].category : "General Complaint";
  const urgentWords = ["threat", "unsafe", "attack", "scared", "violence", "alone"];
  const highWords = ["fail", "harass", "blackmail", "retaliation", "pressure"];
  const urgentScore = urgentWords.filter((word) => lower.includes(word)).length;
  const highScore = highWords.filter((word) => lower.includes(word)).length;
  const severity = urgentScore >= 2 ? "Urgent" : highScore >= 1 ? "High" : "Medium";
  const nextAction =
    severity === "Urgent"
      ? "Route to protected committee review within 24 hours."
      : "Route to confidential student grievance review.";

  const summary =
    category === "Harassment"
      ? "Verified student reports possible harassment and retaliation risk involving a faculty member."
      : `Verified student reports a ${category.toLowerCase()} concern requiring confidential review.`;

  return {
    sanitized:
      sanitized ||
      "Complaint will appear here after the student submits sensitive details for private processing.",
    category,
    severity,
    summary,
    redactions: Array.from(redactions),
    complaintHash: hashText(rawComplaint || "empty complaint"),
    nextAction,
  };
}

export default function Home() {
  const [credentialIssued, setCredentialIssued] = useState(false);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [complaint, setComplaint] = useState(sampleComplaint);
  const [submitted, setSubmitted] = useState(false);
  const [identityRevealed, setIdentityRevealed] = useState(false);

  const processed = useMemo(() => processComplaint(complaint), [complaint]);
  const canSubmit = credentialIssued && proofGenerated && complaint.trim().length > 30;

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#171717]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-[#d8d1c4] pb-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#7a4b32]">Veil</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-normal text-[#111111] sm:text-5xl">
              Verified student. Hidden identity. Actionable complaint.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-[#2c2c2c] sm:min-w-[420px]">
            <StatusPill label="Credential" active={credentialIssued} />
            <StatusPill label="ZK proof" active={proofGenerated} />
            <StatusPill label="Identity hidden" active={!identityRevealed} />
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <Panel title="1. Private Eligibility">
            <div className="space-y-3">
              <div className="rounded-md border border-[#d8d1c4] bg-white p-4">
                <p className="text-sm font-semibold text-[#262626]">School credential</p>
                <p className="mt-1 text-sm leading-6 text-[#5d5952]">
                  The school confirms eligibility once. Veil keeps only a private commitment for proof checks.
                </p>
              </div>
              <button
                className="h-11 w-full rounded-md bg-[#111111] px-4 text-sm font-bold text-white transition hover:bg-[#2d2d2d] disabled:cursor-not-allowed disabled:bg-[#a8a29a]"
                onClick={() => setCredentialIssued(true)}
                type="button"
              >
                Issue Private Student Credential
              </button>
              <button
                className="h-11 w-full rounded-md border border-[#111111] bg-transparent px-4 text-sm font-bold text-[#111111] transition hover:bg-white disabled:cursor-not-allowed disabled:border-[#b8b0a4] disabled:text-[#8a8277]"
                disabled={!credentialIssued}
                onClick={() => setProofGenerated(true)}
                type="button"
              >
                Generate Midnight Proof
              </button>
              <ProofLedger credentialIssued={credentialIssued} proofGenerated={proofGenerated} />
            </div>
          </Panel>

          <Panel title="2. Student Complaint">
            <div className="grid gap-3">
              <label className="text-sm font-bold text-[#262626]" htmlFor="complaint">
                Raw complaint held privately
              </label>
              <textarea
                className="min-h-[230px] resize-none rounded-md border border-[#cfc6b8] bg-white p-4 text-sm leading-6 text-[#222222] outline-none ring-[#0e7c7b] transition focus:ring-2"
                id="complaint"
                onChange={(event) => {
                  setComplaint(event.target.value);
                  setSubmitted(false);
                  setIdentityRevealed(false);
                }}
                value={complaint}
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="h-11 rounded-md bg-[#0e7c7b] px-4 text-sm font-bold text-white transition hover:bg-[#0a6766] disabled:cursor-not-allowed disabled:bg-[#98aaa6]"
                  disabled={!canSubmit}
                  onClick={() => setSubmitted(true)}
                  type="button"
                >
                  Submit Protected Complaint
                </button>
                <button
                  className="h-11 rounded-md border border-[#c04b2f] px-4 text-sm font-bold text-[#8f321f] transition hover:bg-white disabled:cursor-not-allowed disabled:border-[#d8d1c4] disabled:text-[#9b948b]"
                  disabled={!submitted}
                  onClick={() => setIdentityRevealed(true)}
                  type="button"
                >
                  Selective Reveal
                </button>
              </div>
            </div>
          </Panel>

          <Panel title="3. AI Privacy Processor">
            <div className="space-y-3">
              <Metric label="Category" value={processed.category} tone="ink" />
              <Metric label="Severity" value={processed.severity} tone={processed.severity === "Urgent" ? "danger" : "amber"} />
              <Metric label="Redactions" value={`${processed.redactions.length}`} tone="teal" />
              <div className="rounded-md border border-[#d8d1c4] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a4b32]">Sanitized summary</p>
                <p className="mt-2 text-sm leading-6 text-[#333333]">{processed.summary}</p>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Admin View: Sanitized Case">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-md border border-[#d8d1c4] bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a4b32]">Visible to admins</p>
                <p className="mt-3 text-base leading-7 text-[#262626]">{processed.sanitized}</p>
              </div>
              <div className="space-y-3">
                <InfoRow label="Verified student" value={proofGenerated ? "Yes, proof accepted" : "Waiting for proof"} />
                <InfoRow label="Identity" value={identityRevealed ? "Revealed to committee" : "Hidden"} />
                <InfoRow label="Complaint hash" value={submitted ? processed.complaintHash : "Not logged yet"} />
                <InfoRow label="Next action" value={submitted ? processed.nextAction : "Submit to route case"} />
              </div>
            </div>
          </Panel>

          <Panel title="Midnight Contract Shape">
            <div className="space-y-3 font-mono text-xs text-[#2f2f2f]">
              <LedgerLine label="studentCommitment" value={credentialIssued ? "0x91ab...valid" : "pending"} />
              <LedgerLine label="proofVerified" value={proofGenerated ? "true" : "false"} />
              <LedgerLine label="complaintHash" value={submitted ? processed.complaintHash : "pending"} />
              <LedgerLine label="disclosureState" value={identityRevealed ? "committee_only" : "hidden"} />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d8d1c4] bg-[#fffaf2] p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[#242424]">{title}</h2>
      {children}
    </section>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${active ? "border-[#0e7c7b] bg-[#e7f4f1]" : "border-[#d8d1c4] bg-[#fffaf2]"}`}>
      <p className="text-xs text-[#69635b]">{label}</p>
      <p className={`mt-1 text-sm ${active ? "text-[#0a6766]" : "text-[#8a8277]"}`}>{active ? "Ready" : "Pending"}</p>
    </div>
  );
}

function ProofLedger({ credentialIssued, proofGenerated }: { credentialIssued: boolean; proofGenerated: boolean }) {
  return (
    <div className="rounded-md bg-[#181818] p-4 font-mono text-xs text-[#e8e2d8]">
      <p>{credentialIssued ? "> credential commitment created" : "> awaiting school credential"}</p>
      <p className="mt-2">{proofGenerated ? "> proof verified without identity reveal" : "> proof not generated"}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "ink" | "danger" | "amber" | "teal" }) {
  const tones = {
    ink: "border-[#242424] text-[#242424]",
    danger: "border-[#c04b2f] text-[#a23a24]",
    amber: "border-[#b8791b] text-[#875813]",
    teal: "border-[#0e7c7b] text-[#0a6766]",
  };

  return (
    <div className={`rounded-md border bg-white p-4 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7a4b32]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#262626]">{value}</p>
    </div>
  );
}

function LedgerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#d8d1c4] bg-white p-3">
      <span className="text-[#7a4b32]">{label}</span>
      <span className="break-all text-right font-bold">{value}</span>
    </div>
  );
}

