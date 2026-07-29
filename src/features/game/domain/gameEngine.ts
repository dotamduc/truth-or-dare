import { prompts } from "@/data/prompts";
import { normalizeVietnamesePrompt } from "@/features/prompts/services/normalize";
import { selectPromptWithFallback } from "./promptSelector";
import { GAME_SCHEMA_VERSION, type GameFilters, type GameState, type Player, type PromptSelectionResult, type PromptType, type SelectionMode, type TurnOutcome } from "./types";

export interface PlayerValidationResult {
  valid: boolean;
  error?: string;
  normalizedNames: string[];
}

export function validatePlayerNames(names: string[]): PlayerValidationResult {
  if (!Array.isArray(names)) return { valid: false, error: "Danh sách người chơi không hợp lệ.", normalizedNames: [] };
  if (names.length < 2) return { valid: false, error: "Cần tối thiểu 2 người chơi để bắt đầu.", normalizedNames: [] };
  if (names.length > 10) return { valid: false, error: "Tối đa 10 người chơi trên cùng một thiết bị.", normalizedNames: [] };

  const trimmed = names.map((name) => name.trim());
  if (trimmed.some((name) => name.length === 0)) return { valid: false, error: "Tên người chơi không được để trống.", normalizedNames: [] };
  if (trimmed.some((name) => name.length > 24)) return { valid: false, error: "Tên người chơi dài tối đa 24 ký tự.", normalizedNames: [] };

  const fingerprints = trimmed.map(normalizeVietnamesePrompt);
  if (new Set(fingerprints).size !== fingerprints.length) return { valid: false, error: "Tên người chơi không được trùng nhau.", normalizedNames: [] };
  return { valid: true, normalizedNames: trimmed };
}

export function shuffleArray<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function getNextPlayerIndex(
  currentIndex: number,
  totalPlayers: number,
  mode: SelectionMode,
  playerTurnCounts: number[],
  random: () => number = Math.random,
): number {
  if (totalPlayers <= 1) return 0;
  if (mode === "ROUND_ROBIN") return (currentIndex + 1) % totalPlayers;

  const candidates = Array.from({ length: totalPlayers }, (_, index) => index).filter((index) => index !== currentIndex);
  const minimumTurns = Math.min(...candidates.map((index) => playerTurnCounts[index] ?? 0));
  const leastPlayed = candidates.filter((index) => (playerTurnCounts[index] ?? 0) === minimumTurns);
  return leastPlayed[Math.min(leastPlayed.length - 1, Math.floor(random() * leastPlayed.length))] ?? candidates[0] ?? 0;
}

export function calculateTurnPoints(outcome: TurnOutcome, type: PromptType): number {
  return outcome === "COMPLETED" ? (type === "TRUTH" ? 1 : 2) : 0;
}

function makePlayer(name: string, index: number): Player {
  return { id: `player-${index + 1}`, name, score: 0, totalTurns: 0, completedTruths: 0, completedDares: 0, skipped: 0 };
}

export function createGameState(
  names: string[],
  totalRounds: number,
  selectionMode: SelectionMode,
  filters: GameFilters,
  now: Date = new Date(),
): GameState {
  const validation = validatePlayerNames(names);
  if (!validation.valid) throw new Error(validation.error);
  if (!Number.isInteger(totalRounds) || totalRounds < 1 || totalRounds > 20) throw new Error("Số vòng phải từ 1 đến 20.");
  const timestamp = now.toISOString();
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    players: validation.normalizedNames.map(makePlayer),
    currentPlayerIndex: 0,
    currentRound: 1,
    totalRounds,
    selectionMode,
    filters,
    usedPromptIds: [],
    currentPrompt: null,
    gameStatus: "ACTIVE",
    completedTurns: 0,
    startedAt: timestamp,
    updatedAt: timestamp,
  };
}

function resetUsedIdsForType(state: GameState, type: PromptType): string[] {
  const idsOfType = new Set(prompts.filter((prompt) => prompt.type === type).map((prompt) => prompt.id));
  return state.usedPromptIds.filter((id) => !idsOfType.has(id));
}

export function choosePrompt(
  state: GameState,
  type: PromptType,
  hiddenPromptIds: ReadonlySet<string>,
  random: () => number = Math.random,
  excludedPromptIds: ReadonlySet<string> = new Set(),
): PromptSelectionResult {
  if (state.gameStatus !== "ACTIVE") return { state, prompt: null, poolReset: false, message: "Ván chơi đã kết thúc." };
  const selected = selectPromptWithFallback(
    prompts,
    { ...state.filters, playerCount: state.players.length },
    new Set(state.usedPromptIds),
    hiddenPromptIds,
    type,
    excludedPromptIds,
    random,
  );
  if (!selected.prompt) return { state, prompt: null, poolReset: selected.poolReset, message: "Không còn câu phù hợp với bộ lọc hiện tại. Hãy điều chỉnh bộ lọc hoặc khôi phục câu đã ẩn." };
  const usedPromptIds = selected.poolReset ? resetUsedIdsForType(state, type) : [...state.usedPromptIds];
  usedPromptIds.push(selected.prompt.id);
  const nextState = { ...state, usedPromptIds: [...new Set(usedPromptIds)], currentPrompt: selected.prompt, updatedAt: new Date().toISOString() };
  return { state: nextState, prompt: selected.prompt, poolReset: selected.poolReset, message: selected.poolReset ? "Nhóm câu phù hợp đã dùng hết nên hệ thống bắt đầu lại nhóm này, không nới bộ lọc an toàn." : undefined };
}

export function replaceCurrentPrompt(state: GameState, hiddenPromptIds: ReadonlySet<string>, random: () => number = Math.random): PromptSelectionResult {
  if (!state.currentPrompt) return { state, prompt: null, poolReset: false, message: "Chưa có câu để đổi." };
  return choosePrompt(state, state.currentPrompt.type, hiddenPromptIds, random, new Set([state.currentPrompt.id]));
}

export function finishTurn(state: GameState, outcome: TurnOutcome, random: () => number = Math.random, now: Date = new Date()): GameState {
  const prompt = state.currentPrompt;
  if (!prompt || state.gameStatus !== "ACTIVE") return state;

  const players = state.players.map((player, index) => index === state.currentPlayerIndex ? {
    ...player,
    score: player.score + calculateTurnPoints(outcome, prompt.type),
    totalTurns: player.totalTurns + 1,
    completedTruths: player.completedTruths + (outcome === "COMPLETED" && prompt.type === "TRUTH" ? 1 : 0),
    completedDares: player.completedDares + (outcome === "COMPLETED" && prompt.type === "DARE" ? 1 : 0),
    skipped: player.skipped + (outcome === "SKIPPED" ? 1 : 0),
  } : player);
  const completedTurns = state.completedTurns + 1;
  const complete = completedTurns >= state.totalRounds * players.length;
  const nextIndex = complete ? state.currentPlayerIndex : getNextPlayerIndex(state.currentPlayerIndex, players.length, state.selectionMode, players.map((player) => player.totalTurns), random);
  return {
    ...state,
    players,
    completedTurns,
    currentPlayerIndex: nextIndex,
    currentRound: complete ? state.totalRounds : Math.floor(completedTurns / players.length) + 1,
    currentPrompt: null,
    gameStatus: complete ? "COMPLETED" : "ACTIVE",
    updatedAt: now.toISOString(),
  };
}

export function endGame(state: GameState, now: Date = new Date()): GameState {
  return { ...state, currentPrompt: null, gameStatus: "COMPLETED", updatedAt: now.toISOString() };
}

export function replayGame(state: GameState, now: Date = new Date()): GameState {
  return createGameState(state.players.map((player) => player.name), state.totalRounds, state.selectionMode, state.filters, now);
}
