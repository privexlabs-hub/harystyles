import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test("anonymous visitors are sent to sign in for private pages", async ({ page }) => {
  await page.goto("/shelf");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fshelf|\/sign-in\?next=\/shelf/);
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("a reader cannot open the console (404) and is sent from studio to apply", async ({ page }) => {
  await signIn(page, "maya@harystyles.dev");
  await page.goto("/console");
  await expect(page.getByText(/could not be found|404/i).first()).toBeVisible();
  await page.goto("/studio");
  await expect(page).toHaveURL(/\/studio\/apply/);
});

test("server actions reject unauthenticated calls", async ({ request }) => {
  const res = await request.post("/api/v1/reading-progress", {
    data: { letterId: "00000000-0000-7000-8000-000000000000", progress: 1, activeSeconds: 10 },
    headers: { origin: "http://localhost:3100" },
  });
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).toContain("application/problem+json");
});
