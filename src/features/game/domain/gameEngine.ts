import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";

export type SelectionMode = "ROUND_ROBIN" | "BALANCED_RANDOM";
export type PromptType = "TRUTH" | "DARE";
export type TurnOutcome = "PRESENTED" | "COMPLETED" | "SKIPPED" | "REPLACED" | "REFUSED" | "EXPIRED";

export interface PlayerValidationResult {
  valid: boolean;
  error?: string;
  normalizedNames: string[];
}

/**
 * Validates player list for a game session.
 * Requirements:
 * - 2 to 10 players
 * - Each name between 1 and 24 characters
 * - No empty names
 * - No duplicate names after normalization
 */
export function validatePlayerNames(names: string[]): PlayerValidationResult {
  if (!names || !Array.isArray(names)) {
    return { valid: false, error: "Danh sách người chơi không hợp lệ.", normalizedNames: [] };
  }

  const trimmed = names.map((n) => (n || "").trim()).filter((n) => n.length > 0);

  if (trimmed.length < 2) {
    return { valid: false, error: "Cần tối thiểu 2 người chơi để bắt đầu.", normalizedNames: [] };
  }

  if (trimmed.length > 10) {
    return { valid: false, error: "Tối đa chỉ hỗ trợ 10 người chơi trên cùng một thiết bị.", normalizedNames: [] };
  }

  const normalizedNames: string[] = [];
  const seen = new Set<string>();

  for (const name of trimmed) {
    if (name.length > 24) {
      return {
        valid: false,
        error: `Tên "${name}" quá dài (tối đa 24 ký tự).`,
        normalizedNames: [],
      };
    }

    const norm = normalizeVietnamesePrompt(name);
    if (seen.has(norm)) {
      return {
        valid: false,
        error: `Tên người chơi "${name}" bị trùng lặp trong danh sách.`,
        normalizedNames: [],
      };
    }
    seen.add(norm);
    normalizedNames.push(name);
  }

  return { valid: true, normalizedNames };
}

/**
 * Shuffles an array of items (Fisher-Yates shuffle).
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Determines the index of the next player.
 */
export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number,
  mode: SelectionMode,
  playerTurnCounts: number[]
): number {
  if (totalPlayers <= 1) return 0;

  if (mode === "ROUND_ROBIN") {
    return (currentIndex + 1) % totalPlayers;
  }

  // BALANCED_RANDOM: Avoid selecting the current player consecutively if totalPlayers > 1
  // Weight inversely proportional to turns played
  const candidateIndices: number[] = [];
  const weights: number[] = [];

  const maxTurns = Math.max(...playerTurnCounts, 0);

  for (let i = 0; i < totalPlayers; i++) {
    if (i === currentIndex && totalPlayers > 1) continue;
    candidateIndices.push(i);
    // Higher weight for players with fewer turns
    const turns = playerTurnCounts[i] || 0;
    const weight = maxTurns - turns + 1;
    weights.push(weight);
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < candidateIndices.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return candidateIndices[i];
    }
  }

  return candidateIndices[0];
}

/**
 * Calculates score earned for a turn based on outcome and prompt type.
 */
export function calculateTurnPoints(outcome: TurnOutcome, type: PromptType): number {
  if (outcome === "COMPLETED") {
    return type === "TRUTH" ? 1 : 2;
  }
  return 0;
}
