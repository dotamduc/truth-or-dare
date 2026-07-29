import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 w-full flex-1">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
          <span>🔒</span> Chính Sách Quyền Riêng Tư & Dữ Liệu
        </h1>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Cam kết không thu thập dữ liệu cá nhân</h2>
            <p>
              Website <strong>Thật Hay Thách</strong> tôn trọng tuyệt đối quyền riêng tư của bạn:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 pl-2">
              <li>Không yêu cầu tạo tài khoản, đăng nhập Google/Facebook hay cung cấp email/SĐT khi chơi cơ bản.</li>
              <li>Tên người chơi nhập vào chỉ dùng để hiển thị trong phiên chơi local.</li>
              <li><strong>KHÔNG BAO GIỜ</strong> ghi âm, ghi hình hay lưu trữ câu trả lời của người chơi đối với câu hỏi &quot;Thật&quot;.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Lưu trữ phiên chơi & Cookie</h2>
            <p>
              Chúng tôi sử dụng HTTP-only Cookie tạm thời để giữ trạng thái phòng chơi (ví dụ tránh bị mất dữ liệu khi vô tình refresh trang). Dữ liệu phiên chơi ẩn danh sẽ tự động xóa sạch sau 30 ngày.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Liên hệ & Đề xuất</h2>
            <p>
              Nếu bạn có bất kỳ thắc mắc hoặc đề xuất nào về quyền riêng tư, vui lòng liên hệ với đội ngũ phát triển qua tính năng báo cáo hoặc trang quản trị.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
