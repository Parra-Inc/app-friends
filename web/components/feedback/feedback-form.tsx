"use client";

import { useEffect, useId, useRef, useState } from "react";

// Category values are the exact enum the /api/v1/feedback route accepts. The
// route maps each onto a RevenueHog kind and keeps the original in metadata.
const KINDS = [
  { value: "bug", label: "Report a bug" },
  { value: "idea", label: "Suggest an idea" },
  { value: "question", label: "Ask a question" },
  { value: "praise", label: "Say something nice" },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent" | "error";

const fieldClassName =
  "w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-brand aria-invalid:border-error";

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export function FeedbackForm({ onDone }: { onDone?: () => void }) {
  const ids = useId();
  const [category, setCategory] = useState<string>("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    messageRef.current?.focus();
  }, []);

  useEffect(() => {
    if (status === "error") errorRef.current?.focus();
    if (status === "sent") doneRef.current?.focus();
  }, [status]);

  const trimmedEmail = email.trim();
  const emailInvalid =
    trimmedEmail.length > 0 && !EMAIL_PATTERN.test(trimmedEmail);
  const showEmailError = emailInvalid && emailTouched;
  const canSend =
    message.trim().length > 0 && !emailInvalid && status !== "sending";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailInvalid) {
      setEmailTouched(true);
      return;
    }
    if (!canSend) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: trimmedEmail,
          page: window.location.pathname,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="space-y-4">
        <p className="text-sm font-medium text-ink">
          Thanks for the feedback. We read every message.
        </p>
        <div className="flex justify-end">
          <button
            ref={doneRef}
            type="button"
            onClick={() => (onDone ? onDone() : setStatus("idle"))}
            className={
              "inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
            }
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4"
      data-testid="feedback-form"
    >
      <div className="space-y-1.5">
        <label htmlFor={`${ids}-kind`} className="text-sm font-medium text-ink">
          What is this about?
        </label>
        <select
          id={`${ids}-kind`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClassName}
        >
          {KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={`${ids}-message`}
          className="text-sm font-medium text-ink"
        >
          Message
        </label>
        <textarea
          ref={messageRef}
          id={`${ids}-message`}
          required
          maxLength={5000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what happened, or what you would like to see."
          className={`${fieldClassName} h-auto min-h-36 resize-y py-3`}
        />
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={`${ids}-email`}
          className="text-sm font-medium text-ink"
        >
          Email (optional, if you want a reply)
        </label>
        <input
          id={`${ids}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={320}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          aria-invalid={showEmailError || undefined}
          aria-describedby={showEmailError ? `${ids}-email-error` : undefined}
          className={fieldClassName}
        />
        {showEmailError && (
          <p id={`${ids}-email-error`} className="text-sm text-error">
            Enter a valid email, or leave it blank.
          </p>
        )}
      </div>
      {status === "error" && (
        <p
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="text-sm text-error outline-none"
        >
          Something went wrong sending your feedback. Please try again.
        </p>
      )}
      <p className="text-xs text-muted">
        We send your category, message, your email if you add one, the page you
        are on, and your browser&apos;s user agent. Feedback is stored with
        RevenueHog, the tool we use to read it.
      </p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className={
              "rounded-full border border-rule bg-paper-raised px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink"
            }
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!canSend}
          className={
            "inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-ink transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          }
        >
          {status === "sending" && <Spinner />}
          {status === "sending" ? "Sending..." : "Send feedback"}
        </button>
      </div>
    </form>
  );
}

/**
 * A "Send feedback" trigger that opens the form in a modal dialog. Uses the
 * native <dialog> element: focus is trapped, Escape closes it, and a click on
 * the backdrop dismisses it.
 */
export function FeedbackDialog({
  className,
  children = "Send feedback",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState(0);
  const [open, setOpen] = useState(false);

  // A click that lands on the dialog element itself (not its content) is a
  // click on the backdrop, so dismiss.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dialog.close();
    };
    dialog.addEventListener("click", onBackdrop);
    return () => dialog.removeEventListener("click", onBackdrop);
  }, []);

  function show() {
    setSession((s) => s + 1);
    setOpen(true);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={show}
        className={className}
      >
        {children}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        className="rounded-2xl border border-rule bg-paper-raised text-ink shadow-xl m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <h2 id={titleId} className="font-display text-2xl text-ink">
              Send feedback
            </h2>
            <p className="text-sm text-muted">
              Found a bug or have an idea? Tell us.
            </p>
          </div>
          {open && <FeedbackForm key={session} onDone={close} />}
        </div>
      </dialog>
    </>
  );
}
