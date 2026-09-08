import { logger } from "@/lib/logger";

const log = logger("email");

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const DEFAULT_FROM = "App Friends <noreply@appfriends.dev>";
const isDevelopment = process.env.NODE_ENV !== "production";

/** Splits `App Name <noreply@domain>` into name + bare address. */
function parseFrom(from: string): { name: string; addr: string } {
  const match = from.match(/^(.*)<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim(), addr: match[2].trim() };
  return { name: "", addr: from.trim() };
}

interface CloudflareSendEmail {
  send(message: unknown): Promise<void>;
}

/**
 * Read the Cloudflare `SEND_EMAIL` binding.
 *
 * This repo is not on OpenNext/Workers yet (no `lib/cloudflare/context.ts`), so
 * there is no `getCloudflareContext()` to pull the binding from. We reach it
 * through a typed `globalThis` indirection: once the repo is migrated with
 * `/cloudflare-deployment`, the binding is surfaced here and prod email works.
 * Until then this returns undefined and the send fails loudly (but non-fatally).
 */
function sendEmailBinding(): CloudflareSendEmail | undefined {
  const binding = (globalThis as { SEND_EMAIL?: CloudflareSendEmail }).SEND_EMAIL;
  return binding;
}

async function sendViaMailhog(args: SendArgs, from: string): Promise<void> {
  // Lazy import keeps nodemailer out of the Workers runtime path.
  const nodemailer = (await import("nodemailer")).default;
  const transporter = nodemailer.createTransport({
    host: process.env.MAILHOG_HOST || "localhost",
    port: Number(process.env.MAILHOG_PORT || 1055),
    secure: false,
  });
  await transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text ?? stripHtml(args.html),
  });
}

async function sendViaCloudflare(args: SendArgs, from: string): Promise<void> {
  const sender = sendEmailBinding();
  if (!sender) throw new Error("SEND_EMAIL binding is required in production");

  const { createMimeMessage } = await import("mimetext");
  const { name, addr } = parseFrom(from);
  const msg = createMimeMessage();
  msg.setSender({ name, addr });
  msg.setRecipient(args.to);
  msg.setSubject(args.subject);
  msg.addMessage({ contentType: "text/html", data: args.html });
  msg.addMessage({
    contentType: "text/plain",
    data: args.text ?? stripHtml(args.html),
  });

  // `cloudflare:` modules only resolve inside workerd. The env indirection keeps
  // the specifier unknowable at build time so neither Turbopack nor OpenNext's
  // esbuild pass tries to resolve it.
  const specifier = process.env.CLOUDFLARE_EMAIL_MODULE || "cloudflare:email";
  const { EmailMessage } = (await import(/* turbopackIgnore: true */ specifier)) as {
    EmailMessage: new (from: string, to: string, raw: string) => unknown;
  };
  await sender.send(new EmailMessage(addr, args.to, msg.asRaw()));
}

/**
 * Dev: deliver to MailHog over SMTP (no auth). Prod: Cloudflare Email Sending
 * via the `SEND_EMAIL` binding. Email failures are logged, never thrown, so a
 * send never breaks the request path.
 */
export async function sendEmail(args: SendArgs): Promise<void> {
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  try {
    if (isDevelopment) await sendViaMailhog(args, from);
    else await sendViaCloudflare(args, from);
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
