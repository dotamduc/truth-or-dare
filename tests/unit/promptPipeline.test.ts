import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import dareRows from "@/data/prompts.dare.vi.json";
import manifest from "@/data/prompts.import-manifest.json";
import truthRows from "@/data/prompts.truth.vi.json";
import { StaticPromptDatabaseSchema } from "@/features/prompts/schemas/promptSchema";
import { checkDuplicatePrompt } from "@/features/prompts/services/deduplicate";
import { createPromptFingerprint, normalizeVietnamesePrompt, removeGeneratedIndexSuffix } from "@/features/prompts/services/normalize";

const EXPECTED_SOURCE_SHA256 = "689629cfd150fbed8638dd42018c998693461108d6cab5d7930596d4b2bc49fc";
const EXPECTED_CONTENT_SHA256 = "ffa48bea7d47e34d57580fd862e8ce752e27de9d6df6c426be57836dc2a3aa0f";
const EXPECTED_TOTAL = 595;
const EXPECTED_TRUTH_TOTAL = 337;
const EXPECTED_DARE_TOTAL = 258;
const EXPECTED_EXACT_DUPLICATE_GROUPS = 2;
const EXPECTED_EXACT_DUPLICATE_ITEMS = 4;
const EXPECTED_TRUTH_DIFFICULTY = [10, 20, 196, 111];
const EXPECTED_DARE_DIFFICULTY = [57, 76, 40, 85];

describe("static prompt database", () => {
  const truth = StaticPromptDatabaseSchema.parse(truthRows);
  const dare = StaticPromptDatabaseSchema.parse(dareRows);

  it("locks the imported source contract", () => {
    expect(manifest).toMatchObject({
      sourceFile: "question.txt",
      sourceSha256: EXPECTED_SOURCE_SHA256,
      contentSha256: EXPECTED_CONTENT_SHA256,
      total: EXPECTED_TOTAL,
      truthTotal: EXPECTED_TRUTH_TOTAL,
      dareTotal: EXPECTED_DARE_TOTAL,
      exactDuplicateGroups: EXPECTED_EXACT_DUPLICATE_GROUPS,
      exactDuplicateItems: EXPECTED_EXACT_DUPLICATE_ITEMS,
    });
    expect(truth).toHaveLength(EXPECTED_TRUTH_TOTAL);
    expect(dare).toHaveLength(EXPECTED_DARE_TOTAL);
    expect(truth.length + dare.length).toBe(EXPECTED_TOTAL);
    expect(createHash("sha256").update(JSON.stringify([...truth, ...dare].map(({ type, text }) => [type, text]))).digest("hex")).toBe(EXPECTED_CONTENT_SHA256);
  });

  it("matches the imported difficulty distribution", () => {
    const count = (rows: typeof truth, difficulty: string) => rows.filter((prompt) => prompt.difficulty === difficulty).length;
    expect([count(truth, "EASY"), count(truth, "MEDIUM"), count(truth, "BOLD"), count(truth, "HARD")]).toEqual(EXPECTED_TRUTH_DIFFICULTY);
    expect([count(dare, "EASY"), count(dare, "MEDIUM"), count(dare, "BOLD"), count(dare, "HARD")]).toEqual(EXPECTED_DARE_DIFFICULTY);
    expect(Object.values(manifest.truthDifficulty)).toEqual(EXPECTED_TRUTH_DIFFICULTY);
    expect(Object.values(manifest.dareDifficulty)).toEqual(EXPECTED_DARE_DIFFICULTY);
  });

  it("has unique IDs, NFC text and no generated suffix", () => {
    const rows = [...truth, ...dare];
    expect(new Set(rows.map((prompt) => prompt.id)).size).toBe(EXPECTED_TOTAL);
    expect(rows.every((prompt) => prompt.text === prompt.text.normalize("NFC"))).toBe(true);
    expect(rows.every((prompt) => !/\s*\(#\d+\)\s*$/u.test(prompt.text))).toBe(true);
  });

  it("preserves the exact duplicates present in the source file", () => {
    const fingerprints = [...truth, ...dare].map((prompt) => createPromptFingerprint(prompt.text));
    const counts = new Map<string, number>();
    fingerprints.forEach((fingerprint) => counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1));
    const duplicateCounts = [...counts.values()].filter((count) => count > 1);
    expect(duplicateCounts).toHaveLength(EXPECTED_EXACT_DUPLICATE_GROUPS);
    expect(duplicateCounts.reduce((sum, count) => sum + count, 0)).toBe(EXPECTED_EXACT_DUPLICATE_ITEMS);
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
