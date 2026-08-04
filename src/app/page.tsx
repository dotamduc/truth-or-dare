"use client";

import Image from "next/image";
import Link from "next/link";
import truthOrDareBanner from "@/assets/truth-or-dare-banner.webp";
import { getPromptText, prompts } from "@/data/prompts";
import { LandingResume } from "@/features/game/components/LandingResume";
import { useI18n } from "@/features/i18n/I18nProvider";
import { GameReviews } from "@/features/reviews/components/GameReviews";

export default function HomePage() {
  const { language, copy } = useI18n();
  const truthPreview = prompts.find((prompt) => prompt.type === "TRUTH" && prompt.minimumAge === 13 && !prompt.isPrivate && !prompt.isSensitive);
  const darePreview = prompts.find((prompt) => prompt.type === "DARE" && prompt.minimumAge === 13 && !prompt.isPrivate && !prompt.isSensitive);

  return (
    <>
      <section className="hero-section">
        <div className="shell hero-grid">
          <span className="floating-emoji emoji-confetti" aria-hidden="true">🎉</span>
          <span className="floating-emoji emoji-sparkles" aria-hidden="true">✨</span>
          <span className="floating-emoji emoji-dice" aria-hidden="true">🎲</span>
          <span className="floating-emoji emoji-fire" aria-hidden="true">🔥</span>

          <div className="hero-copy">
            <p className="eyebrow">{copy.home.eyebrow}</p>
            <h1 className="hero-banner-heading">
              <Image
                className="hero-banner-image"
                src={truthOrDareBanner}
                alt={copy.home.bannerAlt}
                width={1536}
                height={512}
                priority
                sizes="(max-width: 767px) calc(100vw - 32px), 650px"
              />
            </h1>
            <p className="hero-lede">{copy.home.lede}</p>
            <div className="hero-actions">
              <Link href="/play" prefetch={false} className="button button-primary button-party">{copy.home.start} <span aria-hidden="true">🎉</span></Link>
              <Link href="/guide" prefetch={false} className="button button-secondary">{copy.home.viewGuide}</Link>
            </div>
            <LandingResume />
            <div className="hero-stickers" aria-hidden="true">
              <span className="sticker sticker-yellow">{copy.home.stickerOne}</span>
              <span className="sticker sticker-pink">{copy.home.stickerTwo}</span>
            </div>
          </div>

          <div className="prompt-preview" aria-label={copy.home.previewLabel}>
            <article className="preview-card preview-truth">
              <span className="preview-type">{copy.home.truth} <span aria-hidden="true">🤫</span></span>
              <p>{truthPreview ? getPromptText(truthPreview, language) : null}</p>
              <span className="preview-sticker" aria-hidden="true">{copy.home.yourTurn}</span>
            </article>
            <article className="preview-card preview-dare">
              <span className="preview-type">{copy.home.dare} <span aria-hidden="true">😈</span></span>
              <p>{darePreview ? getPromptText(darePreview, language) : null}</p>
              <span className="preview-sticker" aria-hidden="true">{copy.home.dareSticker}</span>
            </article>
          </div>
        </div>
      </section>

      <section className="shell feature-section" aria-labelledby="feature-heading">
        <div className="section-heading">
          <p className="section-kicker">{copy.home.featureKicker}</p>
          <h2 id="feature-heading">{copy.home.featureHeading}</h2>
        </div>
        <div className="feature-grid">
          {copy.home.features.map((feature, index) => (
            <article className={`feature-card feature-card-${index + 1}`} key={feature.title}>
              <span className="feature-emoji" aria-hidden="true">{feature.emoji}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-to-section" aria-labelledby="how-to-heading">
        <span className="how-to-decoration how-to-chat" aria-hidden="true">💬</span>
        <span className="how-to-decoration how-to-sparkle" aria-hidden="true">✨</span>
        <div className="shell how-to-inner">
          <div className="how-to-copy">
            <span className="sticker sticker-purple" aria-hidden="true">{copy.home.howSticker}</span>
            <h2 id="how-to-heading">{copy.home.howHeading}</h2>
            <p>{copy.home.howText}</p>
          </div>
          <ol className="step-grid">
            {copy.home.steps.map((step, index) => (
              <li className={`step-card step-card-${index + 1}`} key={step.title}>
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <GameReviews />
    </>
  );
}
