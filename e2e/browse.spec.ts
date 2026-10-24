import { expect, test } from "@playwright/test";
import { createChannel, register } from "./api";

test("the home search suggests channels and opens one", async ({ page }) => {
  const owner = await register("finder");
  const word = `Zephyr${Date.now().toString(36)}`;
  const channel = await createChannel(owner, `${word} Radio`);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Find a stream/ })).toBeVisible();
  await page.getByRole("combobox").first().fill(word.slice(0, 10));
  const option = page.getByRole("option", { name: new RegExp(word, "i") });
  await expect(option).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/channel/${channel.slug}`));
});

test("channels page filters, sorts and pages through results", async ({ page }) => {
  const owner = await register("lister");
  const word = `Pager${Date.now().toString(36)}`;
  for (let i = 1; i <= 13; i++) await createChannel(owner, `${word} ${String(i).padStart(2, "0")}`);

  await page.goto(`/channels?q=${word}&sort=name`);
  await expect(page.getByText("13 matching channels")).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`${word} 01`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`${word} 13`) })).toHaveCount(0);

  await page.getByRole("link", { name: "Page 2" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("link", { name: new RegExp(`${word} 13`) })).toBeVisible();

  // Typing in the filter narrows the list and returns to page 1.
  await page.getByRole("searchbox", { name: /Filter by name/ }).fill(`${word} 07`);
  await expect(page).not.toHaveURL(/page=2/);
  await expect(page.getByRole("link", { name: new RegExp(`${word} 07`) })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(`${word} 01`) })).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/q=/);
});

test("the navigation links to the live, channel and recording directories", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary" }).first();
  await expect(nav.getByRole("link", { name: "Browse" })).toHaveCount(0);
  for (const name of ["Live", "Channels", "Recordings"]) {
    await nav.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${name.toLowerCase()}`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
  await expect(page).toHaveURL(/\/recordings/);
  await expect(page.getByRole("link", { name: "Page 2" })).toHaveCount(0);
});

test("every page has the same navigation, with search, and a full footer", async ({ page }) => {
  for (const path of ["/", "/live", "/channels", "/recordings", "/search", "/about", "/login"]) {
    await page.goto(path);
    const header = page.getByRole("banner");
    await expect(header.getByRole("combobox")).toBeVisible();
    await expect(header.getByRole("link", { name: "Channels" })).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "About" })).toBeVisible();
  }
});

test("the about page links to the author and the source", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("run yourself");
  await expect(page.getByRole("link", { name: /shahadathhs on GitHub/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the repository" })).toHaveAttribute(
    "href",
    /github\.com\/shahadathhs\/adda/,
  );
});
