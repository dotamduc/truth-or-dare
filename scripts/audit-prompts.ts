import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { StaticPromptDatabaseSchema, type StaticPrompt } from "../src/features/prompts/schemas/promptSchema";
import { calculateJaccardSimilarity } from "../src/features/prompts/services/deduplicate";
import { createPromptFingerprint, getCharNGrams, getTokenSet, normalizeVietnamesePrompt } from "../src/features/prompts/services/normalize";

type Severity = "BLOCKER" | "WARNING";
type Issue = { severity: Severity; code: string; promptId?: string; message: string };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = path.join(ROOT, "reports");
const IMPORT_MANIFEST_PATH = path.join(ROOT, "src/data/prompts.import-manifest.json");
const NEAR_THRESHOLD = 0.82;
const EXPECTED_SOURCE_FILE = "question.txt";
const EXPECTED_SOURCE_SHA256 = "689629cfd150fbed8638dd42018c998693461108d6cab5d7930596d4b2bc49fc";
const EXPECTED_CONTENT_SHA256 = "ffa48bea7d47e34d57580fd862e8ce752e27de9d6df6c426be57836dc2a3aa0f";
const EXPECTED_TOTAL = 595;
const EXPECTED_TRUTH_TOTAL = 337;
const EXPECTED_DARE_TOTAL = 258;
const EXPECTED_EXACT_DUPLICATE_GROUPS = 2;
const EXPECTED_EXACT_DUPLICATE_ITEMS = 4;
const EXPECTED_TRUTH_DIFFICULTY = { EASY: 10, MEDIUM: 20, BOLD: 196, HARD: 111 } as const;
const EXPECTED_DARE_DIFFICULTY = { EASY: 57, MEDIUM: 76, BOLD: 40, HARD: 85 } as const;
const SOURCES = [
  { file: "src/data/prompts.truth.vi.json", type: "TRUTH" as const },
  { file: "src/data/prompts.dare.vi.json", type: "DARE" as const },
];
const DifficultyDistributionSchema = z.object({
  EASY: z.number().int().nonnegative(),
  MEDIUM: z.number().int().nonnegative(),
  BOLD: z.number().int().nonnegative(),
  HARD: z.number().int().nonnegative(),
}).strict();
const ImportManifestSchema = z.object({
  sourceFile: z.string().min(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  contentSha256: z.string().regex(/^[a-f0-9]{64}$/u),
  total: z.number().int().positive(),
  truthTotal: z.number().int().positive(),
  dareTotal: z.number().int().positive(),
  exactDuplicateGroups: z.number().int().nonnegative(),
  exactDuplicateItems: z.number().int().nonnegative(),
  truthDifficulty: DifficultyDistributionSchema,
  dareDifficulty: DifficultyDistributionSchema,
  sections: z.array(z.object({ type: z.enum(["TRUTH", "DARE"]), section: z.string().min(1), count: z.number().int().positive() }).strict()).min(1),
}).strict();

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

function readImportManifest(issues: Issue[]): z.infer<typeof ImportManifestSchema> | null {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(IMPORT_MANIFEST_PATH, "utf8"));
    const parsed = ImportManifestSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ severity: "BLOCKER", code: "MANIFEST_INVALID", message: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
      return null;
    }
    return parsed.data;
  } catch (error) {
    issues.push({ severity: "BLOCKER", code: "MANIFEST_INVALID", message: error instanceof Error ? error.message : "Import manifest không hợp lệ." });
    return null;
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
  const add = (code: string, message: string, severity: Severity = "BLOCKER") => issues.push({ severity, code, promptId: prompt.id, message });
  if (prompt.type !== expectedType || !prompt.id.startsWith(expectedType.toLowerCase())) add("WRONG_TYPE", "Type hoặc prefix ID không khớp file.");
  if (prompt.text !== prompt.text.normalize("NFC")) add("NON_NFC", "Text chưa chuẩn hóa Unicode NFC.");
  if (SUFFIX_PATTERN.test(prompt.text)) add("GENERATOR_SUFFIX", "Có suffix generator (#n).");
  if (PLACEHOLDER_PATTERN.test(prompt.text)) add("PLACEHOLDER", "Có placeholder hoặc TODO/TBD.");
  if (PROHIBITED_PATTERN.test(prompt.text)) {
    add(prompt.isSensitive ? "SENSITIVE_SOURCE_CONTENT" : "UNFLAGGED_SENSITIVE_CONTENT", prompt.isSensitive ? "Nội dung nhạy cảm từ file nguồn đã được giữ lại và gắn cờ." : "Nội dung nhạy cảm từ file nguồn chưa được gắn cờ.", prompt.isSensitive ? "WARNING" : "BLOCKER");
  }
  const languageError = KNOWN_LANGUAGE_ERRORS.find((phrase) => normalized.includes(phrase));
  if (languageError) add("KNOWN_LANGUAGE_ERROR", `Có cụm từ lỗi: ${languageError}.`);
  if (prompt.requiresPhysicalContact && !prompt.requiresAnotherPlayer) add("INVALID_SAFETY_FLAG", "Tiếp xúc cơ thể phải cần người chơi khác.");

  if (prompt.type === "TRUTH" && !prompt.text.endsWith("?")) add("TRUTH_SOURCE_FORMAT", "Truth trong file nguồn không kết thúc bằng dấu hỏi.", "WARNING");
  if (prompt.type === "DARE") {
    if (/bắt tay|nắm tay|chạm nhẹ trán|làm lại kiểu tóc|trang điểm lại cho bạn|tạo cho bạn một kiểu tóc|tạo .*kiểu tóc .*cho người .*dùng ngón tay|thì thầm .* vào tai/iu.test(prompt.text) && !prompt.requiresPhysicalContact) add("INVALID_SAFETY_FLAG", "Nội dung tiếp xúc cơ thể thiếu cờ tương ứng.");
    if (/vẽ|dùng .*đồ vật|đồ vật (?:an toàn|bình thường|gần)|vật dụng|cuốn sách|sách trên đầu|sơ đồ|quan sát bảy đồ vật|trang điểm lại cho bạn/iu.test(prompt.text) && !/không (?:nói hoặc )?chạm vào điện thoại/iu.test(prompt.text) && !prompt.requiresProps) add("INVALID_SAFETY_FLAG", "Nội dung cần đạo cụ thiếu cờ tương ứng.");
    if (/nhảy|squat|bước năm bước|đứng bằng một chân|tạo dáng|động tác không lời|động tác tay|làm động tác|diễn tả cách dùng|ra ngoài|nằm cầu/iu.test(prompt.text) && !prompt.requiresMovement) add("INVALID_SAFETY_FLAG", "Nội dung cần vận động thiếu cờ tương ứng.");
    if (/cả nhóm|nhóm (?:đoán|chọn|đọc|đưa|gọi|tạo)|người (?:nào đó|ngồi|bên|đối diện|khác|trong nhóm)|thì thầm .* em\/anh .* vào tai/iu.test(prompt.text) && !prompt.requiresAnotherPlayer) add("INVALID_SAFETY_FLAG", "Nội dung cần người chơi khác thiếu cờ tương ứng.");
    if (/gọi mưa/iu.test(prompt.text) && prompt.requiresPhone) add("INVALID_SAFETY_FLAG", "Cụm gọi mưa không yêu cầu điện thoại.");
    if (/không/iu.test(prompt.text) && !/(?<![\p{L}\p{N}])(?:hôn|ôm|cù)(?![\p{L}\p{N}])|mát-xa|massage|chạm|liếm .*chân|ngửi (?:nách|cánh tay)|đổi (?:quần áo|quần|áo)|mặc .* của .*người|nắm tay|tựa đầu|bắt tay|làm lại kiểu tóc|trang điểm lại cho bạn|tạo cho bạn một kiểu tóc|tạo .*kiểu tóc .*cho người .*dùng ngón tay|thì thầm .* vào tai/iu.test(prompt.text) && prompt.requiresPhysicalContact) add("INVALID_SAFETY_FLAG", "Từ không không được suy luận nhầm thành hành động hôn.");
    if (/bốn chân/iu.test(prompt.text) && prompt.requiresAnotherPlayer) add("INVALID_SAFETY_FLAG", "Từ bốn không được suy luận nhầm thành bố.");
  }
}

function main(): void {
  const issues: Issue[] = [];
  const manifest = readImportManifest(issues);
  const prompts = SOURCES.flatMap((source) => {
    const rows = readSource(source.file, issues);
    rows.forEach((prompt) => validatePrompt(prompt, source.type, issues));
    return rows;
  });
  const truths = prompts.filter((prompt) => prompt.type === "TRUTH");
  const dares = prompts.filter((prompt) => prompt.type === "DARE");
  if (manifest) {
    const manifestContract = [
      ["sourceFile", manifest.sourceFile, EXPECTED_SOURCE_FILE],
      ["sourceSha256", manifest.sourceSha256, EXPECTED_SOURCE_SHA256],
      ["contentSha256", manifest.contentSha256, EXPECTED_CONTENT_SHA256],
      ["total", manifest.total, EXPECTED_TOTAL],
      ["truthTotal", manifest.truthTotal, EXPECTED_TRUTH_TOTAL],
      ["dareTotal", manifest.dareTotal, EXPECTED_DARE_TOTAL],
      ["exactDuplicateGroups", manifest.exactDuplicateGroups, EXPECTED_EXACT_DUPLICATE_GROUPS],
      ["exactDuplicateItems", manifest.exactDuplicateItems, EXPECTED_EXACT_DUPLICATE_ITEMS],
    ] as const;
    for (const [field, actual, expected] of manifestContract) {
      if (actual !== expected) issues.push({ severity: "BLOCKER", code: "MANIFEST_CONTRACT", message: `Manifest ${field} phải bằng ${expected}, thực tế ${actual}.` });
    }
    for (const [type, actualDistribution, expectedDistribution] of [
      ["TRUTH", manifest.truthDifficulty, EXPECTED_TRUTH_DIFFICULTY],
      ["DARE", manifest.dareDifficulty, EXPECTED_DARE_DIFFICULTY],
    ] as const) {
      for (const difficulty of ["EASY", "MEDIUM", "BOLD", "HARD"] as const) {
        if (actualDistribution[difficulty] !== expectedDistribution[difficulty]) {
          issues.push({ severity: "BLOCKER", code: "MANIFEST_CONTRACT", message: `Manifest ${type} ${difficulty} phải bằng ${expectedDistribution[difficulty]}, thực tế ${actualDistribution[difficulty]}.` });
        }
      }
    }
  }
  if (truths.length !== EXPECTED_TRUTH_TOTAL) issues.push({ severity: "BLOCKER", code: "TRUTH_COUNT", message: `Truth phải bằng ${EXPECTED_TRUTH_TOTAL}, thực tế ${truths.length}.` });
  if (dares.length !== EXPECTED_DARE_TOTAL) issues.push({ severity: "BLOCKER", code: "DARE_COUNT", message: `Dare phải bằng ${EXPECTED_DARE_TOTAL}, thực tế ${dares.length}.` });
  if (prompts.length !== EXPECTED_TOTAL) issues.push({ severity: "BLOCKER", code: "TOTAL_COUNT", message: `Tổng phải bằng ${EXPECTED_TOTAL}, thực tế ${prompts.length}.` });
  const contentSha256 = createHash("sha256").update(JSON.stringify(prompts.map(({ type, text }) => [type, text]))).digest("hex");
  if (contentSha256 !== EXPECTED_CONTENT_SHA256) issues.push({ severity: "BLOCKER", code: "CONTENT_HASH", message: `SHA-256 nội dung phải bằng ${EXPECTED_CONTENT_SHA256}, thực tế ${contentSha256}.` });

  for (const [type, rows, expectedDistribution] of [
    ["TRUTH", truths, EXPECTED_TRUTH_DIFFICULTY],
    ["DARE", dares, EXPECTED_DARE_DIFFICULTY],
  ] as const) {
    const distribution = countBy(rows.map((prompt) => prompt.difficulty));
    for (const difficulty of ["EASY", "MEDIUM", "BOLD", "HARD"] as const) {
      const actual = distribution[difficulty] ?? 0;
      const expected = expectedDistribution[difficulty];
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
  const exactDuplicateItems = exactDuplicates.reduce((sum, group) => sum + group.length, 0);
  exactDuplicates.forEach((group) => issues.push({ severity: "WARNING", code: "SOURCE_EXACT_DUPLICATE", message: `Giữ nguyên các mục lặp từ file nguồn: ${group.map((prompt) => prompt.id).join(", ")}.` }));
  if (exactDuplicates.length !== EXPECTED_EXACT_DUPLICATE_GROUPS) issues.push({ severity: "BLOCKER", code: "DUPLICATE_COUNT", message: `Số nhóm lặp phải bằng ${EXPECTED_EXACT_DUPLICATE_GROUPS}, thực tế ${exactDuplicates.length}.` });
  if (exactDuplicateItems !== EXPECTED_EXACT_DUPLICATE_ITEMS) issues.push({ severity: "BLOCKER", code: "DUPLICATE_ITEM_COUNT", message: `Số mục thuộc nhóm lặp phải bằng ${EXPECTED_EXACT_DUPLICATE_ITEMS}, thực tế ${exactDuplicateItems}.` });

  const nearDuplicates: Array<{ leftId: string; rightId: string; score: number }> = [];
  for (let left = 0; left < prompts.length; left += 1) {
    for (let right = left + 1; right < prompts.length; right += 1) {
      if (prompts[left].type !== prompts[right].type) continue;
      if (createPromptFingerprint(prompts[left].text) === createPromptFingerprint(prompts[right].text)) continue;
      const score = similarity(prompts[left].text, prompts[right].text);
      if (score >= NEAR_THRESHOLD) {
        nearDuplicates.push({ leftId: prompts[left].id, rightId: prompts[right].id, score: Number(score.toFixed(4)) });
        issues.push({ severity: "WARNING", code: "SOURCE_NEAR_DUPLICATE", message: `${prompts[left].id} gần trùng ${prompts[right].id} (${score.toFixed(4)}), được giữ lại theo file nguồn.` });
      }
    }
  }

  const blockers = issues.filter((issue) => issue.severity === "BLOCKER");
  const warnings = issues.filter((issue) => issue.severity === "WARNING");
  const report = {
    generatedAt: new Date().toISOString(),
    source: manifest ? { file: manifest.sourceFile, sha256: manifest.sourceSha256, sections: manifest.sections.length } : null,
    nearDuplicateThreshold: NEAR_THRESHOLD,
    summary: {
      total: prompts.length,
      truthTotal: truths.length,
      dareTotal: dares.length,
      exactDuplicateGroups: exactDuplicates.length,
      nearDuplicatePairs: nearDuplicates.length,
      invalidMetadata: issues.filter((issue) => ["SCHEMA_INVALID", "INVALID_JSON", "MANIFEST_INVALID", "MANIFEST_CONTRACT", "WRONG_TYPE", "DUPLICATE_ID", "DUPLICATE_COUNT", "DUPLICATE_ITEM_COUNT", "TOTAL_COUNT", "CONTENT_HASH", "TRUTH_COUNT", "DARE_COUNT", "DIFFICULTY_DISTRIBUTION", "NON_NFC"].includes(issue.code)).length,
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
