"use client";

import { useState } from "react";

const KINDS = [
  { value: "bug", label: "Report a bug" },
  { value: "idea", label: "Suggest an idea" },
  { value: "question", label: "Ask a question" },
  { value: "praise", label: "Say something nice" },
] as const;

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700";

export function FeedbackForm() {
  const [category, setCategory] = useState<string>("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const canSend = message.trim().length > 0 && status !== "sending";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          email: email.trim(),
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
      <div
        role="status"
        className="rounded-lg border border-neutral-300 p-6 dark:border-neutral-700"
      >
        <p className="font-medium">Thanks for the feedback.</p>
        <p className="mt-1 text-sm opacity-70">We read every message.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm underline underline-offset-4"
        >
          Send more feedback
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" data-testid="feedback-form">
      <div className="space-y-1.5">
        <label htmlFor="feedback-kind" className="text-sm font-medium">
          What is this about?
        </label>
        <select
          id="feedback-kind"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClass}
        >
          {KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="feedback-message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="feedback-message"
          required
          maxLength={5000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what happened, or what you would like to see."
          className={fieldClass}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="feedback-email" className="text-sm font-medium">
          Email{" "}
          <span className="font-normal opacity-60">
            (optional, if you want a reply)
          </span>
        </label>
        <input
          id="feedback-email"
          type="email"
          autoComplete="email"
          maxLength={320}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          Something went wrong sending your feedback. Please try again.
        </p>
      )}
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {status === "sending" ? "Sending..." : "Send feedback"}
      </button>
    </form>
  );
}
