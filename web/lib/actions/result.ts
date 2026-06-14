import { AppFriendsError } from "@/lib/errors";

/** Discriminated result returned by form-facing server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

/** Run an action body, mapping thrown AppFriendsErrors to a friendly result. */
export async function runAction<T>(
  fn: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppFriendsError) return { ok: false, error: err.message };
    console.error("[action] unhandled:", err);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}
