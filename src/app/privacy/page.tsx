import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quyền riêng tư" };

export default function PrivacyPage() {
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">Dữ liệu ở lại thiết bị.</h1>
      <p className="page-lede">Website không có backend, tài khoản, cookie phiên hoặc cơ sở dữ liệu người chơi.</p>
      <div className="panel">
        <section><h2>Dữ liệu được lưu</h2><p>Tên hiển thị, điểm, cấu hình ván, câu đã dùng và câu đã ẩn được lưu trong localStorage của trình duyệt để hỗ trợ tiếp tục sau khi refresh.</p></section>
        <section><h2>Dữ liệu không được lưu</h2><p>Ứng dụng không ghi âm, ghi hình hoặc lưu câu trả lời của người chơi. Không có dữ liệu được đồng bộ giữa các thiết bị.</p></section>
        <section><h2>Cách xóa</h2><p>Dùng nút “Xóa ván đã lưu” và “Khôi phục câu đã ẩn” trong trang chơi, hoặc xóa dữ liệu website trong cài đặt trình duyệt.</p></section>
        <section><h2>Nội dung public</h2><p>Toàn bộ 595 câu đã nhập nằm trong static JavaScript bundle và có thể được xem bởi bất kỳ ai tải website.</p></section>
      </div>
    </article>
  );
}
