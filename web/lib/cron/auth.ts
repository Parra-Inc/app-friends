/**
 * Vercel cron sends `Authorization: Bearer $CRON_SECRET`. Accept that, or any
 * request in dev when CRON_SECRET is unset.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
