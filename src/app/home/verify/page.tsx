"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const KLU_EMAIL_SUFFIX = "@klu.ac.in";
const KLU_EMAIL_PATTERN = /^[a-z0-9][a-z0-9._-]*@klu\.ac\.in$/i;
const EXAMPLE_EMAIL = "99XXXXXX389@klu.ac.in";
const OTP_LENGTH = 6;
const SIMULATION_STEPS = [
  { label: "Validating OTP with KLU directory", detail: "One-time code accepted · session bound" },
  { label: "Matching student enrollment record", detail: "Active semester · no hold flags" },
  { label: "Issuing private eligibility commitment", detail: "Email discarded · commitment stored" },
] as const;
const REDIRECT_SECONDS = 3;

type Phase = "email" | "sendingOtp" | "otp" | "verifying" | "success";

type FormatCheck = {
  label: string;
  ok: boolean;
};

export default function VerifyIdentityPage() {
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<Phase>("email");
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [redirectIn, setRedirectIn] = useState(REDIRECT_SECONDS);
  const [resendIn, setResendIn] = useState(0);

  const trimmed = email.trim().toLowerCase();
  const isValidEmail = KLU_EMAIL_PATTERN.test(trimmed);
  const formatChecks = useMemo(() => getFormatChecks(trimmed), [trimmed]);
  const checksPassed = formatChecks.filter((check) => check.ok).length;
  const maskedPreview = trimmed.includes("@") ? maskEmail(trimmed) : EXAMPLE_EMAIL;
  const verifyProgress = getVerifyProgress(phase, stepIndex);
  const otpComplete = otp.length === OTP_LENGTH;

  useEffect(() => {
    if (phase !== "otp" || resendIn <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendIn((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, resendIn]);

  useEffect(() => {
    if (phase === "otp") {
      otpInputRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "success") {
      return;
    }

    sessionStorage.setItem("veil.identityVerified", "true");
    sessionStorage.setItem("veil.verifiedEmail", trimmed);

    const tick = window.setInterval(() => {
      setRedirectIn((current) => {
        if (current <= 1) {
          router.push("/dashboard");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [phase, router, trimmed]);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!isValidEmail) {
      setError(`Enter a valid KLU email ending with ${KLU_EMAIL_SUFFIX}`);
      return;
    }

    setPhase("sendingOtp");
    await delay(1400);

    setOtp("");
    setResendIn(30);
    setPhase("otp");
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!otpComplete) {
      setError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setPhase("verifying");
    setStepIndex(0);

    for (let index = 0; index < SIMULATION_STEPS.length; index += 1) {
      await delay(1100);
      setStepIndex(index + 1);
    }

    setRedirectIn(REDIRECT_SECONDS);
    setPhase("success");
  }

  async function handleResendOtp() {
    if (resendIn > 0 || phase !== "otp") {
      return;
    }

    setError("");
    setOtp("");
    await delay(900);
    setResendIn(30);
  }

  function handleChangeEmail() {
    setPhase("email");
    setOtp("");
    setError("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-[color:var(--ink)]">
      <GlowOrb className="-top-24 right-0" />
      <GlowOrb className="-bottom-32 left-0" fromAmber />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--ink-soft)] transition hover:text-[color:var(--accent)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to home
          </Link>
          <StepIndicator active={2} />
        </header>

        <div className="veil-reveal flex flex-1 flex-col justify-center">
          <section className="relative overflow-hidden rounded-2xl border border-[color:var(--stroke)] bg-[linear-gradient(135deg,#1f2335_0%,#24283b_55%,#1a2036_100%)] shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] veil-glow">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2ac3de,#7aa2f7,#e0af68)] veil-shimmer" />

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--accent)] bg-[rgba(42,195,222,0.12)] text-[color:var(--accent)]">
                    {phase === "otp" || phase === "verifying" ? (
                      <KeyRound className="h-6 w-6" aria-hidden />
                    ) : (
                      <Mail className="h-6 w-6" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                      KLU · student SSO
                    </p>
                    <h1 className="font-display text-2xl text-[color:var(--ink-strong)] sm:text-3xl">
                      {phase === "otp" || phase === "sendingOtp"
                        ? "Enter verification code"
                        : phase === "verifying"
                          ? "Verifying credentials"
                          : "Student email verification"}
                    </h1>
                  </div>
                </div>
              </div>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[color:var(--ink-soft)]">
                {phase === "otp"
                  ? `We sent a one-time code to ${maskEmail(trimmed)}. Enter it below to confirm your student credentials.`
                  : phase === "sendingOtp"
                    ? "Sending a one-time password to your institutional inbox…"
                    : "Use your KLU address ending in @klu.ac.in. We will email a one-time code, then verify your student credentials."}
              </p>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[color:var(--ink-soft)]">
                  <span>Verification progress</span>
                  <span className="text-[color:var(--ink-strong)]">{verifyProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#2ac3de,#7aa2f7,#e0af68)] transition-all duration-500 ease-out"
                    style={{ width: `${verifyProgress}%` }}
                  />
                </div>
              </div>

              <FlowSteps phase={phase} />

              {phase === "success" ? (
                <SuccessPanel
                  commitmentId={commitmentFromEmail(trimmed)}
                  email={trimmed}
                  redirectIn={redirectIn}
                />
              ) : (
                <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  {phase === "email" || phase === "sendingOtp" ? (
                    <form className="space-y-4" onSubmit={handleSendOtp}>
                      <div>
                        <label className="text-sm font-bold text-[color:var(--ink-strong)]" htmlFor="student-email">
                          Institutional email
                        </label>
                        <div className="relative mt-2">
                          <input
                            aria-describedby="email-hint email-checks"
                            aria-invalid={Boolean(trimmed && !isValidEmail)}
                            autoComplete="email"
                            className={`h-12 w-full rounded-md border bg-[color:var(--night-2)] px-4 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-soft)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                              trimmed && isValidEmail
                                ? "border-[color:var(--accent)] ring-[color:var(--accent)]"
                                : trimmed && !isValidEmail
                                  ? "border-[color:var(--accent-3)] ring-[color:var(--accent-3)]"
                                  : "border-[color:var(--stroke)] ring-[color:var(--accent)]"
                            }`}
                            disabled={phase === "sendingOtp"}
                            id="student-email"
                            inputMode="email"
                            onChange={(event) => {
                              setEmail(event.target.value);
                              setError("");
                            }}
                            placeholder={EXAMPLE_EMAIL}
                            type="email"
                            value={email}
                          />
                        </div>
                        <p className="mt-2 font-mono text-xs text-[color:var(--ink-soft)]" id="email-hint">
                          Must end with <span className="text-[color:var(--accent)]">{KLU_EMAIL_SUFFIX}</span>
                        </p>
                        {error ? (
                          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-3)]">
                            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                            {error}
                          </p>
                        ) : null}
                      </div>

                      {trimmed ? (
                        <FormatChecklist
                          checks={formatChecks}
                          id="email-checks"
                          passed={checksPassed}
                          total={formatChecks.length}
                        />
                      ) : null}

                      <button
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] text-sm font-bold text-[color:var(--night-1)] transition hover:bg-[#3dd6ef] disabled:cursor-not-allowed disabled:bg-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                        disabled={!trimmed || !isValidEmail || phase === "sendingOtp"}
                        type="submit"
                      >
                        {phase === "sendingOtp" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Sending OTP…
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" aria-hidden />
                            Send OTP to email
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-4" onSubmit={handleVerifyOtp}>
                      <OtpSentBanner maskedEmail={maskEmail(trimmed)} onChangeEmail={handleChangeEmail} />

                      <div>
                        <label className="text-sm font-bold text-[color:var(--ink-strong)]" htmlFor="otp-code">
                          One-time password
                        </label>
                        <input
                          ref={otpInputRef}
                          autoComplete="one-time-code"
                          className="mt-2 h-14 w-full rounded-md border border-[color:var(--stroke)] bg-[color:var(--night-2)] px-4 text-center font-mono text-2xl tracking-[0.45em] text-[color:var(--ink)] outline-none ring-[color:var(--accent)] transition placeholder:text-[color:var(--ink-soft)] focus:border-[color:var(--accent)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={phase === "verifying"}
                          id="otp-code"
                          inputMode="numeric"
                          maxLength={OTP_LENGTH}
                          onChange={(event) => {
                            setOtp(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH));
                            setError("");
                          }}
                          placeholder="······"
                          type="text"
                          value={otp}
                        />
                        <p className="mt-2 text-xs text-[color:var(--ink-soft)]">
                          Enter the {OTP_LENGTH}-digit code sent to your email.
                        </p>
                        {error ? (
                          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-3)]">
                            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
                            {error}
                          </p>
                        ) : null}
                      </div>

                      {phase === "verifying" ? <SimulationLog activeIndex={stepIndex} /> : null}

                      <button
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--accent)] text-sm font-bold text-[color:var(--night-1)] transition hover:bg-[#3dd6ef] disabled:cursor-not-allowed disabled:bg-[color:var(--stroke)] disabled:text-[color:var(--ink-soft)]"
                        disabled={!otpComplete || phase === "verifying"}
                        type="submit"
                      >
                        {phase === "verifying" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            Verifying credentials…
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4" aria-hidden />
                            Verify OTP & credentials
                          </>
                        )}
                      </button>

                      <button
                        className="flex h-10 w-full items-center justify-center gap-2 text-sm font-semibold text-[color:var(--ink-soft)] transition hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={resendIn > 0 || phase === "verifying"}
                        onClick={handleResendOtp}
                        type="button"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
                      </button>
                    </form>
                  )}

                  <aside className="space-y-3">
                    <PrivacyPreview
                      maskedEmail={maskedPreview}
                      verified={phase === "verifying" || phase === "success"}
                    />
                    <InfoTile Icon={Mail} label="OTP delivery" value="Sent to your @klu.ac.in inbox" />
                    <InfoTile Icon={EyeOff} label="Admin view" value="Eligibility only — no raw email" />
                    <InfoTile Icon={Fingerprint} label="After verify" value="Private commitment replaces identity" />
                  </aside>
                </div>
              )}

              <p className="mt-6 text-center text-xs leading-5 text-[color:var(--ink-soft)]">
                Your email is used only to verify student eligibility. Identity stays hidden in the complaint flow.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function FlowSteps({ phase }: { phase: Phase }) {
  const steps = [
    { key: "email", label: "Email" },
    { key: "otp", label: "OTP" },
    { key: "credentials", label: "Credentials" },
  ] as const;

  const activeIndex =
    phase === "email" || phase === "sendingOtp" ? 0 : phase === "otp" ? 1 : 2;

  return (
    <ol className="mt-5 flex gap-2" aria-label="Verification steps">
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;

        return (
          <li
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] ${
              done
                ? "border-[color:var(--accent)]/50 bg-[rgba(42,195,222,0.08)] text-[color:var(--accent)]"
                : active
                  ? "border-[color:var(--accent)] bg-[color:var(--night-2)] text-[color:var(--ink-strong)]"
                  : "border-[color:var(--stroke)] text-[color:var(--ink-soft)]"
            }`}
            key={step.key}
          >
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

function OtpSentBanner({
  maskedEmail,
  onChangeEmail,
}: {
  maskedEmail: string;
  onChangeEmail: () => void;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--accent)]/40 bg-[rgba(42,195,222,0.08)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            <Mail className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent)]">OTP sent</p>
            <p className="mt-1 text-sm leading-5 text-[color:var(--ink-soft)]">
              A {OTP_LENGTH}-digit code was sent to{" "}
              <span className="font-mono font-semibold text-[color:var(--ink)]">{maskedEmail}</span>
            </p>
          </div>
        </div>
        <button
          className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-[color:var(--accent)] hover:underline"
          onClick={onChangeEmail}
          type="button"
        >
          Change
        </button>
      </div>
    </div>
  );
}

function getVerifyProgress(phase: Phase, stepIndex: number) {
  if (phase === "success") {
    return 100;
  }
  if (phase === "verifying") {
    return 55 + Math.round((stepIndex / SIMULATION_STEPS.length) * 45);
  }
  if (phase === "otp") {
    return 40;
  }
  if (phase === "sendingOtp") {
    return 25;
  }
  return 10;
}

function StepIndicator({ active }: { active: number }) {
  const steps = ["Intro", "Verify", "Report"];

  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === active;
        const isDone = stepNumber < active;

        return (
          <li className="flex items-center gap-2" key={label}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                isActive
                  ? "border border-[color:var(--accent)] bg-[rgba(42,195,222,0.15)] text-[color:var(--accent)]"
                  : isDone
                    ? "border border-[color:var(--accent)] text-[color:var(--accent)]"
                    : "border border-[color:var(--stroke)] text-[color:var(--ink-soft)]"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : stepNumber}
            </span>
            <span
              className={`hidden text-[10px] font-bold uppercase tracking-[0.16em] sm:inline ${
                isActive ? "text-[color:var(--ink-strong)]" : "text-[color:var(--ink-soft)]"
              }`}
            >
              {label}
            </span>
            {index < steps.length - 1 ? (
              <span className="hidden h-px w-4 bg-[color:var(--stroke)] sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function FormatChecklist({
  checks,
  id,
  passed,
  total,
}: {
  checks: FormatCheck[];
  id: string;
  passed: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4" id={id}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Email format</p>
        <p className="text-xs font-semibold text-[color:var(--ink-soft)]">
          {passed}/{total} checks
        </p>
      </div>
      <ul className="mt-3 space-y-2">
        {checks.map((check) => (
          <li className="flex items-center gap-2 text-xs" key={check.label}>
            {check.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" aria-hidden />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[color:var(--stroke)]" aria-hidden />
            )}
            <span className={check.ok ? "text-[color:var(--ink)]" : "text-[color:var(--ink-soft)]"}>{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PrivacyPreview({ maskedEmail, verified }: { maskedEmail: string; verified: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)]/90 p-4 backdrop-blur-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Privacy preview</p>
      <div className="mt-3 space-y-2">
        <PreviewRow label="You enter" value={maskedEmail} tone="ink" />
        <PreviewRow
          label="Admins see"
          value={verified ? "Verified student · identity hidden" : "Waiting for OTP verification"}
          tone={verified ? "teal" : "ink"}
        />
      </div>
    </div>
  );
}

function PreviewRow({ label, value, tone }: { label: string; value: string; tone: "ink" | "teal" }) {
  const tones = {
    ink: "text-[color:var(--ink-soft)]",
    teal: "text-[color:var(--accent)]",
  };

  return (
    <div className="rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-3)] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">{label}</p>
      <p className={`mt-0.5 font-mono text-xs font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function SimulationLog({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--accent)]/30 bg-[color:var(--night-4)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--accent-2)]">Credential verification</p>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--accent)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent)]" />
          In progress
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {SIMULATION_STEPS.map((step, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;

          return (
            <li
              className={`rounded-lg border p-3 transition ${
                done
                  ? "border-[color:var(--accent)]/40 bg-[rgba(42,195,222,0.06)]"
                  : active
                    ? "border-[color:var(--accent)] bg-[color:var(--night-3)]"
                    : "border-[color:var(--stroke)] bg-transparent"
              }`}
              key={step.label}
            >
              <div className="flex items-start gap-3">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden />
                ) : active ? (
                  <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[color:var(--accent)]" aria-hidden />
                ) : (
                  <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-[color:var(--stroke)]" aria-hidden />
                )}
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      done || active ? "text-[color:var(--ink-strong)]" : "text-[color:var(--ink-soft)]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-[color:var(--ink-soft)]">{step.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SuccessPanel({
  commitmentId,
  email,
  redirectIn,
}: {
  commitmentId: string;
  email: string;
  redirectIn: number;
}) {
  const masked = maskEmail(email);

  return (
    <div className="mt-6 space-y-5 veil-reveal">
      <div className="rounded-xl border border-[color:var(--accent)] bg-[rgba(42,195,222,0.08)] p-5">
        <div className="flex items-center gap-3 text-[color:var(--accent)]">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em]">Credentials verified</p>
            <p className="mt-1 text-xs text-[color:var(--ink-soft)]">OTP accepted · eligibility confirmed</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard label="Verified as" value={masked} />
          <StatCard label="Commitment" value={commitmentId} mono />
        </div>

        <p className="mt-4 text-sm leading-6 text-[color:var(--ink-soft)]">
          Your email was used only for verification. Admins will see eligibility proof, not your address.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-2)] px-4 py-3">
        <p className="text-sm font-semibold text-[color:var(--ink)]">Opening dashboard</p>
        <span className="rounded-full border border-[color:var(--accent)] px-3 py-1 text-xs font-bold text-[color:var(--accent)]">
          {redirectIn}s
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#2ac3de,#7aa2f7)] transition-all duration-1000 ease-linear"
          style={{ width: `${((REDIRECT_SECONDS - redirectIn) / REDIRECT_SECONDS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--accent-2)]">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-[color:var(--ink-strong)] ${mono ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function InfoTile({
  Icon,
  label,
  value,
}: {
  Icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)]/80 p-3 backdrop-blur-sm">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--stroke)] text-[color:var(--accent)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--accent-2)]">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-[color:var(--ink-soft)]">{value}</p>
      </div>
    </div>
  );
}

function getFormatChecks(email: string): FormatCheck[] {
  if (!email) {
    return [];
  }

  const local = email.split("@")[0] ?? "";

  return [
    { label: "Valid address before @", ok: local.length >= 3 },
    { label: `Ends with ${KLU_EMAIL_SUFFIX}`, ok: email.endsWith(KLU_EMAIL_SUFFIX) },
    { label: "Institutional format accepted", ok: KLU_EMAIL_PATTERN.test(email) },
  ];
}

function commitmentFromEmail(email: string) {
  let hash = 0;
  for (let index = 0; index < email.length; index += 1) {
    hash = (hash * 31 + email.charCodeAt(index)) >>> 0;
  }
  return `0x${hash.toString(16).padStart(8, "0")}…`;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) {
    return email;
  }
  if (local.length <= 5) {
    return `${local.slice(0, 2)}***@${domain}`;
  }
  return `${local.slice(0, 2)}${"X".repeat(Math.min(local.length - 5, 7))}${local.slice(-3)}@${domain}`;
}

function GlowOrb({ className, fromAmber }: { className?: string; fromAmber?: boolean }) {
  const gradient = fromAmber
    ? "bg-[radial-gradient(circle_at_top,_rgba(224,175,104,0.28),_transparent_65%)]"
    : "bg-[radial-gradient(circle_at_top,_rgba(42,195,222,0.35),_transparent_65%)]";

  return (
    <div
      className={`pointer-events-none absolute h-48 w-48 rounded-full blur-2xl veil-float ${gradient} ${className ?? ""}`}
      aria-hidden
    />
  );
}
