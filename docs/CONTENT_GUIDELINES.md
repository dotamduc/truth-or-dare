# Content guidelines

## Contract dữ liệu

- `src/data/prompts.truth.vi.json`: 337 câu Truth.
- `src/data/prompts.dare.vi.json`: 258 câu Dare.
- `src/data/prompts.import-manifest.json`: SHA-256 của file nguồn và chuỗi nội dung đã parse, số lượng, phân bố difficulty và 18 nhóm của `question.txt`.
- Mỗi câu phải khớp strict schema trong `src/features/prompts/schemas/promptSchema.ts`.

ID có dạng `truth-easy-001` hoặc `dare-hard-018`, là duy nhất và không đổi sau khi phát hành. Text phải là Unicode NFC, tiếng Việt tự nhiên, không placeholder và không hậu tố sinh giả.

## Truth

Truth cần được gắn đúng age, audience, category, difficulty, `isPrivate` và `isSensitive`. Vì yêu cầu nhập đủ nguồn, các câu nhạy cảm hoặc riêng tư không bị tự động xóa; selector phải chặn chúng mặc định cho đến khi nhóm chủ động bật quyền tương ứng.

## Dare

Dare phải được gắn đầy đủ yêu cầu về đạo cụ, điện thoại, Internet, vận động, tiếp xúc, người chơi khác, riêng tư và nhạy cảm. Một số thử thách trong nguồn có thể không an toàn trong hoàn cảnh thực tế; người chơi luôn phải đổi câu hoặc bỏ lượt thay vì thực hiện hành động nguy hiểm, xâm phạm riêng tư hay thiếu đồng thuận.

Đánh dấu chính xác mọi yêu cầu về đạo cụ, điện thoại, Internet, vận động, tiếp xúc, người chơi khác, riêng tư và nhạy cảm. Selector luôn deny by default nếu nhóm chưa bật quyền tương ứng.

## Quy trình review

1. Đọc câu trong ngữ cảnh category, audience, age và difficulty.
2. Soát exact duplicate và near duplicate theo normalization hiện tại. Các duplicate vốn có trong nguồn được giữ nguyên và ghi warning.
3. Kiểm tra safety flag bằng ý nghĩa thực tế, không chỉ từ khóa.
4. Chạy `pnpm content:audit`.
5. Đọc lại `reports/prompt-audit.md` và chạy `pnpm test`.

Audit thất bại nếu số lượng, phân bố, schema hoặc safety flag bắt buộc sai. Warning về duplicate và định dạng nguồn không làm mất nội dung. Không sửa câu chữ chỉ để làm báo cáo xanh.
