import { expect, test } from "@playwright/test";
import { onboard, signIn, uniqueEmail } from "./helpers";

test("new reader: magic link → onboarding → Tonight → keep a line → Shelf @mobile", async ({ page }) => {
  const email = uniqueEmail("reader");
  await signIn(page, email);
  await onboard(page);
  await expect(page).toHaveURL(/\/tonight/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("a little melancholy");

  await page.locator("main article a").first().click();
  await expect(page.locator("#letter-title")).toBeVisible();
  const sentence = page.locator("[data-anchor]").first();
  await sentence.click();
  await page.getByRole("toolbar", { name: "React to this sentence" }).getByRole("button", { name: "Keep line" }).click();
  await expect(page.getByText("Kept. The line is on your shelf.")).toBeVisible();

  await page.goto("/shelf");
  await expect(page.locator("blockquote").first()).toBeVisible();
});

test("a private reaction persists for the reader only", async ({ page }) => {
  await signIn(page, "maya@harystyles.dev");
  await page.goto("/daniyar-ahn/what-the-river-kept");
  await page.locator("[data-anchor]").nth(1).click();
  await page.getByRole("button", { name: "tender" }).click();
  await page.reload();
  await expect(page.locator("[data-anchor][data-reacted]")).toHaveCount(1);
});
