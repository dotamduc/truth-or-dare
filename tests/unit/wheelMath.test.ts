import { describe, expect, it } from "vitest";
import { FULL_TURN, WHEEL_POINTER_ANGLE, createSpinPlan, getSelectedIndexAtPointer, getTargetRotation, normalizeRotation, selectSpinDuration, selectUniformIndex } from "@/features/game/domain/wheelMath";

describe("wheel math", () => {
  it("selects an injected uniform index within bounds", () => {
    expect(selectUniformIndex(4, () => 0)).toBe(0);
    expect(selectUniformIndex(4, () => 0.2499)).toBe(0);
    expect(selectUniformIndex(4, () => 0.25)).toBe(1);
    expect(selectUniformIndex(4, () => 0.9999999999999999)).toBe(3);
    expect(selectUniformIndex(4, () => 1)).toBe(3);
    expect(selectUniformIndex(4, () => -1)).toBe(0);
  });

  it("keeps duration between five and seven seconds", () => {
    expect(selectSpinDuration(() => 0)).toBe(5000);
    expect(selectSpinDuration(() => 1)).toBe(7000);
    expect(selectSpinDuration(() => 0.5)).toBeGreaterThanOrEqual(5000);
    expect(selectSpinDuration(() => 0.5)).toBeLessThanOrEqual(7000);
  });

  it("stops the selected segment center beneath the pointer", () => {
    for (const itemCount of [1, 2, 7, 337]) {
      for (const selectedIndex of [0, Math.floor(itemCount / 2), itemCount - 1]) {
        const target = getTargetRotation(itemCount, selectedIndex, 0.73, 7);
        const segmentAngle = FULL_TURN / itemCount;
        const segmentCenter = normalizeRotation(target + (selectedIndex + 0.5) * segmentAngle);
        expect(getSelectedIndexAtPointer(itemCount, target)).toBe(selectedIndex);
        expect(segmentCenter).toBeCloseTo(normalizeRotation(WHEEL_POINTER_ANGLE), 10);
      }
    }
  });

  it("creates a deterministic plan and normalizes rotation", () => {
    const values = [0.4, 0.75, 0.2];
    const plan = createSpinPlan(10, 0, () => values.shift() ?? 0);
    expect(plan.selectedIndex).toBe(4);
    expect(plan.durationMs).toBeGreaterThanOrEqual(5000);
    expect(plan.durationMs).toBeLessThanOrEqual(7000);
    expect(getSelectedIndexAtPointer(10, plan.targetRotation)).toBe(4);
    expect(normalizeRotation(plan.targetRotation)).toBeGreaterThanOrEqual(0);
    expect(normalizeRotation(plan.targetRotation)).toBeLessThan(Math.PI * 2);
  });
});
