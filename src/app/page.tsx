import React from "react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center max-w-4xl mx-auto">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-card text-xs font-semibold text-brand-accent mb-6 border border-brand-accent/30 animate-pulse-glow">
        ✨ Trò chơi tiệc tùng & nhóm bạn hàng đầu Việt Nam
      </div>

      {/* Hero Title */}
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-truth-500 via-teal-300 to-emerald-400">
          THẬT
        </span>{" "}
        HAY{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-dare-500 via-rose-400 to-pink-500">
          THÁCH
        </span>
      </h1>

      {/* Hero Subtitle */}
      <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl leading-relaxed">
        Phá tan sự ngại ngùng, gắn kết nhóm bạn từ 2–10 người với kho câu hỏi Thật Hay Thách đa dạng, vui nhộn và an toàn 100%. Không cần tải app!
      </p>

      {/* Call to action */}
      <div className="flex flex-col sm:flex-row gap-4 mb-14 w-full sm:w-auto">
        <a
          href="/play"
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-truth-600 to-dare-600 hover:from-truth-500 hover:to-dare-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 active:translate-y-0"
        >
          🚀 BẮT ĐẦU CHƠI NGAY
        </a>
        <a
          href="/guide"
          className="px-8 py-4 rounded-xl glass-card text-slate-200 hover:text-white font-semibold text-lg hover:bg-white/10 transition border border-white/10"
        >
          📖 Xem Quy Tắc Chơi
        </a>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-truth-500/40 transition">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-bold text-white mb-2">Bắt Đầu Nhanh</h3>
          <p className="text-sm text-slate-400">
            Nhập tên người chơi và bắt đầu ngay trong 60 giây mà không cần tạo tài khoản hay đăng nhập.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-brand-accent/40 transition">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-bold text-white mb-2">Kho Câu Hỏi Lớn</h3>
          <p className="text-sm text-slate-400">
            Hàng ngàn câu hỏi tiếng Việt được biên tập kỹ lưỡng, phân loại theo độ khó, độ tuổi và chủ đề.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 hover:border-dare-500/40 transition">
          <div className="text-3xl mb-3">🛡️</div>
          <h3 className="text-lg font-bold text-white mb-2">An Toàn & Lịch Sự</h3>
          <p className="text-sm text-slate-400">
            Mặc định an toàn 13+, không bạo lực, tình dục hay cưỡng ép. Mọi người chơi có quyền đổi câu dễ dàng.
          </p>
        </div>
      </div>
    </div>
  );
}
