import { expect, test, type Page } from "@playwright/test";

const GAME_KEY = "truth-or-dare:game:v1";
const HIDDEN_KEY = "truth-or-dare:hidden-prompts:v1";

async function beginTwoPlayerGame(page: Page) {
  await page.goto("./play/");
  await page.getByLabel("Tên người chơi 1").fill("An");
  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.evaluate(() => window.localStorage.clear());
});

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("landing and gameplay work without APIs or missing assets", async ({ page }) => {
  const apiRequests: string[] = [];
  const failedResponses: string[] = [];
  const consoleErrors: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.includes("/api/")) apiRequests.push(request.url());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Một thiết bị");
  await expect(page.getByText("70", { exact: true })).toHaveCount(2);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByRole("heading", { name: "Thiết lập ván chơi" })).toBeVisible();

  await beginTwoPlayerGame(page);
  await page.getByRole("button", { name: /^THẬT/ }).click();
  const prompt = page.locator(".prompt-text");
  const firstPrompt = await prompt.textContent();
  await page.getByRole("button", { name: "Đổi câu khác" }).click();
  await expect(prompt).not.toHaveText(firstPrompt ?? "");

  await page.getByRole("button", { name: /Đã hoàn thành \+1 điểm/ }).click();
  await expect(page.getByRole("heading", { name: "Bình" })).toBeVisible();
  await page.getByRole("button", { name: /^THÁCH/ }).click();
  await page.getByRole("button", { name: "Bỏ lượt" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();

  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).not.toBeNull();
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục ván chơi" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();

  await page.getByRole("button", { name: /^THẬT/ }).click();
  const hiddenPrompt = await prompt.textContent();
  await page.getByRole("button", { name: "Ẩn câu này trên thiết bị" }).click();
  await expect(prompt).not.toHaveText(hiddenPrompt ?? "");
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), HIDDEN_KEY)).toContain("truth-");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Kết thúc" }).click();
  await expect(page.getByRole("heading", { name: "Ván chơi đã khép lại." })).toBeVisible();
  await page.getByRole("button", { name: "Chơi lại cùng nhóm" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();

  expect(apiRequests).toEqual([]);
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("setup rejects duplicate normalized player names and can delete a saved game", async ({ page }) => {
  await page.goto("./play/");
  await page.getByLabel("Tên người chơi 1").fill(" An ");
  await page.getByLabel("Tên người chơi 2").fill("an");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.locator(".error-message")).toContainText("không được trùng");

  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Xóa ván đã lưu" }).click();
  await expect(page.getByRole("button", { name: "Tiếp tục ván chơi" })).toHaveCount(0);
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).toBeNull();
});

test("setup can shuffle the player order before starting", async ({ page }) => {
  await page.goto("./play/");
  const shuffleButton = page.getByRole("button", { name: "Xáo trộn thứ tự" });
  await expect(shuffleButton).toBeDisabled();

  await page.getByLabel("Tên người chơi 1").fill("An");
  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await expect(shuffleButton).toBeEnabled();
  await shuffleButton.click();

  await expect(page.getByLabel("Tên người chơi 1")).toHaveValue("Bình");
  await expect(page.getByLabel("Tên người chơi 2")).toHaveValue("An");
  await expect(page.getByText("Đã xáo trộn thứ tự người chơi.")).toBeVisible();

  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByRole("heading", { name: "Bình" })).toBeVisible();
});

test("responsive layouts avoid horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One browser pass covers the viewport matrix.");
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("./");
    await expectNoHorizontalOverflow(page);
    await page.goto("./play/");
    await expectNoHorizontalOverflow(page);
  }
});
