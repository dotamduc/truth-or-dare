import { describe, it, expect } from "vitest";
import {
  validatePlayerNames,
  shuffleArray,
  getNextPlayerIndex,
  calculateTurnPoints,
} from "@/features/game/domain/gameEngine";
import {
  isAgeAllowed,
  filterEligiblePrompts,
  selectPromptWithFallback,
  PromptItem,
} from "@/features/game/domain/promptSelector";

describe("Game Engine Domain Logic", () => {
  describe("Player Validation", () => {
    it("should reject less than 2 players", () => {
      const res = validatePlayerNames(["An"]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("tối thiểu 2 người");
    });

    it("should reject more than 10 players", () => {
      const names = Array.from({ length: 11 }, (_, i) => `Player ${i + 1}`);
      const res = validatePlayerNames(names);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Tối đa chỉ hỗ trợ 10 người");
    });

    it("should reject duplicate player names after normalization", () => {
      const res = validatePlayerNames(["  An  ", "Bình", "an"]);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("bị trùng lặp");
    });

    it("should accept valid list of 2 to 10 players", () => {
      const res = validatePlayerNames(["  An  ", "Bình", "Chi"]);
      expect(res.valid).toBe(true);
      expect(res.normalizedNames).toEqual(["An", "Bình", "Chi"]);
    });
  });

  describe("Player Selection Modes", () => {
    it("should advance sequentially in ROUND_ROBIN mode", () => {
      expect(getNextPlayerIndex(0, 3, "ROUND_ROBIN", [1, 0, 0])).toBe(1);
      expect(getNextPlayerIndex(1, 3, "ROUND_ROBIN", [1, 1, 0])).toBe(2);
      expect(getNextPlayerIndex(2, 3, "ROUND_ROBIN", [1, 1, 1])).toBe(0);
    });

    it("should avoid selecting current player in BALANCED_RANDOM when total > 1", () => {
      for (let i = 0; i < 20; i++) {
        const next = getNextPlayerIndex(1, 4, "BALANCED_RANDOM", [1, 1, 1, 1]);
        expect(next).not.toBe(1);
      }
    });
  });

  describe("Scoring", () => {
    it("should award +1 for Truth completed and +2 for Dare completed", () => {
      expect(calculateTurnPoints("COMPLETED", "TRUTH")).toBe(1);
      expect(calculateTurnPoints("COMPLETED", "DARE")).toBe(2);
      expect(calculateTurnPoints("SKIPPED", "TRUTH")).toBe(0);
      expect(calculateTurnPoints("REFUSED", "DARE")).toBe(0);
    });
  });

  describe("Prompt Selection & Safety Filtering", () => {
    const mockPrompts: PromptItem[] = [
      {
        id: "p1",
        type: "TRUTH",
        text: "Câu hỏi 13+ dễ",
        difficulty: "EASY",
        minimumAge: "AGE_13_PLUS",
        requiresProps: false,
        requiresPhone: false,
        requiresInternet: false,
        requiresMovement: false,
        requiresPhysicalContact: false,
        requiresAnotherPlayer: false,
        isPrivate: false,
        isSensitive: false,
        qualityScore: 1.0,
        timesServed: 0,
      },
      {
        id: "p2",
        type: "TRUTH",
        text: "Câu hỏi 18+ táo bạo",
        difficulty: "BOLD",
        minimumAge: "AGE_18_PLUS",
        requiresProps: false,
        requiresPhone: false,
        requiresInternet: false,
        requiresMovement: false,
        requiresPhysicalContact: false,
        requiresAnotherPlayer: false,
        isPrivate: false,
        isSensitive: false,
        qualityScore: 1.0,
        timesServed: 0,
      },
      {
        id: "p3",
        type: "DARE",
        text: "Thử thách vận động có đụng chạm",
        difficulty: "MEDIUM",
        minimumAge: "AGE_13_PLUS",
        requiresProps: false,
        requiresPhone: false,
        requiresInternet: false,
        requiresMovement: true,
        requiresPhysicalContact: true,
        requiresAnotherPlayer: true,
        isPrivate: false,
        isSensitive: false,
        qualityScore: 1.0,
        timesServed: 0,
      },
    ];

    it("should enforce age restrictions strictly", () => {
      expect(isAgeAllowed("AGE_13_PLUS", "AGE_13_PLUS")).toBe(true);
      expect(isAgeAllowed("AGE_16_PLUS", "AGE_13_PLUS")).toBe(false);
      expect(isAgeAllowed("AGE_18_PLUS", "AGE_16_PLUS")).toBe(false);
    });

    it("should filter out 18+ prompts when session is 13+", () => {
      const eligible = filterEligiblePrompts(
        mockPrompts,
        { minimumAge: "AGE_13_PLUS", allowedDifficulties: ["EASY", "BOLD"] },
        new Set(),
        "TRUTH"
      );
      expect(eligible.length).toBe(1);
      expect(eligible[0].id).toBe("p1");
    });

    it("should filter out physical contact dares if disallowed", () => {
      const eligible = filterEligiblePrompts(
        mockPrompts,
        {
          minimumAge: "AGE_13_PLUS",
          allowedDifficulties: ["EASY", "MEDIUM"],
          allowPhysicalContact: false,
        },
        new Set(),
        "DARE"
      );
      expect(eligible.length).toBe(0);
    });

    it("should handle pool exhaustion with safe fallback without violating age rules", () => {
      const usedIds = new Set(["p1"]);
      const res = selectPromptWithFallback(
        mockPrompts,
        { minimumAge: "AGE_13_PLUS", allowedDifficulties: ["EASY"] },
        usedIds,
        "TRUTH"
      );
      expect(res.poolExhausted).toBe(true);
      expect(res.prompt?.id).toBe("p1"); // Re-selected p1 safely
    });
  });
});
