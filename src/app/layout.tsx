import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thật Hay Thách - Truth or Dare Vietnam | Game Nhóm Vui Nhộn & An Toàn",
  description:
    "Website game Thật Hay Thách (Truth or Dare) bằng tiếng Việt dành cho nhóm bạn từ 2-10 người. Kho câu hỏi phong phú, phân loại thông minh, an toàn và hấp dẫn.",
  keywords: [
    "Truth or Dare",
    "Thật Hay Thách",
    "Game tiệc tùng",
    "Game nhóm bạn",
    "Trò chơi tụ tập",
    "Câu hỏi thật hay thách tiếng Việt",
  ],
  authors: [{ name: "Truth or Dare Vietnam Team" }],
  openGraph: {
    title: "Thật Hay Thách - Game Nhóm Tiếng Việt",
    description:
      "Game Thật Hay Thách online tiếng Việt cực vui, an toàn và mượt mà trên mobile!",
    type: "website",
    locale: "vi_VN",
    siteName: "Thật Hay Thách",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark">
      <body className="antialiased selection:bg-brand-accent selection:text-white min-h-screen flex flex-col">
        <header className="w-full border-b border-white/10 glass-panel sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-wider">
              <span className="text-truth-500">THẬT</span>
              <span className="text-white/40">HAY</span>
              <span className="text-dare-500">THÁCH</span>
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <a href="/play" className="px-4 py-2 rounded-lg bg-gradient-to-r from-truth-600 to-dare-600 hover:opacity-90 transition font-semibold text-white shadow-lg">
                Chơi Ngay
              </a>
              <a href="/guide" className="hidden sm:inline-block text-slate-300 hover:text-white transition">
                Hướng Dẫn
              </a>
              <a href="/safety" className="hidden sm:inline-block text-slate-300 hover:text-white transition">
                An Toàn
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="w-full border-t border-white/10 glass-panel py-6 mt-12 text-center text-sm text-slate-400">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Thật Hay Thách (Truth or Dare Vietnam). Mọi quyền được bảo lưu.</p>
            <div className="flex gap-4">
              <a href="/safety" className="hover:text-white transition">Quy Tắc An Toàn</a>
              <a href="/privacy" className="hover:text-white transition">Quyền Riêng Tư</a>
              <a href="/guide" className="hover:text-white transition">Luật Chơi</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
