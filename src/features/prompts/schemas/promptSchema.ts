import { z } from "zod";

export const PromptTypeEnum = z.enum(["TRUTH", "DARE"]);
export const DifficultyEnum = z.enum(["EASY", "MEDIUM", "BOLD", "HARD"]);
export const MinimumAgeEnum = z.enum(["AGE_13_PLUS", "AGE_16_PLUS", "AGE_18_PLUS"]);
export const PromptStatusEnum = z.enum([
  "DRAFT",
  "IN_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export const PromptInputSchema = z.object({
  id: z.string().optional(),
  type: PromptTypeEnum,
  text: z.string().min(5, "Nội dung câu hỏi phải có ít nhất 5 ký tự").max(300, "Nội dung không được quá 300 ký tự"),
  language: z.string().default("vi"),
  difficulty: DifficultyEnum.default("EASY"),
  minimumAge: MinimumAgeEnum.default("AGE_13_PLUS"),
  status: PromptStatusEnum.default("PUBLISHED"),

  requiresProps: z.boolean().default(false),
  requiresPhone: z.boolean().default(false),
  requiresInternet: z.boolean().default(false),
  requiresMovement: z.boolean().default(false),
  requiresPhysicalContact: z.boolean().default(false),
  requiresAnotherPlayer: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  isSensitive: z.boolean().default(false),
  isTimeBound: z.boolean().default(false),
  estimatedSeconds: z.number().nullable().optional(),

  categories: z.array(z.string()).default([]),
  audiences: z.array(z.string()).default([]),

  source: z.string().nullable().optional(),
  qualityScore: z.number().min(0).max(5).default(1.0),
});

export type PromptInput = z.infer<typeof PromptInputSchema>;
