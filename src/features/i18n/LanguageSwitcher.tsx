"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGE_STORAGE_KEY, useI18n } from "./I18nProvider";
import type { Language } from "./types";

export function LanguageSwitcher() {
  const { language, setLanguage, copy } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [choiceRequired, setChoiceRequired] = useState(false);

  useEffect(() => {
    let hasSavedChoice = false;
    try {
      hasSavedChoice = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) !== null;
    } catch { /* Ask again when browser storage is unavailable. */ }
    if (!hasSavedChoice) {
      setChoiceRequired(true);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const chooseLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setChoiceRequired(false);
    setIsOpen(false);
  };

  const close = () => {
    if (!choiceRequired) setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="language-toggle"
        onClick={() => setIsOpen(true)}
        aria-label={copy.language.buttonLabel}
        title={copy.language.buttonLabel}
      >
        <span aria-hidden="true">{language === "vi" ? "🇻🇳" : "🇬🇧"}</span>
        <span className="language-code">{language === "vi" ? "VI" : "EN"}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="language-dialog"
        aria-label={copy.language.dialogLabel}
        onCancel={(event) => {
          if (choiceRequired) event.preventDefault();
          else close();
        }}
      >
        <div className="language-dialog-inner">
          {!choiceRequired && (
            <button type="button" className="language-close" onClick={close} aria-label={copy.language.close}>×</button>
          )}
          <span className="language-dialog-icon" aria-hidden="true">🌍</span>
          <h2>{choiceRequired ? copy.language.firstTitle : copy.language.title}</h2>
          <p>{choiceRequired ? copy.language.firstSubtitle : copy.language.subtitle}</p>
          <div className="language-options">
            <button type="button" className={!choiceRequired && language === "vi" ? "is-selected" : ""} onClick={() => chooseLanguage("vi")}>
              <span className="language-flag" aria-hidden="true">🇻🇳</span>
              <span><strong>{copy.language.vietnamese}</strong><small>{copy.language.vietnameseDescription}</small></span>
              {language === "vi" && !choiceRequired && <span className="language-check" aria-hidden="true">✓</span>}
            </button>
            <button type="button" className={!choiceRequired && language === "en" ? "is-selected" : ""} onClick={() => chooseLanguage("en")}>
              <span className="language-flag" aria-hidden="true">🇬🇧</span>
              <span><strong>{copy.language.english}</strong><small>{copy.language.englishDescription}</small></span>
              {language === "en" && !choiceRequired && <span className="language-check" aria-hidden="true">✓</span>}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
