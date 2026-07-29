# Static deployment

## Kiến trúc deploy

Ứng dụng dùng Next.js static export và GitHub Pages. Production không chạy Node.js, API, database hoặc secret. Workflow chỉ tạo các file HTML, CSS, JavaScript và asset trong `out/`, sau đó upload Pages artifact.

URL production:

```text
https://dotamduc.github.io/truth-or-dare/
```

`next.config.mjs` đặt `basePath` thành `/truth-or-dare` khi `GITHUB_PAGES=true`. Không đặt `assetPrefix` vì Next.js đã sinh đường dẫn asset đúng từ `basePath` và việc dùng cả hai dễ tạo đường dẫn lặp.

## Kiểm tra local

```bash
pnpm install --frozen-lockfile
pnpm content:audit
pnpm lint
pnpm typecheck
pnpm test
pnpm build:pages
pnpm audit --prod
pnpm exec playwright install chromium
pnpm test:e2e:pages
```

E2E phục vụ bản sao nguyên trạng của `out/` dưới `.pages-preview/truth-or-dare/`. Cách này mô phỏng base path production và phát hiện asset 404, request `/api` hoặc lỗi console.

## GitHub Actions

- `ci.yml` chạy toàn bộ quality gate và Playwright trên static output.
- `pages.yml` build, xác minh `out/index.html`, upload artifact và deploy vào environment `github-pages`.
- Workflow dùng official GitHub Pages actions và không có PostgreSQL service, Prisma generate hoặc migration.

Repository phải đặt Pages source thành `GitHub Actions` tại `Settings > Pages > Build and deployment`. Nếu workflow không có quyền tạo deployment, chủ repository cần bật source này rồi chạy lại `Deploy GitHub Pages`.

## Xác minh sau deploy

1. Chờ cả workflow CI và Deploy GitHub Pages hoàn tất thành công.
2. Lấy URL từ output của job deploy.
3. Xác minh response HTTP 200.
4. Chạy production smoke cho landing, game hai người, Truth, Dare, complete, skip, replace, refresh/resume, result, replay và mobile.
5. Xác minh không có request `/api`, asset 404 hoặc console error nghiêm trọng.

Không commit `out/`, `.next/`, `.pages-preview/`, Playwright report hoặc test result.
