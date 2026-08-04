import { z } from "zod";

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z
    .string()
    .trim()
    .max(1000)
    .refine(
      (value) => value.length === 0 || value.length >= 10,
      "review_body_too_short",
    ),
  locale: z.enum(["vi", "en"]),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
