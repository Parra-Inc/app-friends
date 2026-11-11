import { NextResponse } from "next/server";
import { z } from "zod";
import { FEEDBACK_KINDS, forwardFeedbackToRevenueHog } from "@/lib/revenuehog";
import { rateLimit } from "@/lib/queue/ratelimit";

const feedbackSchema = z.object({
  category: z.enum(FEEDBACK_KINDS),
  message: z.string().trim().min(1).max(5000),
  email: z
    .union([z.string().trim().email().max(320), z.literal("")])
    .optional(),
  page: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rl = await rateLimit(`feedback:${ip}`);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
  }

  const data = parsed.data;
  const result = await forwardFeedbackToRevenueHog({
    kind: data.category,
    message: data.message,
    email: data.email || null,
    page: data.page ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  if (!result.success) {
    // Keep RevenueHog's auth and validation detail out of the response.
    console.error("Failed to forward feedback to RevenueHog:", result.error);
    return NextResponse.json(
      { error: "Failed to deliver feedback" },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
