import React from "react";

export default function SafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 w-full flex-1">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-3">
          <span>🛡️</span> Quy Tắc An Toàn & Chính Sách Nội Dung
        </h1>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <h2 className="text-base font-bold text-emerald-400 mb-1">
               An Toàn & Sự Thoải Mái Là Ưu Tiên Hàng Đầu
            </h2>
            <p className="text-xs text-slate-300">
              Trò chơi được xây dựng với mục tiêu mang lại niềm vui lành mạnh. Hệ thống chủ động loại bỏ mọi nội dung độc hại, bạo lực, vi phạm pháp luật hay cưỡng ép.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Những nội dung BỊ CẤM HOÀN TOÀN</h2>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-rose-300">
              <li>Hành vi tự gây hại hoặc khuyến khích tự gây hại.</li>
              <li>Hành vi bạo lực, nguy hiểm có nguy cơ gây thương tích.</li>
              <li>Nội dung tình dục tường minh hoặc cưỡng ép đụng chạm thân thể.</li>
              <li>Sử dụng chất kích thích, uồng rượu quá độ hay hành vi bất hợp pháp.</li>
              <li>Yêu cầu tiết lộ thông tin tài chính, mật khẩu hay dữ liệu cá nhân nhạy cảm.</li>
              <li>Xúc phạm, làm nhục, quấy rối người khác hay phân biệt đối xử.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Quyền từ chối của người chơi</h2>
            <p>
              Mọi người chơi luôn có <strong>Quyền Từ Chối</strong> thực hiện bất kỳ câu hỏi hoặc thử thách nào nếu cảm thấy không thoải mái hay không phù hợp với bản thân. Cả nhóm tuyệt đối không được ép buộc hay giễu cợt người từ chối.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Tính năng Báo Cáo Nội Dung</h2>
            <p>
              Nếu phát hiện bất kỳ câu hỏi nào bị lỗi, có yếu tố nhạy cảm không phù hợp hoặc vi phạm an toàn, người chơi có thể nhấn biểu tượng lá cờ 🚩 trên thẻ câu hỏi để gửi báo cáo trực tiếp tới Ban Quản Trị để gỡ bỏ.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
