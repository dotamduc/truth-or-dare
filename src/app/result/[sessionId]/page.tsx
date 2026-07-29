"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import confetti from "canvas-confetti";

export default function SummaryResultPage() {
  const router = useRouter();
  const params = useParams();
  const publicId = params.sessionId as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/game-sessions/${publicId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Lỗi tải kết quả.");

        setSession(json.data.session);
        setLoading(false);

        // Fire celebratory confetti
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (err: any) {
        setErrorMsg(err.message);
        setLoading(false);
      }
    }

    if (publicId) fetchResult();
  }, [publicId]);

  const handlePlayAgainSameGroup = async () => {
    if (!session) return;
    setLoading(true);

    try {
      const playerNames = session.players.map((p: any) => p.displayName);
      const allowedDifficulties = JSON.parse(session.allowedDifficulties || "[]");
      const settings = JSON.parse(session.settings || "{}");

      const res = await fetch("/api/game-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: playerNames,
          selectionMode: session.selectionMode,
          targetRounds: session.targetRounds,
          minimumAge: session.minimumAge,
          allowedDifficulties,
          allowPhysicalContact: settings.allowPhysicalContact,
          allowProps: settings.allowProps,
          allowPhone: settings.allowPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi tạo ván mới.");

      router.push(`/game/${json.data.publicId}`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="animate-spin text-4xl mb-4">🏆</div>
        <p className="text-slate-400 font-medium">Đang tổng hợp kết quả...</p>
      </div>
    );
  }

  if (errorMsg || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-rose-400 mb-4">{errorMsg || "Không tìm thấy dữ liệu kết quả."}</p>
        <a href="/play" className="px-6 py-3 bg-brand-accent text-white font-bold rounded-xl">
          Quay Về Trang Thiết Lập
        </a>
      </div>
    );
  }

  // Sort players by score
  const sortedPlayers = [...session.players].sort((a: any, b: any) => b.score - a.score);

  // Determine Fun Awards
  const mostDaresPlayer = [...session.players].sort((a: any, b: any) => b.completedDares - a.completedDares)[0];
  const mostTruthsPlayer = [...session.players].sort((a: any, b: any) => b.completedTruths - a.completedTruths)[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-4xl mb-2 block">🎉</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            TỔNG KẾT PHIÊN CHƠI
          </h1>
          <p className="text-xs text-slate-400">
            Đã hoàn thành {session.currentRound - 1} vòng chơi tuyệt vời cùng nhau!
          </p>
        </div>

        {/* Fun Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {mostDaresPlayer && mostDaresPlayer.completedDares > 0 && (
            <div className="glass-card p-4 rounded-2xl border border-dare-500/30 flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <span className="text-[10px] font-bold text-dare-400 uppercase tracking-wide block">
                  DŨNG CẢM NHẤT
                </span>
                <span className="text-base font-extrabold text-white">
                  {mostDaresPlayer.displayName}
                </span>
                <span className="text-xs text-slate-400 block">
                  ({mostDaresPlayer.completedDares} thử thách thách)
                </span>
              </div>
            </div>
          )}

          {mostTruthsPlayer && mostTruthsPlayer.completedTruths > 0 && (
            <div className="glass-card p-4 rounded-2xl border border-truth-500/30 flex items-center gap-3">
              <span className="text-3xl">💬</span>
              <div>
                <span className="text-[10px] font-bold text-truth-400 uppercase tracking-wide block">
                  THÀNH THẬT NHẤT
                </span>
                <span className="text-base font-extrabold text-white">
                  {mostTruthsPlayer.displayName}
                </span>
                <span className="text-xs text-slate-400 block">
                  ({mostTruthsPlayer.completedTruths} câu trả lời thật)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            📊 BẢNG ĐIỂM NGƯỜI CHƠI
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player: any, idx: number) => (
              <div
                key={player.id}
                className="glass-card p-4 rounded-xl flex items-center justify-between border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-400 text-slate-950"
                        : idx === 1
                        ? "bg-slate-300 text-slate-950"
                        : idx === 2
                        ? "bg-amber-600 text-white"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm block">
                      {player.displayName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {player.completedTruths} Thật • {player.completedDares} Thách
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-extrabold text-brand-accent block">
                    +{player.score}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={handlePlayAgainSameGroup}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-truth-600 to-dare-600 hover:from-truth-500 hover:to-dare-500 text-white font-extrabold text-base shadow-xl transition transform active:scale-95"
          >
            🎮 CHƠI LẠI CÙNG NHÓM NÀY
          </button>
          <a
            href="/play"
            className="block text-center w-full py-3.5 rounded-2xl glass-card text-slate-300 hover:text-white font-semibold text-sm border border-white/10 hover:bg-white/10 transition"
          >
            ⚙️ Tạo Phòng Mới / Đổi Cài Đặt
          </a>
        </div>
      </div>
    </div>
  );
}
