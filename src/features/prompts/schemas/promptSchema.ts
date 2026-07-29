import { z } from "zod";

export const PromptTypeSchema = z.enum(["TRUTH", "DARE"]);
export const DifficultySchema = z.enum(["EASY", "MEDIUM", "BOLD", "HARD"]);
export const MinimumAgeSchema = z.union([z.literal(13), z.literal(16), z.literal(18)]);
export const CategorySchema = z.enum([
  "everyday",
  "preferences",
  "memories",
  "friendship",
  "family",
  "school",
  "work",
  "travel",
  "entertainment",
  "creativity",
  "goals",
  "perspective",
  "self-awareness",
  "humor",
  "hypothetical",
  "performance",
  "memory",
  "coordination",
  "wordplay",
  "movement",
  "teamwork",
  "drawing",
  "music",
  "acting",
]);
export const AudienceSchema = z.enum(["friends", "family", "coworkers", "couples"]);

export const StaticPromptSchema = z.object({
  id: z.string().regex(/^(truth|dare)-(easy|medium|bold|hard)-\d{3}$/),
  type: PromptTypeSchema,
  text: z.string().trim().min(5).max(300),
  difficulty: DifficultySchema,
  minimumAge: MinimumAgeSchema,
  categories: z.array(CategorySchema).min(1).max(3),
  audiences: z.array(AudienceSchema).min(1).max(4),
  requiresProps: z.boolean(),
  requiresPhone: z.boolean(),
  requiresInternet: z.boolean(),
  requiresMovement: z.boolean(),
  requiresPhysicalContact: z.boolean(),
  requiresAnotherPlayer: z.boolean(),
  isPrivate: z.boolean(),
  isSensitive: z.boolean(),
}).strict();

export const StaticPromptDatabaseSchema = z.array(StaticPromptSchema);

export type PromptType = z.infer<typeof PromptTypeSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type MinimumAge = z.infer<typeof MinimumAgeSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Audience = z.infer<typeof AudienceSchema>;
export type StaticPrompt = z.infer<typeof StaticPromptSchema>;
