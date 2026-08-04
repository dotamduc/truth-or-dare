import { expect, test, type Page } from "@playwright/test";

const GAME_KEY = "truth-or-dare:game:v2";
const HIDDEN_KEY = "truth-or-dare:hidden-prompts:v2";
const THEME_KEY = "truth-or-dare-theme";
const LANGUAGE_KEY = "truth-or-dare-language";

async function beginTwoPlayerGame(page: Page) {
  await page.goto("./play/");
  await page.getByLabel("Tên người chơi 1").fill("An");
  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();
}

async function drawPromptNow(page: Page, type: "THẬT" | "THÁCH") {
  await page.getByRole("button", { name: new RegExp(`^${type}`) }).click();
  await page.getByRole("button", { name: "RÚT CÂU NGAY" }).click();
  await expect(page.locator(".prompt-text")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto("./");
  await page.evaluate((languageKey) => {
    window.localStorage.clear();
    window.localStorage.setItem(languageKey, "vi");
  }, LANGUAGE_KEY);
  await page.reload();
});

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
}

test("language chooser appears on first visit and switches the whole site", async ({ page }) => {
  await page.evaluate((languageKey) => window.localStorage.removeItem(languageKey), LANGUAGE_KEY);
  await page.reload();

  const chooser = page.getByRole("dialog", { name: "Chọn ngôn ngữ hiển thị" });
  await expect(chooser).toBeVisible();
  await expect(chooser.getByRole("heading", { name: "Chọn một ngôn ngữ / Choose a language" })).toBeVisible();
  await chooser.getByRole("button", { name: /English/ }).click();

  await expect(page.getByRole("heading", { name: "How do you play Truth or Dare?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Play now" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect.poll(() => page.evaluate((languageKey) => window.localStorage.getItem(languageKey), LANGUAGE_KEY)).toBe("en");

  await page.getByRole("button", { name: "Change language" }).click();
  await page.getByRole("dialog", { name: "Choose display language" }).getByRole("button", { name: /Tiếng Việt/ }).click();
  await expect(page.getByRole("heading", { name: "Truth or Dare chơi như thế nào?" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
});

test("community review UI is anonymous and does not show a login gate", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Bạn thấy trò chơi này thế nào?" })).toBeVisible();

  const setupNotice = page.getByText("Góc đánh giá đang được thiết lập. Vui lòng quay lại sau.");
  if (await setupNotice.isVisible()) {
    await expect(setupNotice).toBeVisible();
    return;
  }

  await expect(page.getByRole("heading", { name: /Kể một chút|Cập nhật cảm nhận/ })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(5);
  await expect(page.getByRole("textbox", { name: "Nhận xét (không bắt buộc)" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Gửi đánh giá ẩn danh|Cập nhật đánh giá/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /đăng nhập/i })).toHaveCount(0);
});

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
  await expect(page.getByRole("heading", { level: 1, name: "Truth or Dare" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Truth or Dare chơi như thế nào?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phá băng cực nhanh" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chọn Thật" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chọn Thách" })).toBeVisible();
  await expect(page.getByText("337 câu Thật", { exact: true })).toHaveCount(0);
  await expect(page.getByText("258 câu Thách", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chơi ngay" })).toHaveAttribute("href", /\/play\/?$/u);
  await expect(page.getByRole("link", { name: "Xem luật chơi" })).toHaveAttribute("href", /\/guide\/?$/u);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByRole("heading", { name: "Thiết lập ván chơi" })).toBeVisible();

  await beginTwoPlayerGame(page);
  await drawPromptNow(page, "THẬT");
  const prompt = page.locator(".prompt-text");
  const firstPrompt = await prompt.textContent();
  await page.getByRole("button", { name: "Đổi câu khác" }).click();
  await expect(page.locator(".prompt-card")).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: "Đang đổi câu…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "XOAY LẠI 🔥" })).toHaveCount(0);
  await expect(page.locator(".prompt-card")).toHaveAttribute("aria-busy", "false", { timeout: 5_500 });
  await expect(prompt).not.toHaveText(firstPrompt ?? "");

  await page.getByRole("button", { name: /Đã hoàn thành \+1 điểm/ }).click();
  await expect(page.getByRole("heading", { name: "Bình" })).toBeVisible();
  await drawPromptNow(page, "THÁCH");
  await page.getByRole("button", { name: "Bỏ lượt" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();

  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).not.toBeNull();
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục ván chơi" }).click();
  await expect(page.getByRole("heading", { name: "An" })).toBeVisible();

  await drawPromptNow(page, "THẬT");
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

test("question wheel commits only after confirmation and scores the turn", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await beginTwoPlayerGame(page);

  await page.getByRole("button", { name: /^THẬT/ }).click();
  await expect(page.getByText("Bạn đã chọn", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "XOAY ĐỂ THÊM THÚ VỊ 🔥" })).toBeVisible();
  const beforeSpin = await page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY);

  await page.getByRole("button", { name: "XOAY ĐỂ THÊM THÚ VỊ 🔥" }).click();
  const wheelDialog = page.getByRole("dialog", { name: "Vòng quay câu THẬT" });
  await expect(wheelDialog).toBeVisible();
  await expect(wheelDialog.locator(".wheel-pointer")).toBeVisible();
  const spinButton = wheelDialog.getByRole("button", { name: "QUAY", exact: true });
  await spinButton.dblclick();
  await expect(wheelDialog.getByRole("button", { name: "ĐANG QUAY" })).toBeDisabled();
  await expect(wheelDialog.getByRole("heading", { name: "KẾT QUẢ VÒNG QUAY" })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).toBe(beforeSpin);

  await wheelDialog.getByRole("button", { name: "CHƠI CÂU NÀY" }).click();
  await expect(page.locator(".prompt-card.truth")).toBeVisible();
  const committed = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null") as { currentPrompt: { id: string; type: string } | null; usedPromptIds: string[] }, GAME_KEY);
  expect(committed.currentPrompt?.type).toBe("TRUTH");
  expect(committed.usedPromptIds.filter((id) => id === committed.currentPrompt?.id)).toHaveLength(1);

  await page.getByRole("button", { name: /Đã hoàn thành \+1 điểm/ }).click();
  await expect(page.getByRole("heading", { name: "Bình" })).toBeVisible();
  const scored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null") as { players: Array<{ name: string; score: number }> }, GAME_KEY);
  expect(scored.players.find((player) => player.name === "An")?.score).toBe(1);
});

test("type and question wheels can be cancelled without changing the saved game", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await beginTwoPlayerGame(page);
  const initial = await page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY);

  await page.getByRole("button", { name: "XOAY CHỌN THẬT / THÁCH 🎲" }).click();
  const typeDialog = page.getByRole("dialog", { name: "Vòng quay chọn THẬT / THÁCH" });
  await expect(typeDialog).toBeVisible();
  await typeDialog.getByRole("button", { name: "Đóng vòng quay" }).click();
  await expect(typeDialog).toBeHidden();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).toBe(initial);

  await page.getByRole("button", { name: /^THÁCH/ }).click();
  await expect(page.locator(".selected-type-stage")).toContainText("THÁCH");
  await page.getByRole("button", { name: "XOAY ĐỂ THÊM THÚ VỊ 🔥" }).click();
  const questionDialog = page.getByRole("dialog", { name: "Vòng quay câu THÁCH" });
  await questionDialog.getByRole("button", { name: "QUAY", exact: true }).click();
  await expect(questionDialog.getByRole("heading", { name: "KẾT QUẢ VÒNG QUAY" })).toBeVisible();
  await questionDialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(questionDialog).toBeHidden();
  await expect(page.locator(".prompt-card")).toHaveCount(0);
  await expect(page.locator(".selected-type-stage")).toContainText("THÁCH");
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), GAME_KEY)).toBe(initial);

  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục ván chơi" }).click();
  await expect(page.getByRole("button", { name: /^THẬT/ })).toBeVisible();
  await expect(page.locator(".prompt-card")).toHaveCount(0);
});

test("mobile question wheel has no overflow or console errors", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  await beginTwoPlayerGame(page);
  await page.getByRole("button", { name: /^THẬT/ }).click();
  await page.getByRole("button", { name: "XOAY ĐỂ THÊM THÚ VỊ 🔥" }).click();
  const dialog = page.getByRole("dialog", { name: "Vòng quay câu THẬT" });
  await expect(dialog).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await dialog.getByRole("button", { name: "QUAY", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "KẾT QUẢ VÒNG QUAY" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test("theme follows the system when no preference is saved", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Chuyển sang giao diện sáng" })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), THEME_KEY)).toBeNull();
});

test("theme toggle persists across reload and navigation", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");

  const html = page.locator("html");
  const themeToggle = page.getByRole("button", { name: "Chuyển sang giao diện tối" });
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(themeToggle).toBeVisible();

  await themeToggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Chuyển sang giao diện sáng" })).toBeVisible();
  await expect.poll(() => page.evaluate((key) => window.localStorage.getItem(key), THEME_KEY)).toBe("dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Xem luật chơi" }).click();
  await expect(page.getByRole("heading", { name: "Luật chơi" })).toBeVisible();
  await expect(html).toHaveAttribute("data-theme", "dark");
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

test("setup supports infinite and custom round counts", async ({ page }) => {
  await page.goto("./play/");
  const rounds = page.getByLabel("Số vòng mỗi người");
  await expect(rounds.getByRole("option", { name: "Vô hạn vòng" })).toHaveCount(1);
  await expect(rounds.getByRole("option", { name: "Tuỳ chọn số vòng" })).toHaveCount(1);

  await page.getByLabel("Tên người chơi 1").fill("An");
  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await rounds.selectOption("INFINITE");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByText("Vòng 1 · Vô hạn", { exact: true })).toBeVisible();
  const infinite = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? "null") as { totalRounds: number | null }, GAME_KEY);
  expect(infinite.totalRounds).toBeNull();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Kết thúc" }).click();
  await page.getByRole("button", { name: "Tạo ván mới" }).click();
  await page.getByLabel("Tên người chơi 1").fill("An");
  await page.getByLabel("Tên người chơi 2").fill("Bình");
  await page.getByLabel("Số vòng mỗi người").selectOption("CUSTOM");
  await page.getByLabel("Số vòng tuỳ chọn").fill("37");
  await page.getByRole("button", { name: "Bắt đầu chơi" }).click();
  await expect(page.getByText("Vòng 1/37", { exact: true })).toBeVisible();
});

test("responsive layouts avoid horizontal overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One browser pass covers the viewport matrix.");
  const viewports = [
    { width: 320, height: 720 },
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
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
