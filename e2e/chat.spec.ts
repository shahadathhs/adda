import { expect, test, type Page } from "@playwright/test";
import { createChannel, follow, register } from "./api";
import { startPublisher } from "./publisher";

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/");
}

test("viewers reply, react, stay anonymous, and a moderator times one out", async ({ browser }) => {
  const owner = await register("owner");
  const fan = await register("fan");
  const channel = await createChannel(owner, "Chat Room");
  await follow(fan, channel.id);

  const publisher = startPublisher(channel.streamUrl);
  try {
    const ownerPage = await (await browser.newContext()).newPage();
    const fanPage = await (await browser.newContext()).newPage();
    await signIn(ownerPage, owner.email, owner.password);
    await signIn(fanPage, fan.email, fan.password);

    await ownerPage.goto(`/channel/${channel.slug}`);
    await fanPage.goto(`/channel/${channel.slug}`);
    await expect(fanPage.getByRole("textbox", { name: "Chat message" })).toBeVisible({
      timeout: 60_000,
    });

    // ── the owner speaks, the fan replies with a mention ──
    const ownerBox = ownerPage.getByRole("textbox", { name: "Chat message" });
    await ownerBox.fill("welcome everyone");
    await ownerPage.getByRole("button", { name: "Send" }).click();
    const fanLine = fanPage.getByText("welcome everyone").first();
    await expect(fanLine).toBeVisible();

    await fanLine.hover();
    await fanPage
      .getByRole("button", { name: /^Reply to/ })
      .first()
      .click();
    await fanPage.getByRole("textbox", { name: "Chat message" }).fill(`thanks @${owner.username}`);
    await fanPage.getByRole("button", { name: "Send" }).click();
    await expect(ownerPage.getByText("Replying to").first()).toBeVisible();

    // ── a reaction shows up for the other side ──
    await fanLine.hover();
    await fanPage.getByRole("button", { name: "Add a reaction" }).first().click();
    await fanPage.getByRole("button", { name: "React with 👍" }).click();
    await expect(ownerPage.getByRole("button", { name: "👍 1" })).toBeVisible();

    // ── the mention rang the owner's bell ──
    await ownerPage.getByRole("button", { name: /Notifications/ }).click();
    await expect(ownerPage.getByText(/mentioned you|replied to you/).first()).toBeVisible();
    await ownerPage.keyboard.press("Escape");

    // ── anonymous mode: the room sees "Anonymous" ──
    await fanPage.getByRole("button", { name: "switch to anonymous" }).click();
    await expect(fanPage.getByRole("button", { name: "switch to my name" })).toBeVisible();
    await fanPage.getByRole("textbox", { name: "Chat message" }).fill("psst");
    await fanPage.getByRole("button", { name: "Send" }).click();
    const anonymousLine = ownerPage.locator("p", { hasText: "psst" }).first();
    await expect(anonymousLine).toContainText("Anonymous");
    await expect(anonymousLine).not.toContainText(fan.username);

    // ── the owner times the anonymous sender out from the message menu ──
    const psst = ownerPage.getByText("psst").first();
    await psst.hover();
    await ownerPage.getByRole("button", { name: "More actions for this message" }).last().click();
    await ownerPage.getByRole("menuitem", { name: "Time out 10 minutes" }).click();
    await expect(fanPage.getByText(/timed out until/)).toBeVisible();
    await expect(fanPage.getByRole("textbox", { name: "Chat message" })).toHaveCount(0);
  } finally {
    publisher.stop();
  }
});

test("the channel page works at phone width", async ({ browser }) => {
  const owner = await register("mobile");
  const channel = await createChannel(owner, "Phone Room");
  const publisher = startPublisher(channel.streamUrl);
  try {
    const page = await (
      await browser.newContext({ viewport: { width: 390, height: 844 } })
    ).newPage();
    await page.goto(`/channel/${channel.slug}`);
    await expect(page.getByText("LIVE").first()).toBeVisible({ timeout: 60_000 });
    // No horizontal page scroll, and the chat sits under the player.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("region", { name: "Chat" })).toBeVisible();
  } finally {
    publisher.stop();
  }
});
