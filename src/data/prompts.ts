import dareRows from "./prompts.dare.vi.json";
import truthRows from "./prompts.truth.vi.json";
import { StaticPromptDatabaseSchema } from "@/features/prompts/schemas/promptSchema";

export const prompts = StaticPromptDatabaseSchema.parse([...truthRows, ...dareRows]);

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
