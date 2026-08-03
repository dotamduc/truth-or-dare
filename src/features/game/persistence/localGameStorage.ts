import { z } from "zod";
import { AudienceSchema, CategorySchema, DifficultySchema, MinimumAgeSchema, StaticPromptSchema } from "@/features/prompts/schemas/promptSchema";
import { GAME_SCHEMA_VERSION, type GameState } from "@/features/game/domain/types";

export const GAME_STORAGE_KEY = "truth-or-dare:game:v2";
export const HIDDEN_PROMPTS_STORAGE_KEY = "truth-or-dare:hidden-prompts:v2";
const LEGACY_GAME_STORAGE_KEYS = ["truth-or-dare:game:v1"] as const;
const LEGACY_HIDDEN_PROMPTS_STORAGE_KEYS = ["truth-or-dare:hidden-prompts:v1"] as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PlayerSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(24),
  score: z.number().int().min(0),
  totalTurns: z.number().int().min(0),
  completedTruths: z.number().int().min(0),
  completedDares: z.number().int().min(0),
  skipped: z.number().int().min(0),
}).strict();

const FiltersSchema = z.object({
  minimumAge: MinimumAgeSchema,
  allowedDifficulties: z.array(DifficultySchema).min(1).max(4),
  audiences: z.array(AudienceSchema).min(1).max(4),
  categories: z.array(CategorySchema).max(24),
  allowProps: z.boolean(),
  allowPhone: z.boolean(),
  allowInternet: z.boolean(),
  allowMovement: z.boolean(),
  allowPhysicalContact: z.boolean(),
  allowPrivate: z.boolean(),
  allowSensitive: z.boolean(),
}).strict();

export const GameStateSchema = z.object({
  schemaVersion: z.literal(GAME_SCHEMA_VERSION),
  players: z.array(PlayerSchema).min(2).max(10),
  currentPlayerIndex: z.number().int().min(0).max(9),
  currentRound: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),
  totalRounds: z.number().int().min(1).max(999).nullable(),
  selectionMode: z.enum(["ROUND_ROBIN", "BALANCED_RANDOM"]),
  filters: FiltersSchema,
  usedPromptIds: z.array(z.string().min(1).max(64)).max(1000),
  currentPrompt: StaticPromptSchema.nullable(),
  gameStatus: z.enum(["ACTIVE", "COMPLETED"]),
  completedTurns: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict().refine((state) => state.currentPlayerIndex < state.players.length, "Chỉ số người chơi không hợp lệ.");

const HiddenPromptIdsSchema = z.array(z.string().regex(/^(truth|dare)-(easy|medium|bold|hard)-\d{3}$/)).max(1000);

function removeKeys(storage: StorageLike, keys: readonly string[]): void {
  for (const key of keys) storage.removeItem(key);
}

function browserStorage(): StorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function serializeGameState(state: GameState): string {
  return JSON.stringify(GameStateSchema.parse(state));
}

export function deserializeGameState(raw: string): GameState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = GameStateSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState, storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(GAME_STORAGE_KEY, serializeGameState(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGameState(storage: StorageLike | null = browserStorage()): GameState | null {
  if (!storage) return null;
  try {
    removeKeys(storage, LEGACY_GAME_STORAGE_KEYS);
    const raw = storage.getItem(GAME_STORAGE_KEY);
    if (!raw) return null;
    const state = deserializeGameState(raw);
    if (!state) storage.removeItem(GAME_STORAGE_KEY);
    return state;
  } catch {
    return null;
  }
}

export function clearGameState(storage: StorageLike | null = browserStorage()): void {
  try {
    if (storage) removeKeys(storage, [GAME_STORAGE_KEY, ...LEGACY_GAME_STORAGE_KEYS]);
  } catch { /* Storage can be unavailable in privacy mode. */ }
}

export function loadHiddenPromptIds(storage: StorageLike | null = browserStorage()): Set<string> {
  if (!storage) return new Set();
  try {
    removeKeys(storage, LEGACY_HIDDEN_PROMPTS_STORAGE_KEYS);
    const raw = storage.getItem(HIDDEN_PROMPTS_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    const result = HiddenPromptIdsSchema.safeParse(parsed);
    if (!result.success) {
      storage.removeItem(HIDDEN_PROMPTS_STORAGE_KEY);
      return new Set();
    }
    return new Set(result.data);
  } catch {
    return new Set();
  }
}

export function saveHiddenPromptIds(ids: ReadonlySet<string>, storage: StorageLike | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    const values = HiddenPromptIdsSchema.parse([...ids]);
    storage.setItem(HIDDEN_PROMPTS_STORAGE_KEY, JSON.stringify(values));
    return true;
  } catch {
    return false;
  }
}

export function clearHiddenPromptIds(storage: StorageLike | null = browserStorage()): void {
  try {
    if (storage) removeKeys(storage, [HIDDEN_PROMPTS_STORAGE_KEY, ...LEGACY_HIDDEN_PROMPTS_STORAGE_KEYS]);
  } catch { /* Storage can be unavailable in privacy mode. */ }
}
