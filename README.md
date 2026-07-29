# TRUTH OR DARE - THẬT HAY THÁCH (VIETNAM)

Ứng dụng web game **"Thật Hay Thách"** (Truth or Dare) bằng tiếng Việt dành cho nhóm từ 2–10 người chơi trên cùng một thiết bị.

---

## 🚀 TÍNH NĂNG NỔI BẬT

- **Trải nghiệm mượt mà:** Giao diện Tiếng Việt thân thiện, tối ưu mobile-first, chơi ngay trong 60 giây không cần tạo tài khoản.
- **Tùy chỉnh nhóm & bộ lọc:** Hỗ trợ 2–10 người chơi với tên tùy chỉnh, sắp xếp thứ tự hoặc xáo trộn ngẫu nhiên. Lọc theo độ tuổi (13+, 16+, 18+), độ khó (Dễ, Vừa, Táo bạo, Khó), nhóm người (Bạn bè, Gia đình, Đồng nghiệp, Cặp đôi).
- **Tránh lặp câu hỏi:** Thuật toán ngẫu nhiên có trọng số (Weighted Random Selection) kết hợp kiểm tra lịch sử phiên chơi.
- **An toàn tuyệt đối:** Tiêu chuẩn an toàn mặc định, cấm các hành vi nguy hiểm, bạo lực hay vi phạm pháp luật; tích hợp quyền đổi câu và bỏ lượt.
- **Trang Quản trị Admin:** Tìm kiếm, xem trước mobile, duyệt, sửa, import/export CSV/JSON và xử lý báo cáo câu hỏi.

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG (STACK)

- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS (Glassmorphism design, vibrant dark mode)
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Validation:** Zod
- **Testing:** Vitest (Unit/Integration) & Playwright (E2E)
- **Linter & Formatter:** ESLint + Prettier
- **Containerization:** Docker Compose cho PostgreSQL local

---

## 💻 HƯỚNG DẪN CHẠY LOCAL DEV

### 1. Cài đặt Dependencies

```bash
npx pnpm install
# hoặc npm install
```

### 2. Cấu hình Môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

### 3. Khởi tạo Database PostgreSQL

Nếu dùng Docker Compose:
```bash
docker compose up -d
```

Chạy migration và seed dữ liệu mẫu:
```bash
npx pnpm db:push
npx pnpm db:seed
```

### 4. Khởi chạy Ứng dụng

```bash
npx pnpm dev
# Trình duyệt mở: http://localhost:3000
```

---

## 🧪 KIỂM THỬ (TESTING)

```bash
# Linting
npx pnpm lint

# Typecheck TypeScript
npx pnpm typecheck

# Chạy Unit & Integration Tests
npx pnpm test

# Chạy End-to-End Tests (Playwright)
npx pnpm test:e2e
```

---

## 📦 BUILD PRODUCTION

```bash
npx pnpm build
npx pnpm start
```

---
