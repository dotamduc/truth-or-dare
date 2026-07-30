# Local storage

Ứng dụng không gửi state đến máy chủ. Hai key được dùng:

```text
truth-or-dare:game:v2
truth-or-dare:hidden-prompts:v2
```

## Game state

`truth-or-dare:game:v2` lưu schema version, người chơi và điểm, lượt/vòng hiện tại, tổng vòng, selection mode, filters, prompt đã dùng, prompt hiện tại, trạng thái game và timestamp.

State được serialize và validate bằng strict Zod schema. JSON hỏng, field thừa, dữ liệu ngoài giới hạn hoặc schema version không tương thích bị từ chối và key cũ được xóa an toàn. Module persistence chỉ truy cập `window.localStorage` trong browser; client component đọc lần đầu trong effect.

Người dùng có thể tiếp tục ván sau refresh hoặc chọn `Xóa ván đã lưu`. Khi tạo game mới, state cũ bị xóa khỏi thiết bị.

## Hidden prompts

`truth-or-dare:hidden-prompts:v2` chỉ chứa danh sách prompt ID hợp lệ. Nút `Ẩn câu này trên thiết bị` thêm ID hiện tại và chọn câu thay thế mà không nới safety filter. Người dùng có thể khôi phục toàn bộ câu đã ẩn từ màn hình setup.

Các key `v1` được xóa khi ứng dụng đọc dữ liệu lần đầu. Việc reset này ngăn ván cũ hoặc danh sách ID cũ trỏ nhầm sang nội dung mới sau khi thay toàn bộ database bằng `question.txt`.

## Riêng tư và giới hạn

- Không lưu token, mật khẩu, secret hoặc dữ liệu định danh.
- Dữ liệu không đồng bộ giữa browser profile hoặc thiết bị.
- Chế độ riêng tư, quota hoặc chính sách browser có thể làm ghi localStorage thất bại; game hiện tại vẫn chạy trong bộ nhớ.
- Xóa site data sẽ xóa ván đã lưu và danh sách câu đã ẩn.
