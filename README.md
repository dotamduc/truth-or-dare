# Thật Hay Thách

Game Truth or Dare tiếng Việt cho 2 đến 10 người chơi trên cùng một thiết bị. Ứng dụng là website tĩnh: không tài khoản, không API, không cơ sở dữ liệu và không gửi trạng thái ván chơi ra khỏi trình duyệt.

Website: <https://dotamduc.github.io/truth-or-dare/>

## Tính năng

- 595 mục từ `question.txt`: 337 câu Thật và 258 câu Thách đã qua content audit.
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

Content audit khóa độc lập SHA-256 nội dung, số lượng 595/337/258 và phân bố difficulty của đợt nhập hiện tại; đồng thời kiểm tra manifest, schema, ID, Unicode NFC, placeholder, duplicate và safety flag. Duplicate có sẵn trong file nguồn được giữ nguyên và báo ở mức warning. Kết quả được ghi vào `reports/prompt-audit.md` và `reports/prompt-audit.json`.

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

## Nhập lại bộ câu hỏi

Để tạo lại toàn bộ database từ đúng bản nguồn `question.txt` đã khóa bằng SHA-256:

```bash
pnpm content:import -- /duong-dan/toi/question.txt
pnpm content:audit
```

Lệnh nhập tạo hai tệp JSON và `src/data/prompts.import-manifest.json`, đồng thời giữ nguyên mọi mục trong nguồn, kể cả các mục trùng lặp. Importer từ chối file bị thiếu hoặc thay đổi nội dung so với nguồn đã duyệt.

## Thêm hoặc sửa câu hỏi

1. Không vá trực tiếp hai tệp JSON đã sinh. Hãy sửa nguồn được duyệt hoặc logic metadata trong `scripts/import-question-file.ts`, rồi chạy lại importer.
2. Nếu chủ động thay bộ nguồn, cập nhật contract SHA-256, số lượng và phân bố trong importer, audit và unit test trong cùng một review nội dung.
3. Giữ ID theo mẫu `truth-easy-001` hoặc `dare-hard-018`; không thêm hậu tố giả để né duplicate.
4. Điền đúng category, audience, minimum age và toàn bộ safety flag.
5. Chạy `pnpm verify` trước khi commit.

Quy tắc chi tiết nằm trong [Content guidelines](docs/CONTENT_GUIDELINES.md). Cơ chế lưu state nằm trong [Local storage](docs/LOCAL_STORAGE.md).

## GitHub Pages

Workflow `.github/workflows/pages.yml` kiểm tra nội dung, lint, typecheck, unit test, build với `GITHUB_PAGES=true`, upload `out/` và deploy qua GitHub Pages. Hướng dẫn vận hành nằm trong [Static deployment](docs/STATIC_DEPLOYMENT.md).

## Giới hạn

- Không có backend, tài khoản, admin dashboard hoặc tính năng report về máy chủ.
- Không đồng bộ ván chơi giữa thiết bị.
- Xóa dữ liệu website trong trình duyệt sẽ xóa ván đã lưu và danh sách câu đã ẩn.
- Nội dung câu hỏi là một phần của public bundle, không phải kho nội dung riêng tư.
