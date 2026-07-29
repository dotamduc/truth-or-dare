import type { GameFilters, PromptType, StaticPrompt } from "./types";

export interface PromptFilterOptions extends GameFilters {
  playerCount: number;
}

export function isAgeAllowed(promptAge: number, selectedAge: number): boolean {
  return promptAge <= selectedAge;
}

export function filterEligiblePrompts(
  source: StaticPrompt[],
  options: PromptFilterOptions,
  usedPromptIds: ReadonlySet<string>,
  hiddenPromptIds: ReadonlySet<string>,
  requestedType: PromptType,
  excludedPromptIds: ReadonlySet<string> = new Set(),
): StaticPrompt[] {
  return source.filter((prompt) => {
    if (prompt.type !== requestedType) return false;
    if (usedPromptIds.has(prompt.id) || hiddenPromptIds.has(prompt.id) || excludedPromptIds.has(prompt.id)) return false;
    if (!isAgeAllowed(prompt.minimumAge, options.minimumAge)) return false;
    if (!options.allowedDifficulties.includes(prompt.difficulty)) return false;
    if (options.categories.length > 0 && !prompt.categories.some((category) => options.categories.includes(category))) return false;
    if (options.audiences.length > 0 && !prompt.audiences.some((audience) => options.audiences.includes(audience))) return false;
    if (prompt.requiresProps && !options.allowProps) return false;
    if (prompt.requiresPhone && !options.allowPhone) return false;
    if (prompt.requiresInternet && !options.allowInternet) return false;
    if (prompt.requiresMovement && !options.allowMovement) return false;
    if (prompt.requiresPhysicalContact && !options.allowPhysicalContact) return false;
    if (prompt.requiresAnotherPlayer && options.playerCount < 2) return false;
    if (prompt.isPrivate && !options.allowPrivate) return false;
    if (prompt.isSensitive && !options.allowSensitive) return false;
    return true;
  });
}

export function selectRandomPrompt(candidates: StaticPrompt[], random: () => number = Math.random): StaticPrompt | null {
  if (candidates.length === 0) return null;
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  return candidates[index] ?? null;
}

export function selectPromptWithFallback(
  source: StaticPrompt[],
  options: PromptFilterOptions,
  usedPromptIds: ReadonlySet<string>,
  hiddenPromptIds: ReadonlySet<string>,
  requestedType: PromptType,
  excludedPromptIds: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): { prompt: StaticPrompt | null; poolReset: boolean } {
  const unused = filterEligiblePrompts(source, options, usedPromptIds, hiddenPromptIds, requestedType, excludedPromptIds);
  if (unused.length > 0) return { prompt: selectRandomPrompt(unused, random), poolReset: false };

  const safelyReusable = filterEligiblePrompts(source, options, new Set(), hiddenPromptIds, requestedType, excludedPromptIds);
  if (safelyReusable.length > 0) return { prompt: selectRandomPrompt(safelyReusable, random), poolReset: true };
  return { prompt: null, poolReset: true };
}
