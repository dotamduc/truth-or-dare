"use client";

import Link from "next/link";
import { useI18n } from "@/features/i18n/I18nProvider";

export default function GuidePage() {
  const { copy } = useI18n();
  return (
    <article className="page-shell article-page">
      <h1 className="page-title">{copy.guide.title}</h1>
      <p className="page-lede">{copy.guide.lede}</p>
      <div className="panel">
        <section><h2>{copy.guide.setupTitle}</h2><p>{copy.guide.setupText}</p></section>
        <section><h2>{copy.guide.turnTitle}</h2><ol>{copy.guide.turnSteps.map((step) => <li key={step}>{step}</li>)}</ol></section>
        <section><h2>{copy.guide.refuseTitle}</h2><p>{copy.guide.refuseText}</p></section>
        <section><h2>{copy.guide.exhaustedTitle}</h2><p>{copy.guide.exhaustedText}</p></section>
        <section><Link href="/play" prefetch={false} className="button button-primary">{copy.guide.setupGame}</Link></section>
      </div>
    </article>
  );
}
