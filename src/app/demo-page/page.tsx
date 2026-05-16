import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  EyeOff,
  FileText,
  Fingerprint,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

type IconComponent = typeof ShieldCheck;
type Tone = "teal" | "amber" | "rose" | "ink";

type StoryBeat = {
  title: string;
  detail: string;
  Icon: IconComponent;
  tone: Tone;
};

type DemoStep = {
  label: string;
  detail: string;
  Icon: IconComponent;
  tone: Tone;
};

type StoryboardBeat = {
  text: string;
  Icon: IconComponent;
};

type CalloutItem = {
  label: string;
  detail: string;
  Icon: IconComponent;
};

type ArtifactItem = {
  label: string;
  detail: string;
  Icon: IconComponent;
};

type ProofSignal = {
  label: string;
  value: string;
  tone: Tone;
  Icon: IconComponent;
};

const storyBeats: StoryBeat[] = [
  {
    title: "Fear of reporting",
    detail:
      "Students hesitate to report sensitive issues when identity exposure can trigger retaliation or stigma.",
    Icon: AlertTriangle,
    tone: "rose",
  },
  {
    title: "Verified without revealing",
    detail:
      "Veil verifies a student is eligible to report without exposing name, roll number, or email.",
    Icon: ShieldCheck,
    tone: "teal",
  },
  {
    title: "Private processing boundary",
    detail:
      "The complaint is processed inside a privacy boundary that strips PII before admins see it.",
    Icon: Lock,
    tone: "ink",
  },
  {
    title: "Actionable outcome",
    detail:
      "Admins receive a sanitized case summary, severity, and case hash for auditability.",
    Icon: Sparkles,
    tone: "amber",
  },
  {
    title: "Consent-based reveal",
    detail:
      "Identity can be revealed only if the student requests it and a committee approves.",
    Icon: EyeOff,
    tone: "teal",
  },
];

const demoSteps: DemoStep[] = [
  {
    label: "Issue credential",
    detail: "School issues a private credential; only a commitment is stored.",
    Icon: BadgeCheck,
    tone: "teal",
  },
  {
    label: "Generate proof",
    detail: "Student proves eligibility in zero knowledge.",
    Icon: Fingerprint,
    tone: "amber",
  },
  {
    label: "Submit complaint",
    detail: "Raw complaint enters the private processing API boundary.",
    Icon: FileText,
    tone: "ink",
  },
  {
    label: "Sanitize + classify",
    detail: "PII redacted; category and severity computed.",
    Icon: ClipboardCheck,
    tone: "teal",
  },
  {
    label: "Admin view",
    detail: "Admins see only sanitized complaint + action guidance.",
    Icon: Shield,
    tone: "amber",
  },
  {
    label: "Selective disclosure",
    detail: "Committee reveal only after student consent.",
    Icon: UserCheck,
    tone: "teal",
  },
];

const storyboard: StoryboardBeat[] = [
  { text: "Problem: students fear retaliation.", Icon: CheckCircle2 },
  { text: "Magic moment: verified student, identity hidden.", Icon: CheckCircle2 },
  { text: "Privacy boundary: PII redacted before admin view.", Icon: CheckCircle2 },
  { text: "Admin outcome: category, severity, next action.", Icon: CheckCircle2 },
  { text: "Selective reveal: consent + committee approval.", Icon: CheckCircle2 },
  { text: "Close: trust, safety, auditability.", Icon: CheckCircle2 },
];

const callouts: CalloutItem[] = [
  {
    label: "Eligibility",
    detail: "Verified without identity disclosure.",
    Icon: ShieldCheck,
  },
  {
    label: "Privacy boundary",
    detail: "Raw complaint never leaves the student flow.",
    Icon: Lock,
  },
  {
    label: "Admin view",
    detail: "Only sanitized summaries and hashes are visible.",
    Icon: FileText,
  },
  {
    label: "Disclosure",
    detail: "Consent-driven reveal to committee only.",
    Icon: UserCheck,
  },
];

const artifacts: ArtifactItem[] = [
  {
    label: "Magic moment screenshot",
    detail: "Show status pills + verified identity hidden.",
    Icon: Camera,
  },
  {
    label: "Privacy boundary view",
    detail: "Show redactions count and sanitized summary card.",
    Icon: ClipboardCheck,
  },
  {
    label: "Admin view",
    detail: "Capture category, severity, complaint hash, next action.",
    Icon: FileText,
  },
  {
    label: "Disclosure state",
    detail: "Show reveal request + committee approval sequence.",
    Icon: UserCheck,
  },
  {
    label: "Contract shape",
    detail: "Show metadata fields: commitment, hash, disclosure state.",
    Icon: ShieldCheck,
  },
];

const proofSignals: ProofSignal[] = [
  {
    label: "Eligibility",
    value: "Verified",
    tone: "teal",
    Icon: ShieldCheck,
  },
  {
    label: "Identity",
    value: "Hidden",
    tone: "ink",
    Icon: EyeOff,
  },
  {
    label: "Disclosure",
    value: "Consent-first",
    tone: "amber",
    Icon: UserCheck,
  },
  {
    label: "Audit",
    value: "Case hash logged",
    tone: "teal",
    Icon: CheckCircle2,
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-transparent text-[color:var(--ink)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] veil-reveal">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[color:var(--accent)] bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.4em] text-[color:var(--accent)]">
                Demo narrative
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-[color:var(--ink-soft)]">
                Tokyo Night edition
              </span>
            </div>
            <h1 className="font-display text-4xl text-[color:var(--ink-strong)] sm:text-5xl">
              Veil demo: verified student, hidden identity, actionable complaint.
            </h1>
            <p className="max-w-xl text-base leading-7 text-[color:var(--ink-soft)]">
              Use this page as your walkthrough script. It highlights the story beats, what to show on screen, and the
              key lines to say while you demo the MVP.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                title="Audience"
                detail="School leadership, student safety teams, privacy-focused reviewers, and hackathon judges."
              />
              <InfoCard
                title="Goal"
                detail="Prove a student is real without exposing identity while giving admins a safe, actionable case."
              />
            </div>
          </div>
          <div className="rounded-2xl border border-[color:var(--stroke)] bg-[linear-gradient(135deg,#1f2335_0%,#24283b_60%,#1a2036_100%)] p-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)] veil-glow">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--accent-2)]">
              Magic moment
            </p>
            <h2 className="mt-4 font-display text-3xl text-[color:var(--ink-strong)]">
              "Verified student. Identity still hidden."
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
              Pause on this moment. It is the product thesis and the line to repeat in the video.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {proofSignals.map((signal) => (
                <ProofTile
                  key={signal.label}
                  label={signal.label}
                  value={signal.value}
                  tone={signal.tone}
                  Icon={signal.Icon}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.6fr_1.4fr] veil-reveal veil-reveal-delay-1">
          <Panel title="Story beats">
            <div className="space-y-3">
              {storyBeats.map((beat, index) => (
                <StoryCard
                  key={beat.title}
                  index={index + 1}
                  title={beat.title}
                  detail={beat.detail}
                  Icon={beat.Icon}
                  tone={beat.tone}
                />
              ))}
            </div>
          </Panel>
          <Panel title="Demo flow (screen order)">
            <div className="grid gap-3 sm:grid-cols-2">
              {demoSteps.map((step, index) => (
                <StepCard
                  key={step.label}
                  index={index + 1}
                  label={step.label}
                  detail={step.detail}
                  Icon={step.Icon}
                  tone={step.tone}
                />
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] veil-reveal veil-reveal-delay-2">
          <Panel title="Presenter script (2 minutes)">
            <div className="space-y-4">
              <ScriptLine
                stamp="00:00"
                line="Students avoid reporting sensitive issues because identity exposure can lead to retaliation."
              />
              <ScriptLine
                stamp="00:20"
                line="Veil verifies eligibility without exposing identity. This is the magic moment: verified student, hidden identity."
              />
              <ScriptLine
                stamp="00:45"
                line="The complaint enters a private processing boundary, where PII is redacted and the case is classified."
              />
              <ScriptLine
                stamp="01:20"
                line="Admins receive a sanitized complaint with severity, category, and next action. No raw PII leaks."
              />
              <ScriptLine
                stamp="01:50"
                line="If the student requests it, a committee can approve selective disclosure. Consent comes first."
              />
            </div>
          </Panel>
          <Panel title="On-screen callouts">
            <div className="space-y-3">
              {callouts.map((callout) => (
                <Callout key={callout.label} label={callout.label} Icon={callout.Icon}>
                  {callout.detail}
                </Callout>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] veil-reveal veil-reveal-delay-3">
          <Panel title="Video storyboard">
            <div className="space-y-3">
              {storyboard.map((scene, index) => (
                <div
                  key={scene.text}
                  className="flex items-start gap-3 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4"
                >
                  <IconBadge Icon={scene.Icon} tone="teal" size="sm" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">
                      Scene {index + 1}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{scene.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Artifacts to capture">
            <div className="space-y-4">
              {artifacts.map((artifact) => (
                <Artifact key={artifact.label} label={artifact.label} detail={artifact.detail} Icon={artifact.Icon} />
              ))}
            </div>
          </Panel>
        </section>

        <section className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--night-3)] p-6 veil-reveal veil-reveal-delay-4">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[color:var(--accent-2)]">Closing line</p>
              <h2 className="mt-3 font-display text-3xl text-[color:var(--ink-strong)]">
                Trust, safety, and auditability without exposing the student.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                Veil proves eligibility, protects identity by default, and still gives administrators an actionable case.
                It is privacy-first, consent-driven, and designed for real institutional workflows.
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">One-sentence pitch</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--ink)]">
                "Veil lets a verified student report safely while keeping their identity hidden, and gives admins an
                actionable, sanitized case in minutes."
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--night-3)] p-6 shadow-[0_18px_40px_-32px_rgba(0,0,0,0.6)]">
      <h2 className="text-xs font-black uppercase tracking-[0.26em] text-[color:var(--accent-2)]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{detail}</p>
    </div>
  );
}

function IconBadge({
  Icon,
  tone,
  size = "md",
}: {
  Icon: IconComponent;
  tone: Tone;
  size?: "sm" | "md";
}) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
  };
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
  };
  const tones = {
    teal: "border-[color:var(--accent)] text-[color:var(--accent)] bg-[rgba(42,195,222,0.12)]",
    amber: "border-[color:var(--accent-2)] text-[color:var(--accent-2)] bg-[rgba(224,175,104,0.12)]",
    rose: "border-[color:var(--accent-3)] text-[color:var(--accent-3)] bg-[rgba(247,118,142,0.12)]",
    ink: "border-[color:var(--stroke)] text-[color:var(--ink)] bg-[color:var(--night-4)]",
  };

  return (
    <span
      className={`flex ${sizes[size]} items-center justify-center rounded-xl border ${tones[tone]}`}
      aria-hidden="true"
    >
      <Icon className={iconSizes[size]} />
    </span>
  );
}

function StoryCard({
  index,
  title,
  detail,
  Icon,
  tone,
}: {
  index: number;
  title: string;
  detail: string;
  Icon: IconComponent;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <div className="flex items-center gap-3">
        <IconBadge Icon={Icon} tone={tone} size="sm" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">Beat {index}</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--ink-strong)]">{title}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">{detail}</p>
    </div>
  );
}

function StepCard({
  index,
  label,
  detail,
  Icon,
  tone,
}: {
  index: number;
  label: string;
  detail: string;
  Icon: IconComponent;
  tone: Tone;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">Step {index}</p>
        <span className="rounded-full border border-[color:var(--stroke)] px-2 py-1 text-[10px] font-semibold text-[color:var(--ink-soft)]">
          Live
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <IconBadge Icon={Icon} tone={tone} size="sm" />
        <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{detail}</p>
    </div>
  );
}

function ScriptLine({ stamp, line }: { stamp: string; line: string }) {
  return (
    <div className="flex gap-4 rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <span className="rounded-full border border-[color:var(--accent)] px-2 py-1 text-[10px] font-bold text-[color:var(--accent)]">
        {stamp}
      </span>
      <p className="text-sm leading-6 text-[color:var(--ink-soft)]">{line}</p>
    </div>
  );
}

function Callout({
  label,
  children,
  Icon,
}: {
  label: string;
  children: React.ReactNode;
  Icon: IconComponent;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <div className="flex items-center gap-3">
        <IconBadge Icon={Icon} tone="teal" size="sm" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--accent)]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{children}</p>
    </div>
  );
}

function Artifact({
  label,
  detail,
  Icon,
}: {
  label: string;
  detail: string;
  Icon: IconComponent;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--stroke)] bg-[color:var(--night-2)] p-4">
      <div className="flex items-center gap-3">
        <IconBadge Icon={Icon} tone="amber" size="sm" />
        <p className="text-sm font-semibold text-[color:var(--ink-strong)]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">{detail}</p>
    </div>
  );
}

function ProofTile({
  label,
  value,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  tone: Tone;
  Icon: IconComponent;
}) {
  const tones = {
    teal: "border-[color:var(--accent)] text-[color:var(--accent)]",
    amber: "border-[color:var(--accent-2)] text-[color:var(--accent-2)]",
    rose: "border-[color:var(--accent-3)] text-[color:var(--accent-3)]",
    ink: "border-[color:var(--stroke)] text-[color:var(--ink)]",
  };

  return (
    <div className={`rounded-xl border bg-[color:var(--night-2)] p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-3">
        <IconBadge Icon={Icon} tone={tone} size="sm" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-70">{label}</p>
      </div>
      <p className="mt-3 text-lg font-semibold">{value}</p>
    </div>
  );
}
