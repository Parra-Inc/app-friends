"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-brand-ink hover:opacity-90",
  accent: "bg-accent text-white hover:opacity-90",
  secondary:
    "bg-paper-raised text-ink border border-rule hover:border-brand/40 hover:bg-brand-soft/40",
  ghost: "text-ink-soft hover:text-ink hover:bg-brand-soft/40",
  danger: "bg-error text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = CommonProps & {
  href?: undefined;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type LinkProps = CommonProps & {
  href: string;
  external?: boolean;
};

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
  } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href) {
    if (props.external) {
      return (
        <a href={props.href} target="_blank" rel="noopener noreferrer" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }

  const { onClick, type = "button", disabled } = props as ButtonProps;
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
