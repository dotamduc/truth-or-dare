import Link from "next/link";
import { LandingResume } from "@/features/game/components/LandingResume";

export default function HomePage() {
  return (
    <>
      <section className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">140 câu đã được kiểm tra</p>
          <h1>Một thiết bị. Cả nhóm cùng chơi.</h1>
          <p className="hero-lede">Chọn Thật hoặc Thách, chuyền máy và giữ mọi niềm vui ngay trong trình duyệt.</p>
          <div className="hero-actions">
            <Link href="/play" prefetch={false} className="button button-primary">Bắt đầu chơi</Link>
            <Link href="/guide" prefetch={false} className="button button-secondary">Xem luật chơi</Link>
          </div>
          <LandingResume />
        </div>
        <div className="prompt-preview" aria-label="Xem trước câu hỏi trong trò chơi">
          <article className="preview-card preview-truth">
            <span>THẬT</span>
            <p>Thói quen nhỏ nào khiến bạn cảm thấy vui hơn mỗi ngày?</p>
          </article>
          <article className="preview-card preview-dare">
            <span>THÁCH</span>
            <p>Tạo một khẩu hiệu vui dành riêng cho nhóm trong 30 giây.</p>
          </article>
        </div>
      </section>

      <section className="shell proof-strip" aria-label="Thông tin chính">
        <div><strong>70</strong><span>câu Thật</span></div>
        <div><strong>70</strong><span>câu Thách</span></div>
        <div><strong>2-10</strong><span>người chơi</span></div>
        <div><strong>0</strong><span>tài khoản cần tạo</span></div>
      </section>

      <section className="shell local-story">
        <div>
          <h2>Không có máy chủ đứng giữa cuộc vui.</h2>
          <p>Ván chơi, điểm số và danh sách câu đã ẩn chỉ nằm trên thiết bị này. Refresh vẫn tiếp tục được.</p>
        </div>
        <ul>
          <li>Bộ lọc tuổi, độ khó và đối tượng</li>
          <li>Round robin hoặc ngẫu nhiên cân bằng</li>
          <li>Không lặp câu khi pool còn nội dung</li>
          <li>Ẩn câu không phù hợp trên thiết bị</li>
        </ul>
      </section>
    </>
  );
}
