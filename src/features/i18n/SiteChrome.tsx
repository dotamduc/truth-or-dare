"use client";

import Link from "next/link";
import { ThemeToggle } from "@/features/theme/ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "./I18nProvider";

export function SiteHeader() {
  const { copy } = useI18n();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" prefetch={false} className="wordmark" aria-label={copy.chrome.homeLabel}>
          {copy.chrome.truth} <span>{copy.chrome.or}</span> {copy.chrome.dare}
        </Link>
        <div className="header-actions">
          <nav aria-label={copy.chrome.navLabel} className="main-nav">
            <Link href="/guide" prefetch={false}>{copy.chrome.guide}</Link>
            <Link href="/safety" prefetch={false}>{copy.chrome.safety}</Link>
          </nav>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link href="/play" prefetch={false} className="nav-cta">{copy.chrome.play}</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { copy } = useI18n();
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p>{copy.chrome.footerText}</p>
        <nav aria-label={copy.chrome.footerNavLabel}>
          <Link href="/privacy" prefetch={false}>{copy.chrome.privacy}</Link>
          <Link href="/safety" prefetch={false}>{copy.chrome.safety}</Link>
          <a href="https://github.com/dotamduc/truth-or-dare">{copy.chrome.source}</a>
        </nav>
      </div>
    </footer>
  );
}
