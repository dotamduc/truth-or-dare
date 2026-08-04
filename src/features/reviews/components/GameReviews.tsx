"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  getExistingAnonymousIdentity,
  type AnonymousIdentity,
} from "@/features/auth/services/anonymousIdentity";
import { useI18n } from "@/features/i18n/I18nProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { reviewInputSchema } from "../schemas/reviewSchema";
import {
  deleteMyReview,
  getMyReview,
  getReviews,
  getReviewSummary,
  submitReview,
  type ReviewItem,
  type ReviewSummary,
} from "../services/reviewRepository";

const PAGE_SIZE = 6;
const STAR_VALUES = [1, 2, 3, 4, 5] as const;
const EMPTY_SUMMARY: ReviewSummary = {
  reviewCount: 0,
  averageRating: 0,
  counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

type Feedback =
  | "rating"
  | "body"
  | "load"
  | "submit"
  | "delete"
  | "created"
  | "updated"
  | "deleted"
  | null;

export function GameReviews() {
  const { language, copy } = useI18n();
  const reviewCopy = copy.home.reviews;
  const configured = isSupabaseConfigured();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [identity, setIdentity] = useState<AnonymousIdentity | null>(null);
  const [myReviewId, setMyReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(configured);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    let ignore = false;

    async function initialize() {
      try {
        const [nextSummary, firstReviews, existingIdentity] = await Promise.all([
          getReviewSummary(),
          getReviews(0, PAGE_SIZE),
          getExistingAnonymousIdentity(),
        ]);

        if (ignore) {
          return;
        }

        setSummary(nextSummary);
        setReviews(firstReviews);
        setHasMore(firstReviews.length === PAGE_SIZE);
        setIdentity(existingIdentity);

        if (existingIdentity) {
          const ownReview = await getMyReview(existingIdentity.userId);

          if (!ignore && ownReview) {
            setMyReviewId(ownReview.id);
            setRating(ownReview.rating);
            setBody(ownReview.body ?? "");
          }
        }
      } catch {
        if (!ignore) {
          setFeedback("load");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      ignore = true;
    };
  }, [configured]);

  async function refreshCommunity() {
    const [nextSummary, firstReviews] = await Promise.all([
      getReviewSummary(),
      getReviews(0, PAGE_SIZE),
    ]);

    setSummary(nextSummary);
    setReviews(firstReviews);
    setPage(0);
    setHasMore(firstReviews.length === PAGE_SIZE);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const parsed = reviewInputSchema.safeParse({ rating, body, locale: language });

    if (!parsed.success) {
      setFeedback(rating === 0 ? "rating" : "body");
      return;
    }

    setSubmitting(true);
    const wasEditing = Boolean(myReviewId);

    try {
      const result = await submitReview(parsed.data);
      const ownReview = await getMyReview(result.identity.userId);
      setIdentity(result.identity);
      setMyReviewId(ownReview?.id ?? null);
      await refreshCommunity();
      setFeedback(wasEditing ? "updated" : "created");
    } catch {
      setFeedback("submit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLoadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const nextReviews = await getReviews(nextPage, PAGE_SIZE);
      setReviews((current) => [...current, ...nextReviews]);
      setPage(nextPage);
      setHasMore(nextReviews.length === PAGE_SIZE);
    } catch {
      setFeedback("load");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleDelete() {
    if (!myReviewId || !window.confirm(reviewCopy.deleteConfirm)) {
      return;
    }

    setDeleting(true);
    setFeedback(null);

    try {
      await deleteMyReview(myReviewId);
      setMyReviewId(null);
      setRating(0);
      setBody("");
      await refreshCommunity();
      setFeedback("deleted");
    } catch {
      setFeedback("delete");
    } finally {
      setDeleting(false);
    }
  }

  const feedbackText = feedback
    ? {
        rating: reviewCopy.ratingRequired,
        body: reviewCopy.bodyInvalid,
        load: reviewCopy.loadError,
        submit: reviewCopy.submitError,
        delete: reviewCopy.deleteError,
        created: reviewCopy.saved,
        updated: reviewCopy.updated,
        deleted: reviewCopy.deleted,
      }[feedback]
    : null;
  const feedbackIsError = feedback !== null && !["created", "updated", "deleted"].includes(feedback);
  const dateFormatter = new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
  });

  return (
    <section className="reviews-section" aria-labelledby="reviews-heading">
      <div className="shell">
        <div className="reviews-heading-grid">
          <div className="section-heading reviews-heading-copy">
            <p className="section-kicker">{reviewCopy.kicker}</p>
            <h2 id="reviews-heading">{reviewCopy.heading}</h2>
            <p>{reviewCopy.lede}</p>
          </div>

          <article className="review-summary-card" aria-label={reviewCopy.summaryLabel}>
            <div className="review-average">
              <strong>{summary.averageRating.toFixed(1)}</strong>
              <span className="review-stars" aria-hidden="true">
                {STAR_VALUES.map((value) => (
                  <span className={value <= Math.round(summary.averageRating) ? "is-filled" : ""} key={value}>★</span>
                ))}
              </span>
              <span>{summary.reviewCount} {reviewCopy.reviewCount}</span>
            </div>
            <div className="rating-breakdown">
              {[...STAR_VALUES].reverse().map((value) => {
                const count = summary.counts[value];
                const width = summary.reviewCount === 0 ? 0 : (count / summary.reviewCount) * 100;

                return (
                  <div className="rating-breakdown-row" key={value}>
                    <span>{value} ★</span>
                    <span className="rating-track" aria-hidden="true">
                      <span style={{ width: `${width}%` }} />
                    </span>
                    <span>{count}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {!configured ? (
          <p className="notice review-setup-notice">{reviewCopy.notConfigured}</p>
        ) : (
          <div className="reviews-content-grid">
            <form className="review-form panel" onSubmit={handleSubmit}>
              <div>
                <p className="section-kicker">{myReviewId ? reviewCopy.editKicker : reviewCopy.formKicker}</p>
                <h3>{myReviewId ? reviewCopy.editHeading : reviewCopy.formHeading}</h3>
              </div>

              <fieldset className="rating-fieldset">
                <legend>{reviewCopy.ratingLabel}</legend>
                <div className="star-picker">
                  {STAR_VALUES.map((value) => (
                    <label className={value <= rating ? "is-selected" : ""} key={value}>
                      <input
                        className="sr-only"
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                      />
                      <span aria-hidden="true">★</span>
                      <span className="sr-only">{value} {reviewCopy.starUnit}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="review-body-field">
                <span>{reviewCopy.bodyLabel}</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={reviewCopy.bodyPlaceholder}
                  maxLength={1000}
                  rows={5}
                />
                <span className="review-body-help">
                  <span>{reviewCopy.bodyHelp}</span>
                  <span>{body.length}/1000</span>
                </span>
              </label>

              <div className="anonymous-identity-note">
                <span aria-hidden="true">🕶️</span>
                <p>
                  {identity
                    ? `${reviewCopy.postingAs} ${identity.displayName}`
                    : reviewCopy.anonymousNameNote}
                </p>
              </div>

              {feedbackText ? (
                <p className={feedbackIsError ? "error-message" : "notice"} role="status">
                  {feedbackText}
                </p>
              ) : null}

              <div className="review-form-actions">
                <button className="button button-primary" type="submit" disabled={submitting || deleting}>
                  {submitting ? reviewCopy.submitting : myReviewId ? reviewCopy.updateButton : reviewCopy.submitButton}
                </button>
                {myReviewId ? (
                  <button className="button button-danger" type="button" onClick={handleDelete} disabled={submitting || deleting}>
                    {deleting ? reviewCopy.deleting : reviewCopy.deleteButton}
                  </button>
                ) : null}
              </div>
              <p className="fine-print">{reviewCopy.sessionNote}</p>
            </form>

            <div className="review-feed" aria-busy={loading}>
              <div className="review-feed-header">
                <h3>{reviewCopy.communityHeading}</h3>
                <span>{reviewCopy.newestFirst}</span>
              </div>

              {loading ? <p className="review-feed-state">{reviewCopy.loading}</p> : null}
              {!loading && reviews.length === 0 ? (
                <p className="review-feed-state">{reviewCopy.empty}</p>
              ) : null}

              <div className="review-list">
                {reviews.map((review) => (
                  <article className="review-card" key={review.id}>
                    <header>
                      <div>
                        <strong>{review.displayName}</strong>
                        {identity?.userId === review.userId ? <span className="own-review-badge">{reviewCopy.yours}</span> : null}
                      </div>
                      <time dateTime={review.createdAt}>{dateFormatter.format(new Date(review.createdAt))}</time>
                    </header>
                    <div className="review-card-stars" aria-label={`${review.rating} ${reviewCopy.starUnit}`}>
                      {STAR_VALUES.map((value) => (
                        <span className={value <= review.rating ? "is-filled" : ""} key={value} aria-hidden="true">★</span>
                      ))}
                    </div>
                    {review.body ? <p>{review.body}</p> : null}
                  </article>
                ))}
              </div>

              {hasMore ? (
                <button className="button button-secondary review-load-more" type="button" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? reviewCopy.loadingMore : reviewCopy.loadMore}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
