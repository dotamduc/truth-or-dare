import { describe, expect, it } from "vitest";
import dareRows from "@/data/prompts.dare.vi.json";
import truthRows from "@/data/prompts.truth.vi.json";
import { StaticPromptDatabaseSchema } from "@/features/prompts/schemas/promptSchema";
import { checkDuplicatePrompt } from "@/features/prompts/services/deduplicate";
import { createPromptFingerprint, normalizeVietnamesePrompt, removeGeneratedIndexSuffix } from "@/features/prompts/services/normalize";

describe("static prompt database", () => {
  const truth = StaticPromptDatabaseSchema.parse(truthRows);
  const dare = StaticPromptDatabaseSchema.parse(dareRows);

  it("contains exactly 70 Truth and 70 Dare", () => {
    expect(truth).toHaveLength(70);
    expect(dare).toHaveLength(70);
  });

  it("matches the required difficulty distribution", () => {
    const count = (rows: typeof truth, difficulty: string) => rows.filter((prompt) => prompt.difficulty === difficulty).length;
    expect([count(truth, "EASY"), count(truth, "MEDIUM"), count(truth, "BOLD"), count(truth, "HARD")]).toEqual([18, 18, 17, 17]);
    expect([count(dare, "EASY"), count(dare, "MEDIUM"), count(dare, "BOLD"), count(dare, "HARD")]).toEqual([17, 17, 18, 18]);
  });

  it("has unique IDs, NFC text and no generated suffix", () => {
    const rows = [...truth, ...dare];
    expect(new Set(rows.map((prompt) => prompt.id)).size).toBe(140);
    expect(rows.every((prompt) => prompt.text === prompt.text.normalize("NFC"))).toBe(true);
    expect(rows.every((prompt) => !/\s*\(#\d+\)\s*$/u.test(prompt.text))).toBe(true);
  });

  it("has no exact duplicate after normalization", () => {
    const fingerprints = [...truth, ...dare].map((prompt) => createPromptFingerprint(prompt.text));
    expect(new Set(fingerprints).size).toBe(fingerprints.length);
  });
});

describe("duplicate detector", () => {
  it("detects exact and near duplicates", () => {
    expect(checkDuplicatePrompt("  Kể một câu chuyện vui. ", ["Kể một câu chuyện vui."]).isExactDuplicate).toBe(true);
    const near = checkDuplicatePrompt("Hãy kể một câu chuyện hài hước trong 30 giây.", ["Kể một câu chuyện hài hước trong 30 giây."], 0.7);
    expect(near.isNearDuplicate).toBe(true);
  });

  it("normalizes Vietnamese Unicode and generated suffixes", () => {
    expect(normalizeVietnamesePrompt("  Ca\u0302u ho\u0309i na\u0300y? ")).toBe("câu hỏi này?");
    expect(removeGeneratedIndexSuffix("Câu hỏi này? (#12)")).toBe("Câu hỏi này?");
  });
});
