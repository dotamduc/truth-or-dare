"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();

  // Players state
  const [players, setPlayers] = useState<string[]>(["An", "Bình", "Chi"]);
  const [nameInput, setNameInput] = useState("");

  // Game Settings state
  const [selectionMode, setSelectionMode] = useState<"ROUND_ROBIN" | "BALANCED_RANDOM">("ROUND_ROBIN");
  const [targetRounds, setTargetRounds] = useState<number | null>(5);
  const [minimumAge, setMinimumAge] = useState<"AGE_13_PLUS" | "AGE_16_PLUS" | "AGE_18_PLUS">("AGE_13_PLUS");
  const [allowedDifficulties, setAllowedDifficulties] = useState<string[]>(["EASY", "MEDIUM"]);
  const [allowPhysicalContact, setAllowPhysicalContact] = useState(false);
  const [allowProps, setAllowProps] = useState(true);
  const [allowPhone, setAllowPhone] = useState(true);

  // Status
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    if (players.length >= 10) {
      setErrorMsg("Tối đa chỉ hỗ trợ 10 người chơi trên cùng thiết bị.");
      return;
    }

    if (players.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(`Tên "${trimmed}" đã có trong danh sách.`);
      return;
    }

    setPlayers([...players, trimmed]);
    setNameInput("");
    setErrorMsg(null);
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length <= 2) {
      setErrorMsg("Cần tối thiểu 2 người chơi.");
      return;
    }
    setPlayers(players.filter((_, i) => i !== index));
    setErrorMsg(null);
  };

  const handleShuffle = () => {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setPlayers(shuffled);
  };

  const toggleDifficulty = (diff: string) => {
    if (allowedDifficulties.includes(diff)) {
      if (allowedDifficulties.length === 1) {
        setErrorMsg("Phải chọn ít nhất 1 mức độ.");
        return;
      }
      setAllowedDifficulties(allowedDifficulties.filter((d) => d !== diff));
    } else {
      setAllowedDifficulties([...allowedDifficulties, diff]);
    }
    setErrorMsg(null);
  };

  const handleStartGame = async () => {
    if (players.length < 2) {
      setErrorMsg("Cần ít nhất 2 người chơi để bắt đầu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/game-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players,
          selectionMode,
          targetRounds,
          minimumAge,
          allowedDifficulties,
          allowPhysicalContact,
          allowProps,
          allowPhone,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Lỗi tạo phòng chơi.");
      }

      router.push(`/game/${json.data.publicId}`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center mb-2 tracking-tight">
          ⚙️ Thiết Lập Trò Chơi
        </h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          Thêm tên người chơi và tùy chỉnh chế độ phù hợp với nhóm bạn
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm font-medium flex items-center justify-between">
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold ml-2">
              ✕
            </button>
          </div>
        )}

        {/* 1. Danh sách người chơi */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="font-bold text-slate-200 text-sm tracking-wide">
              👥 NGƯỜI CHƠI ({players.length}/10)
            </label>
            <button
              type="button"
              onClick={handleShuffle}
              className="text-xs px-3 py-1 rounded-lg glass-card text-brand-accent hover:text-white hover:bg-brand-accent/30 transition font-semibold"
            >
              🔀 Xáo Trộn Thứ Tự
            </button>
          </div>

          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nhập tên người chơi (ví dụ: An)..."
              maxLength={24}
              className="flex-1 px-4 py-3 rounded-xl glass-card text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-accent border border-white/10"
            />
            <button
              type="submit"
              disabled={players.length >= 10}
              className="px-5 py-3 rounded-xl bg-brand-accent hover:bg-purple-600 font-bold text-white transition disabled:opacity-50"
            >
              Thêm
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {players.map((name, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 font-medium text-sm shadow-sm"
              >
                <span className="text-xs text-slate-500 font-bold">#{idx + 1}</span>
                <span>{name}</span>
                <button
                  onClick={() => handleRemovePlayer(idx)}
                  className="text-slate-400 hover:text-rose-400 font-bold ml-1"
                  title="Xóa người chơi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Chế độ chọn lượt & Số vòng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block font-bold text-slate-200 text-xs mb-2 tracking-wide uppercase">
              🔄 Cách Chọn Lượt
            </label>
            <select
              value={selectionMode}
              onChange={(e: any) => setSelectionMode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl glass-card text-white focus:outline-none border border-white/10 bg-slate-900"
            >
              <option value="ROUND_ROBIN">Theo Vòng Lần Lượt</option>
              <option value="BALANCED_RANDOM">Ngẫu Nhiên Cân Bằng</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-200 text-xs mb-2 tracking-wide uppercase">
              🏁 Số Vòng Chơi
            </label>
            <select
              value={targetRounds === null ? "unlimited" : targetRounds.toString()}
              onChange={(e) =>
                setTargetRounds(e.target.value === "unlimited" ? null : parseInt(e.target.value))
              }
              className="w-full px-4 py-3 rounded-xl glass-card text-white focus:outline-none border border-white/10 bg-slate-900"
            >
              <option value="unlimited">Không Giới Hạn (Chơi tự do)</option>
              <option value="3">3 Vòng / Người</option>
              <option value="5">5 Vòng / Người</option>
              <option value="10">10 Vòng / Người</option>
            </select>
          </div>
        </div>

        {/* 3. Độ tuổi & Mức độ */}
        <div className="mb-8">
          <label className="block font-bold text-slate-200 text-xs mb-2 tracking-wide uppercase">
            🔞 Giới Hạn Độ Tuổi
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: "AGE_13_PLUS", label: "13+ (An toàn)" },
              { id: "AGE_16_PLUS", label: "16+ (Hài hước)" },
              { id: "AGE_18_PLUS", label: "18+ (Táo bạo)" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "AGE_18_PLUS" && minimumAge !== "AGE_18_PLUS") {
                    if (!confirm("Chế độ 18+ cần sự đồng thuận của cả nhóm. Bạn xác nhận mọi người chơi đều trên 18 tuổi?")) {
                      return;
                    }
                  }
                  setMinimumAge(item.id as any);
                }}
                className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition border ${
                  minimumAge === item.id
                    ? "bg-brand-accent text-white border-brand-accent shadow-md"
                    : "glass-card text-slate-400 hover:text-white border-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="block font-bold text-slate-200 text-xs mb-2 tracking-wide uppercase">
            🔥 Mức Độ Thách / Thật
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "EASY", label: "Nhẹ Nhàng" },
              { id: "MEDIUM", label: "Vui Nhộn" },
              { id: "BOLD", label: "Táo Bạo" },
              { id: "HARD", label: "Thử Thách Khó" },
            ].map((diff) => {
              const active = allowedDifficulties.includes(diff.id);
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => toggleDifficulty(diff.id)}
                  className={`py-2.5 px-3 rounded-xl font-semibold text-xs transition border ${
                    active
                      ? "bg-truth-600 text-white border-truth-500 shadow-md"
                      : "glass-card text-slate-400 hover:text-white border-white/10"
                  }`}
                >
                  {active ? "✓ " : ""}{diff.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Cờ an toàn */}
        <div className="mb-8 p-4 rounded-2xl glass-card border border-white/10 space-y-3">
          <span className="block font-bold text-xs text-slate-300 uppercase tracking-wide">
            🛡️ TÙY CHỌN AN TOÀN & ĐẠO CỤ
          </span>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allowPhysicalContact}
              onChange={(e) => setAllowPhysicalContact(e.target.checked)}
              className="w-4 h-4 accent-truth-500 rounded"
            />
            <span>Cho phép thử thách có tương tác thể chất nhẹ (bắt tay, đứng gần)</span>
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={allowProps}
              onChange={(e) => setAllowProps(e.target.checked)}
              className="w-4 h-4 accent-truth-500 rounded"
            />
            <span>Cho phép dùng đạo cụ đơn giản (cốc nước, sách, giấy)</span>
          </label>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleStartGame}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-truth-600 to-dare-600 hover:from-truth-500 hover:to-dare-500 text-white font-extrabold text-lg shadow-xl hover:shadow-2xl transition transform active:scale-95 disabled:opacity-50"
        >
          {loading ? "Đang Khởi Tạo..." : "🚀 BẮT ĐẦU CHƠI NGAY"}
        </button>
      </div>
    </div>
  );
}
