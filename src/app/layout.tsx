import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { I18nProvider } from "@/features/i18n/I18nProvider";
import { SiteFooter, SiteHeader } from "@/features/i18n/SiteChrome";
import "./globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const publicUrl = "https://dotamduc.github.io/truth-or-dare/";
const basePath = process.env.GITHUB_PAGES === "true" ? "/truth-or-dare" : "";
const isVercelDeployment = process.env.VERCEL === "1";
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
const languageInitializationScript = `
(() => {
  try {
    const savedLanguage = localStorage.getItem("truth-or-dare-language");
    const language = savedLanguage === "en" ? "en" : "vi";
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
  } catch {
    document.documentElement.lang = "vi";
    document.documentElement.dataset.language = "vi";
  }
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: { default: "Truth or Dare | Thật Hay Thách", template: "%s | Truth or Dare" },
  description: "A bilingual Vietnamese and English Truth or Dare game for friends, families, and parties.",
  alternates: { canonical: publicUrl },
  manifest: `${basePath}/site.webmanifest`,
  icons: { icon: `${basePath}/icon.svg` },
  openGraph: {
    title: "Truth or Dare | Thật Hay Thách",
    description: "Choose Truth, take a Dare, and get the party started in Vietnamese or English.",
    type: "website",
    locale: "vi_VN",
    alternateLocale: "en_US",
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
        <script dangerouslySetInnerHTML={{ __html: languageInitializationScript }} />
      </head>
      <body className="min-h-[100dvh] antialiased">
        <I18nProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </I18nProvider>
        {isVercelDeployment ? <Analytics /> : null}
      </body>
    </html>
  );
}
