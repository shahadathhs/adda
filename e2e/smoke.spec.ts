import { expect, test } from "@playwright/test";
import { startPublisher } from "./publisher";

// register → create a channel → go live (test pattern) → watch as a guest → chat → poll.
test("a streamer goes live and a guest watches, reads chat and sees a poll", async ({
  page,
  browser,
}) => {
  const id = Date.now().toString(36);
  const username = `streamer_${id}`;
  const password = "correct-horse-1";

  // ── register ──
  await page.goto("/register");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill("E2E Streamer");
  await page.getByLabel("Email").fill(`${username}@example.com`);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/");

  // ── create a channel from the home rail ──
  await page.getByRole("button", { name: "Create a channel" }).click();
  await page.getByLabel("Channel name").fill(`E2E ${id}`);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page).toHaveURL(/\/studio/);
  await expect(page.getByRole("heading", { name: `E2E ${id}` })).toBeVisible();

  // ── the stream URL with its key, from the Setup tab ──
  const together = page.locator("#full-url");
  await page.getByRole("button", { name: "Show Server and key together" }).click();
  const rtmpUrl = await together.inputValue();
  expect(rtmpUrl).toMatch(/^rtmp:\/\/.+\/community\/[0-9a-f-]{36}\?key=/);
  const slug = `e2e-${id}`;

  // ── go live ──
  const publisher = startPublisher(rtmpUrl);
  try {
    await expect(page.getByText("Encoder connected. You are live.")).toBeVisible({
      timeout: 60_000,
    });

    // ── a guest watches: player badge, read-only chat ──
    const guest = await (await browser.newContext()).newPage();
    await guest.goto(`/channel/${slug}`);
    await expect(guest.getByText("LIVE").first()).toBeVisible({ timeout: 30_000 });
    await expect(guest.getByText("You are watching as a guest")).toBeVisible();
    await expect(guest.getByRole("textbox", { name: "Chat message" })).toHaveCount(0);

    // ── the streamer chats; the guest sees it arrive ──
    await page.goto("/studio/live");
    await page.getByRole("textbox", { name: "Chat message" }).fill("hello from the studio");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(guest.getByText("hello from the studio")).toBeVisible();

    // ── the streamer starts a poll; the guest sees it, and cannot vote ──
    await page.getByLabel("Question").fill("Which one?");
    await page.getByLabel("Option 1").fill("Red");
    await page.getByLabel("Option 2").fill("Blue");
    await page.getByRole("button", { name: "Start poll" }).click();
    const poll = guest.getByRole("region", { name: "Poll" });
    await expect(poll.getByText("Which one?")).toBeVisible();
    await expect(poll.getByText("sign in to vote")).toBeVisible();
    await expect(poll.getByRole("button")).toHaveCount(0);

    // ── the stream ends: the guest sees the ended state and chat stays ──
    await publisher.stop();
    await expect(guest.getByText("Thanks for watching")).toBeVisible({ timeout: 60_000 });
    await expect(guest.getByText("hello from the studio")).toBeVisible();
  } finally {
    publisher.stop();
  }
});

test("an unknown channel shows the not-found page", async ({ page }) => {
  await page.goto("/channel/definitely-not-here");
  await expect(page.getByText(/nothing at that address/)).toBeVisible();
});

test("a wrong password shows an error under the field", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});
