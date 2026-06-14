import type { WorkspacePlan } from "@prisma/client";

/**
 * App Friends pricing.
 *
 * - Free: get on the network. 1 app, view-for-view pairings, basic analytics.
 * - Pro:  $19/workspace/month. Unlimited apps, run sponsored campaigns,
 *         advanced analytics, priority fill.
 * - Sponsored spend is separate — a prepaid wallet topped up in any amount.
 */

export const PRO_PRICE_USD_CENTS = 1900;

export const PLAN_LIMITS = {
  FREE: {
    maxApps: 1,
    canRunCampaigns: false,
    advancedAnalytics: false,
    priorityFill: false,
  },
  PRO: {
    maxApps: Infinity,
    canRunCampaigns: true,
    advancedAnalytics: true,
    priorityFill: true,
  },
} as const satisfies Record<WorkspacePlan, unknown>;

export type PlanLimit = (typeof PLAN_LIMITS)[WorkspacePlan];

export function planLimits(plan: WorkspacePlan): PlanLimit {
  return PLAN_LIMITS[plan];
}

export const WALLET_TOPUP_PRESETS_CENTS = [2500, 10000, 50000, 100000];
export const MIN_TOPUP_CENTS = 1000;

export interface PlanFeature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "Registered apps", free: "1", pro: "Unlimited" },
  { label: "View-for-view pairings", free: true, pro: true },
  { label: "Promotions SDK (iOS + RN)", free: true, pro: true },
  { label: "Basic analytics", free: true, pro: true },
  { label: "Advanced analytics & exports", free: false, pro: true },
  { label: "Run sponsored campaigns", free: false, pro: true },
  { label: "Earn from sponsored placements", free: true, pro: true },
  { label: "Priority fill", free: false, pro: true },
  { label: "Team members", free: "2", pro: "Unlimited" },
];
