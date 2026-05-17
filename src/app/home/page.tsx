"use client";

import Link from "next/link";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";

export default function HomeEntryPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-[color:var(--ink)]">
      <GlowOrb className="-top-24 right-0" />
      <GlowOrb className="-bottom-24 left-0" fromAmber />

      <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="veil-reveal space-y-8">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[color:var(--accent-2)]">Veil</p>
            <h1 className="mt-4 font-display text-4xl tracking-tight text-[color:var(--ink-strong)] sm:text-5xl">
              Private complaint reporting
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[color:var(--ink-soft)]">
              Verify that you are an enrolled student before entering the protected complaint flow. Your identity stays
              hidden from administrators by default.
            </p>
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-[color:var(--stroke)] bg-[linear-gradient(135deg,#1f2335_0%,#24283b_60%,#1a2036_100%)] p-8 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] veil-glow">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#2ac3de,#7aa2f7,#e0af68)] veil-shimmer" />

            <div className="relative space-y-6">
              <div className="flex justify-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[color:var(--accent)] bg-[rgba(42,195,222,0.12)] text-[color:var(--accent)]">
                  <ShieldCheck className="h-8 w-8" aria-hidden />
                </span>
              </div>

              <div className="text-center">
                <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Verify your identity</h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
                  Sign in with your institutional email to continue. This step simulates KLU student verification.
                </p>
              </div>

              <ul className="space-y-3">
                <TrustRow
                  Icon={Fingerprint}
                  label="Eligibility check"
                  detail="Confirms you are an active student without exposing your name in the complaint flow."
                />
                <TrustRow
                  Icon={Lock}
                  label="Privacy by default"
                  detail="Only a cryptographic commitment is used after verification."
                />
              </ul>

              <Link
                href="/home/verify"
                className="flex h-12 w-full items-center justify-center rounded-md bg-[color:var(--accent)] text-sm font-bold text-[color:var(--night-1)] transition hover:bg-[#3dd6ef]"
              >
                Verify your identity
              </Link>


            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function TrustRow({
  Icon,
  label,
  detail,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--accent)] bg-[rgba(42,195,222,0.12)] text-[color:var(--accent)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[color:var(--ink-soft)]">{detail}</p>
      </div>
    </li>
  );
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
