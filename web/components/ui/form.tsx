"use client";

import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const fieldBase =
  "w-full rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-ink">
          {label}
          {required ? <span className="text-accent">*</span> : null}
        </span>
      ) : null}
      {children}
      {hint && !error ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1 block text-xs text-error">{error}</span>
      ) : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${fieldBase} ${className}`} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`${fieldBase} ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select className={`${fieldBase} ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        {description ? (
          <div className="mt-0.5 text-xs text-muted">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-rule"
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[1.4rem]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
