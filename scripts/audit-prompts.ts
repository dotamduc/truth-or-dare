import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { StaticPromptDatabaseSchema, type Difficulty, type StaticPrompt } from "../src/features/prompts/schemas/promptSchema";
import { calculateJaccardSimilarity } from "../src/features/prompts/services/deduplicate";
import { createPromptFingerprint, getCharNGrams, getTokenSet, normalizeVietnamesePrompt } from "../src/features/prompts/services/normalize";

type Severity = "BLOCKER" | "WARNING";
type Issue = { severity: Severity; code: string; promptId?: string; message: string };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = path.join(ROOT, "reports");
const NEAR_THRESHOLD = 0.82;
const SOURCES = [
  { file: "src/data/prompts.truth.vi.json", type: "TRUTH" as const },
  { file: "src/data/prompts.dare.vi.json", type: "DARE" as const },
];
const EXPECTED_DISTRIBUTION: Record<"TRUTH" | "DARE", Record<Difficulty, number>> = {
  TRUTH: { EASY: 18, MEDIUM: 18, BOLD: 17, HARD: 17 },
  DARE: { EASY: 17, MEDIUM: 17, BOLD: 18, HARD: 18 },
};

const SUFFIX_PATTERN = /\s*\(#\d+\)\s*$/u;
const PLACEHOLDER_PATTERN = /\{(?:target|topic|action)\}|\$\{[^}]+\}|\b(?:TODO|TBD)\b/iu;
const KNOWN_LANGUAGE_ERRORS = ["xấu hói", "dại khụt", "dã hoàn thành", "trở lời", "uồng rượu", "thử thách thách"];
const PROHIBITED_PATTERN = /mật khẩu|tài khoản ngân hàng|số căn cước|địa chỉ nhà|uống (?:hết|liền)|rượu|chất kích thích|nín thở|tự gây đau|tự gây hại|cởi đồ|quấy rối người lạ|gọi số khẩn cấp|đăng bài|đọc tin nhắn riêng|phá (?:đồ|hoại)|leo trèo|chạy ra đường/iu;

function readSource(relativePath: string, issues: Issue[]): StaticPrompt[] {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
    const parsed = StaticPromptDatabaseSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ severity: "BLOCKER", code: "SCHEMA_INVALID", message: `${relativePath}: ${parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}` });
      return [];
    }
    return parsed.data;
  } catch (error) {
    issues.push({ severity: "BLOCKER", code: "INVALID_JSON", message: `${relativePath}: ${error instanceof Error ? error.message : "JSON không hợp lệ"}` });
    return [];
  }
}

function similarity(left: string, right: string): number {
  return Math.max(
    calculateJaccardSimilarity(getTokenSet(left), getTokenSet(right)),
    calculateJaccardSimilarity(getCharNGrams(left), getCharNGrams(right)),
  );
}

function countBy<T extends string>(values: T[]): Record<T, number> {
  return values.reduce<Record<T, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

function validatePrompt(prompt: StaticPrompt, expectedType: "TRUTH" | "DARE", issues: Issue[]): void {
  const normalized = normalizeVietnamesePrompt(prompt.text);
  const add = (code: string, message: string) => issues.push({ severity: "BLOCKER", code, promptId: prompt.id, message });
  if (prompt.type !== expectedType || !prompt.id.startsWith(expectedType.toLowerCase())) add("WRONG_TYPE", "Type hoặc prefix ID không khớp file.");
  if (prompt.text !== prompt.text.normalize("NFC")) add("NON_NFC", "Text chưa chuẩn hóa Unicode NFC.");
  if (SUFFIX_PATTERN.test(prompt.text)) add("GENERATOR_SUFFIX", "Có suffix generator (#n).");
  if (PLACEHOLDER_PATTERN.test(prompt.text)) add("PLACEHOLDER", "Có placeholder hoặc TODO/TBD.");
  if (PROHIBITED_PATTERN.test(prompt.text)) add("PROHIBITED_CONTENT", "Khớp quy tắc nội dung bị cấm.");
  const languageError = KNOWN_LANGUAGE_ERRORS.find((phrase) => normalized.includes(phrase));
  if (languageError) add("KNOWN_LANGUAGE_ERROR", `Có cụm từ lỗi: ${languageError}.`);
  if (prompt.requiresPhysicalContact && !prompt.requiresAnotherPlayer) add("INVALID_SAFETY_FLAG", "Tiếp xúc cơ thể phải cần người chơi khác.");

  if (prompt.type === "TRUTH" && !prompt.text.endsWith("?")) add("TRUTH_NOT_QUESTION", "Truth phải là câu hỏi rõ ràng.");
  if (prompt.type === "DARE") {
    if (!/^(nói|diễn|kể|hát|dùng|thực hiện|bắt|cùng|đọc|vẽ|nhảy|tạo|giữ|nếu|giả vờ|đứng|vỗ|đặt|quảng cáo|ngân nga|tường thuật|lặp lại|sáng tạo|sáng tác|quan sát|điều khiển|mô tả|giới thiệu|nhắm mắt|làm|ghi nhớ)/iu.test(prompt.text)) {
      add("DARE_NOT_ACTION", "Dare phải bắt đầu bằng một hành động cụ thể.");
    }
    if (/bắt tay|nắm tay|chạm nhẹ trán/iu.test(prompt.text) && !prompt.requiresPhysicalContact) add("INVALID_SAFETY_FLAG", "Nội dung tiếp xúc cơ thể thiếu cờ tương ứng.");
    if (/vẽ|dùng .*đồ vật|đồ vật (?:an toàn|bình thường|gần)|cuốn sách|sách trên đầu|sơ đồ|quan sát bảy đồ vật/iu.test(prompt.text) && !/không (?:nói hoặc )?chạm vào điện thoại/iu.test(prompt.text) && !prompt.requiresProps) add("INVALID_SAFETY_FLAG", "Nội dung cần đạo cụ thiếu cờ tương ứng.");
    if (/nhảy|squat|bước năm bước|đứng bằng một chân|tạo dáng|động tác không lời|động tác tay|làm động tác|diễn tả cách dùng/iu.test(prompt.text) && !prompt.requiresMovement) add("INVALID_SAFETY_FLAG", "Nội dung cần vận động thiếu cờ tương ứng.");
    if (/cả nhóm|nhóm (?:đoán|chọn|đọc|đưa|gọi|tạo)|người (?:ngồi|bên|đối diện|khác|trong nhóm)/iu.test(prompt.text) && !prompt.requiresAnotherPlayer) add("INVALID_SAFETY_FLAG", "Nội dung cần người chơi khác thiếu cờ tương ứng.");
  }
}

function main(): void {
  const issues: Issue[] = [];
  const prompts = SOURCES.flatMap((source) => {
    const rows = readSource(source.file, issues);
    rows.forEach((prompt) => validatePrompt(prompt, source.type, issues));
    return rows;
  });
  const truths = prompts.filter((prompt) => prompt.type === "TRUTH");
  const dares = prompts.filter((prompt) => prompt.type === "DARE");
  if (truths.length !== 70) issues.push({ severity: "BLOCKER", code: "TRUTH_COUNT", message: `Truth phải bằng 70, thực tế ${truths.length}.` });
  if (dares.length !== 70) issues.push({ severity: "BLOCKER", code: "DARE_COUNT", message: `Dare phải bằng 70, thực tế ${dares.length}.` });

  for (const [type, rows] of [["TRUTH", truths], ["DARE", dares]] as const) {
    const distribution = countBy(rows.map((prompt) => prompt.difficulty));
    for (const difficulty of ["EASY", "MEDIUM", "BOLD", "HARD"] as const) {
      const actual = distribution[difficulty] ?? 0;
      const expected = EXPECTED_DISTRIBUTION[type][difficulty];
      if (actual !== expected) issues.push({ severity: "BLOCKER", code: "DIFFICULTY_DISTRIBUTION", message: `${type} ${difficulty} phải bằng ${expected}, thực tế ${actual}.` });
    }
  }

  const idCounts = countBy(prompts.map((prompt) => prompt.id));
  for (const [id, count] of Object.entries(idCounts)) if (count > 1) issues.push({ severity: "BLOCKER", code: "DUPLICATE_ID", promptId: id, message: `ID xuất hiện ${count} lần.` });

  const exactGroups = new Map<string, StaticPrompt[]>();
  for (const prompt of prompts) {
    const fingerprint = createPromptFingerprint(prompt.text);
    exactGroups.set(fingerprint, [...(exactGroups.get(fingerprint) ?? []), prompt]);
  }
  const exactDuplicates = [...exactGroups.values()].filter((group) => group.length > 1);
  exactDuplicates.forEach((group) => issues.push({ severity: "BLOCKER", code: "EXACT_DUPLICATE", message: group.map((prompt) => prompt.id).join(", ") }));

  const nearDuplicates: Array<{ leftId: string; rightId: string; score: number }> = [];
  for (let left = 0; left < prompts.length; left += 1) {
    for (let right = left + 1; right < prompts.length; right += 1) {
      if (prompts[left].type !== prompts[right].type) continue;
      if (createPromptFingerprint(prompts[left].text) === createPromptFingerprint(prompts[right].text)) continue;
      const score = similarity(prompts[left].text, prompts[right].text);
      if (score >= NEAR_THRESHOLD) {
        nearDuplicates.push({ leftId: prompts[left].id, rightId: prompts[right].id, score: Number(score.toFixed(4)) });
        issues.push({ severity: "BLOCKER", code: "NEAR_DUPLICATE", message: `${prompts[left].id} gần trùng ${prompts[right].id} (${score.toFixed(4)}).` });
      }
    }
  }

  const blockers = issues.filter((issue) => issue.severity === "BLOCKER");
  const warnings = issues.filter((issue) => issue.severity === "WARNING");
  const report = {
    generatedAt: new Date().toISOString(),
    nearDuplicateThreshold: NEAR_THRESHOLD,
    summary: {
      total: prompts.length,
      truthTotal: truths.length,
      dareTotal: dares.length,
      exactDuplicateGroups: exactDuplicates.length,
      nearDuplicatePairs: nearDuplicates.length,
      invalidMetadata: issues.filter((issue) => ["SCHEMA_INVALID", "INVALID_JSON", "WRONG_TYPE", "DUPLICATE_ID", "NON_NFC"].includes(issue.code)).length,
      invalidSafetyFlags: issues.filter((issue) => issue.code === "INVALID_SAFETY_FLAG").length,
      blockerCount: blockers.length,
      warningCount: warnings.length,
    },
    distributions: {
      truthDifficulty: countBy(truths.map((prompt) => prompt.difficulty)),
      dareDifficulty: countBy(dares.map((prompt) => prompt.difficulty)),
      totalDifficulty: countBy(prompts.map((prompt) => prompt.difficulty)),
      categories: countBy(prompts.flatMap((prompt) => prompt.categories)),
      audiences: countBy(prompts.flatMap((prompt) => prompt.audiences)),
    },
    nearDuplicates,
    issues,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, "prompt-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const markdown = [
    "# Prompt audit",
    "",
    `Generated: ${report.generatedAt}`,
    `Near-duplicate threshold: ${NEAR_THRESHOLD}`,
    "",
    "## Summary",
    "",
    `- Truth: ${truths.length}`,
    `- Dare: ${dares.length}`,
    `- Exact duplicate groups: ${exactDuplicates.length}`,
    `- Near-duplicate pairs: ${nearDuplicates.length}`,
    `- Invalid metadata: ${report.summary.invalidMetadata}`,
    `- Invalid safety flags: ${report.summary.invalidSafetyFlags}`,
    `- Blockers: ${blockers.length}`,
    `- Warnings: ${warnings.length}`,
    "",
    "## Difficulty",
    "",
    `- Truth: EASY ${report.distributions.truthDifficulty.EASY ?? 0}, MEDIUM ${report.distributions.truthDifficulty.MEDIUM ?? 0}, BOLD ${report.distributions.truthDifficulty.BOLD ?? 0}, HARD ${report.distributions.truthDifficulty.HARD ?? 0}`,
    `- Dare: EASY ${report.distributions.dareDifficulty.EASY ?? 0}, MEDIUM ${report.distributions.dareDifficulty.MEDIUM ?? 0}, BOLD ${report.distributions.dareDifficulty.BOLD ?? 0}, HARD ${report.distributions.dareDifficulty.HARD ?? 0}`,
    "",
    "## Issues",
    "",
    ...(issues.length === 0 ? ["No issues."] : issues.map((issue) => `- **${issue.severity} ${issue.code}**${issue.promptId ? ` (${issue.promptId})` : ""}: ${issue.message}`)),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(REPORT_DIR, "prompt-audit.md"), markdown, "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
  if (blockers.length > 0) process.exitCode = 1;
}

main();
