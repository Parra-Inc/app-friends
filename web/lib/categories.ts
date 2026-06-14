/**
 * App Store primary categories. Used for the "no customer overlap" guard when
 * suggesting pairings and for campaign targeting.
 */
export const APP_CATEGORIES = [
  "Books",
  "Business",
  "Developer Tools",
  "Education",
  "Entertainment",
  "Finance",
  "Food & Drink",
  "Games",
  "Graphics & Design",
  "Health & Fitness",
  "Lifestyle",
  "Kids",
  "Magazines & Newspapers",
  "Medical",
  "Music",
  "Navigation",
  "News",
  "Photo & Video",
  "Productivity",
  "Reference",
  "Shopping",
  "Social Networking",
  "Sports",
  "Travel",
  "Utilities",
  "Weather",
] as const;

export type AppCategory = (typeof APP_CATEGORIES)[number];

export function isAppCategory(value: string): value is AppCategory {
  return (APP_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Two apps "compete" when they share a primary category. Friends should not be
 * competitors, so the overlap guard excludes same-category apps from pairing
 * suggestions (a developer can still pair manually if they disagree).
 */
export function categoriesOverlap(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}
