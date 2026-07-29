import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Luật chơi" };

export default function GuidePage() {
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">Luật chơi</h1>
      <p className="page-lede">Một thiết bị được chuyền quanh nhóm. Mỗi người chọn Thật hoặc Thách khi tới lượt.</p>
      <div className="panel">
        <section><h2>Chuẩn bị</h2><p>Nhập 2-10 tên người chơi, chọn số vòng, cách chọn lượt và bộ lọc phù hợp với cả nhóm.</p></section>
        <section><h2>Trong mỗi lượt</h2><ol><li>Người đang được gọi chọn Thật hoặc Thách.</li><li>Đọc câu trên màn hình và quyết định hoàn thành, đổi câu hoặc bỏ lượt.</li><li>Hoàn thành Thật được 1 điểm, hoàn thành Thách được 2 điểm.</li></ol></section>
        <section><h2>Quyền từ chối</h2><p>Bất kỳ người chơi nào cũng có thể đổi câu hoặc bỏ lượt. Không ép buộc, chế giễu hoặc tự ý bật quyền bổ sung thay người khác.</p></section>
        <section><h2>Khi hết câu</h2><p>Ứng dụng có thể dùng lại các câu phù hợp đã xuất hiện. Bộ lọc tuổi và an toàn không bao giờ được tự động nới.</p></section>
        <section><Link href="/play" prefetch={false} className="button button-primary">Thiết lập ván chơi</Link></section>
      </div>
    </article>
  );
}
