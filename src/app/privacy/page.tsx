"use client";

import { useI18n } from "@/features/i18n/I18nProvider";

export default function PrivacyPage() {
  const { copy } = useI18n();
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">{copy.privacy.title}</h1>
      <p className="page-lede">{copy.privacy.lede}</p>
      <div className="panel">
        {copy.privacy.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
      </div>
    </article>
  );
}
