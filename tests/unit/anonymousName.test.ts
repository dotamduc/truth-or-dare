import { describe, expect, it } from "vitest";
import { anonymousDisplayNameFromUserId } from "@/features/auth/domain/anonymousName";

describe("anonymousDisplayNameFromUserId", () => {
  it("creates a stable eight-character anonymous suffix", () => {
    expect(anonymousDisplayNameFromUserId("A1B2C3D4-1111-2222-3333-444455556666"))
      .toBe("ẨnDanh_a1b2c3d4");
  });

  it("rejects identifiers that cannot produce a safe suffix", () => {
    expect(() => anonymousDisplayNameFromUserId("not-a-uuid")).toThrow();
  });
});
