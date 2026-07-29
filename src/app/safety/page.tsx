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
        <section><h2>Nội dung bị loại trừ</h2><ul><li>Tự gây hại, gây đau, nín thở hoặc vận động nguy hiểm.</li><li>Rượu bia, chất kích thích, cởi đồ hoặc nội dung tình dục.</li><li>Mật khẩu, tin nhắn riêng, địa chỉ, tài chính hoặc dữ liệu định danh.</li><li>Quấy rối người lạ, gọi số khẩn cấp, phá đồ hoặc đăng nội dung gây hiểu nhầm.</li></ul></section>
      </div>
    </article>
  );
}
