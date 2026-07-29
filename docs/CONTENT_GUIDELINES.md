# Content guidelines

## Contract dữ liệu

- `src/data/prompts.truth.vi.json`: đúng 70 câu Truth.
- `src/data/prompts.dare.vi.json`: đúng 70 câu Dare.
- Truth: EASY 18, MEDIUM 18, BOLD 17, HARD 17.
- Dare: EASY 17, MEDIUM 17, BOLD 18, HARD 18.
- Mỗi câu phải khớp strict schema trong `src/features/prompts/schemas/promptSchema.ts`.

ID có dạng `truth-easy-001` hoặc `dare-hard-018`, là duy nhất và không đổi sau khi phát hành. Text phải là Unicode NFC, tiếng Việt tự nhiên, không placeholder và không hậu tố sinh giả.

## Truth

Truth cần rõ nghĩa, phù hợp tuổi, audience, category và difficulty. Không yêu cầu mật khẩu, địa chỉ, tài chính, định danh, thông tin tình dục, trauma, hành vi phạm pháp, bí mật gây hại hoặc dữ liệu riêng của người khác. Câu hỏi không được phân biệt giới, nghề nghiệp, vùng miền, ngoại hình hay hoàn cảnh.

## Dare

Dare phải là hành động cụ thể, an toàn và hoàn thành được trong khoảng 10 giây đến 2 phút. Không dùng chất kích thích, tự gây đau, nín thở, hành vi nguy hiểm, phá đồ, truy cập dữ liệu riêng, quấy rối, nội dung tình dục, làm nhục hoặc tiếp xúc cơ thể thiếu đồng thuận. HARD khó vì sáng tạo, biểu diễn, phối hợp, trí nhớ hoặc kiên trì, không phải vì rủi ro.

Đánh dấu chính xác mọi yêu cầu về đạo cụ, điện thoại, Internet, vận động, tiếp xúc, người chơi khác, riêng tư và nhạy cảm. Selector luôn deny by default nếu nhóm chưa bật quyền tương ứng.

## Quy trình review

1. Đọc câu trong ngữ cảnh category, audience, age và difficulty.
2. Soát exact duplicate và near duplicate theo normalization hiện tại.
3. Kiểm tra safety flag bằng ý nghĩa thực tế, không chỉ từ khóa.
4. Chạy `pnpm content:audit`.
5. Đọc lại `reports/prompt-audit.md` và chạy `pnpm test`.

Audit thất bại nếu số lượng, phân bố hoặc bất kỳ assertion bắt buộc nào sai. Không nới ngưỡng near duplicate hoặc sửa difficulty chỉ để làm báo cáo xanh.
