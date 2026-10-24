import { expect, test } from "@playwright/test";
import { createChannel, register } from "./api";
import { makeTestVideo } from "./video-file";

test("an owner uploads a video, viewers watch it, and making it private hides it", async ({
  browser,
}) => {
  const owner = await register("uploader");
  await createChannel(owner, "Upload Room");
  const title = `Clip ${Date.now().toString(36)}`;
  const file = makeTestVideo();

  const ownerPage = await (await browser.newContext()).newPage();
  await ownerPage.goto("/login");
  await ownerPage.getByLabel("Email").fill(owner.email);
  await ownerPage.getByLabel("Password").fill(owner.password);
  await ownerPage.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await expect(ownerPage).toHaveURL("/");

  await ownerPage.goto("/studio/videos");
  await ownerPage.getByLabel("Choose a video file").setInputFiles(file);
  await ownerPage.getByLabel("Title").fill(title);
  await ownerPage.getByRole("button", { name: "Upload", exact: true }).click();

  // The server inspects the file, fixes its index for streaming and makes a poster.
  const link = ownerPage.getByRole("link", { name: title });
  await expect(link).toBeVisible({ timeout: 90_000 });
  await expect(ownerPage.getByText("public", { exact: true })).toBeVisible();

  // A guest finds it in the directory and in search, and it plays.
  const guest = await (await browser.newContext()).newPage();
  await guest.goto(`/videos?q=${encodeURIComponent(title)}`);
  await expect(guest.getByRole("link", { name: new RegExp(title) })).toBeVisible();
  await guest.getByRole("link", { name: new RegExp(title) }).click();
  await expect(guest.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect
    .poll(() => guest.locator("video").evaluate((v: HTMLVideoElement) => Math.round(v.duration)), {
      timeout: 30_000,
    })
    .toBe(3);

  // Private: the owner still sees it, the guest does not.
  const url = guest.url();
  await link.waitFor();
  await ownerPage.getByRole("button", { name: "Edit" }).click();
  await ownerPage.getByLabel("Who can watch").selectOption("private");
  await ownerPage.getByRole("button", { name: "Save", exact: true }).click();
  await expect(ownerPage.getByText("Video saved")).toBeVisible();
  await guest.goto(url);
  await expect(guest.getByText("This video is not available")).toBeVisible();
  await guest.goto(`/videos?q=${encodeURIComponent(title)}`);
  await expect(guest.getByText("No video matches these filters.")).toBeVisible();

  // Delete it.
  ownerPage.once("dialog", (d) => void d.accept());
  await ownerPage.getByRole("button", { name: "Delete" }).click();
  await expect(ownerPage.getByText("Video deleted")).toBeVisible();
  await expect(link).toHaveCount(0);
});
