# Supabase anonymous reviews

## Mô hình hoạt động

Người dùng không nhìn thấy màn hình đăng nhập. Khi họ gửi đánh giá lần đầu, frontend gọi Supabase Anonymous Sign-In để nhận một user ID và phiên cục bộ. Database tạo tên dạng `ẨnDanh_xxxxxxxx` từ tám ký tự đầu của UUID.

Rating, comment và tên ẩn danh được lưu trên Supabase. RLS dùng `auth.uid()` để bảo đảm mỗi phiên chỉ sửa hoặc xóa đánh giá của chính mình. Mỗi user ID chỉ có một đánh giá cho game, nhưng có thể cập nhật đánh giá đó.

Nếu người dùng xóa dữ liệu website hoặc đổi trình duyệt/thiết bị, Supabase sẽ tạo một user ID khác và họ không còn sửa được đánh giá cũ.

## 1. Bật Anonymous Sign-In

Trong Supabase Dashboard:

1. Mở `Authentication > Providers`.
2. Mở mục `Anonymous Sign-Ins`.
3. Bật `Allow anonymous sign-ins` và lưu.

Không cần bật email/password hoặc OAuth cho chức năng đánh giá này.

## 2. Chạy migration

Mở `SQL Editor > New query`, dán nội dung file:

```text
supabase/migrations/20260804000000_anonymous_reviews.sql
```

Sau đó chọn `Run`. Migration tạo `profiles`, `reviews`, trigger sinh tên ẩn danh, view tổng hợp rating, grants và RLS policies.

Nếu dùng Supabase CLI với project đã link, có thể chạy:

```bash
supabase db push
```

## 3. Cấu hình local

Sao chép `.env.example` thành `.env.local` và điền Project URL cùng Publishable key từ cửa sổ `Connect` của Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Publishable key được phép xuất hiện trong frontend. Không dùng secret key hoặc `service_role` key trong biến `NEXT_PUBLIC_*`.

## 4. Cấu hình Vercel và GitHub Pages

Trong Vercel Project Settings, thêm cho Production và Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://truth-or-dare-drab.vercel.app
```

Trong GitHub `Settings > Secrets and variables > Actions > Variables`, thêm:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://dotamduc.github.io/truth-or-dare
```

Hai workflow đã đọc các repository variables này khi build static output.

## 5. Kiểm tra RLS

Kiểm tra trên hai cửa sổ trình duyệt riêng biệt:

1. Chưa gửi review vẫn xem được danh sách và điểm trung bình.
2. Gửi lần đầu không xuất hiện màn hình đăng nhập và tên có dạng `ẨnDanh_xxxxxxxx`.
3. Gửi lần hai trên cùng trình duyệt cập nhật review cũ, không tạo dòng thứ hai.
4. Trình duyệt A không thể sửa hoặc xóa review của trình duyệt B.
5. Nút xóa chỉ xóa review thuộc phiên hiện tại.
6. Rating ngoài 1–5 và comment từ 1–9 ký tự bị từ chối cả ở frontend lẫn database.

## Chống lạm dụng

Supabase áp dụng rate limit theo IP cho anonymous sign-in, nhưng trước khi có lưu lượng lớn nên tích hợp Cloudflare Turnstile và truyền CAPTCHA token vào `signInAnonymously`. Không bật yêu cầu CAPTCHA trong Dashboard trước khi frontend được bổ sung token, nếu không lần gửi review đầu tiên sẽ thất bại.

Không chạy tác vụ xóa `auth.users` ẩn danh một cách tự động nếu muốn giữ review: foreign key hiện dùng `on delete cascade`, nên xóa anonymous Auth user cũng xóa profile và review tương ứng.
