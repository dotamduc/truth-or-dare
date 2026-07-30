import type { Metadata } from "next";

export const metadata: Metadata = { title: "An toàn" };

export default function SafetyPage() {
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">Chơi vui, không vượt ranh giới.</h1>
      <p className="page-lede">Sự thoải mái của từng người quan trọng hơn điểm số hoặc nhịp của trò chơi.</p>
      <div className="panel">
        <section><h2>Luôn có quyền dừng</h2><p>Đổi câu hoặc bỏ lượt không cần giải thích. Nếu một hành động gây khó chịu, hãy dừng ngay.</p></section>
        <section><h2>Quyền bổ sung mặc định tắt</h2><p>Đạo cụ, điện thoại, Internet, vận động, tiếp xúc cơ thể, nội dung riêng tư và nhạy cảm chỉ xuất hiện khi được chủ động bật.</p></section>
        <section><h2>Tiếp xúc cần đồng thuận</h2><p>Mỗi người liên quan phải đồng ý trước. Đồng thuận có thể được rút lại bất cứ lúc nào.</p></section>
        <section><h2>Ẩn câu trên thiết bị</h2><p>Nút “Ẩn câu này trên thiết bị” loại câu khỏi những lượt sau trong trình duyệt hiện tại. Không có báo cáo giả gửi tới máy chủ.</p></section>
        <section><h2>Lưu ý về bộ câu hỏi nguồn</h2><p>Bộ câu hỏi được giữ đầy đủ theo file nguồn nên có một số nội dung 16+, 18+, riêng tư hoặc tiềm ẩn rủi ro. Các cờ tương ứng mặc định bị tắt, nhưng bộ lọc tự động không thay thế phán đoán của người chơi.</p><ul><li>Không thực hiện hành động nguy hiểm, gây đau, dùng chất kích thích hoặc phá tài sản.</li><li>Không tiết lộ mật khẩu, tin nhắn riêng, dữ liệu định danh hay thông tin của người khác.</li><li>Không đăng nội dung, liên hệ người lạ hoặc tiếp xúc cơ thể khi chưa có đồng thuận rõ ràng.</li><li>Luôn đổi câu, bỏ lượt hoặc ẩn câu nếu nội dung không phù hợp với nhóm.</li></ul></section>
      </div>
    </article>
  );
}
