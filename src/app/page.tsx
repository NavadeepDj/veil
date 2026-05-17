"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { emptyProcessedComplaint, type ProcessedComplaint } from "@/lib/complaint-processing";
import { disclosureStateLabel, disclosureStates } from "@/lib/veil-contract";

const sampleComplaint =
  "My name is Priya Nair, roll number CSE-22-104. Professor Kumar from CSE-A threatened to fail me after I refused to meet him alone after class. Please do not reveal my identity because I am scared this will affect my grades.";

export default function Home() {
  const router = useRouter();
  const [credentialIssued, setCredentialIssued] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem("veil.identityVerified") === "true";
    if (!verified) {
      router.replace("/home");
      return;
    }
    setCredentialIssued(true);
    setAuthReady(true);
  }, [router]);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [complaint, setComplaint] = useState(sampleComplaint);
  const [processed, setProcessed] = useState<ProcessedComplaint>(() => emptyProcessedComplaint());
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const [privacyBoundary, setPrivacyBoundary] = useState("Ready to process only after proof verification.");
  const [revealRequested, setRevealRequested] = useState(false);
  const [committeeAccessGranted, setCommitteeAccessGranted] = useState(false);
  const identityRevealed = committeeAccessGranted;
  const disclosureState = identityRevealed
    ? disclosureStates.committeeOnly
    : revealRequested
      ? disclosureStates.studentRequested
      : disclosureStates.hidden;

  const canSubmit = credentialIssued && proofGenerated && complaint.trim().length > 30 && !processing;
  const proofMomentReady = credentialIssued && proofGenerated;

  async function handleProtectedSubmit() {
    if (!canSubmit) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setSubmitted(false);
    setRevealRequested(false);
    setCommitteeAccessGranted(false);

    try {
      const response = await fetch("/api/process-complaint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ complaint }),
      });

      const body = (await response.json()) as {
        error?: string;
        processed?: ProcessedComplaint;
        privacyBoundary?: string;
      };

      if (!response.ok || !body.processed) {
        throw new Error(body.error || "Unable to process complaint privately.");
      }

      setProcessed(body.processed);
      setPrivacyBoundary(body.privacyBoundary || "Sanitized case is ready for admin review.");
      setSubmitted(true);
    } catch (error) {
      setProcessed(emptyProcessedComplaint());
      setProcessingError(error instanceof Error ? error.message : "Unable to process complaint privately.");
      setPrivacyBoundary("Processing failed before any admin case was created.");
    } finally {
      setProcessing(false);
    }
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[color:var(--ink-soft)]">
        <p className="text-sm font-semibold">Loading protected workspace…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent text-[color:var(--ink)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 border-b border-[color:var(--stroke)] pb-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[color:var(--accent-2)]">Veil</p>
            <h1 className="mt-3 max-w-3xl font-display text-3xl tracking-tight text-[color:var(--ink-strong)] sm:text-5xl">
              Verified student. Hidden identity. Actionable complaint.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-[color:var(--ink)] sm:min-w-[420px]">
            <StatusPill label="Credential" active={credentialIssued} />
            <StatusPill label="ZK proof" active={proofGenerated} />
            <StatusPill label="Identity hidden" active={!identityRevealed} />
          </div>
        </header>

        <MagicMoment
          identityRevealed={identityRevealed}
          processing={processing}
          proofMomentReady={proofMomentReady}
          revealRequested={revealRequested}
          submitted={submitted}
        />

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <Panel title="1. Private Eligibility">
            <div className="space-y-3">
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
                <p className="text-sm font-semibold text-[color:var(--ink-strong)]">School credential</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
                  The school confirms eligibility once. Veil keeps only a private commitment for proof checks.
                </p>
              </div>
              <button
                className="h-11 w-full rounded-md bg-[color:var(--accent)] px-4 text-sm font-bold text-[color:var(--night-1)] transition hover:bg-[#3dd6ef] disabled:cursor-not-allowed disabled:bg-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                onClick={() => setCredentialIssued(true)}
                type="button"
              >
                Issue Private Student Credential
              </button>
              <button
                className="h-11 w-full rounded-md border border-[color:var(--accent)] bg-transparent px-4 text-sm font-bold text-[color:var(--accent)] transition hover:bg-[rgba(42,195,222,0.12)] disabled:cursor-not-allowed disabled:border-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
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
              <label className="text-sm font-bold text-[color:var(--ink-strong)]" htmlFor="complaint">
                Raw complaint held privately
              </label>
              <textarea
                className="min-h-[230px] resize-none rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4 text-sm leading-6 text-[color:var(--ink)] outline-none ring-[color:var(--accent)] transition focus:ring-2"
                id="complaint"
                onChange={(event) => {
                  setComplaint(event.target.value);
                  setSubmitted(false);
                  setRevealRequested(false);
                  setCommitteeAccessGranted(false);
                  setProcessingError("");
                  setPrivacyBoundary("Complaint changed. Submit again to create a sanitized case.");
                }}
                value={complaint}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  className="min-h-11 rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-bold text-[color:var(--night-1)] transition hover:bg-[#3dd6ef] disabled:cursor-not-allowed disabled:bg-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                  disabled={!canSubmit}
                  onClick={handleProtectedSubmit}
                  type="button"
                >
                  {processing ? "Processing Privately" : "Submit Protected Complaint"}
                </button>
                <button
                  className="min-h-11 rounded-md border border-[color:var(--accent-3)] px-4 py-2 text-sm font-bold text-[color:var(--accent-3)] transition hover:bg-[rgba(247,118,142,0.12)] disabled:cursor-not-allowed disabled:border-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                  disabled={!submitted || revealRequested}
                  onClick={() => setRevealRequested(true)}
                  type="button"
                >
                  {revealRequested ? "Reveal Requested" : "Request Reveal"}
                </button>
                <button
                  className="min-h-11 rounded-md border border-[color:var(--ink-soft)] px-4 py-2 text-sm font-bold text-[color:var(--ink)] transition hover:bg-[color:var(--night-4)] disabled:cursor-not-allowed disabled:border-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                  disabled={!revealRequested || identityRevealed}
                  onClick={() => setCommitteeAccessGranted(true)}
                  type="button"
                >
                  {identityRevealed ? "Access Granted" : "Approve Committee Reveal"}
                </button>
              </div>
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Privacy boundary</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[color:var(--ink)]">
                  {processingError || privacyBoundary}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="3. Privacy Processor">
            <div className="space-y-3">
              <Metric label="Category" value={submitted ? processed.category : "Pending"} tone="ink" />
              <Metric
                label="Severity"
                value={submitted ? processed.severity : "Pending"}
                tone={submitted && processed.severity === "Urgent" ? "danger" : "amber"}
              />
              <Metric label="Redactions" value={submitted ? `${processed.redactions.length}` : "0"} tone="teal" />
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-2)]">Sanitized summary</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                  {submitted ? processed.summary : "Submit after proof verification to generate a sanitized summary."}
                </p>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Admin View: Sanitized Case">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-2)]">Visible to admins</p>
                <p className="mt-3 text-base leading-7 text-[color:var(--ink)]">
                  {submitted ? processed.sanitized : "No admin-visible complaint until private processing completes."}
                </p>
              </div>
              <div className="space-y-3">
                <InfoRow label="Verified student" value={proofGenerated ? "Yes, proof accepted" : "Waiting for proof"} />
                <InfoRow label="Identity" value={identityRevealed ? "Revealed to committee" : "Hidden"} />
                <InfoRow
                  label="Disclosure consent"
                  value={revealRequested ? "Student requested committee-only reveal" : "No reveal requested"}
                />
                <InfoRow label="Complaint hash" value={submitted ? processed.complaintHash : "Not logged yet"} />
                <InfoRow label="Next action" value={submitted ? processed.nextAction : "Submit to route case"} />
              </div>
            </div>
          </Panel>

          <Panel title="Midnight Contract Shape">
            <div className="space-y-3 font-mono text-xs text-[color:var(--ink-soft)]">
              <LedgerLine label="studentCommitment" value={credentialIssued ? "0x91ab...valid" : "pending"} />
              <LedgerLine label="proofVerified" value={proofGenerated ? "true" : "false"} />
              <LedgerLine label="latestComplaintHash" value={submitted ? processed.complaintHash : "pending"} />
              <LedgerLine label="caseCounter" value={submitted ? "1" : "0"} />
              <LedgerLine
                label="disclosureState"
                value={disclosureStateLabel(disclosureState)}
              />
              <LedgerLine label="revealPolicy" value="student_consent + committee_scope" />
              <DisclosureTimeline
                identityRevealed={identityRevealed}
                processing={processing}
                proofMomentReady={proofMomentReady}
                revealRequested={revealRequested}
                submitted={submitted}
              />
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function MagicMoment({
  identityRevealed,
  processing,
  proofMomentReady,
  revealRequested,
  submitted,
}: {
  identityRevealed: boolean;
  processing: boolean;
  proofMomentReady: boolean;
  revealRequested: boolean;
  submitted: boolean;
}) {
  const message = proofMomentReady
    ? "Proof verified. Student eligibility confirmed. Identity still hidden."
    : "Generate the private credential proof to unlock the verified-anonymous complaint flow.";
  const progress = identityRevealed
    ? 100
    : revealRequested
      ? 84
      : submitted || processing
        ? 68
        : proofMomentReady
          ? 42
          : 18;
  const stageLabel = identityRevealed
    ? "Committee-only access granted."
    : revealRequested
      ? "Waiting on committee approval."
      : submitted || processing
        ? "Sanitized case ready for admin review."
        : proofMomentReady
          ? "Eligibility proof verified."
          : "Issue credential and generate proof.";
  const proofLabel = proofMomentReady ? "Verified" : "Pending";
  const complaintLabel = processing ? "Processing" : submitted ? "Sanitized" : "Waiting";
  const identityLabel = identityRevealed ? "Revealed" : revealRequested ? "Pending" : "Hidden";
  const complaintTone = processing ? "amber" : submitted ? "teal" : "ink";
  const identityTone = identityRevealed ? "amber" : revealRequested ? "ink" : "teal";
  const events = [
    proofMomentReady ? "Eligibility proof accepted without identity reveal." : "Awaiting eligibility proof.",
    processing
      ? "Complaint is processing inside the privacy boundary."
      : submitted
        ? "Sanitized complaint hash logged."
        : "Complaint not logged yet.",
    revealRequested ? "Student requested committee-only reveal." : "Identity remains sealed by default.",
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[color:var(--stroke)] bg-[linear-gradient(135deg,#1f2335_0%,#24283b_45%,#1f2a44_100%)] p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)]">
      <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top,_rgba(42,195,222,0.35),_transparent_65%)] blur-2xl veil-float" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_top,_rgba(224,175,104,0.28),_transparent_65%)] blur-2xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2ac3de,#7aa2f7,#e0af68)] veil-shimmer" />

      <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[color:var(--accent)] bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4em] text-[color:var(--accent)]">
              Magic moment
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[color:var(--ink-soft)]">
              Zero exposure verification
            </span>
          </div>
          <h2 className="font-display text-3xl text-[color:var(--ink-strong)] sm:text-4xl">Verified without revealing identity.</h2>
          <p className="max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">{message}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <MagicStat label="Eligibility proof" value={proofLabel} tone={proofMomentReady ? "teal" : "ink"} />
            <MagicStat label="Complaint" value={complaintLabel} tone={complaintTone} />
            <MagicStat label="Identity" value={identityLabel} tone={identityTone} />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[color:var(--ink-soft)]">
              <span>Live status</span>
              <span className="text-[color:var(--ink-strong)]">{stageLabel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-[linear-gradient(90deg,#2ac3de,#7aa2f7,#e0af68)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <MomentStep label="Credential issued" active={proofMomentReady} />
            <MomentStep label="Proof accepted" active={proofMomentReady} />
            <MomentStep label={processing ? "Processing privately" : "Complaint logged"} active={submitted || processing} />
            <MomentStep
              label={identityRevealed ? "Committee reveal" : revealRequested ? "Reveal pending" : "Identity hidden"}
              active={!identityRevealed}
            />
          </div>
          <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--accent-2)]">Proof log</p>
            <div className="mt-3 space-y-2">
              {events.map((event) => (
                <p className="text-xs font-semibold leading-5 text-[color:var(--ink-soft)]" key={event}>
                  {event}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MomentStep({ label, active }: { label: string; active: boolean }) {
  const status = active ? "Ready" : "Pending";

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm backdrop-blur ${
        active
          ? "border-[color:var(--accent)] bg-[color:var(--night-2)]"
          : "border-[color:var(--stroke)] bg-[color:var(--night-3)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.2em] ${
            active ? "text-[color:var(--accent)]" : "text-[color:var(--ink-soft)]"
          }`}
        >
          {status}
        </p>
        <span
          className={`h-2 w-2 rounded-full ${
            active ? "bg-[color:var(--accent)]" : "bg-[color:var(--stroke)]"
          }`}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{label}</p>
    </div>
  );
}

function MagicStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "teal" | "amber" | "ink";
}) {
  const tones = {
    teal: "border-[color:var(--accent)] text-[color:var(--accent)]",
    amber: "border-[color:var(--accent-2)] text-[color:var(--accent-2)]",
    ink: "border-[color:var(--stroke)] text-[color:var(--ink)]",
  };

  return (
    <div className={`rounded-xl border bg-[color:var(--night-2)] px-4 py-3 shadow-sm backdrop-blur ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-2 text-base font-semibold">{value}</p>
    </div>
  );
}

function DisclosureTimeline({
  identityRevealed,
  processing,
  proofMomentReady,
  revealRequested,
  submitted,
}: {
  identityRevealed: boolean;
  processing: boolean;
  proofMomentReady: boolean;
  revealRequested: boolean;
  submitted: boolean;
}) {
  const events = [
    proofMomentReady ? "Eligibility proof accepted without identity reveal" : "Awaiting private eligibility proof",
    processing ? "Sanitization running in privacy processing API" : submitted ? "Sanitized complaint hash logged" : "Complaint not logged yet",
    revealRequested ? "Student consented to committee-only reveal" : "Identity remains sealed",
    identityRevealed ? "Committee access granted and auditable" : "No committee identity access",
  ];

  return (
    <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3 font-sans">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Audit trail</p>
      <div className="mt-3 space-y-2">
        {events.map((event) => (
          <p className="text-xs font-semibold leading-5 text-[color:var(--ink-soft)]" key={event}>
            {event}
          </p>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-3)] p-4 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.6)]">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">{title}</h2>
      {children}
    </section>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 shadow-sm ${
        active
          ? "border-[color:var(--accent)] bg-[color:var(--night-2)]"
          : "border-[color:var(--stroke)] bg-[color:var(--night-3)]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${active ? "text-[color:var(--accent)]" : "text-[color:var(--ink-soft)]"}`}>
        {active ? "Ready" : "Pending"}
      </p>
    </div>
  );
}

function ProofLedger({ credentialIssued, proofGenerated }: { credentialIssued: boolean; proofGenerated: boolean }) {
  return (
    <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-4)] p-4 font-mono text-xs text-[color:var(--ink-soft)]">
      <p>{credentialIssued ? "> credential commitment created" : "> awaiting school credential"}</p>
      <p className="mt-2">{proofGenerated ? "> proof verified without identity reveal" : "> proof not generated"}</p>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "ink" | "danger" | "amber" | "teal" }) {
  const tones = {
    ink: "border-[color:var(--stroke)] text-[color:var(--ink)]",
    danger: "border-[color:var(--accent-3)] text-[color:var(--accent-3)]",
    amber: "border-[color:var(--accent-2)] text-[color:var(--accent-2)]",
    teal: "border-[color:var(--accent)] text-[color:var(--accent)]",
  };

  return (
    <div className={`rounded-md border bg-[color:var(--night-2)] p-4 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--accent-2)]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[color:var(--ink)]">{value}</p>
    </div>
  );
}

function LedgerLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3">
      <span className="text-[color:var(--accent-2)]">{label}</span>
      <span className="break-all text-right font-bold text-[color:var(--ink)]">{value}</span>
    </div>
  );
}
