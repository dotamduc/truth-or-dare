"use client";

import { useI18n } from "@/features/i18n/I18nProvider";

export default function SafetyPage() {
  const { copy } = useI18n();
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">{copy.safety.title}</h1>
      <p className="page-lede">{copy.safety.lede}</p>
      <div className="panel">
        {copy.safety.sections.map((section, index) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            {index === copy.safety.sections.length - 1 && <ul>{copy.safety.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          </section>
        ))}
      </div>
    </article>
  );
}
