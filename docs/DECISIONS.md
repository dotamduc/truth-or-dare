# TÀI LIỆU QUYẾT ĐỊNH KỸ THUẬT (DECISIONS RECORD)

## Dự án: Website Game "TRUTH OR DARE - Thật Hay Thách"

---

### DECISION 001: Kiến trúc Monolith Modular
- **Ngày:** 29/07/2026
- **Bối cảnh:** Cần xây dựng ứng dụng web nhanh, linh hoạt, dễ phát triển và bảo trì.
- **Quyết định:** Sử dụng Monolith Modular với Next.js App Router. Tổ chức theo các miền tính năng (`features/game`, `features/prompts`, `features/reporting`, `features/admin`).
- **Lý do:** Giảm độ phức tạp vận hành so với microservices, tối ưu thời gian phản hồi API và phát triển MVP nhanh chóng.

---

### DECISION 002: Lựa chọn Database và ORM
- **Ngày:** 29/07/2026
- **Bối cảnh:** Dữ liệu có quan hệ chặt chẽ giữa Session, Player, GameTurn, Prompt, Category, Audience và Report; cần truy vấn lọc phức tạp.
- **Quyết định:** Sử dụng **PostgreSQL** cùng với **Prisma ORM**.
- **Lý do:** Khả năng truy vấn quan hệ mạnh mẽ, hỗ trợ JSON column, index hiệu quả và Prisma cung cấp type-safety tuyệt vời cho TypeScript.

---

### DECISION 003: Quản lý phiên chơi (Session Management)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Người chơi cơ bản không cần tạo tài khoản/đăng nhập để chơi game.
- **Quyết định:**
  - Sử dụng `publicId` (CUID/UUID) ngẫu nhiên không đoán được cho mỗi GameSession.
  - Lưu trữ trạng thái Session chính xác phía Server DB (PostgreSQL) để hỗ trợ refresh trang, phân tích và xem lại kết quả.
  - Sử dụng HTTP-only cookie chứa `sessionToken` (hoặc ownership token) để xác nhận quyền thao tác với phiên chơi.
- **Lý do:** Đảm bảo trải nghiệm tức thì (dưới 60s) mà vẫn an toàn và không bị mất dữ liệu khi mất kết nối tạm thời.

---

### DECISION 004: Bảo vệ dữ liệu cá nhân & Riêng tư (Privacy & Data Protection)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Đảm bảo quyền riêng tư người dùng theo nguyên tắc không thu thập dữ liệu không cần thiết.
- **Quyết định:**
  - Không bắt buộc nhập email/SĐT khi chơi game.
  - Không bao giờ lưu trữ câu trả lời chi tiết của người chơi cho câu hỏi "Thật".
  - Tự động dọn dẹp hoặc vô danh hóa các phiên chơi ẩn danh cũ sau 30 ngày.
  - Analytics chỉ ghi nhận sự kiện tương tác (ví dụ: `truth_selected`, `prompt_completed`), KHÔNG ghi nhận tên người chơi hay nội dung tự nhập.

---

### DECISION 005: Tiêu chuẩn An toàn Nội dung Mặc định (Default Safety Standards)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Tránh các rủi ro nguy hiểm, cưỡng ép, độc hại hoặc làm nhục người chơi.
- **Quyết định:**
  - Chế độ mặc định bắt buộc ở `minimumAge: AGE_13_PLUS`, nội dung an toàn.
  - Nội dung 18+ bị khóa mặc định, chỉ mở khi có bước xác nhận tuổi chủ động từ host.
  - Dù ở bất kỳ độ tuổi nào, hệ thống CẤM BẮT BUỘC các hành vi: bạo lực, tự gây hại, tình dục tường minh, uống rượu/chất kích thích, xâm phạm thân thể, phá hoại tài sản hay vi phạm pháp luật.
  - Mọi người chơi luôn có **Quyền Từ Chối** hoặc **Đổi Câu** không bị phạt điểm nặng.

---

### DECISION 006: Thuật toán Chọn Prompt (Weighted Random & Repeat Prevention)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Tránh lặp lại câu hỏi trong cùng một session và ưu tiên câu hỏi chất lượng cao.
- **Quyết định:**
  1. Lọc cứng (Hard Filter): Trạng thái `PUBLISHED`, ngôn ngữ `vi`, thỏa mãn độ tuổi (`minimumAge`), độ khó (`difficulty`), nhóm người chơi (`audiences`), cờ an toàn (`requiresPhysicalContact`, `requiresProps`, v.v.), chưa từng xuất hiện trong session đó.
  2. Xếp hạng mềm (Soft Ranking): Tính trọng số dựa trên `qualityScore`, số lần đã hiển thị (`timesServed` thấp hơn), đa dạng chủ đề và độ khác biệt so với câu trước.
  3. Chọn ngẫu nhiên có trọng số (Weighted Random) trong Top Candidate Pool.
  4. Nới điều kiện an toàn (Safe Fallback) khi pool cạn: Bỏ ưu tiên đa dạng chủ đề -> Cho phép nhắc lại câu đã dùng lâu nhất trong phiên. KHÔNG NÓI NỚI ĐIỀU KIỆN ĐỘ TUỔI VÀ AN TOÀN.

---

### DECISION 007: Quy trình Biên tập & Import Nội dung (Content Pipeline)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Quản lý kho câu hỏi lớn mà không tạo nội dung rác hoặc trùng lặp.
- **Quyết định:**
  - Chuẩn hóa văn bản (`normalizeVietnamesePrompt`) giữ nguyên dấu tiếng Việt, loại khoảng trắng thừa/dấu câu thừa.
  - Kiểm tra trùng lặp 3 tầng: Trùng chính xác (Exact Match), Trùng gần đúng (Near Match), Duyệt thủ công/Semantics.
  - Tính năng Import qua Admin Dashboard phải có bước **Dry-run Preview** (hiển thị số lượng hợp lệ, lỗi, trùng) trước khi Commit vào Database.
  - Xóa mềm (Archive) đối với Prompt đã từng xuất hiện trong các lượt chơi cũ thay vì xóa cứng (Hard Delete).

---

### DECISION 008: Quản trị Admin (Admin Protection)
- **Ngày:** 29/07/2026
- **Bối cảnh:** Bảo vệ trang quản trị nội dung.
- **Quyết định:**
  - Trang `/admin` bắt buộc qua lớp xác thực an toàn (Session auth/JWT HTTP-only cookie + Bcrypt hashed password).
  - Áp dụng Rate Limiting chống brute-force đăng nhập admin.
  - Ghi Log Audit cho các hành động thay đổi trạng thái nội dung (Publish, Archive, Import, Resolve Report).

---

### DECISION 009: Quản lý kết nối Database & Môi trường Dev
- **Ngày:** 29/07/2026
- **Bối cảnh:** Máy dev hiện tại không có Docker CLI, cần có giải pháp kết nối PostgreSQL ổn định cho Prisma và tests.
- **Quyết định:**
  - Sử dụng chuỗi kết nối `DATABASE_URL` tới PostgreSQL (Local PostgreSQL service hoặc Neon/Supabase cloud instance / SQLite fallback nếu phát triển unit test độc lập).
  - Cung cấp `docker-compose.yml` chuẩn sẵn sàng cho môi trường server CI/CD.
---
