"use client";

import React, { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tabs & Data state
  const [activeTab, setActiveTab] = useState<"prompts" | "import" | "reports">("prompts");
  const [prompts, setPrompts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New prompt form state
  const [newType, setNewType] = useState<"TRUTH" | "DARE">("TRUTH");
  const [newText, setNewText] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("EASY");
  const [newMinAge, setNewMinAge] = useState("AGE_13_PLUS");
  const [formMsg, setFormMsg] = useState<string | null>(null);

  // Import state
  const [importJsonText, setImportJsonText] = useState("");
  const [importPreview, setImportPreview] = useState<any>(null);

  // Initial check on mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Đăng nhập thất bại.");

      setIsAuthenticated(true);
      fetchPrompts();
      fetchReports();
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  const fetchPrompts = async () => {
    try {
      const res = await fetch("/api/admin/prompts?limit=50");
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setPrompts(json.data.prompts || []);
      }
    } catch (err) {
      console.error("Error loading prompts:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/reports");
      const json = await res.json();
      if (res.ok) {
        setReports(json.data.reports || []);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    }
  };

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    if (!newText.trim()) return;

    try {
      const res = await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          text: newText,
          difficulty: newDifficulty,
          minimumAge: newMinAge,
          status: "PUBLISHED",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi thêm câu hỏi.");

      setFormMsg("✓ Thêm câu hỏi thành công!");
      setNewText("");
      fetchPrompts();
    } catch (err: any) {
      setFormMsg(`⚠️ ${err.message}`);
    }
  };

  const handleArchivePrompt = async (id: string) => {
    if (!confirm("Bạn có chắc muốn chuyển câu hỏi này sang trạng thái Đã Lưu Trữ (Xóa mềm)?")) return;
    try {
      await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
      fetchPrompts();
    } catch (err) {
      console.error("Error archiving prompt:", err);
    }
  };

  const handleImportPreview = async () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const res = await fetch("/api/admin/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi xem trước.");

      setImportPreview(json.data);
    } catch (err: any) {
      alert("Cú pháp JSON không hợp lệ hoặc lỗi API: " + err.message);
    }
  };

  const handleImportCommit = async () => {
    if (!importPreview?.items) return;
    const validItems = importPreview.items
      .filter((i: any) => i.status === "VALID")
      .map((i: any) => i.item);

    if (validItems.length === 0) {
      alert("Không có câu hỏi hợp lệ nào để import!");
      return;
    }

    try {
      const res = await fetch("/api/admin/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Lỗi commit import.");

      alert(`✅ Đã import thành công ${json.data.insertedCount} câu hỏi!`);
      setImportPreview(null);
      setImportJsonText("");
      fetchPrompts();
    } catch (err: any) {
      alert("Lỗi commit import: " + err.message);
    }
  };

  const handleResolveReport = async (reportId: string, archive: boolean) => {
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED", archivePrompt: archive }),
      });
      fetchReports();
      fetchPrompts();
    } catch (err) {
      console.error("Error resolving report:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-2xl font-extrabold text-center mb-2">🔐 Đăng Nhập Admin</h1>
          <p className="text-xs text-slate-400 text-center mb-6">
            Bảng điều khiển dành riêng cho ban quản trị nội dung
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-200 text-xs font-medium">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tài khoản:</label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Nhập tên đăng nhập admin..."
                className="w-full p-3 rounded-xl glass-card text-white text-sm border border-white/10"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Mật khẩu:</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full p-3 rounded-xl glass-card text-white text-sm border border-white/10"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-accent hover:bg-purple-600 font-bold text-white transition"
            >
              Đăng Nhập Quản Trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
      {/* Admin Header */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">🛠️ Admin Dashboard</h1>
          <p className="text-xs text-slate-400">
            Quản lý kho câu hỏi, kiểm duyệt nội dung và xem thống kê báo cáo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
            {prompts.length} Prompts
          </span>
          <span className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 font-bold">
            {reports.filter((r) => r.status === "OPEN").length} Báo cáo mở
          </span>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg glass-card text-slate-400 hover:text-white font-semibold"
          >
            Đăng Xuất
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("prompts")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "prompts" ? "bg-brand-accent text-white" : "glass-card text-slate-400 hover:text-white"
          }`}
        >
          📋 Quản Lý Câu Hỏi ({prompts.length})
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "import" ? "bg-brand-accent text-white" : "glass-card text-slate-400 hover:text-white"
          }`}
        >
          📥 Import / Export Hàng Loạt
        </button>
        <button
          onClick={() => {
            setActiveTab("reports");
            fetchReports();
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            activeTab === "reports" ? "bg-brand-accent text-white" : "glass-card text-slate-400 hover:text-white"
          }`}
        >
          🚩 Hàng Chờ Báo Cáo ({reports.filter((r) => r.status === "OPEN").length})
        </button>
      </div>

      {/* TAB 1: PROMPTS CRUD */}
      {activeTab === "prompts" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Prompt Form */}
          <div className="glass-panel p-6 rounded-3xl border border-white/10 h-fit">
            <h3 className="text-lg font-bold text-white mb-4">➕ Thêm Câu Hỏi Mới</h3>
            {formMsg && <p className="text-xs mb-3 font-semibold text-emerald-400">{formMsg}</p>}

            <form onSubmit={handleCreatePrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Loại:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("TRUTH")}
                    className={`py-2 rounded-xl text-xs font-bold ${
                      newType === "TRUTH" ? "bg-truth-600 text-white" : "glass-card text-slate-400"
                    }`}
                  >
                    THẬT 💬
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("DARE")}
                    className={`py-2 rounded-xl text-xs font-bold ${
                      newType === "DARE" ? "bg-dare-600 text-white" : "glass-card text-slate-400"
                    }`}
                  >
                    THÁCH 🔥
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nội dung câu hỏi:</label>
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Nhập nội dung tiếng Việt..."
                  rows={3}
                  className="w-full p-3 rounded-xl glass-card text-white text-sm border border-white/10 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mức độ:</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-card text-white text-xs bg-slate-900 border border-white/10"
                  >
                    <option value="EASY">Nhẹ nhàng</option>
                    <option value="MEDIUM">Vui nhộn</option>
                    <option value="BOLD">Táo bạo</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Độ tuổi:</label>
                  <select
                    value={newMinAge}
                    onChange={(e) => setNewMinAge(e.target.value)}
                    className="w-full p-2.5 rounded-xl glass-card text-white text-xs bg-slate-900 border border-white/10"
                  >
                    <option value="AGE_13_PLUS">13+</option>
                    <option value="AGE_16_PLUS">16+</option>
                    <option value="AGE_18_PLUS">18+</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-sm transition"
              >
                Đăng Xuất Bản (Publish)
              </button>
            </form>
          </div>

          {/* Prompts Table */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">📜 Kho Câu Hỏi Đã Lưu</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/5"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          prompt.type === "TRUTH"
                            ? "bg-truth-500/20 text-truth-400"
                            : "bg-dare-500/20 text-dare-400"
                        }`}
                      >
                        {prompt.type}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{prompt.difficulty}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{prompt.minimumAge}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{prompt.text}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Hiển thị: {prompt.timesServed}</span>
                    <button
                      onClick={() => handleArchivePrompt(prompt.id)}
                      className="text-xs px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white transition"
                    >
                      Lưu Trữ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IMPORT / EXPORT */}
      {activeTab === "import" && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-2">📥 Batch Import / Export JSON</h3>
          <p className="text-xs text-slate-400 mb-4">
            Dán danh sách câu hỏi dạng JSON để thực hiện Dry-run kiểm tra trùng lặp trước khi commit
          </p>

          <textarea
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder='[\n  { "type": "TRUTH", "text": "Câu hỏi mới?", "difficulty": "EASY" }\n]'
            rows={8}
            className="w-full p-4 rounded-xl glass-card text-white font-mono text-xs border border-white/10 mb-4 focus:outline-none"
          />

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleImportPreview}
              className="px-6 py-3 rounded-xl bg-brand-accent text-white font-bold text-xs"
            >
              🔍 Chạy Dry-Run Xem Trước
            </button>
          </div>

          {importPreview && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-4">
              <h4 className="font-bold text-sm text-white">📊 Kết quả kiểm tra Dry-run:</h4>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-800">
                  <span className="block font-bold text-white">{importPreview.summary.totalInput}</span>
                  <span className="text-slate-400">Tổng</span>
                </div>
                <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                  <span className="block font-bold">{importPreview.summary.validCount}</span>
                  <span>Hợp lệ</span>
                </div>
                <div className="p-2 rounded bg-rose-500/20 text-rose-400">
                  <span className="block font-bold">{importPreview.summary.exactDuplicatesCount}</span>
                  <span>Trùng chính xác</span>
                </div>
                <div className="p-2 rounded bg-amber-500/20 text-amber-400">
                  <span className="block font-bold">{importPreview.summary.nearDuplicatesCount}</span>
                  <span>Nghi trùng</span>
                </div>
              </div>

              <button
                onClick={handleImportCommit}
                className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition"
              >
                ✅ Commit ({importPreview.summary.validCount}) Câu Hỏi Hợp Lệ Vào DB
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REPORTS MODERATION */}
      {activeTab === "reports" && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">🚩 Hàng Chờ Báo Cáo Nội Dung</h3>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">Hiện không có báo cáo nào.</p>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-white/5"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 mr-2">
                      {report.reason}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString("vi-VN")}</span>
                    <p className="text-sm font-semibold text-white mt-1">&ldquo;{report.prompt?.text}&rdquo;</p>
                    {report.comment && <p className="text-xs text-amber-300 italic mt-0.5">Ghi chú: {report.comment}</p>}
                  </div>

                  {report.status === "OPEN" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveReport(report.id, false)}
                        className="text-xs px-3 py-1.5 rounded bg-slate-700 text-white font-bold hover:bg-slate-600"
                      >
                        Bỏ Qua
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, true)}
                        className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white font-bold hover:bg-rose-500"
                      >
                        Lưu Trữ Prompt Này
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
