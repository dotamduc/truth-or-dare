import { describe, it, expect } from "vitest";
import { normalizeVietnamesePrompt, removeVietnameseAccents } from "@/features/prompts/services/normalize";
import { checkDuplicatePrompt, calculateJaccardSimilarity } from "@/features/prompts/services/deduplicate";
import { PromptInputSchema } from "@/features/prompts/schemas/promptSchema";

describe("Vietnamese Prompt Normalization & Deduplication Pipeline", () => {
  it("should correctly normalize whitespace and punctuation without stripping accents", () => {
    const raw = "   Bài  hát nào   gần đây  bạn nghe  nhiều nhất ?   ";
    const normalized = normalizeVietnamesePrompt(raw);
    expect(normalized).toBe("bài hát nào gần đây bạn nghe nhiều nhất?");
  });

  it("should create correct fingerprint by removing accents", () => {
    const text = "Kể một bí mật vui của bạn";
    const fp = removeVietnameseAccents(text);
    expect(fp).toBe("kemotbimatvuicuaban");
  });

  it("should detect exact duplicate prompts", () => {
    const existing = ["Nói một lời khen chân thành với người bên trái bạn."];
    const candidate = "   Nói một lời khen chân thành với người bên trái bạn.  ";
    const result = checkDuplicatePrompt(candidate, existing);
    expect(result.isExactDuplicate).toBe(true);
    expect(result.similarityScore).toBe(1.0);
  });

  it("should detect near-duplicate prompts", () => {
    const existing = ["Kể một câu chuyện hài hước trong 30 giây."];
    const candidate = "Hãy kể một câu chuyện hài hước trong 30 giây.";
    const result = checkDuplicatePrompt(candidate, existing, 0.7);
    expect(result.isNearDuplicate).toBe(true);
    expect(result.similarityScore).toBeGreaterThan(0.7);
  });

  it("should validate valid prompt input with Zod", () => {
    const input = {
      type: "TRUTH",
      text: "Món ăn ưa thích nhất của bạn là gì?",
      difficulty: "EASY",
      minimumAge: "AGE_13_PLUS",
      categories: ["funny", "icebreaker"],
      audiences: ["FRIENDS", "FAMILY"],
    };
    const parsed = PromptInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });
});
