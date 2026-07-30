import { describe, expect, it } from "vitest";
import { prompts } from "@/data/prompts";
import { calculateTurnPoints, choosePrompt, createGameState, finishTurn, getNextPlayerIndex, replaceCurrentPrompt, shufflePlayerOrder, validatePlayerNames } from "@/features/game/domain/gameEngine";
import { filterEligiblePrompts, selectPromptWithFallback } from "@/features/game/domain/promptSelector";
import type { GameFilters, StaticPrompt } from "@/features/game/domain/types";

const filters: GameFilters = {
  minimumAge: 16,
  allowedDifficulties: ["EASY", "MEDIUM", "BOLD", "HARD"],
  audiences: ["friends"],
  categories: [],
  allowProps: true,
  allowPhone: true,
  allowInternet: true,
  allowMovement: true,
  allowPhysicalContact: true,
  allowPrivate: true,
  allowSensitive: true,
};

describe("player validation and selection", () => {
  it("accepts 2-10 unique trimmed names", () => {
    expect(validatePlayerNames([" An ", "Bình"])).toMatchObject({ valid: true, normalizedNames: ["An", "Bình"] });
    expect(validatePlayerNames(["An"])).toMatchObject({ valid: false });
    expect(validatePlayerNames(Array.from({ length: 11 }, (_, index) => `Người ${index}`))).toMatchObject({ valid: false });
  });

  it("rejects blank and duplicate names after normalization", () => {
    expect(validatePlayerNames(["An", " "]).error).toContain("để trống");
    expect(validatePlayerNames([" An ", "an"]).error).toContain("trùng");
  });

  it("supports round robin and balanced random", () => {
    expect(getNextPlayerIndex(2, 3, "ROUND_ROBIN", [1, 1, 1])).toBe(0);
    expect(getNextPlayerIndex(0, 3, "BALANCED_RANDOM", [2, 0, 1], () => 0)).toBe(1);
    expect(getNextPlayerIndex(1, 3, "BALANCED_RANDOM", [0, 1, 0], () => 0.99)).toBe(2);
  });

  it("shuffles player order without changing the player list", () => {
    const original = ["An", "Bình", "Chi"];
    const shuffled = shufflePlayerOrder(original, () => 0.99);
    expect(shuffled).not.toEqual(original);
    expect([...shuffled].sort()).toEqual([...original].sort());
    expect(original).toEqual(["An", "Bình", "Chi"]);
  });
});

describe("prompt filtering", () => {
  it("enforces age, difficulty, category and audience filters", () => {
    const result = filterEligiblePrompts(prompts, { ...filters, minimumAge: 13, allowedDifficulties: ["EASY"], categories: ["music"], audiences: ["family"], playerCount: 2 }, new Set(), new Set(), "DARE");
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((prompt) => prompt.minimumAge <= 13 && prompt.difficulty === "EASY" && prompt.categories.includes("music") && prompt.audiences.includes("family"))).toBe(true);
  });

  it("denies every elevated safety capability until explicitly enabled", () => {
    const restricted: GameFilters = { ...filters, allowProps: false, allowPhone: false, allowInternet: false, allowMovement: false, allowPhysicalContact: false, allowPrivate: false, allowSensitive: false };
    const safeTruth = prompts.find((prompt) =>
      prompt.type === "TRUTH"
      && prompt.minimumAge <= 16
      && prompt.audiences.includes("friends")
      && !prompt.requiresProps
      && !prompt.requiresPhone
      && !prompt.requiresInternet
      && !prompt.requiresMovement
      && !prompt.requiresPhysicalContact
      && !prompt.isPrivate
      && !prompt.isSensitive
    );
    expect(safeTruth, "expected at least one unrestricted Truth prompt").toBeDefined();
    const flagCases: Array<[keyof StaticPrompt, keyof GameFilters]> = [
      ["requiresProps", "allowProps"], ["requiresPhone", "allowPhone"], ["requiresInternet", "allowInternet"],
      ["requiresMovement", "allowMovement"], ["requiresPhysicalContact", "allowPhysicalContact"],
      ["isPrivate", "allowPrivate"], ["isSensitive", "allowSensitive"],
    ];
    for (const [promptFlag, permission] of flagCases) {
      const sample = { ...safeTruth!, id: `truth-easy-099`, [promptFlag]: true } as StaticPrompt;
      expect(filterEligiblePrompts([sample], { ...restricted, playerCount: 2 }, new Set(), new Set(), "TRUTH")).toHaveLength(0);
      expect(filterEligiblePrompts([sample], { ...restricted, [permission]: true, playerCount: 2 }, new Set(), new Set(), "TRUTH")).toHaveLength(1);
    }
  });

  it("keeps safety filters while resetting an exhausted used pool", () => {
    const safeTruths = prompts.filter((prompt) => prompt.type === "TRUTH" && prompt.difficulty === "EASY" && !prompt.isPrivate && !prompt.isSensitive);
    const result = selectPromptWithFallback(safeTruths, { ...filters, allowedDifficulties: ["EASY"], playerCount: 2 }, new Set(safeTruths.map((prompt) => prompt.id)), new Set(), "TRUTH", new Set(), () => 0);
    expect(result.poolReset).toBe(true);
    expect(result.prompt?.minimumAge).toBeLessThanOrEqual(16);
  });

  it("excludes hidden prompts", () => {
    const first = prompts.find((prompt) => prompt.type === "TRUTH" && prompt.difficulty === "EASY")!;
    const eligible = filterEligiblePrompts(prompts, { ...filters, allowedDifficulties: ["EASY"], playerCount: 2 }, new Set(), new Set([first.id]), "TRUTH");
    expect(eligible.some((prompt) => prompt.id === first.id)).toBe(false);
  });
});

describe("client game state", () => {
  it("scores complete turns and advances the round", () => {
    expect(calculateTurnPoints("COMPLETED", "TRUTH")).toBe(1);
    expect(calculateTurnPoints("COMPLETED", "DARE")).toBe(2);
    expect(calculateTurnPoints("SKIPPED", "DARE")).toBe(0);
    let state = createGameState(["An", "Bình"], 1, "ROUND_ROBIN", filters, new Date("2026-01-01T00:00:00.000Z"));
    state = choosePrompt(state, "TRUTH", new Set(), () => 0).state;
    state = finishTurn(state, "COMPLETED", () => 0, new Date("2026-01-01T00:01:00.000Z"));
    expect(state.players[0]).toMatchObject({ score: 1, totalTurns: 1, completedTruths: 1 });
    expect(state.currentPlayerIndex).toBe(1);
    state = choosePrompt(state, "DARE", new Set(), () => 0).state;
    state = finishTurn(state, "SKIPPED", () => 0, new Date("2026-01-01T00:02:00.000Z"));
    expect(state.gameStatus).toBe("COMPLETED");
    expect(state.players[1].skipped).toBe(1);
  });

  it("replace never returns the current prompt", () => {
    let state = createGameState(["An", "Bình"], 2, "ROUND_ROBIN", filters);
    state = choosePrompt(state, "TRUTH", new Set(), () => 0).state;
    const currentId = state.currentPrompt?.id;
    const replacement = replaceCurrentPrompt(state, new Set(), () => 0);
    expect(replacement.prompt).not.toBeNull();
    expect(replacement.prompt?.id).not.toBe(currentId);
  });
});
