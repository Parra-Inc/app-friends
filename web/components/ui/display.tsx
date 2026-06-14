import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}

type Tone = "brand" | "accent" | "positive" | "muted" | "error";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  positive: "bg-positive/10 text-positive",
  muted: "bg-rule text-muted",
  error: "bg-error/10 text-error",
};

export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </div>
      <div
        className={`mt-2 text-3xl font-semibold tabular ${tone ? toneClasses[tone].split(" ")[1] : "text-ink"}`}
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-sm text-muted">{sub}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-brand">{icon}</div> : null}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
