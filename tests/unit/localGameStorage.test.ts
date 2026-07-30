import { describe, expect, it } from "vitest";
import { createGameState } from "@/features/game/domain/gameEngine";
import type { GameFilters } from "@/features/game/domain/types";
import { GAME_STORAGE_KEY, HIDDEN_PROMPTS_STORAGE_KEY, deserializeGameState, loadGameState, loadHiddenPromptIds, saveGameState, saveHiddenPromptIds, type StorageLike } from "@/features/game/persistence/localGameStorage";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const filters: GameFilters = {
  minimumAge: 13,
  allowedDifficulties: ["EASY"],
  audiences: ["friends"],
  categories: [],
  allowProps: false,
  allowPhone: false,
  allowInternet: false,
  allowMovement: false,
  allowPhysicalContact: false,
  allowPrivate: false,
  allowSensitive: false,
};

describe("local game storage", () => {
  it("serializes and restores a valid game", () => {
    const storage = new MemoryStorage();
    const game = createGameState(["An", "Bình"], 3, "ROUND_ROBIN", filters, new Date("2026-01-01T00:00:00.000Z"));
    expect(saveGameState(game, storage)).toBe(true);
    expect(loadGameState(storage)).toEqual(game);
  });

  it("recovers from corrupted JSON without crashing", () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_STORAGE_KEY, "{broken");
    expect(loadGameState(storage)).toBeNull();
  });

  it("rejects and clears incompatible schema versions", () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_STORAGE_KEY, JSON.stringify({ schemaVersion: 999 }));
    expect(loadGameState(storage)).toBeNull();
    expect(storage.getItem(GAME_STORAGE_KEY)).toBeNull();
    expect(deserializeGameState(JSON.stringify({ schemaVersion: 999 }))).toBeNull();
  });

  it("clears version 1 data after the prompt database replacement", () => {
    const storage = new MemoryStorage();
    storage.setItem("truth-or-dare:game:v1", JSON.stringify({ schemaVersion: 1 }));
    storage.setItem("truth-or-dare:hidden-prompts:v1", JSON.stringify(["truth-easy-001"]));
    expect(loadGameState(storage)).toBeNull();
    expect(loadHiddenPromptIds(storage)).toEqual(new Set());
    expect(storage.getItem("truth-or-dare:game:v1")).toBeNull();
    expect(storage.getItem("truth-or-dare:hidden-prompts:v1")).toBeNull();
  });

  it("stores, restores and validates hidden prompt IDs", () => {
    const storage = new MemoryStorage();
    expect(saveHiddenPromptIds(new Set(["truth-easy-001", "dare-hard-018"]), storage)).toBe(true);
    expect(loadHiddenPromptIds(storage)).toEqual(new Set(["truth-easy-001", "dare-hard-018"]));
    storage.setItem(HIDDEN_PROMPTS_STORAGE_KEY, JSON.stringify(["not-a-prompt"]));
    expect(loadHiddenPromptIds(storage)).toEqual(new Set());
    expect(storage.getItem(HIDDEN_PROMPTS_STORAGE_KEY)).toBeNull();
  });
});
