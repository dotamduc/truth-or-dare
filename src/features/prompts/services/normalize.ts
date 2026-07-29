/**
 * Standardizes Vietnamese prompt text while retaining Vietnamese diacritics.
 */
export function normalizeVietnamesePrompt(text: string): string {
  if (!text) return "";

  return text
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with a single space
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width characters
    .replace(/\s+([.,!?])/g, "$1") // Fix space before punctuation
    .toLowerCase();
}

/** Removes the legacy generated index suffix without changing the display text otherwise. */
export function removeGeneratedIndexSuffix(text: string): string {
  return text.replace(/\s*\(#\d+\)\s*$/u, "").trim();
}

/**
 * Produces a comparison fingerprint that is stable across Unicode composition,
 * Vietnamese accents, punctuation, whitespace and legacy generator suffixes.
 */
export function createPromptFingerprint(text: string): string {
  return removeVietnameseAccents(
    normalizeVietnamesePrompt(removeGeneratedIndexSuffix(text))
  );
}

/**
 * Removes Vietnamese diacritics for near-duplicate fingerprinting.
 * Does NOT alter the original text for display.
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return "";

  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getTokenSet(text: string): Set<string> {
  const normalized = normalizeVietnamesePrompt(removeGeneratedIndexSuffix(text))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return new Set(normalized ? normalized.split(" ") : []);
}

/**
 * Generates a character n-gram set for text similarity matching.
 */
export function getCharNGrams(text: string, n = 3): Set<string> {
  const cleaned = removeVietnameseAccents(text);
  const ngrams = new Set<string>();
  if (cleaned.length < n) {
    ngrams.add(cleaned);
    return ngrams;
  }
  for (let i = 0; i <= cleaned.length - n; i++) {
    ngrams.add(cleaned.substring(i, i + n));
  }
  return ngrams;
}
