import dareRows from "./prompts.dare.vi.json";
import truthRows from "./prompts.truth.vi.json";
import dareEnglishRows from "./prompts.dare.en.json";
import truthEnglishRows from "./prompts.truth.en.json";
import { StaticPromptDatabaseSchema } from "@/features/prompts/schemas/promptSchema";
import type { StaticPrompt } from "@/features/game/domain/types";
import type { Language } from "@/features/i18n/types";

export const prompts = StaticPromptDatabaseSchema.parse([...truthRows, ...dareRows]);
const englishTextById = new Map([...Object.entries(truthEnglishRows), ...Object.entries(dareEnglishRows)]);

if (englishTextById.size !== prompts.length || prompts.some((prompt) => !englishTextById.has(prompt.id))) {
  throw new Error("The English prompt set must contain the same IDs as the Vietnamese prompt set.");
}

export function getPromptText(prompt: Pick<StaticPrompt, "id" | "text">, language: Language): string {
  return language === "en" ? englishTextById.get(prompt.id) ?? prompt.text : prompt.text;
}

export const categoryLabels: Record<string, string> = {
  everyday: "Đời sống",
  preferences: "Sở thích",
  memories: "Kỷ niệm",
  friendship: "Tình bạn",
  family: "Gia đình",
  school: "Trường học",
  work: "Công việc",
  travel: "Du lịch",
  entertainment: "Giải trí",
  creativity: "Sáng tạo",
  goals: "Mục tiêu",
  perspective: "Quan điểm",
  "self-awareness": "Hiểu bản thân",
  humor: "Hài hước",
  hypothetical: "Giả định",
  performance: "Biểu diễn",
  memory: "Ghi nhớ",
  coordination: "Phối hợp",
  wordplay: "Ngôn từ",
  movement: "Vận động nhẹ",
  teamwork: "Nhóm",
  drawing: "Vẽ",
  music: "Âm nhạc",
  acting: "Diễn xuất",
};

export const audienceLabels: Record<string, string> = {
  friends: "Bạn bè",
  family: "Gia đình",
  coworkers: "Đồng nghiệp",
  couples: "Cặp đôi",
};
