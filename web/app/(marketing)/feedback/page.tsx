import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = {
  title: "Send feedback",
  description: "Report a bug, suggest an idea, or ask a question.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Send feedback</h1>
      <p className="mt-2 mb-8 opacity-70">
        Found a bug or have an idea? Tell us. We read every message.
      </p>
      <FeedbackForm />
    </main>
  );
}
