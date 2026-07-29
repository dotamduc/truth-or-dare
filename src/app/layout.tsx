import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const publicUrl = "https://dotamduc.github.io/truth-or-dare/";
const basePath = process.env.GITHUB_PAGES === "true" ? "/truth-or-dare" : "";

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: { default: "Thật Hay Thách", template: "%s | Thật Hay Thách" },
  description: "Game Truth or Dare tiếng Việt dành cho bạn bè, gia đình và các buổi tụ họp.",
  alternates: { canonical: publicUrl },
  manifest: `${basePath}/site.webmanifest`,
  icons: { icon: `${basePath}/icon.svg` },
  openGraph: {
    title: "Thật Hay Thách",
    description: "140 câu hỏi tiếng Việt chạy hoàn toàn trong trình duyệt.",
    type: "website",
    locale: "vi_VN",
    url: publicUrl,
    siteName: "Thật Hay Thách",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#111210" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={geist.variable}>
      <body className="min-h-[100dvh] antialiased">
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" prefetch={false} className="wordmark" aria-label="Thật Hay Thách, trang chủ">
              THẬT <span>HAY</span> THÁCH
            </Link>
            <nav aria-label="Điều hướng chính" className="main-nav">
              <Link href="/guide" prefetch={false}>Luật chơi</Link>
              <Link href="/safety" prefetch={false}>An toàn</Link>
              <Link href="/play" prefetch={false} className="nav-cta">Chơi ngay</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <p>Thật Hay Thách. Chơi tại chỗ, dữ liệu ở lại trình duyệt.</p>
            <nav aria-label="Điều hướng cuối trang">
              <Link href="/privacy" prefetch={false}>Quyền riêng tư</Link>
              <Link href="/safety" prefetch={false}>An toàn</Link>
              <a href="https://github.com/dotamduc/truth-or-dare">Mã nguồn</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
