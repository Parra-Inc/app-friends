/**
 * Public iTunes Search API lookup — pull an app's public metadata by bundle id
 * or store id. No credentials required, so developers can register an app in
 * seconds before (or instead of) connecting App Store Connect.
 */

export interface AppMetadata {
  name: string;
  subtitle: string | null;
  bundleId: string;
  storeId: string;
  storeUrl: string;
  iconUrl: string | null;
  screenshots: string[];
  category: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  sellerName: string | null;
}

interface ItunesResult {
  trackName: string;
  bundleId: string;
  trackId: number;
  trackViewUrl: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  screenshotUrls?: string[];
  primaryGenreName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  sellerName?: string;
  description?: string;
}

const ENDPOINT = "https://itunes.apple.com/lookup";

export async function lookupByBundleId(
  bundleId: string,
  country = "us"
): Promise<AppMetadata | null> {
  return lookup(`bundleId=${encodeURIComponent(bundleId)}&country=${country}`);
}

export async function lookupByStoreId(
  storeId: string,
  country = "us"
): Promise<AppMetadata | null> {
  return lookup(`id=${encodeURIComponent(storeId)}&country=${country}`);
}

async function lookup(query: string): Promise<AppMetadata | null> {
  try {
    const res = await fetch(`${ENDPOINT}?${query}&entity=software`, {
      headers: { Accept: "application/json" },
      // App metadata is stable; cache for an hour.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { resultCount: number; results: ItunesResult[] };
    const r = data.results?.[0];
    if (!r) return null;
    return normalize(r);
  } catch {
    return null;
  }
}

function normalize(r: ItunesResult): AppMetadata {
  return {
    name: r.trackName,
    subtitle: r.description ? firstSentence(r.description) : null,
    bundleId: r.bundleId,
    storeId: String(r.trackId),
    storeUrl: r.trackViewUrl,
    iconUrl: r.artworkUrl512 ?? r.artworkUrl100 ?? null,
    screenshots: (r.screenshotUrls ?? []).slice(0, 5),
    category: r.primaryGenreName ?? null,
    ratingAvg: r.averageUserRating ?? null,
    ratingCount: r.userRatingCount ?? null,
    sellerName: r.sellerName ?? null,
  };
}

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const period = trimmed.indexOf(". ");
  const slice = period > 20 ? trimmed.slice(0, period + 1) : trimmed.slice(0, 120);
  return slice.length < trimmed.length ? slice : trimmed.slice(0, 120);
}
