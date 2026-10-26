// Dev-only visual check: node scripts/screenshots.mjs [email] — screenshots key routes at desktop + mobile.
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const base = process.env.BASE ?? "http://localhost:3000";
const email = process.argv[2];
const routes = (process.env.ROUTES ?? "/,/tonight,/moods,/ines-marlowe,/ines-marlowe/on-the-small-grief-of-leaving-a-city,/shelf,/settings,/writers").split(",");
const browser = await chromium.launch();
async function login(ctx) {
  const page = await ctx.newPage();
  const res = await page.request.post(`${base}/api/auth/sign-in/magic-link`, { data: { email, callbackURL: "/tonight" }, headers: { origin: base } });
  if (!res.ok()) throw new Error(`magic link ${res.status()} ${await res.text()}`);
  const lines = readFileSync(".mail/outbox.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((m) => m.to === email && m.tag === "magic-link");
  const url = lines.at(-1).text.match(/https?:\/\/\S+/)[0];
  await page.goto(url);
  await page.close();
}
for (const [name, vp] of [["desktop", { width: 1280, height: 860 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  if (email) await login(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: "networkidle" });
    const file = `.shots/${name}${r.replace(/[^a-z0-9]+/gi, "_") || "_root"}.png`;
    await page.screenshot({ path: file, fullPage: process.env.FULL === "1" });
    console.log(name, r, "→", file, page.url() !== base + r ? `(at ${page.url()})` : "");
  }
  if (errors.length) console.log("console errors:", [...new Set(errors)].slice(0, 8));
  await ctx.close();
}
await browser.close();
