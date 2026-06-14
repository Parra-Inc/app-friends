import Link from "next/link";

/** The App Friends mark: two overlapping rounded app tiles becoming friends. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="6"
        width="18"
        height="18"
        rx="5"
        fill="var(--brand)"
      />
      <rect
        x="12"
        y="8"
        width="18"
        height="18"
        rx="5"
        fill="var(--accent)"
        fillOpacity="0.92"
      />
      {/* link notch where the two tiles overlap */}
      <circle cx="16" cy="16" r="2.4" fill="var(--paper-raised)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span style={{ color: "var(--brand)" }}>App</span>
      <span> </span>
      <span style={{ color: "var(--accent)" }}>Friends</span>
    </span>
  );
}

export function Logo({
  size = 28,
  className = "",
  href = "/",
}: {
  size?: number;
  className?: string;
  href?: string | null;
}) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Mark size={size} />
      <Wordmark className="text-lg" />
    </span>
  );
  if (href === null) return content;
  return (
    <Link href={href} aria-label="App Friends home">
      {content}
    </Link>
  );
}
