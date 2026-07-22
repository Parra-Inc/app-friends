const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3053";

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#FBFAFF;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#14122B">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <div style="font-size:20px;font-weight:600;margin-bottom:24px">
      <span style="color:#6D4AFF">App</span> <span style="color:#FF6B5E">Friends</span>
    </div>
    <div style="background:#fff;border:1px solid #ECEAF5;border-radius:16px;padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="color:#6B6A80;font-size:12px;margin-top:24px">
      App Friends — trade installs with apps that aren't your competition.
      <a href="${SITE}" style="color:#6D4AFF">${SITE.replace(/^https?:\/\//, "")}</a>
    </p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#6D4AFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${label}</a>`;
}

export function invitationEmail(args: {
  workspaceName: string;
  inviterName: string;
  acceptUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Join ${args.workspaceName} on App Friends`,
    html: shell(
      `You're invited to ${args.workspaceName}`,
      `<p style="color:#3A3756;line-height:1.6">${args.inviterName} invited you to collaborate on <strong>${args.workspaceName}</strong> in App Friends.</p>
       <p style="margin:24px 0">${button(args.acceptUrl, "Accept invite")}</p>
       <p style="color:#6B6A80;font-size:13px">This invite expires in 7 days.</p>`
    ),
  };
}

export function pairingRequestEmail(args: {
  fromAppName: string;
  toAppName: string;
  message?: string | null;
  reviewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${args.fromAppName} wants to be friends with ${args.toAppName}`,
    html: shell(
      `New pairing request`,
      `<p style="color:#3A3756;line-height:1.6"><strong>${args.fromAppName}</strong> would like to cross-promote with <strong>${args.toAppName}</strong> — you show theirs, they show yours.</p>
       ${args.message ? `<blockquote style="border-left:3px solid #EEE9FF;padding-left:12px;color:#3A3756;margin:16px 0">${args.message}</blockquote>` : ""}
       <p style="margin:24px 0">${button(args.reviewUrl, "Review request")}</p>`
    ),
  };
}

export function campaignApprovalEmail(args: {
  advertiserAppName: string;
  publisherAppName: string;
  reviewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `${args.advertiserAppName} wants to advertise in ${args.publisherAppName}`,
    html: shell(
      `New advertiser awaiting approval`,
      `<p style="color:#3A3756;line-height:1.6"><strong>${args.advertiserAppName}</strong> would like to run a sponsored placement inside <strong>${args.publisherAppName}</strong>. Nothing shows until you approve.</p>
       <p style="margin:24px 0">${button(args.reviewUrl, "Review advertiser")}</p>`
    ),
  };
}
