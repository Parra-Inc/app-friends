export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "payment_required"
  | "internal";

export type Surface =
  | "auth"
  | "api"
  | "sdk"
  | "workspace"
  | "app"
  | "key"
  | "pairing"
  | "campaign"
  | "approval"
  | "billing"
  | "asc"
  | "member"
  | "webhook";

export type ErrorCode = `${ErrorType}:${Surface}`;

export class AppFriendsError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: string) {
    super();
    const [type, surface] = errorCode.split(":");
    this.type = type as ErrorType;
    this.surface = surface as Surface;
    this.cause = cause;
    this.message = messageFor(errorCode);
    this.statusCode = statusFor(this.type);
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    return Response.json(
      { code, message: this.message, cause: this.cause },
      { status: this.statusCode }
    );
  }
}

function messageFor(code: ErrorCode): string {
  switch (code) {
    case "unauthorized:auth":
      return "Sign in to continue.";
    case "unauthorized:sdk":
      return "Missing or invalid API key.";
    case "forbidden:sdk":
      return "This API key can't perform that action.";
    case "forbidden:workspace":
      return "You don't have access to this workspace.";
    case "forbidden:app":
      return "You don't have access to this app.";
    case "not_found:workspace":
      return "Workspace not found.";
    case "not_found:app":
      return "App not found.";
    case "not_found:sdk":
      return "No app is registered for that bundle id.";
    case "not_found:key":
      return "API key not found.";
    case "not_found:pairing":
      return "Pairing not found.";
    case "not_found:campaign":
      return "Campaign not found.";
    case "conflict:app":
      return "An app with that bundle id already exists.";
    case "conflict:pairing":
      return "A pairing already exists between these apps.";
    case "conflict:workspace":
      return "That workspace slug is taken.";
    case "rate_limit:sdk":
      return "Too many requests. Slow down.";
    case "payment_required:campaign":
      return "Not enough wallet balance to run this campaign.";
    case "payment_required:billing":
      return "This feature requires the Pro plan.";
    case "bad_request:api":
    case "bad_request:sdk":
      return "Invalid request.";
    case "unauthorized:webhook":
      return "Invalid webhook signature.";
    default:
      return "Something went wrong. Try again.";
  }
}

function statusFor(type: ErrorType): number {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "payment_required":
      return 402;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "conflict":
      return 409;
    case "rate_limit":
      return 429;
    case "internal":
      return 500;
  }
}

/** Wrap an async route handler so thrown AppFriendsErrors become JSON responses. */
export async function handleRoute(
  fn: () => Promise<Response>
): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppFriendsError) return err.toResponse();
    console.error("[route] unhandled error:", err);
    return new AppFriendsError("internal:api").toResponse();
  }
}
