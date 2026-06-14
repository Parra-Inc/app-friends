import type { ColorSchemeName } from "react-native";

/** App Friends brand colors. */
export const BRAND = {
  /** Primary violet. */
  violet: "#6D4AFF",
  /** Accent coral. */
  coral: "#FF6B5E",
} as const;

/** A resolved color palette for a given color scheme. */
export interface Theme {
  /** True when rendering against a dark background. */
  isDark: boolean;
  /** Accent used for the CTA. */
  accent: string;
  /** Card / sheet background. */
  card: string;
  /** Scrim behind a modal. */
  scrim: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Hairline borders and dividers. */
  border: string;
  /** Subtle fill for placeholders (e.g. missing icon). */
  fill: string;
  /** Text drawn on top of the accent color. */
  onAccent: string;
}

/**
 * Resolve a {@link Theme} for the current color scheme, optionally overriding
 * the accent with a host-supplied hex (e.g. `SdkConfig.accentColor`).
 */
export function resolveTheme(scheme: ColorSchemeName, accentOverride?: string | null): Theme {
  const isDark = scheme === "dark";
  const accent = accentOverride || BRAND.violet;

  if (isDark) {
    return {
      isDark,
      accent,
      card: "#1C1C22",
      scrim: "rgba(0,0,0,0.6)",
      text: "#FFFFFF",
      textMuted: "#A6A6B0",
      border: "rgba(255,255,255,0.12)",
      fill: "rgba(255,255,255,0.08)",
      onAccent: "#FFFFFF",
    };
  }

  return {
    isDark,
    accent,
    card: "#FFFFFF",
    scrim: "rgba(0,0,0,0.45)",
    text: "#16161A",
    textMuted: "#6B6B76",
    border: "rgba(0,0,0,0.10)",
    fill: "rgba(0,0,0,0.05)",
    onAccent: "#FFFFFF",
  };
}

/** Format a numeric rating like `4.8`, or `null` when there's nothing to show. */
export function formatRating(avg: number | null): string | null {
  if (avg == null || !Number.isFinite(avg)) return null;
  return avg.toFixed(1);
}

/** Format a rating count like `1.2K`, `12K`, `1.3M`. */
export function formatRatingCount(count: number | null): string | null {
  if (count == null || !Number.isFinite(count) || count <= 0) return null;
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(count < 10_000 ? 1 : 0)}K`;
  return `${(count / 1_000_000).toFixed(1)}M`;
}
