import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { StaticPromptDatabaseSchema, type Audience, type Category, type Difficulty, type MinimumAge, type StaticPrompt } from "../src/features/prompts/schemas/promptSchema";
import { createPromptFingerprint } from "../src/features/prompts/services/normalize";

type SourceType = "TRUTH" | "DARE";

interface SourceItem {
  type: SourceType;
  section: string;
  sectionIndex: number;
  text: string;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUTS: Record<SourceType, string> = {
  TRUTH: path.join(ROOT, "src/data/prompts.truth.vi.json"),
  DARE: path.join(ROOT, "src/data/prompts.dare.vi.json"),
};
const MANIFEST_PATH = path.join(ROOT, "src/data/prompts.import-manifest.json");
const EXPECTED_SOURCE_SHA256 = "689629cfd150fbed8638dd42018c998693461108d6cab5d7930596d4b2bc49fc";
const EXPECTED_CONTENT_SHA256 = "ffa48bea7d47e34d57580fd862e8ce752e27de9d6df6c426be57836dc2a3aa0f";
const EXPECTED_TOTAL = 595;
const EXPECTED_TRUTH_TOTAL = 337;
const EXPECTED_DARE_TOTAL = 258;

const EXPLICIT_PATTERN = /ân ái|tình dục|sext|ảnh nóng|phim x|lên đỉnh|tự sướng|thoát y|cởi (?:đồ|\d)|bao cao su|rên rỉ|đời sống tình dục|ngực trần|nude/iu;
const ROMANCE_PATTERN = /crush|(?<![\p{L}\p{N}])hôn(?![\p{L}\p{N}])|tán tỉnh|hẹn hò|người yêu|tình cảm|quyến rũ|hấp dẫn|chia tay|mối tình|tri kỷ|kết hôn/iu;
const PRIVATE_PATTERN = /bí mật|tin nhắn|lịch sử|điện thoại|danh bạ|(?<![\p{L}\p{N}])ảnh(?![\p{L}\p{N}])|người yêu cũ|crush|tình dục|ân ái|(?<![\p{L}\p{N}])hôn(?![\p{L}\p{N}])|riêng tư|google|tài khoản|mật khẩu|nhật ký|mối quan hệ|phản bội|gian lận|bất hợp pháp|trộm/iu;
const RISK_PATTERN = /liếm|ăn (?:một|cả|gói|thìa|tép)|uống|sốt nóng|tương ớt|mù tạt|xà phòng|hành tây sống|tỏi sống|đổ .*nước lạnh|đập .*trứng|viên đá vào quần|nhảy xuống|trồng cây chuối|lục .*điện thoại|mở khóa điện thoại|người lạ|số ngẫu nhiên|nhà hàng xóm|qua cửa sổ|ban công|không dùng tay|bịt mắt|(?<![\p{L}\p{N}])cù(?![\p{L}\p{N}])|hét|đánh nhau|nỗi đau|gây đau|phá hoại|chết đầu tiên/iu;
const PHONE_PATTERN = /điện thoại|tin nhắn|sms|danh bạ|cuộc gọi|gọi (?:cho|điện|một|người|bố|mẹ|cha mẹ|crush|người yêu|người lạ|số|nhà hàng)|nhắn|emoji|(?<![\p{L}\p{N}])ảnh(?![\p{L}\p{N}])|selfie|video|story|instagram|snapchat|tiktok|youtube|spotify|hinge|(?<![\p{L}\p{N}])dm(?![\p{L}\p{N}])|mạng xã hội|thời gian sử dụng màn hình/iu;
const INTERNET_PATTERN = /instagram|snapchat|tiktok|youtube|spotify|hinge|(?<![\p{L}\p{N}])dm(?![\p{L}\p{N}])|mạng xã hội|trực tuyến|google|story|(?<![\p{L}\p{N}])live(?![\p{L}\p{N}])|fyp|reel/iu;
const MOVEMENT_PATTERN = /nhảy|múa|vũ đạo|squat|plank|hít đất|chống đẩy|đứng|đi |bước|chạy|bò |twerk|catwalk|moonwalk|lò cò|thăng bằng|trồng cây chuối|tạo dáng|quay \d|vẫy tay|ba-lê|ballet|cua|khủng long|ra ngoài|nằm cầu/iu;
const CONTACT_PATTERN = /(?<![\p{L}\p{N}])(?:hôn|ôm|cù)(?![\p{L}\p{N}])|mát-xa|massage|chạm|liếm .*chân|ngửi (?:nách|cánh tay)|đổi (?:quần áo|quần|áo)|mặc .* của .*người|nắm tay|tựa đầu|bắt tay|làm lại kiểu tóc|trang điểm lại cho bạn|tạo cho bạn một kiểu tóc|tạo .*kiểu tóc .*cho người .*dùng ngón tay|thì thầm .* vào tai/iu;
const OTHER_PLAYER_PATTERN = /ai đó|người nào đó|người (?:bên|ngồi|đối diện|chơi|trong phòng|trong nhóm|khác|bạn chọn)|cả nhóm|nhóm |mọi người|từng người|bạn bè|(?<![\p{L}\p{N}])(?:bố|mẹ|ex)(?![\p{L}\p{N}])|cha mẹ|gia đình|crush|người yêu|hàng xóm|thì thầm .* em\/anh .* vào tai/iu;
const PROPS_PATTERN = /vẽ|đồ vật|vật dụng|cái ghế|chiếc ghế|gối|giấy|bút|bút lông|sharpie|(?<![\p{L}\p{N}])tất(?![\p{L}\p{N}])|quần áo|trang phục|phụ kiện|thức ăn|đồ ăn|món ăn|đồ uống|nước|đá |chanh|chuối|hành tây|tỏi|mù tạt|tương ớt|sốt|xà phòng|trứng|(?:cái|một) cây|cây xanh|cây hoặc cột điện|cột điện|chai|ly|cốc|khăn|mũ|túi|ba lô|sách|giáo khoa|nhẫn|trang điểm lại cho bạn/iu;

function parseSource(raw: string): SourceItem[] {
  let type: SourceType | null = null;
  let section: string | null = null;
  const sectionCounts = new Map<string, number>();
  const items: SourceItem[] = [];

  for (const rawLine of raw.split(/\r?\n/u)) {
    const line = rawLine.trimEnd();
    if (/^###\s+.*SỰ THẬT/iu.test(line)) {
      type = "TRUTH";
      section = null;
      continue;
    }
    if (/^###\s+.*THỬ THÁCH/iu.test(line)) {
      type = "DARE";
      section = null;
      continue;
    }
    const numberedSection = line.match(/^####\s+(.+)$/u);
    if (numberedSection) {
      section = numberedSection[1].trim();
      continue;
    }
    const namedSection = line.match(/^\*\*(.+)\*\*$/u);
    if (namedSection) {
      section = namedSection[1].trim();
      continue;
    }
    const itemMatch = line.match(/^\s*(?:\d+\.|-)\s+(.+)$/u);
    if (!itemMatch) continue;
    if (!type || !section) throw new Error(`Mục không có type hoặc section: ${line}`);
    const sectionKey = `${type}:${section}`;
    const sectionIndex = (sectionCounts.get(sectionKey) ?? 0) + 1;
    sectionCounts.set(sectionKey, sectionIndex);
    items.push({ type, section, sectionIndex, text: itemMatch[1].trim().normalize("NFC") });
  }
  return items;
}

function inferMinimumAge(item: SourceItem): MinimumAge {
  const context = `${item.section} ${item.text}`;
  if (EXPLICIT_PATTERN.test(context) || /phiên bản nóng|hot - toz/iu.test(item.section)) return 18;
  if (ROMANCE_PATTERN.test(context) || /mặn mà|spicy|cực độ|extreme|khó chịu|annoying/iu.test(item.section)) return 16;
  return 13;
}

function inferDifficulty(item: SourceItem, minimumAge: MinimumAge): Difficulty {
  const section = item.section.toLocaleLowerCase("vi");
  if (item.type === "TRUTH") {
    if (/cực độ|extreme|khó chịu|annoying/u.test(section)) return "HARD";
    if (/mặn mà|spicy/u.test(section)) return minimumAge === 18 || item.sectionIndex % 3 === 0 ? "HARD" : "BOLD";
    if (/sâu sắc|deep/u.test(section)) return item.sectionIndex % 4 === 0 ? "HARD" : "BOLD";
    if (/cặp đôi|couples/u.test(section)) return item.sectionIndex % 2 === 0 ? "BOLD" : "MEDIUM";
    if (/tuổi teen|teens/u.test(section)) return item.sectionIndex % 2 === 0 ? "MEDIUM" : "EASY";
    if (minimumAge === 18) return "HARD";
    if (PRIVATE_PATTERN.test(item.text) || RISK_PATTERN.test(item.text)) return "BOLD";
    return item.sectionIndex % 2 === 0 ? "MEDIUM" : "EASY";
  }

  if (/thử thách khó|hard dares|cực độ|extreme|khó chịu|annoying|nóng|hot/u.test(section)) return "HARD";
  if (/mặn mòi|spicy/u.test(section)) return minimumAge === 18 ? "HARD" : "BOLD";
  if (/đáng nhớ|memorable|cặp đôi|couples/u.test(section)) return item.sectionIndex % 2 === 0 ? "BOLD" : "MEDIUM";
  return item.sectionIndex % 2 === 0 ? "MEDIUM" : "EASY";
}

function inferCategories(item: SourceItem): Category[] {
  const text = `${item.section} ${item.text}`;
  const categories: Category[] = [];
  const add = (category: Category) => { if (!categories.includes(category) && categories.length < 3) categories.push(category); };

  if (/hát|bài hát|karaoke|nhạc|opera|rap|giai điệu|âm thanh/iu.test(text)) add("music");
  if (/vẽ|hình xăm/iu.test(text)) add("drawing");
  if (MOVEMENT_PATTERN.test(text)) add("movement");
  if (/giả vờ|bắt chước|nhại|diễn|vai |yoda|t-rex|kịch/iu.test(text)) add("acting");
  if (/đọc|nói|kể|bảng chữ cái|khẩu hiệu|biệt danh|câu đố|tựa phim/iu.test(text)) add("wordplay");
  if (/nhớ|kỷ niệm|tuổi thơ|lần đầu|quá khứ/iu.test(text)) add("memories");
  if (/bố|mẹ|cha mẹ|gia đình|anh\/chị em/iu.test(text)) add("family");
  if (/trường|thi |giáo viên|học /iu.test(text)) add("school");
  if (/công việc|sự nghiệp|sa thải|đồng nghiệp/iu.test(text)) add("work");
  if (/du lịch|đất nước|đảo hoang|chuyến đi/iu.test(text)) add("travel");
  if (/phim|truyền hình|người nổi tiếng|ứng dụng|game|trò chơi/iu.test(text)) add("entertainment");
  if (/crush|bạn bè|tình bạn|người yêu|hẹn hò|hôn|tán tỉnh|cặp đôi/iu.test(text)) add("friendship");
  if (/nếu |giả sử|có thể|điều ước|tận thế/iu.test(text)) add("hypothetical");
  if (/mục tiêu|tương lai|ước mơ|đạt được/iu.test(text)) add("goals");
  if (item.type === "TRUTH") add("self-awareness");
  else if (categories.length === 0) add("performance");
  if (categories.length === 0) add("everyday");
  return categories;
}

function inferAudiences(item: SourceItem, minimumAge: MinimumAge, isPrivate: boolean, isSensitive: boolean): Audience[] {
  const section = item.section.toLocaleLowerCase("vi");
  if (/cặp đôi|couples/u.test(section)) return ["couples"];
  if (/tuổi teen|teens/u.test(section)) return ["friends", "family"];
  if (minimumAge === 18 || isPrivate || isSensitive) return ["friends", "couples"];
  return ["friends", "family", "coworkers", "couples"];
}

function toPrompt(item: SourceItem, counters: Record<SourceType, Record<Difficulty, number>>): StaticPrompt {
  const context = `${item.section} ${item.text}`;
  const minimumAge = inferMinimumAge(item);
  const difficulty = inferDifficulty(item, minimumAge);
  const requiresPhysicalContact = CONTACT_PATTERN.test(item.text);
  const isPrivate = PRIVATE_PATTERN.test(context) || /sâu sắc|deep|mặn mà|spicy|cực độ|extreme|khó chịu|annoying|nóng|hot/iu.test(item.section);
  const isSensitive = EXPLICIT_PATTERN.test(context) || RISK_PATTERN.test(item.text) || requiresPhysicalContact || /cực độ|extreme|khó chịu|annoying|nóng|hot/iu.test(item.section);
  counters[item.type][difficulty] += 1;
  const id = `${item.type.toLowerCase()}-${difficulty.toLowerCase()}-${String(counters[item.type][difficulty]).padStart(3, "0")}`;

  return {
    id,
    type: item.type,
    text: item.text,
    difficulty,
    minimumAge,
    categories: inferCategories(item),
    audiences: inferAudiences(item, minimumAge, isPrivate, isSensitive),
    requiresProps: PROPS_PATTERN.test(item.text),
    requiresPhone: PHONE_PATTERN.test(item.text),
    requiresInternet: INTERNET_PATTERN.test(item.text),
    requiresMovement: MOVEMENT_PATTERN.test(item.text),
    requiresPhysicalContact,
    requiresAnotherPlayer: requiresPhysicalContact || OTHER_PLAYER_PATTERN.test(item.text),
    isPrivate,
    isSensitive,
  };
}

function countByDifficulty(rows: StaticPrompt[]): Record<Difficulty, number> {
  return {
    EASY: rows.filter((row) => row.difficulty === "EASY").length,
    MEDIUM: rows.filter((row) => row.difficulty === "MEDIUM").length,
    BOLD: rows.filter((row) => row.difficulty === "BOLD").length,
    HARD: rows.filter((row) => row.difficulty === "HARD").length,
  };
}

function main(): void {
  const sourcePath = process.argv.slice(2).find((argument) => argument !== "--");
  if (!sourcePath) throw new Error("Cách dùng: pnpm content:import -- <đường-dẫn-question.txt>");
  const raw = fs.readFileSync(path.resolve(sourcePath), "utf8");
  const sourceSha256 = createHash("sha256").update(raw).digest("hex");
  if (sourceSha256 !== EXPECTED_SOURCE_SHA256) {
    throw new Error(`SHA-256 nguồn không khớp: ${sourceSha256}.`);
  }
  const sourceItems = parseSource(raw);
  const truthItems = sourceItems.filter((item) => item.type === "TRUTH");
  const dareItems = sourceItems.filter((item) => item.type === "DARE");
  const contentSha256 = createHash("sha256").update(JSON.stringify(sourceItems.map(({ type, text }) => [type, text]))).digest("hex");
  if (contentSha256 !== EXPECTED_CONTENT_SHA256) {
    throw new Error(`SHA-256 nội dung nguồn không khớp: ${contentSha256}.`);
  }
  if (sourceItems.length !== EXPECTED_TOTAL || truthItems.length !== EXPECTED_TRUTH_TOTAL || dareItems.length !== EXPECTED_DARE_TOTAL) {
    throw new Error(`Số lượng nguồn không khớp: total ${sourceItems.length}, Truth ${truthItems.length}, Dare ${dareItems.length}.`);
  }

  const counters: Record<SourceType, Record<Difficulty, number>> = {
    TRUTH: { EASY: 0, MEDIUM: 0, BOLD: 0, HARD: 0 },
    DARE: { EASY: 0, MEDIUM: 0, BOLD: 0, HARD: 0 },
  };
  const truthRows = StaticPromptDatabaseSchema.parse(truthItems.map((item) => toPrompt(item, counters)));
  const dareRows = StaticPromptDatabaseSchema.parse(dareItems.map((item) => toPrompt(item, counters)));
  const fingerprints = sourceItems.map((item) => createPromptFingerprint(item.text));
  const fingerprintCounts = new Map<string, number>();
  fingerprints.forEach((fingerprint) => fingerprintCounts.set(fingerprint, (fingerprintCounts.get(fingerprint) ?? 0) + 1));
  const duplicateCounts = [...fingerprintCounts.values()].filter((count) => count > 1);
  const sectionCounts = new Map<string, { type: SourceType; section: string; count: number }>();
  sourceItems.forEach((item) => {
    const key = `${item.type}:${item.section}`;
    const current = sectionCounts.get(key);
    sectionCounts.set(key, { type: item.type, section: item.section, count: (current?.count ?? 0) + 1 });
  });
  const manifest = {
    sourceFile: path.basename(sourcePath),
    sourceSha256,
    contentSha256,
    total: sourceItems.length,
    truthTotal: truthRows.length,
    dareTotal: dareRows.length,
    exactDuplicateGroups: duplicateCounts.length,
    exactDuplicateItems: duplicateCounts.reduce((sum, count) => sum + count, 0),
    truthDifficulty: countByDifficulty(truthRows),
    dareDifficulty: countByDifficulty(dareRows),
    sections: [...sectionCounts.values()],
  };

  fs.writeFileSync(OUTPUTS.TRUTH, `${JSON.stringify(truthRows, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUTPUTS.DARE, `${JSON.stringify(dareRows, null, 2)}\n`, "utf8");
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

main();
