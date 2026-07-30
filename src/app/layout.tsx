import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const publicUrl = "https://dotamduc.github.io/truth-or-dare/";
const basePath = process.env.GITHUB_PAGES === "true" ? "/truth-or-dare" : "";
const themeInitializationScript = `
(() => {
  try {
    const savedTheme = localStorage.getItem("truth-or-dare-theme");
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: { default: "Thật Hay Thách", template: "%s | Thật Hay Thách" },
  description: "Game Truth or Dare tiếng Việt dành cho bạn bè, gia đình và các buổi tụ họp.",
  alternates: { canonical: publicUrl },
  manifest: `${basePath}/site.webmanifest`,
  icons: { icon: `${basePath}/icon.svg` },
  openGraph: {
    title: "Thật Hay Thách",
    description: "Chọn Thật, nhận Thách và bắt nhịp cuộc vui cùng mọi người.",
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
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#181c22" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body className="min-h-[100dvh] antialiased">
        <header className="site-header">
          <div className="shell header-inner">
            <Link href="/" prefetch={false} className="wordmark" aria-label="Thật Hay Thách, trang chủ">
              THẬT <span>HAY</span> THÁCH
            </Link>
            <div className="header-actions">
              <nav aria-label="Điều hướng chính" className="main-nav">
                <Link href="/guide" prefetch={false}>Luật chơi</Link>
                <Link href="/safety" prefetch={false}>An toàn</Link>
              </nav>
              <ThemeToggle />
              <Link href="/play" prefetch={false} className="nav-cta">Chơi ngay</Link>
            </div>
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
