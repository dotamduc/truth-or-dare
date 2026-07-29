import { test, expect } from "@playwright/test";

test.describe("Truth or Dare Vietnam - Full Game Flow E2E", () => {
  test("should navigate from landing to setup, add players, play turns and view results", async ({ page }) => {
    // 1. Open Landing Page
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("THẬT");
    await expect(page.locator("h1")).toContainText("THÁCH");

    // 2. Click "Chơi ngay"
    await page.click("text=🚀 BẮT ĐẦU CHƠI NGAY");
    await expect(page).toHaveURL(/\/play/);

    // 3. Setup Page: Add 3 players
    const input = page.locator('input[placeholder*="Nhập tên người chơi"]');
    await input.fill("An");
    await page.click("button:has-text('Thêm')");

    await input.fill("Bình");
    await page.click("button:has-text('Thêm')");

    await input.fill("Chi");
    await page.click("button:has-text('Thêm')");

    // Verify player tags
    await expect(page.locator("text=An")).toBeVisible();
    await expect(page.locator("text=Bình")).toBeVisible();
    await expect(page.locator("text=Chi")).toBeVisible();

    // 4. Click Start Game
    await page.click("button:has-text('BẮT ĐẦU CHƠI NGAY')");

    // 5. Game Play Page
    await expect(page).toHaveURL(/\/game\/game-/);
    await expect(page.locator("text=Lượt Chơi Của")).toBeVisible();

    // 6. Select "THẬT"
    await page.click("button:has-text('THẬT')");

    // 7. Complete Turn
    await expect(page.locator("text=DÃ HOÀN THÀNH")).toBeVisible();
    await page.click("button:has-text('DÃ HOÀN THÀNH')");

    // 8. Next player turn: Select "THÁCH"
    await expect(page.locator("button:has-text('THÁCH')")).toBeVisible();
    await page.click("button:has-text('THÁCH')");

    // 9. Click Replace Prompt
    await page.click("button:has-text('Đổi Câu Khác')");

    // 10. Complete Turn
    await page.click("button:has-text('DÃ HOÀN THÀNH')");

    // 11. End Game
    page.on("dialog", (dialog) => dialog.accept());
    await page.click("button:has-text('Kết Thúc')");

    // 12. Result Page
    await expect(page).toHaveURL(/\/result\/game-/);
    await expect(page.locator("h1")).toContainText("TỔNG KẾT PHIÊN CHƠI");
    await expect(page.locator("text=BẢNG ĐIỂM NGƯỜI CHƠI")).toBeVisible();
  });

  test("should show validation error for duplicate player names", async ({ page }) => {
    await page.goto("/play");
    const input = page.locator('input[placeholder*="Nhập tên người chơi"]');

    await input.fill("Minh");
    await page.click("button:has-text('Thêm')");

    await input.fill("minh"); // duplicate after normalize
    await page.click("button:has-text('Thêm')");

    await expect(page.locator("text=bị trùng lặp")).toBeVisible();
  });
});
