export type MinimumAge = "AGE_13_PLUS" | "AGE_16_PLUS" | "AGE_18_PLUS";
export type Difficulty = "EASY" | "MEDIUM" | "BOLD" | "HARD";
export type PromptType = "TRUTH" | "DARE";

export interface PromptItem {
  id: string;
  type: PromptType;
  text: string;
  difficulty: Difficulty;
  minimumAge: MinimumAge;
  requiresProps: boolean;
  requiresPhone: boolean;
  requiresInternet: boolean;
  requiresMovement: boolean;
  requiresPhysicalContact: boolean;
  requiresAnotherPlayer: boolean;
  isPrivate: boolean;
  isSensitive: boolean;
  qualityScore: number;
  timesServed: number;
  categories?: { category: { slug: string } }[];
  audiences?: { audience: { slug: string } }[];
}

export interface SessionFilterOptions {
  minimumAge: MinimumAge;
  allowedDifficulties: Difficulty[];
  audiences?: string[];
  categories?: string[];
  allowProps?: boolean;
  allowPhone?: boolean;
  allowPhysicalContact?: boolean;
}

const AGE_HIERARCHY: Record<MinimumAge, number> = {
  AGE_13_PLUS: 13,
  AGE_16_PLUS: 16,
  AGE_18_PLUS: 18,
};

/**
 * Checks if a prompt's minimum age is permitted under the session's age limit.
 */
export function isAgeAllowed(promptAge: MinimumAge, sessionAge: MinimumAge): boolean {
  return AGE_HIERARCHY[promptAge] <= AGE_HIERARCHY[sessionAge];
}

/**
 * Hard filters candidate prompts based on session settings and safety rules.
 */
export function filterEligiblePrompts(
  prompts: PromptItem[],
  options: SessionFilterOptions,
  usedPromptIds: Set<string>,
  requestedType: PromptType
): PromptItem[] {
  return prompts.filter((p) => {
    // Type check
    if (p.type !== requestedType) return false;

    // Already used in session?
    if (usedPromptIds.has(p.id)) return false;

    // Age constraint (STRICT)
    if (!isAgeAllowed(p.minimumAge, options.minimumAge)) return false;

    // Difficulty constraint
    if (options.allowedDifficulties && options.allowedDifficulties.length > 0) {
      if (!options.allowedDifficulties.includes(p.difficulty)) return false;
    }

    // Safety constraints
    if (p.requiresPhysicalContact && options.allowPhysicalContact === false) return false;
    if (p.requiresProps && options.allowProps === false) return false;
    if (p.requiresPhone && options.allowPhone === false) return false;

    // Audience filter (if specified)
    if (options.audiences && options.audiences.length > 0 && p.audiences) {
      const pAuds = p.audiences.map((a) => a.audience.slug);
      const hasMatchingAud = pAuds.includes("ANY") || pAuds.some((aud) => options.audiences!.includes(aud));
      if (!hasMatchingAud) return false;
    }

    // Category filter (if specified)
    if (options.categories && options.categories.length > 0 && p.categories) {
      const pCats = p.categories.map((c) => c.category.slug);
      const hasMatchingCat = pCats.some((cat) => options.categories!.includes(cat));
      if (!hasMatchingCat) return false;
    }

    return true;
  });
}

/**
 * Performs weighted random selection from eligible candidates based on quality score and times served.
 */
export function selectWeightedPrompt(candidates: PromptItem[]): PromptItem | null {
  if (!candidates || candidates.length === 0) return null;

  const weights = candidates.map((p) => {
    // Quality score boost (default 1.0)
    const qScore = Math.max(0.1, p.qualityScore || 1.0);
    // Recency / Frequency penalty: prompts served fewer times get higher weight
    const freqPenalty = 1 / (1 + (p.timesServed || 0) * 0.1);
    return qScore * freqPenalty;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < candidates.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return candidates[i];
    }
  }

  return candidates[0];
}

/**
 * Selects prompt with safe fallback if main candidate pool is exhausted.
 */
export function selectPromptWithFallback(
  allPrompts: PromptItem[],
  options: SessionFilterOptions,
  usedPromptIds: Set<string>,
  requestedType: PromptType
): { prompt: PromptItem | null; poolExhausted: boolean } {
  // Try selecting from unused prompts
  const candidates = filterEligiblePrompts(allPrompts, options, usedPromptIds, requestedType);

  if (candidates.length > 0) {
    const selected = selectWeightedPrompt(candidates);
    return { prompt: selected, poolExhausted: false };
  }

  // Fallback: Reset used ids for this type, BUT KEEP STRICT AGE & SAFETY FILTERS
  const fallbackCandidates = filterEligiblePrompts(allPrompts, options, new Set(), requestedType);
  if (fallbackCandidates.length > 0) {
    const selected = selectWeightedPrompt(fallbackCandidates);
    return { prompt: selected, poolExhausted: true };
  }

  return { prompt: null, poolExhausted: true };
}
