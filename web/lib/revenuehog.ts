// Forwards user feedback to RevenueHog's server-to-server feedback API.
// /api/v1/feedback validates the submission, then hands it here.
//
// Auth is a per-app server key (rh_live_...) in REVENUE_HOG_API_KEY, bound to
// this app inside RevenueHog, so bundleId is not needed on the wire. The key
// never reaches the browser: clients only ever call our own route.

const REVENUE_HOG_FEEDBACK_URL = "https://app.revenuehog.dev/api/v1/feedback";

export const FEEDBACK_KINDS = ["bug", "idea", "question", "praise"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

type ForwardPayload = {
  kind: FeedbackKind;
  message: string;
  email?: string | null;
  page?: string | null;
  userAgent?: string | null;
  appUserId?: string | null;
};

export async function forwardFeedbackToRevenueHog(
  payload: ForwardPayload,
): Promise<{ success: boolean; status?: number; error?: string }> {
  const key = process.env.REVENUE_HOG_API_KEY;
  if (!key) {
    return { success: false, error: "REVENUE_HOG_API_KEY is not configured" };
  }

  const metadata: Record<string, string> = {};
  metadata.originalCategory = payload.kind;
  if (payload.email) metadata.email = payload.email;
  if (payload.page) metadata.page = payload.page;
  if (payload.userAgent) metadata.userAgent = payload.userAgent.slice(0, 512);

  try {
    const response = await fetch(REVENUE_HOG_FEEDBACK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: payload.kind,
        message: payload.message,
        platform: "web",
        ...(payload.appUserId ? { appUserId: payload.appUserId } : {}),
        metadata,
      }),
    });

    // RevenueHog returns 201 Created on success; accept 200 as well.
    if (response.status === 200 || response.status === 201) {
      return { success: true, status: response.status };
    }

    const errorBody = await response.text().catch(() => "");
    return {
      success: false,
      status: response.status,
      error: `RevenueHog ${response.status}: ${errorBody}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
