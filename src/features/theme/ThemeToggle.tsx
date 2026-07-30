"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "truth-or-dare-theme";

type Theme = "light" | "dark";

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";

  const toggleTheme = () => {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={label} title={label}>
      <span className="theme-icon theme-icon-to-dark" aria-hidden="true">🌙</span>
      <span className="theme-icon theme-icon-to-light" aria-hidden="true">☀️</span>
    </button>
  );
}
