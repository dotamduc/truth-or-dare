"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { translations } from "./translations";
import type { Language } from "./types";

export const LANGUAGE_STORAGE_KEY = "truth-or-dare-language";

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  copy: (typeof translations)[Language];
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "vi" || value === "en";
}

function applyLanguage(language: Language): void {
  document.documentElement.lang = language;
  document.documentElement.dataset.language = language;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguageState] = useState<Language>("vi");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch { /* Storage can be unavailable in privacy mode. */ }
    const initial = isLanguage(saved) ? saved : document.documentElement.dataset.language;
    const nextLanguage: Language = initial === "en" ? "en" : "vi";
    applyLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch { /* The active language still works for this page view. */ }
    applyLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  };

  const copy = translations[language];

  useEffect(() => {
    const routeTitle = pathname === "/play"
      ? copy.pageTitles.play
      : pathname === "/guide"
        ? copy.pageTitles.guide
        : pathname === "/safety"
          ? copy.pageTitles.safety
          : pathname === "/privacy"
            ? copy.pageTitles.privacy
            : copy.pageTitles.home;
    document.title = routeTitle;
  }, [copy, pathname]);

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, copy }), [copy, language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
