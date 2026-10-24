import { expect, test } from "@playwright/test";
import { register } from "./api";

// A 1x1 PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test("a user sets a picture and a status, and clears the status", async ({ page }) => {
  const user = await register("profile");
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/settings");
  await page
    .getByLabel("Choose a profile picture")
    .setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("button", { name: "Replace picture" })).toBeVisible();

  await page.getByLabel("What's happening?").fill("Back at 6");
  await page.getByRole("button", { name: "Use ☕" }).click();
  await page.getByRole("button", { name: "Set status" }).click();
  await expect(page.getByText("Status saved")).toBeVisible();

  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menu").getByText("Back at 6")).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Clear status" }).click();
  await expect(page.getByText("Status cleared")).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menu").getByText("Back at 6")).toHaveCount(0);

  // Signing out lands on the home page, not the sign-in form.
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
