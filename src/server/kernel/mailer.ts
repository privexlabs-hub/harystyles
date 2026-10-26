import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";
import { log } from "./logger";

/**
 * Mailer port (docs/02 §2.10). Adapters:
 * - console (dev/test only): appends messages to .mail/outbox.jsonl so the developer — and the
 *   e2e suite — can open magic links. Never logs the link itself (INV-17).
 * - postmark: Postmark HTTP API.
 * Emails render in the paper theme (BR-PR-05).
 */
export type Mail = { to: string; subject: string; text: string; html: string; tag: string };

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

export const OUTBOX_FILE = path.join(process.cwd(), ".mail", "outbox.jsonl");

const consoleMailer: Mailer = {
  async send(mail) {
    if (env().NODE_ENV === "production") throw new Error("MAIL_TRANSPORT=console is not allowed in production");
    await mkdir(path.dirname(OUTBOX_FILE), { recursive: true });
    await appendFile(OUTBOX_FILE, JSON.stringify({ ...mail, at: new Date().toISOString() }) + "\n");
    log.info("mail captured in .mail/outbox.jsonl", { tag: mail.tag });
  },
};

const postmarkMailer: Mailer = {
  async send(mail) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-Postmark-Server-Token": env().POSTMARK_SERVER_TOKEN ?? "",
      },
      body: JSON.stringify({
        From: env().MAIL_FROM,
        To: mail.to,
        Subject: mail.subject,
        TextBody: mail.text,
        HtmlBody: mail.html,
        Tag: mail.tag,
        MessageStream: "outbound",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      log.error("postmark send failed", { status: res.status, tag: mail.tag });
      throw new Error("Email delivery failed");
    }
  },
};

export function mailer(): Mailer {
  return env().MAIL_TRANSPORT === "postmark" ? postmarkMailer : consoleMailer;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Paper-theme email shell. */
export function emailHtml(opts: { heading: string; body: string; cta?: { label: string; href: string }; footer?: string }): string {
  const cta = opts.cta
    ? `<p style="margin:28px 0"><a href="${esc(opts.cta.href)}" style="background:#b8642d;color:#fbf6ee;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px">${esc(opts.cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f1e9;padding:40px 16px">
<div style="max-width:520px;margin:0 auto;background:#fcf9f4;border:1px solid #e6dccd;border-radius:14px;padding:36px;color:#2b2520">
<p style="font-family:Georgia,serif;font-size:22px;margin:0 0 24px">harystyles<span style="color:#b8642d">.</span></p>
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;line-height:1.25;margin:0 0 16px">${esc(opts.heading)}</h1>
<p style="font-family:Georgia,serif;font-size:16px;line-height:1.6;margin:0">${esc(opts.body)}</p>${cta}
<p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#7a6f63;margin:28px 0 0">${esc(opts.footer ?? "Letters, not posts.")}</p>
</div></body></html>`;
}
