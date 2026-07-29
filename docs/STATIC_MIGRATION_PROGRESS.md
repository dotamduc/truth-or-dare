# Static migration progress

Ngày cập nhật: 2026-07-30. Repository: `E:\\anti`. Branch: `main`.

## Baseline trước static migration

- Working tree có toàn bộ remediation PostgreSQL/staging trước đó nhưng chưa được commit.
- Remote `origin`: `https://github.com/dotamduc/truth-or-dare.git` (đúng yêu cầu).
- Commit hiện tại: `0e70cd6 Initial commit: Truth or Dare Vietnam full-stack web application`.
- Node: `v22.20.0`.
- pnpm: `11.9.0`.
- `gh auth status`: BLOCKED, GitHub CLI chưa được cài trên máy.
- `corepack enable`: FAIL, lỗi `EPERM` khi ghi vào `C:\\Program Files\\nodejs\\pnpm`; pnpm cài sẵn vẫn hoạt động.
- `pnpm install --frozen-lockfile`: PASS.
- `pnpm content:audit`: PASS theo contract cũ, 43 Truth + 33 Dare, 0 blocker.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS, 3 files / 24 tests.
- `pnpm build`: FAIL vì backend route yêu cầu `DATABASE_URL`, `APP_SECRET`, `APP_URL`.
- `pnpm audit --prod`: PASS, không có advisory đã biết.

Không có lệnh chưa chạy nào được ghi là PASS.

## Audit kiến trúc và giao diện

### Kiến trúc trước migration

- Next.js App Router với dynamic routes `/game/[sessionId]`, `/result/[sessionId]`.
- PostgreSQL + Prisma cho prompt, session, turn, player, report, admin và rate limit.
- API routes cho game, admin, import/export, report và health.
- Owner/admin cookie, CSP proxy, Docker và staging container workflow.

### Phần domain giữ lại

- Player validation 2-10 người và chống trùng tên.
- Round robin và balanced random.
- Scoring Truth +1, Dare +2.
- Age, difficulty, taxonomy và deny-by-default safety filters.
- Used-prompt tracking và safe pool reset.
- Chuẩn hóa Unicode NFC và duplicate detection.

### Audit UI hiện tại

- Brand tokens: nền tối, Truth xanh, Dare hồng, accent tím; Inter; radius 12-24px; glassmorphism và glow.
- Information architecture: landing, setup, dynamic gameplay/result, guide, safety, privacy, admin.
- Điểm giữ lại: game loop trực tiếp, lựa chọn Truth/Dare rõ, quyền đổi/bỏ lượt, nội dung tiếng Việt.
- Điểm loại bỏ: centered hero nhiều emoji, AI-purple gradient/glow, ba feature card bằng nhau, animation lặp, dynamic routes và copy phóng đại về số lượng nội dung.
- Design read: game tụ họp mobile-first, vui và trực tiếp nhưng không trẻ con; native CSS, không thêm design-system dependency.
- Dials: `DESIGN_VARIANCE=6`, `MOTION_INTENSITY=3`, `VISUAL_DENSITY=4`.
- Theme: tự động sáng/tối theo hệ điều hành; semantic Truth/Dare được giữ, hành động chính dùng một accent cam san hô nhất quán.
- Shape rule: card/dialog 16px, control 12px; không dùng pill như container mặc định.

## Milestones

| Milestone | Status | Evidence |
|---|---|---|
| Baseline và repository audit | Completed | Kết quả ở trên; đã đọc routes, data, game engine, tests, workflows và tài liệu vận hành. |
| Static content 70/70 | Completed | 70 Truth + 70 Dare; difficulty đúng 35 mỗi mức; exact/near duplicate, invalid metadata/flags, blocker/warning đều bằng 0. |
| Pure client game engine | Completed | Pure TypeScript, không import Prisma; validation, round robin, balanced random, filters, score, replace, pool reset và result đã có unit test. |
| localStorage và hidden prompts | Completed | State schema v1 được Zod validate; dữ liệu hỏng/version sai được reset; resume, delete và hidden prompt dùng hai key riêng. |
| Static UI + accessibility | Completed | Landing/setup/game/result chạy trong `/play`; giao diện mobile-first, auto light/dark, focus-visible, semantic control và reduced motion. |
| Remove backend/runtime | Completed | Đã bỏ Prisma/PostgreSQL, API/admin/auth, Docker, server middleware, migrations, staging backend và dependency tương ứng; static build chỉ còn sáu route tĩnh. |
| Static tests/CI/Pages | Completed | CI và Pages workflow không còn service backend; Playwright trên `/truth-or-dare/` đạt 5 pass + 1 skip có chủ đích, không API/404/console error và không overflow ở năm viewport. |
| Local verification | Completed | Frozen install, content audit, lint, typecheck, 19 unit tests, local build, Pages build, 5 static E2E pass + 1 skip, dependency audit và HTTP smoke cho mọi route/asset đều đạt. |
| GitHub push/deploy | Pending | Chưa commit hoặc push. |
