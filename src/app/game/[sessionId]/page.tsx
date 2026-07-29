"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import confetti from "canvas-confetti";

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [currentPlayer, setCurrentPlayer] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("INAPPROPRIATE");
  const [reportComment, setReportComment] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/game-sessions/${publicId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi tải thông tin phòng chơi.");

      setSession(json.data.session);
      setCurrentPlayer(json.data.currentPlayer);
      setCurrentTurn(json.data.currentTurn);
      setLoading(false);

      if (json.data.session.status === "COMPLETED") {
        router.push(`/result/${publicId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  }, [publicId, router]);

  useEffect(() => {
    if (publicId) {
      fetchSession();
    }
  }, [publicId, fetchSession]);

  const handleSelectType = async (type: "TRUTH" | "DARE") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/game-sessions/${publicId}/turns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi chọn câu hỏi.");

      setCurrentTurn(json.data.turn);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleUpdateTurn = async (outcome: "COMPLETED" | "SKIPPED" | "REFUSED") => {
    if (!currentTurn) return;
    setLoading(true);

    if (outcome === "COMPLETED") {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }

    try {
      const res = await fetch(`/api/game-sessions/${publicId}/turns/${currentTurn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi cập nhật lượt.");

      if (json.data.session.status === "COMPLETED") {
        router.push(`/result/${publicId}`);
      } else {
        await fetchSession();
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleReplaceTurn = async () => {
    if (!currentTurn) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/game-sessions/${publicId}/turns/${currentTurn.id}/replace`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Không thể đổi câu hỏi.");

      setCurrentTurn(json.data.turn);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!confirm("Bạn có chắc chắn muốn kết thúc trò chơi và xem kết quả ngay?")) return;
    try {
      await fetch(`/api/game-sessions/${publicId}/end`, { method: "POST" });
      router.push(`/result/${publicId}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTurn?.promptId) return;

    try {
      await fetch(`/api/prompts/${currentTurn.promptId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session?.id,
          reason: reportReason,
          comment: reportComment,
        }),
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
      }, 1500);
    } catch (err) {
      console.error("Report failed:", err);
    }
  };

  if (loading && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-slate-400 font-medium">Đang tải phòng chơi...</p>
      </div>
    );
  }

  if (errorMsg && !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p className="text-rose-400 text-sm mb-6">{errorMsg}</p>
        <a href="/play" className="px-6 py-3 bg-brand-accent text-white font-bold rounded-xl">
          Quay Về Trang Tạo Phòng
        </a>
      </div>
    );
  }

  const difficultyLabels: Record<string, string> = {
    EASY: "Nhẹ nhàng",
    MEDIUM: "Vui nhộn",
    BOLD: "Táo bạo",
    HARD: "Thử thách khó",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 w-full flex-1 flex flex-col justify-between">
      {/* Header bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-accent/30 text-brand-accent">
            VÒNG {session?.currentRound} {session?.targetRounds ? `/ ${session?.targetRounds}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEndGame}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white font-semibold transition"
          >
            🏁 Kết Thúc
          </button>
        </div>
      </div>

      {/* Active Player Banner */}
      <div className="text-center mb-6">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
          Lượt Chơi Của
        </span>
        <h2 className="text-3xl font-extrabold text-white tracking-tight animate-float">
          👉 {currentPlayer?.displayName}
        </h2>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* State 1: Choose Truth or Dare */}
      {!currentTurn && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-auto py-6">
          <button
            onClick={() => handleSelectType("TRUTH")}
            disabled={loading}
            className="glass-panel p-8 rounded-3xl border border-truth-500/30 hover:border-truth-500 flex flex-col items-center justify-center gap-4 glow-truth hover:scale-105 transition transform active:scale-95 group"
          >
            <span className="text-5xl group-hover:scale-110 transition">💬</span>
            <span className="text-3xl font-extrabold text-truth-500">THẬT</span>
            <span className="text-xs text-slate-400">Trả lời câu hỏi thành thật (+1đ)</span>
          </button>

          <button
            onClick={() => handleSelectType("DARE")}
            disabled={loading}
            className="glass-panel p-8 rounded-3xl border border-dare-500/30 hover:border-dare-500 flex flex-col items-center justify-center gap-4 glow-dare hover:scale-105 transition transform active:scale-95 group"
          >
            <span className="text-5xl group-hover:scale-110 transition">🔥</span>
            <span className="text-3xl font-extrabold text-dare-500">THÁCH</span>
            <span className="text-xs text-slate-400">Thực hiện thử thách (+2đ)</span>
          </button>
        </div>
      )}

      {/* State 2: Display Prompt Card */}
      {currentTurn && currentTurn.prompt && (
        <div className="my-auto flex flex-col items-center">
          <div
            className={`w-full glass-panel p-6 sm:p-8 rounded-3xl border transition-all animate-card-flip mb-6 text-center relative ${
              currentTurn.requestedType === "TRUTH"
                ? "border-truth-500/40 glow-truth"
                : "border-dare-500/40 glow-dare"
            }`}
          >
            {/* Badges */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span
                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                  currentTurn.requestedType === "TRUTH"
                    ? "bg-truth-500/20 text-truth-400 border border-truth-500/40"
                    : "bg-dare-500/20 text-dare-400 border border-dare-500/40"
                }`}
              >
                {currentTurn.requestedType === "TRUTH" ? "THẬT 💬" : "THÁCH 🔥"}
              </span>

              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                {difficultyLabels[currentTurn.prompt.difficulty] || currentTurn.prompt.difficulty}
              </span>
            </div>

            {/* Prompt Text */}
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-6">
              &ldquo;{currentTurn.prompt.text}&rdquo;
            </h3>

            {/* Flags */}
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-400">
              {currentTurn.prompt.requiresProps && <span>🎒 Cần đạo cụ</span>}
              {currentTurn.prompt.requiresPhone && <span>📱 Cần điện thoại</span>}
              {currentTurn.prompt.requiresMovement && <span>🏃 Vận động</span>}
              {currentTurn.prompt.requiresAnotherPlayer && <span>👥 Cần người hỗ trợ</span>}
            </div>

            {/* Report icon */}
            <button
              onClick={() => setShowReportModal(true)}
              className="absolute top-4 right-4 text-xs text-slate-500 hover:text-slate-300"
              title="Báo cáo câu hỏi"
            >
              🚩
            </button>
          </div>

          {/* Action buttons */}
          <div className="w-full space-y-3">
            <button
              onClick={() => handleUpdateTurn("COMPLETED")}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-truth-600 to-emerald-500 hover:from-truth-500 hover:to-emerald-400 text-white font-extrabold text-lg shadow-lg hover:shadow-xl transition transform active:scale-95"
            >
              ✅ DÃ HOÀN THÀNH (+{currentTurn.requestedType === "TRUTH" ? "1" : "2"}Đ)
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReplaceTurn}
                disabled={loading}
                className="py-3 rounded-xl glass-card text-slate-300 hover:text-white font-semibold text-sm hover:bg-white/10 transition border border-white/10"
              >
                🔄 Đổi Câu Khác
              </button>
              <button
                onClick={() => handleUpdateTurn("SKIPPED")}
                disabled={loading}
                className="py-3 rounded-xl glass-card text-slate-400 hover:text-rose-400 font-semibold text-sm hover:bg-white/10 transition border border-white/10"
              >
                ⏭️ Bỏ Lượt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">🚩 Báo cáo câu hỏi này</h3>
            <p className="text-xs text-slate-400 mb-4">
              Giúp chúng tôi giữ nội dung vui tươi, an toàn và phù hợp
            </p>

            {reportSubmitted ? (
              <div className="text-center py-4 text-emerald-400 font-bold">
                ✓ Cảm ơn bạn đã gửi báo cáo!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Lý do:</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-card text-white text-xs bg-slate-900 border border-white/10"
                  >
                    <option value="INAPPROPRIATE">Không phù hợp bối cảnh</option>
                    <option value="DANGEROUS">Có nguy cơ nguy hiểm</option>
                    <option value="OFFENSIVE">Xúc phạm / Làm nhục</option>
                    <option value="AGE_MISMATCH">Sai phân loại độ tuổi</option>
                    <option value="DUPLICATE">Bị trùng lặp</option>
                    <option value="TYPO">Lỗi chính tả / Khó hiểu</option>
                    <option value="OTHER">Lý do khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ghi chú thêm (tùy chọn):</label>
                  <textarea
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Mô tả chi tiết..."
                    rows={2}
                    className="w-full p-2.5 rounded-xl glass-card text-white text-xs border border-white/10"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 rounded-xl glass-card text-slate-400 text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500"
                  >
                    Gửi Báo Cáo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
