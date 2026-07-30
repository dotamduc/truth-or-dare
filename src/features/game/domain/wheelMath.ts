export const FULL_TURN = Math.PI * 2;
export const WHEEL_POINTER_ANGLE = -Math.PI / 2;

export interface SpinPlan {
  selectedIndex: number;
  durationMs: number;
  targetRotation: number;
}

export function selectUniformIndex(itemCount: number, random: () => number = Math.random): number {
  if (!Number.isInteger(itemCount) || itemCount <= 0) throw new Error("Vòng quay cần ít nhất một mục.");
  const value = Math.min(1 - Number.EPSILON, Math.max(0, random()));
  return Math.min(itemCount - 1, Math.floor(value * itemCount));
}

export function selectSpinDuration(random: () => number = Math.random): number {
  const value = Math.min(1 - Number.EPSILON, Math.max(0, random()));
  return 5000 + Math.floor(value * 2001);
}

export function normalizeRotation(rotation: number): number {
  return ((rotation % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

export function getTargetRotation(itemCount: number, selectedIndex: number, currentRotation = 0, fullTurns = 8): number {
  if (!Number.isInteger(itemCount) || itemCount <= 0) throw new Error("Vòng quay cần ít nhất một mục.");
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= itemCount) throw new Error("Chỉ số kết quả vòng quay không hợp lệ.");
  if (!Number.isInteger(fullTurns) || fullTurns < 1) throw new Error("Số vòng quay đầy đủ không hợp lệ.");

  const segmentAngle = FULL_TURN / itemCount;
  const segmentCenter = (selectedIndex + 0.5) * segmentAngle;
  const normalizedCurrent = normalizeRotation(currentRotation);
  const targetNormalized = normalizeRotation(WHEEL_POINTER_ANGLE - segmentCenter);
  const forwardDelta = normalizeRotation(targetNormalized - normalizedCurrent);
  return currentRotation + fullTurns * FULL_TURN + forwardDelta;
}

export function getSelectedIndexAtPointer(itemCount: number, rotation: number): number {
  if (!Number.isInteger(itemCount) || itemCount <= 0) throw new Error("Vòng quay cần ít nhất một mục.");
  const segmentAngle = FULL_TURN / itemCount;
  const localAngle = normalizeRotation(WHEEL_POINTER_ANGLE - normalizeRotation(rotation));
  return Math.min(itemCount - 1, Math.floor(localAngle / segmentAngle));
}

export function createSpinPlan(
  itemCount: number,
  currentRotation = 0,
  random: () => number = Math.random,
): SpinPlan {
  const selectedIndex = selectUniformIndex(itemCount, random);
  const durationMs = selectSpinDuration(random);
  const fullTurns = 6 + selectUniformIndex(5, random);
  return { selectedIndex, durationMs, targetRotation: getTargetRotation(itemCount, selectedIndex, currentRotation, fullTurns) };
}

export function easeOutQuint(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  return 1 - Math.pow(1 - clamped, 5);
}
