import { getCharNGrams, normalizeVietnamesePrompt } from "./normalize";

export interface DuplicateCheckResult {
  isExactDuplicate: boolean;
  isNearDuplicate: boolean;
  similarityScore: number;
  matchedPromptText?: string;
}

/**
 * Calculates Jaccard similarity between two sets of n-grams.
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionSize = 0;
  for (const elem of setA) {
    if (setB.has(elem)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Checks a new candidate prompt text against an array of existing prompt texts.
 */
export function checkDuplicatePrompt(
  candidateText: string,
  existingTexts: string[],
  nearThreshold = 0.8
): DuplicateCheckResult {
  const normalizedCandidate = normalizeVietnamesePrompt(candidateText);
  const candidateNGrams = getCharNGrams(normalizedCandidate);

  let highestScore = 0;
  let matchedText: string | undefined = undefined;
  const exact = false;

  for (const existing of existingTexts) {
    const normalizedExisting = normalizeVietnamesePrompt(existing);

    if (normalizedCandidate === normalizedExisting) {
      return {
        isExactDuplicate: true,
        isNearDuplicate: true,
        similarityScore: 1.0,
        matchedPromptText: existing,
      };
    }

    const existingNGrams = getCharNGrams(normalizedExisting);
    const score = calculateJaccardSimilarity(candidateNGrams, existingNGrams);

    if (score > highestScore) {
      highestScore = score;
      matchedText = existing;
    }
  }

  return {
    isExactDuplicate: exact,
    isNearDuplicate: highestScore >= nearThreshold,
    similarityScore: highestScore,
    matchedPromptText: matchedText,
  };
}
