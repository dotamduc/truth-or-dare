import React from "react";

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 w-full flex-1">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-3xl font-extrabold text-white mb-6 border-b border-white/10 pb-4">
          📖 Hướng Dẫn & Luật Chơi Thật Hay Thách
        </h1>

        <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-truth-400 mb-2">1. Giới thiệu trò chơi</h2>
            <p>
              <strong>Thật Hay Thách (Truth or Dare)</strong> là trò chơi tiệc tùng truyền thống giúp nhóm bạn hiểu nhau hơn, giải tỏa căng thẳng và tạo ra những kỷ niệm vui vẻ. Website được thiết kế tối ưu cho nhóm từ 2 đến 10 người chơi trực tiếp trên cùng một điện thoại hoặc máy tính.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-truth-400 mb-2">2. Quy trình chơi 3 bước đơn giản</h2>
            <ol className="list-decimal list-inside space-y-2 pl-2">
              <li>
                <strong>Bước 1 - Nhập danh sách:</strong> Vào trang <em>Chơi Ngay</em>, nhập tên 2-10 người tham gia và chọn bộ lọc độ tuổi/mức độ phù hợp.
              </li>
              <li>
                <strong>Bước 2 - Lần lượt chọn:</strong> Đến lượt ai, người đó chọn nhận một câu <strong>THẬT</strong> (trả lời thành thật) hoặc thử thách <strong>THÁCH</strong> (thực hiện hành động).
              </li>
              <li>
                <strong>Bước 3 - Ghi nhận & Chuyển lượt:</strong> Sau khi hoàn thành, nhấn <em>Dã Hoàn Thành</em> để tích điểm và chuyển sang người tiếp theo!
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold text-truth-400 mb-2">3. Tính điểm & Quyền từ chối</h2>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>Trở lời câu hỏi <strong>THẬT</strong> thành công: <strong>+1 điểm</strong>.</li>
              <li>Thực hiện thử thách <strong>THÁCH</strong> thành công: <strong>+2 điểm</strong>.</li>
              <li>
                Nếu cảm thấy câu hỏi không phù hợp, người chơi có thể nhấn <strong>Đổi Câu Khác</strong> hoặc <strong>Bỏ Lượt</strong> mà không bị phạt nặng.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-dare-400 mb-2">4. Nguyên tắc tôn trọng trong khi chơi</h2>
            <p>
              Mọi thành viên đều tham gia trên tinh thần tự nguyện, vui vẻ và tôn trọng lẫn nhau. Không ép buộc tiết lộ thông tin cá nhân nhạy cảm hoặc thực hiện các hành động nguy hiểm.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
          <a
            href="/play"
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-truth-600 to-dare-600 font-bold text-white shadow-lg hover:opacity-90 transition"
          >
            🚀 BẮT ĐẦU CHƠI NGAY
          </a>
        </div>
      </div>
    </div>
  );
}
