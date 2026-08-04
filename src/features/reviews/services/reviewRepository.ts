import {
  ensureAnonymousIdentity,
  type AnonymousIdentity,
} from "@/features/auth/services/anonymousIdentity";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  reviewInputSchema,
  type ReviewInput,
} from "../schemas/reviewSchema";

const GAME_ID = "truth-or-dare";

export type ReviewSummary = {
  reviewCount: number;
  averageRating: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReviewItem = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  displayName: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles:
    | { display_name: string; avatar_url: string | null }
    | { display_name: string; avatar_url: string | null }[]
    | null;
};

export async function getReviewSummary(): Promise<ReviewSummary> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("review_summary")
    .select("*")
    .eq("game_id", GAME_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    reviewCount: Number(data?.review_count ?? 0),
    averageRating: Number(data?.average_rating ?? 0),
    counts: {
      1: Number(data?.one_star_count ?? 0),
      2: Number(data?.two_star_count ?? 0),
      3: Number(data?.three_star_count ?? 0),
      4: Number(data?.four_star_count ?? 0),
      5: Number(data?.five_star_count ?? 0),
    },
  };
}

export async function getReviews(page = 0, pageSize = 10): Promise<ReviewItem[]> {
  const supabase = getSupabaseClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      body,
      created_at,
      updated_at,
      user_id,
      profiles!reviews_user_id_fkey (
        display_name,
        avatar_url
      )
    `)
    .eq("game_id", GAME_ID)
    .eq("status", "published")
    .not("body", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ReviewRow[]).map((review) => {
    const profile = Array.isArray(review.profiles)
      ? review.profiles[0]
      : review.profiles;

    return {
      id: review.id,
      rating: review.rating,
      body: review.body,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      userId: review.user_id,
      displayName: profile?.display_name ?? "ẨnDanh_unknown",
    };
  });
}

export async function getMyReview(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, body")
    .eq("game_id", GAME_ID)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function submitReview(input: ReviewInput): Promise<{
  identity: AnonymousIdentity;
}> {
  const parsed = reviewInputSchema.parse(input);
  const identity = await ensureAnonymousIdentity();
  const supabase = getSupabaseClient();
  const body = parsed.body.length > 0 ? parsed.body : null;
  const { data: existing, error: findError } = await supabase
    .from("reviews")
    .select("id")
    .eq("game_id", GAME_ID)
    .eq("user_id", identity.userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  const result = existing
    ? await supabase
        .from("reviews")
        .update({ rating: parsed.rating, body, locale: parsed.locale })
        .eq("id", existing.id)
    : await supabase.from("reviews").insert({
        game_id: GAME_ID,
        user_id: identity.userId,
        rating: parsed.rating,
        body,
        locale: parsed.locale,
      });

  if (result.error) {
    throw result.error;
  }

  return { identity };
}

export async function deleteMyReview(reviewId: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    throw error;
  }
}
