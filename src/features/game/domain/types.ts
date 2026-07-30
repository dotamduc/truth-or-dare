import type { Audience, Category, Difficulty, MinimumAge, PromptType, StaticPrompt } from "@/features/prompts/schemas/promptSchema";

export const GAME_SCHEMA_VERSION = 2 as const;

export type SelectionMode = "ROUND_ROBIN" | "BALANCED_RANDOM";
export type GameStatus = "ACTIVE" | "COMPLETED";
export type TurnOutcome = "COMPLETED" | "SKIPPED";

export interface Player {
  id: string;
  name: string;
  score: number;
  totalTurns: number;
  completedTruths: number;
  completedDares: number;
  skipped: number;
}

export interface GameFilters {
  minimumAge: MinimumAge;
  allowedDifficulties: Difficulty[];
  audiences: Audience[];
  categories: Category[];
  allowProps: boolean;
  allowPhone: boolean;
  allowInternet: boolean;
  allowMovement: boolean;
  allowPhysicalContact: boolean;
  allowPrivate: boolean;
  allowSensitive: boolean;
}

export interface GameState {
  schemaVersion: typeof GAME_SCHEMA_VERSION;
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  totalRounds: number;
  selectionMode: SelectionMode;
  filters: GameFilters;
  usedPromptIds: string[];
  currentPrompt: StaticPrompt | null;
  gameStatus: GameStatus;
  completedTurns: number;
  startedAt: string;
  updatedAt: string;
}

export interface PromptSelectionResult {
  state: GameState;
  prompt: StaticPrompt | null;
  poolReset: boolean;
  message?: string;
}

export type { Audience, Category, Difficulty, MinimumAge, PromptType, StaticPrompt };
