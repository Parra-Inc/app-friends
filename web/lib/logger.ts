/* Tiny structured logger. Keeps output greppable in dev and JSON-ish in prod. */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, scope: string, msg: string, data?: unknown) {
  const prefix = `[${scope}]`;
  const line = data !== undefined ? `${prefix} ${msg}` : `${prefix} ${msg}`;
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  if (data !== undefined) fn(line, data);
  else fn(line);
}

export function logger(scope: string) {
  return {
    debug: (msg: string, data?: unknown) => {
      if (process.env.NODE_ENV !== "production") emit("debug", scope, msg, data);
    },
    info: (msg: string, data?: unknown) => emit("info", scope, msg, data),
    warn: (msg: string, data?: unknown) => emit("warn", scope, msg, data),
    error: (msg: string, data?: unknown) => emit("error", scope, msg, data),
  };
}
