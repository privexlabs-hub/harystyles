import { expect, test } from "@playwright/test";

test("landing renders the brand promise @mobile", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Letters,");
  await expect(page.getByRole("link", { name: "Begin reading tonight" })).toBeVisible();
});

test("anonymous Tonight shows five public letters and switches mood in-session @mobile", async ({ page }) => {
  await page.goto("/tonight");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("a little tender");
  await expect(page.locator("main article")).toHaveCount(5);
  await page.getByRole("button", { name: "Still" }).click();
  await expect(page).toHaveURL(/mood=still/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("a little still");
});

test("INV-01: a patron letter shows only the preview to anonymous readers", async ({ page }) => {
  const res = await page.goto("/ines-marlowe/i-dont-know-how-to-end-this-letter");
  await expect(page.getByRole("heading", { name: "The rest of this letter is for patrons." })).toBeVisible();
  const html = await res!.text();
  expect(html).not.toContain("morning sun"); // last paragraph of the seeded patron letter
  expect(html).not.toContain("be careless with your joy");
});

test("reader pages expose no public counts (INV-02)", async ({ page }) => {
  await page.goto("/ines-marlowe");
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/\bpatrons?\s*·|\d+\s+(patrons|followers|kept lines)/i);
});

test("unknown writers render the not-found page", async ({ page }) => {
  await page.goto("/no-such-writer-here");
  await expect(page.getByText(/could not be found|404/i).first()).toBeVisible();
});

test("search finds public letters by title", async ({ page }) => {
  await page.goto("/search?q=river");
  await expect(page.getByRole("link", { name: "What the river kept" })).toBeVisible();
});
