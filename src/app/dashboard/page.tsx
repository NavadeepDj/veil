"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { emptyProcessedComplaint, type ProcessedComplaint } from "@/lib/complaint-processing";
import {
  approveCommitteeRevealOnChain,
  fetchMidnightStatus,
  logComplaintOnChain,
  requestRevealOnChain,
} from "@/lib/midnight-api";
import { issueStudentCredentialFromId } from "@/lib/student-credential";
import {
  disclosureStateLabel,
  disclosureStates,
  emptyVeilContractSnapshot,
  syncUiFromLedger,
  truncateHex,
  type VeilContractSnapshot,
} from "@/lib/veil-contract";
import { CheckCircle2 } from "lucide-react";

const AUTO_ELIGIBILITY = true;

const sampleComplaint =
  "My name is Priya Nair, roll number CSE-22-104. Professor Kumar from CSE-A threatened to fail me after I refused to meet him alone after class. Please do not reveal my identity because I am scared this will affect my grades.";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [credentialIssued, setCredentialIssued] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [studentId, setStudentId] = useState("");

  const [proofGenerated, setProofGenerated] = useState(false);
  const [localCommitment, setLocalCommitment] = useState("");
  const [complaint, setComplaint] = useState(sampleComplaint);
  const [processed, setProcessed] = useState<ProcessedComplaint>(() => emptyProcessedComplaint());
  const [complaintProcessed, setComplaintProcessed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState("");
  const [privacyBoundary, setPrivacyBoundary] = useState("Ready to process only after proof verification.");
  const [revealRequested, setRevealRequested] = useState(false);
  const [committeeAccessGranted, setCommitteeAccessGranted] = useState(false);
  const [chainLedger, setChainLedger] = useState<VeilContractSnapshot>(() => ({ ...emptyVeilContractSnapshot }));
  const [midnightConfigured, setMidnightConfigured] = useState(false);
  const [midnightHint, setMidnightHint] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [chainBusy, setChainBusy] = useState(false);
  const [midnightError, setMidnightError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);

  const identityRevealed = committeeAccessGranted;
  const disclosureState = chainLedger.disclosureState;
  const canSubmit =
    credentialIssued && proofGenerated && complaint.trim().length > 30 && !processing && !chainBusy;
  const proofMomentReady = credentialIssued && proofGenerated;
  const displayError = processingError || midnightError;

  const applyLedger = useCallback((ledger: VeilContractSnapshot) => {
    setChainLedger(ledger);
    const synced = syncUiFromLedger(ledger);
    setCredentialIssued(synced.credentialIssued);
    setProofGenerated(synced.proofGenerated);
    setRevealRequested(synced.revealRequested);
    setCommitteeAccessGranted(synced.committeeAccessGranted);
    if (synced.submitted) {
      setComplaintProcessed(true);
    }
  }, []);

  const bootstrapEligibility = useCallback(async (regNumber: string) => {
    const credential = await issueStudentCredentialFromId(regNumber);
    setLocalCommitment(credential.commitment);
    setCredentialIssued(true);
    setProofGenerated(true);
    setChainLedger({
      studentCommitment: truncateHex(credential.commitment),
      proofVerified: true,
      latestComplaintHash: "pending",
      disclosureState: disclosureStates.hidden,
      caseCounter: 0,
    });
    setPrivacyBoundary(
      "Your @klu.ac.in login unlocked private eligibility and credential. Identity stays hidden by default.",
    );
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const verified = sessionStorage.getItem("veil.identityVerified") === "true";
      if (!verified) {
        router.replace("/home");
        return;
      }

      const email = sessionStorage.getItem("veil.verifiedEmail") ?? "";
      const regNumber = studentIdFromEmail(email);
      setStudentId(regNumber);

      if (!cancelled && AUTO_ELIGIBILITY) {
        await bootstrapEligibility(regNumber);
      }

      if (!cancelled) {
        setAuthReady(true);
        setStatusLoading(false);
      }

      try {
        const status = await fetchMidnightStatus({ timeoutMs: AUTO_ELIGIBILITY ? 3_000 : 8_000 });
        if (cancelled) {
          return;
        }

        setMidnightConfigured(status.configured);
        setMidnightHint(status.hint ?? "");
        setContractAddress(status.contractAddress ?? "");
        if (status.configured && status.ledger && !AUTO_ELIGIBILITY) {
          applyLedger(status.ledger);
        }
        if (status.error) {
          setMidnightError(status.error);
        }
        setStatusLoading(false);
      } catch (error) {
        if (!cancelled) {
          setMidnightError(error instanceof Error ? error.message : "Unable to reach Midnight status API.");
          setStatusLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyLedger, bootstrapEligibility, mounted, router]);

  async function handleProtectedSubmit() {
    if (!canSubmit) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setMidnightError("");

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
      setComplaintProcessed(true);

      if (midnightConfigured) {
        setChainBusy(true);
        try {
          const ledger = await logComplaintOnChain(body.processed.complaintHash);
          applyLedger(ledger);
          setPrivacyBoundary("Sanitized case ready. Complaint hash logged on Midnight.");
        } catch (error) {
          setMidnightError(error instanceof Error ? error.message : "On-chain complaint log failed.");
          setPrivacyBoundary(
            body.privacyBoundary ||
              "Sanitized locally, but Midnight log failed. Check devnet and wallet funds.",
          );
        } finally {
          setChainBusy(false);
        }
      } else {
        setPrivacyBoundary(body.privacyBoundary || "Sanitized case is ready for admin review.");
      }
    } catch (error) {
      setProcessed(emptyProcessedComplaint());
      setProcessingError(error instanceof Error ? error.message : "Unable to process complaint privately.");
      setPrivacyBoundary("Processing failed before any admin case was created.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRequestReveal() {
    if (!AUTO_ELIGIBILITY && !complaintProcessed) {
      return;
    }

    if (AUTO_ELIGIBILITY && !midnightConfigured) {
      setRevealRequested(true);
      setChainLedger((current) => ({ ...current, disclosureState: disclosureStates.studentRequested }));
      setPrivacyBoundary("Student requested committee-only reveal.");
      return;
    }

    if (!midnightConfigured) {
      return;
    }

    setChainBusy(true);
    setMidnightError("");

    try {
      const ledger = await requestRevealOnChain();
      applyLedger(ledger);
      setPrivacyBoundary("Student requested committee-only reveal on Midnight.");
    } catch (error) {
      setMidnightError(error instanceof Error ? error.message : "Unable to request reveal on-chain.");
    } finally {
      setChainBusy(false);
    }
  }

  async function handleApproveReveal() {
    if (!revealRequested) {
      return;
    }

    if (AUTO_ELIGIBILITY && !midnightConfigured) {
      setCommitteeAccessGranted(true);
      setChainLedger((current) => ({ ...current, disclosureState: disclosureStates.committeeOnly }));
      setPrivacyBoundary("Committee reveal approved.");
      return;
    }

    if (!midnightConfigured) {
      return;
    }

    setChainBusy(true);
    setMidnightError("");

    try {
      const ledger = await approveCommitteeRevealOnChain();
      applyLedger(ledger);
      setPrivacyBoundary("Committee reveal approved on Midnight.");
    } catch (error) {
      setMidnightError(error instanceof Error ? error.message : "Unable to approve committee reveal on-chain.");
    } finally {
      setChainBusy(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("veil.identityVerified");
    sessionStorage.removeItem("veil.verifiedEmail");
    router.replace("/home");
  }

  if (!mounted || !authReady) {
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
          <div className="flex flex-col items-stretch gap-3 sm:items-end sm:min-w-[280px]">
            <div className="flex items-center justify-end gap-2">
              <RegNumberMenu onLogout={handleLogout} regNumber={studentId} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm font-semibold text-[color:var(--ink)]">
              <StatusPill label="Credential" active={credentialIssued} />
              <StatusPill label="ZK proof" active={proofGenerated} />
              <StatusPill label="Identity hidden" active={!identityRevealed} />
            </div>
          </div>
        </header>

        {!AUTO_ELIGIBILITY ? (
          <MidnightStatusBanner
            chainBusy={chainBusy}
            configured={midnightConfigured}
            contractAddress={contractAddress}
            hint={midnightHint}
            loading={statusLoading}
          />
        ) : null}

        <MagicMoment
          identityRevealed={identityRevealed}
          processing={processing}
          proofMomentReady={proofMomentReady}
          revealRequested={revealRequested}
          complaintProcessed={complaintProcessed}
        />

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <Panel title="1. Private Eligibility">
            <EligibilityPanel commitment={localCommitment} />
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
                  setComplaintProcessed(false);
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
                  onClick={() => void handleProtectedSubmit()}
                  type="button"
                >
                  Submit Protected Complaint
                </button>
                <button
                  className="min-h-11 rounded-md border border-[color:var(--accent-3)] px-4 py-2 text-sm font-bold text-[color:var(--accent-3)] transition hover:bg-[rgba(247,118,142,0.12)] disabled:cursor-not-allowed disabled:border-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                  disabled={revealRequested || chainBusy || (!AUTO_ELIGIBILITY && !midnightConfigured)}
                  onClick={() => void handleRequestReveal()}
                  type="button"
                >
                  Request Reveal
                </button>
                <button
                  className="min-h-11 rounded-md border border-[color:var(--ink-soft)] px-4 py-2 text-sm font-bold text-[color:var(--ink)] transition hover:bg-[color:var(--night-4)] disabled:cursor-not-allowed disabled:border-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                  disabled={!revealRequested || identityRevealed || chainBusy || (!AUTO_ELIGIBILITY && !midnightConfigured)}
                  onClick={() => void handleApproveReveal()}
                  type="button"
                >
                  Approve Committee Reveal
                </button>
              </div>
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Privacy boundary</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-[color:var(--ink)]">
                  {displayError || privacyBoundary}
                </p>
              </div>
            </div>
          </Panel>

          <Panel title="3. Privacy Processor">
            <div className="space-y-3">
              <Metric label="Category" value={complaintProcessed ? processed.category : "Pending"} tone="ink" />
              <Metric
                label="Severity"
                value={complaintProcessed ? processed.severity : "Pending"}
                tone={complaintProcessed && processed.severity === "Urgent" ? "danger" : "amber"}
              />
              <Metric label="Redactions" value={complaintProcessed ? `${processed.redactions.length}` : "0"} tone="teal" />
              <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-2)]">Sanitized summary</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink)]">
                  {complaintProcessed ? processed.summary : "Submit after proof verification to generate a sanitized summary."}
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
                  {complaintProcessed ? processed.sanitized : "No admin-visible complaint until private processing completes."}
                </p>
              </div>
              <div className="space-y-3">
                <InfoRow label="Verified student" value={proofGenerated ? "Yes, proof accepted" : "Waiting for proof"} />
                <InfoRow label="Identity" value={identityRevealed ? "Revealed to committee" : "Hidden"} />
                <InfoRow
                  label="Disclosure consent"
                  value={revealRequested ? "Student requested committee-only reveal" : "No reveal requested"}
                />
                <InfoRow label="Complaint hash" value={complaintProcessed ? processed.complaintHash : "Not logged yet"} />
                <InfoRow label="Next action" value={complaintProcessed ? processed.nextAction : "Submit to route case"} />
              </div>
            </div>
          </Panel>

          <Panel title="Midnight Contract Shape">
            <div className="space-y-3 font-mono text-xs text-[color:var(--ink-soft)]">
              <LedgerLine
                label="studentCommitment"
                value={truncateHex(chainLedger.studentCommitment)}
              />
              <LedgerLine label="proofVerified" value={chainLedger.proofVerified ? "true" : "false"} />
              <LedgerLine
                label="latestComplaintHash"
                value={
                  chainLedger.latestComplaintHash !== "pending"
                    ? truncateHex(chainLedger.latestComplaintHash)
                    : complaintProcessed
                      ? truncateHex(processed.complaintHash)
                      : "pending"
                }
              />
              <LedgerLine label="caseCounter" value={String(chainLedger.caseCounter)} />
              <LedgerLine label="disclosureState" value={disclosureStateLabel(disclosureState)} />
              <LedgerLine label="revealPolicy" value="student_consent + committee_scope" />
              <DisclosureTimeline
                identityRevealed={identityRevealed}
                processing={processing}
                proofMomentReady={proofMomentReady}
                revealRequested={revealRequested}
                complaintProcessed={complaintProcessed}
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
  complaintProcessed,
}: {
  identityRevealed: boolean;
  processing: boolean;
  proofMomentReady: boolean;
  revealRequested: boolean;
  complaintProcessed: boolean;
}) {
  const message = proofMomentReady
    ? "Proof verified. Student eligibility confirmed. Identity still hidden."
    : "Generate the private credential proof to unlock the verified-anonymous complaint flow.";
  const progress = identityRevealed
    ? 100
    : revealRequested
      ? 84
      : complaintProcessed || processing
        ? 68
        : proofMomentReady
          ? 42
          : 18;
  const stageLabel = identityRevealed
    ? "Committee-only access granted."
    : revealRequested
      ? "Waiting on committee approval."
      : complaintProcessed || processing
        ? "Sanitized case ready for admin review."
        : proofMomentReady
          ? "Eligibility proof verified."
          : "Issue credential and generate proof.";
  const proofLabel = proofMomentReady ? "Verified" : "Pending";
  const complaintLabel = processing ? "Processing" : complaintProcessed ? "Sanitized" : "Waiting";
  const identityLabel = identityRevealed ? "Revealed" : revealRequested ? "Pending" : "Hidden";
  const complaintTone = processing ? "amber" : complaintProcessed ? "teal" : "ink";
  const identityTone = identityRevealed ? "amber" : revealRequested ? "ink" : "teal";
  const events = [
    proofMomentReady ? "Eligibility proof accepted without identity reveal." : "Awaiting eligibility proof.",
    processing
      ? "Complaint is processing inside the privacy boundary."
      : complaintProcessed
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
            <MomentStep label={processing ? "Processing privately" : "Complaint logged"} active={complaintProcessed || processing} />
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
  complaintProcessed,
}: {
  identityRevealed: boolean;
  processing: boolean;
  proofMomentReady: boolean;
  revealRequested: boolean;
  complaintProcessed: boolean;
}) {
  const events = [
    proofMomentReady ? "Eligibility proof accepted without identity reveal" : "Awaiting private eligibility proof",
    processing ? "Sanitization running in privacy processing API" : complaintProcessed ? "Sanitized complaint hash logged" : "Complaint not logged yet",
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

function RegNumberMenu({ regNumber, onLogout }: { regNumber: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative text-right" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Reg. no. ${regNumber || "unknown"}. Open menu`}
        className="rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-2)] px-3 py-2 font-mono text-lg font-bold tracking-wide text-[color:var(--accent)] transition hover:border-[color:var(--accent)] hover:bg-[rgba(42,195,222,0.08)]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {regNumber || "—"}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[10rem] overflow-hidden rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-3)] py-1 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)]"
          role="menu"
        >
          <button
            className="flex w-full px-4 py-2.5 text-left text-sm font-semibold text-[color:var(--accent-3)] transition hover:bg-[rgba(247,118,142,0.12)]"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            role="menuitem"
            type="button"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

function studentIdFromEmail(email: string) {
  const local = email.split("@")[0]?.trim().toLowerCase() ?? "";
  if (!local) {
    return "";
  }
  const digits = local.replace(/\D/g, "");
  return digits || local;
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

function EligibilityPanel({ commitment }: { commitment: string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[color:var(--accent)]/30 bg-[rgba(42,195,222,0.06)] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--accent)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-[color:var(--ink-strong)]">Eligibility verified</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--ink-soft)]">
              Your @klu.ac.in login unlocked a private student credential and Midnight proof.
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        <EligibilityCheck label="Private credential issued" done />
        <EligibilityCheck label="Midnight proof ready" done />
      </div>
      <ProofLedger commitment={commitment} credentialIssued={true} proofGenerated={true} />
    </div>
  );
}

function EligibilityCheck({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] px-3 py-2 text-sm">
      <CheckCircle2
        className={`h-4 w-4 shrink-0 ${done ? "text-[color:var(--accent)]" : "text-[color:var(--stroke)]"}`}
        aria-hidden
      />
      <span className={done ? "text-[color:var(--ink-strong)]" : "text-[color:var(--ink-soft)]"}>{label}</span>
    </div>
  );
}

function MidnightStatusBanner({
  loading,
  configured,
  contractAddress,
  hint,
  chainBusy,
}: {
  loading: boolean;
  configured: boolean;
  contractAddress: string;
  hint: string;
  chainBusy: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] px-4 py-3 text-sm text-[color:var(--ink-soft)]">
        Connecting to Midnight devnet status...
      </div>
    );
  }

  if (configured) {
    return (
      <div className="rounded-md border border-[color:var(--accent)] bg-[rgba(42,195,222,0.08)] px-4 py-3 text-sm text-[color:var(--ink)]">
        <span className="font-bold text-[color:var(--accent)]">Midnight live</span>
        <span className="mx-2 text-[color:var(--ink-soft)]">·</span>
        <span className="font-mono text-xs break-all">{contractAddress}</span>
        {chainBusy ? <span className="ml-2 text-[color:var(--accent-2)]">(transaction in progress)</span> : null}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[color:var(--accent-2)] bg-[rgba(224,175,104,0.08)] px-4 py-3 text-sm leading-6 text-[color:var(--ink)]">
      <p className="font-bold text-[color:var(--accent-2)]">Midnight devnet not linked</p>
      <p className="mt-1 text-[color:var(--ink-soft)]">
        {hint || "Run docker compose up -d, deploy the contract, then restart npm run dev."}
      </p>
      <p className="mt-2 font-mono text-xs text-[color:var(--ink-soft)]">
        docker compose up -d → GET /api/deploy (or npm run deploy:local)
      </p>
    </div>
  );
}

function ProofLedger({
  credentialIssued,
  proofGenerated,
  commitment,
}: {
  credentialIssued: boolean;
  proofGenerated: boolean;
  commitment: string;
}) {
  return (
    <div className="rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-4)] p-4 font-mono text-xs text-[color:var(--ink-soft)]">
      <p>{credentialIssued ? "> credential commitment created" : "> awaiting school credential"}</p>
      <p className="mt-2 break-all">
        {commitment ? `> commitment ${truncateHex(commitment)}` : "> commitment pending"}
      </p>
      <p className="mt-2">{proofGenerated ? "> proof verified on Midnight" : "> proof not on-chain yet"}</p>
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
