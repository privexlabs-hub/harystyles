import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/** Signs in through the real magic-link flow; the dev mailer writes links to .mail/outbox.jsonl. */
export async function signIn(page: Page, email: string, next = "/tonight") {
  const res = await page.request.post("/api/auth/sign-in/magic-link", {
    data: { email, callbackURL: `/onboarding?next=${encodeURIComponent(next)}` },
    headers: { origin: "http://localhost:3100" },
  });
  expect(res.ok()).toBeTruthy();
  const msgs = readFileSync(".mail/outbox.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as { to: string; tag: string; text: string })
    .filter((m) => m.to === email && m.tag === "magic-link");
  const url = msgs.at(-1)!.text.match(/https?:\/\/\S+/)![0];
  await page.goto(url);
  // The link verifies, then redirects through onboarding; wait until the chain settles.
  await page.waitForURL((u) => !u.pathname.startsWith("/api/auth"));
  await page.waitForLoadState("networkidle");
}

export const uniqueEmail = (tag: string) => `${tag}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@e2e.test`;

export async function onboard(page: Page) {
  await expect(page.getByRole("heading", { name: /Welcome to/ })).toBeVisible();
  await page.getByLabel("I am 16 or older.").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Melancholy/ }).click();
  await page.getByRole("button", { name: /^Tender/ }).click(); // drop the default so melancholy leads
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("At a time I choose").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /Paper/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Begin reading tonight" }).click();
}
