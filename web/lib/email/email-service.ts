import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

const log = logger("email");

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Dev: deliver to MailHog over SMTP (no auth). Prod: Resend's SMTP bridge when
 * RESEND_API_KEY is set. Either way, one code path.
 */
function transport() {
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });
  }
  return nodemailer.createTransport({
    host: process.env.MAILHOG_HOST || "localhost",
    port: Number(process.env.MAILHOG_PORT || 1055),
    secure: false,
  });
}

export async function sendEmail(args: SendArgs): Promise<void> {
  const from = process.env.EMAIL_FROM || "App Friends <noreply@appfriends.dev>";
  try {
    await transport().sendMail({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text ?? stripHtml(args.html),
    });
    log.info(`sent "${args.subject}" → ${args.to}`);
  } catch (err) {
    log.error("send failed", err);
    // Don't throw — email failures shouldn't break the request path.
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
