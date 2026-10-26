import { expect, test } from "@playwright/test";
import { signIn, onboard, uniqueEmail } from "./helpers";

const PARA =
  "The tide came in slowly that evening, the way it always does when nobody is waiting for it. I stood on the steps with my coat open and watched the light leave the water one shade at a time, and I thought about how little we say to the people who matter most.";

test("apply → curator approves → write → publish → curator confirms mood", async ({ browser }) => {
  const writerEmail = uniqueEmail("writer");
  const penName = `Test Writer ${Date.now() % 100000}`;

  const w = await browser.newPage();
  await signIn(w, writerEmail, "/studio/apply");
  await onboard(w);
  await w.goto("/studio/apply");
  await w.getByLabel("Pen name").fill(penName);
  await w.getByLabel("About you").fill("I write about tides, kitchens and the people who leave them.");
  for (const i of [0, 1]) {
    await w.locator(`#st${i}`).fill(`Sample ${i + 1}`);
    await w.locator(`#sb${i}`).fill(PARA + " " + PARA);
  }
  await w.getByRole("button", { name: "Send my application" }).click();
  await expect(w.getByText(/curators read every application/)).toBeVisible();

  const c = await browser.newPage();
  await signIn(c, "curator@harystyles.dev", "/console/applications");
  await c.goto("/console/applications");
  const card = c.locator("li", { hasText: penName });
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(c.getByText("Application approved.")).toBeVisible();

  await w.goto("/studio");
  await expect(w.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  await w.getByRole("button", { name: "Write a letter" }).click();
  await expect(w).toHaveURL(/\/studio\/letters\//);
  await w.getByPlaceholder("Title", { exact: true }).fill("Low tide, high feeling");
  const body = w.getByRole("textbox", { name: "Letter body" });
  await body.click();
  for (let i = 0; i < 4; i++) await w.keyboard.type(PARA + (i < 3 ? "\n" : ""), { delay: 0 });
  await w.getByRole("button", { name: "Settings" }).click();
  await w.getByLabel("Mood").selectOption("still");
  await w.getByRole("button", { name: "Publish letter" }).click();
  await expect(w.locator("#letter-title")).toHaveText("Low tide, high feeling", { timeout: 20_000 });

  await c.goto("/console/queue");
  const item = c.locator("li", { hasText: "Low tide, high feeling" });
  await item.getByLabel("Mood").selectOption("still");
  await item.getByRole("button", { name: "Confirm mood" }).click();
  await expect(c.getByText("Mood confirmed.")).toBeVisible();
});
