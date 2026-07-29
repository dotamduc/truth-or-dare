# Thật Hay Thách

Game Truth or Dare tiếng Việt cho 2 đến 10 người chơi trên cùng một thiết bị. Ứng dụng là website tĩnh: không tài khoản, không API, không cơ sở dữ liệu và không gửi trạng thái ván chơi ra khỏi trình duyệt.

Website: <https://dotamduc.github.io/truth-or-dare/>

## Tính năng

- Chính xác 70 câu Thật và 70 câu Thách đã qua content audit.
- Bốn mức độ cân bằng: EASY, MEDIUM, BOLD và HARD.
- Chọn tuổi tối thiểu, độ khó, chủ đề, nhóm người chơi và quyền an toàn.
- Chơi lần lượt hoặc ngẫu nhiên cân bằng.
- Hoàn thành, bỏ lượt, đổi câu, tính điểm, bảng kết quả và chơi lại.
- Tiếp tục sau khi refresh bằng `localStorage`.
- Ẩn câu không phù hợp chỉ trên trình duyệt hiện tại.
- Giao diện responsive, hỗ trợ bàn phím, focus rõ và reduced motion.

## Công nghệ và kiến trúc

- Next.js 16 App Router với `output: "export"`.
- React 19 và TypeScript strict.
- Pure client-side game engine.
- Hai tệp JSON tĩnh trong `src/data/`.
- Zod để kiểm tra schema dữ liệu và state đọc từ `localStorage`.
- Vitest cho unit test và Playwright cho static E2E.
- GitHub Actions và GitHub Pages, không có backend runtime.

Toàn bộ nội dung câu hỏi nằm trong JavaScript công khai của website. Trạng thái ván chơi chỉ nằm trên thiết bị đang dùng, không đồng bộ giữa trình duyệt hoặc thiết bị.

## Phát triển local

Yêu cầu Node.js 20.19 trở lên và pnpm 11.9.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Không cần `.env`, PostgreSQL, Prisma, Docker hay secret.

## Kiểm tra chất lượng

```bash
pnpm content:audit
pnpm lint
pnpm typecheck
pnpm test
pnpm audit --prod
```

Content audit kiểm tra số lượng, phân bố difficulty, schema, ID, Unicode NFC, placeholder, exact duplicate, near duplicate, safety flag và nội dung cấm. Kết quả được ghi vào `reports/prompt-audit.md` và `reports/prompt-audit.json`.

## Build tĩnh và E2E

Build local không có base path:

```bash
pnpm build
pnpm start
```

Build và kiểm thử đúng cấu trúc GitHub Pages:

```bash
pnpm build:pages
pnpm exec playwright install chromium
pnpm test:e2e:pages
```

`build:pages` tạo `out/` với base path `/truth-or-dare`. Script preview đặt một bản sao tạm vào `.pages-preview/truth-or-dare/` để mô phỏng chính xác URL production; cả hai thư mục đều bị Git bỏ qua.

Chạy toàn bộ quality gate:

```bash
pnpm verify
```

## Thêm hoặc sửa câu hỏi

1. Sửa `src/data/prompts.truth.vi.json` hoặc `src/data/prompts.dare.vi.json`.
2. Giữ ID theo mẫu `truth-easy-001` hoặc `dare-hard-018` và không tái sử dụng ID.
3. Điền đúng category, audience, minimum age và toàn bộ safety flag.
4. Không thêm hậu tố giả để né duplicate.
5. Chạy `pnpm content:audit` và unit test trước khi commit.

Quy tắc chi tiết nằm trong [Content guidelines](docs/CONTENT_GUIDELINES.md). Cơ chế lưu state nằm trong [Local storage](docs/LOCAL_STORAGE.md).

## GitHub Pages

Workflow `.github/workflows/pages.yml` kiểm tra nội dung, lint, typecheck, unit test, build với `GITHUB_PAGES=true`, upload `out/` và deploy qua GitHub Pages. Hướng dẫn vận hành nằm trong [Static deployment](docs/STATIC_DEPLOYMENT.md).

## Giới hạn

- Không có backend, tài khoản, admin dashboard hoặc tính năng report về máy chủ.
- Không đồng bộ ván chơi giữa thiết bị.
- Xóa dữ liệu website trong trình duyệt sẽ xóa ván đã lưu và danh sách câu đã ẩn.
- Nội dung câu hỏi là một phần của public bundle, không phải kho nội dung riêng tư.
