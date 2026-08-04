import { describe, expect, it } from "vitest";
import { reviewInputSchema } from "@/features/reviews/schemas/reviewSchema";

describe("reviewInputSchema", () => {
  it("accepts a rating without a written comment", () => {
    expect(reviewInputSchema.safeParse({ rating: 5, body: "", locale: "vi" }).success).toBe(true);
  });

  it("accepts comments between 10 and 1000 trimmed characters", () => {
    const result = reviewInputSchema.parse({ rating: 4, body: "  Game rất vui!  ", locale: "vi" });
    expect(result.body).toBe("Game rất vui!");
  });

  it("rejects short comments and invalid ratings", () => {
    expect(reviewInputSchema.safeParse({ rating: 0, body: "", locale: "vi" }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ rating: 5, body: "Quá ngắn", locale: "vi" }).success).toBe(false);
  });
});
