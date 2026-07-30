"use client";

import { type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { WHEEL_POINTER_ANGLE, createSpinPlan, easeOutQuint, normalizeRotation } from "@/features/game/domain/wheelMath";

export interface WheelItem {
  id: string;
  label: string;
  tone?: "truth" | "dare" | "neutral";
}

interface WheelModalProps {
  isOpen: boolean;
  title: string;
  items: WheelItem[];
  description: string;
  countLabel?: string;
  onClose: () => void;
  onResult?: (id: string) => void;
  onConfirmResult?: (id: string) => void;
  renderResult?: (item: WheelItem) => ReactNode;
  resultTitle?: string;
  confirmLabel?: string;
  autoResolveResult?: boolean;
}

interface WheelPalette {
  line: string;
  surface: string;
  ink: string;
  truth: string;
  truthSoft: string;
  dare: string;
  dareSoft: string;
  accent: string;
}

const REDUCED_MOTION_DELAY_MS = 220;

function readPalette(element: HTMLElement): WheelPalette {
  const styles = getComputedStyle(element);
  return {
    line: styles.getPropertyValue("--line").trim() || "#d4dae5",
    surface: styles.getPropertyValue("--surface").trim() || "#ffffff",
    ink: styles.getPropertyValue("--ink").trim() || "#182033",
    truth: styles.getPropertyValue("--truth").trim() || "#0c6e57",
    truthSoft: styles.getPropertyValue("--truth-soft").trim() || "#d7f7ea",
    dare: styles.getPropertyValue("--dare").trim() || "#aa3455",
    dareSoft: styles.getPropertyValue("--dare-soft").trim() || "#ffe2ea",
    accent: styles.getPropertyValue("--accent").trim() || "#c9422a",
  };
}

function colorForItem(item: WheelItem, index: number, palette: WheelPalette): string {
  if (item.tone === "truth") return index % 2 === 0 ? palette.truthSoft : palette.truth;
  if (item.tone === "dare") return index % 2 === 0 ? palette.dareSoft : palette.dare;
  return index % 2 === 0 ? palette.truthSoft : palette.dareSoft;
}

function textColorForItem(item: WheelItem, index: number, palette: WheelPalette): string {
  if (item.tone === "truth") return index % 2 === 0 ? palette.truth : palette.surface;
  if (item.tone === "dare") return index % 2 === 0 ? palette.dare : palette.surface;
  return palette.ink;
}

function drawWheel(canvas: HTMLCanvasElement, items: WheelItem[], rotation: number, palette: WheelPalette): void {
  const size = Math.max(240, Math.round(canvas.getBoundingClientRect().width || 560));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, size, size);

  const center = size / 2;
  const radius = center - 12;
  const segmentAngle = (Math.PI * 2) / items.length;
  const showLabels = items.length <= 24;
  const showNumbers = items.length > 24 && items.length <= 96;

  items.forEach((item, index) => {
    const start = rotation + index * segmentAngle;
    const end = start + segmentAngle;
    context.beginPath();
    context.moveTo(center, center);
    context.arc(center, center, radius, start, end);
    context.closePath();
    context.fillStyle = colorForItem(item, index, palette);
    context.fill();
    context.strokeStyle = palette.line;
    context.lineWidth = items.length > 80 ? 0.35 : 1;
    context.stroke();

    if (!showLabels && !showNumbers) return;
    const label = showLabels ? item.label : String(index + 1);
    const angle = start + segmentAngle / 2;
    context.save();
    context.translate(center, center);
    context.rotate(angle);
    context.textAlign = "right";
    context.textBaseline = "middle";
    context.fillStyle = textColorForItem(item, index, palette);
    context.font = showLabels ? `800 ${Math.max(12, size * 0.035)}px system-ui, sans-serif` : `800 ${Math.max(9, size * 0.025)}px system-ui, sans-serif`;
    context.fillText(label.slice(0, 18), radius - 20, 0);
    context.restore();
  });

  context.beginPath();
  context.arc(center, center, radius, 0, Math.PI * 2);
  context.strokeStyle = palette.ink;
  context.lineWidth = 3;
  context.stroke();

  context.beginPath();
  context.arc(center, center, radius * 0.18, 0, Math.PI * 2);
  context.fillStyle = palette.surface;
  context.fill();
  context.strokeStyle = palette.accent;
  context.lineWidth = 3;
  context.stroke();

  context.beginPath();
  context.moveTo(center + Math.cos(WHEEL_POINTER_ANGLE) * (radius - 12), center + Math.sin(WHEEL_POINTER_ANGLE) * (radius - 12));
  context.lineTo(center + Math.cos(WHEEL_POINTER_ANGLE - 0.035) * (radius - 42), center + Math.sin(WHEEL_POINTER_ANGLE - 0.035) * (radius - 42));
  context.lineTo(center + Math.cos(WHEEL_POINTER_ANGLE + 0.035) * (radius - 42), center + Math.sin(WHEEL_POINTER_ANGLE + 0.035) * (radius - 42));
  context.closePath();
  context.fillStyle = palette.accent;
  context.fill();
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WheelModal({ isOpen, title, items, description, countLabel, onClose, onResult, onConfirmResult, renderResult, resultTitle = "KẾT QUẢ VÒNG QUAY", confirmLabel = "CHƠI CÂU NÀY", autoResolveResult = false }: WheelModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const frameRef = useRef<number | null>(null);
  const drawFrameRef = useRef<number | null>(null);
  const reducedMotionTimerRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const isSpinningRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const resultTitleId = useId();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId]);
  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    if (drawFrameRef.current !== null) window.cancelAnimationFrame(drawFrameRef.current);
    if (reducedMotionTimerRef.current !== null) window.clearTimeout(reducedMotionTimerRef.current);
    frameRef.current = null;
    drawFrameRef.current = null;
    reducedMotionTimerRef.current = null;
  }, []);
  const closeSafely = useCallback(() => {
    if (isSpinningRef.current) return;
    onClose();
  }, [onClose]);
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    drawWheel(canvas, items, rotationRef.current, readPalette(document.documentElement));
  }, [items]);
  const finishSpin = useCallback((id: string, targetRotation: number) => {
    rotationRef.current = normalizeRotation(targetRotation);
    redraw();
    isSpinningRef.current = false;
    setIsSpinning(false);
    setLiveMessage(autoResolveResult ? "Vòng quay đã chọn kết quả." : "Vòng quay đã chọn một câu.");
    if (autoResolveResult) onResult?.(id);
    else {
      setSelectedId(id);
      onResult?.(id);
    }
  }, [autoResolveResult, onResult, redraw]);

  const startSpin = () => {
    if (isSpinningRef.current || items.length === 0) return;
    const plan = createSpinPlan(items.length, rotationRef.current);
    const selected = items[plan.selectedIndex];
    if (!selected) return;

    cancelAnimation();
    setSelectedId(null);
    setLiveMessage("Vòng quay đang chạy.");
    isSpinningRef.current = true;
    setIsSpinning(true);

    if (prefersReducedMotion()) {
      rotationRef.current = normalizeRotation(plan.targetRotation);
      redraw();
      reducedMotionTimerRef.current = window.setTimeout(() => finishSpin(selected.id, plan.targetRotation), REDUCED_MOTION_DELAY_MS);
      return;
    }

    const startRotation = rotationRef.current;
    const delta = plan.targetRotation - startRotation;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      startTime ??= timestamp;
      const progress = Math.min(1, (timestamp - startTime) / plan.durationMs);
      rotationRef.current = startRotation + delta * easeOutQuint(progress);
      redraw();
      if (progress < 1) frameRef.current = window.requestAnimationFrame(animate);
      else {
        frameRef.current = null;
        finishSpin(selected.id, plan.targetRotation);
      }
    };
    frameRef.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null);
    setLiveMessage("");
    rotationRef.current = 0;
    drawFrameRef.current = window.requestAnimationFrame(() => {
      drawFrameRef.current = null;
      redraw();
      closeButtonRef.current?.focus();
    });
  }, [isOpen, redraw]);

  useEffect(() => {
    if (!isOpen) return;
    redraw();
    const handleResize = () => redraw();
    const observer = new MutationObserver(redraw);
    window.addEventListener("resize", handleResize);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [isOpen, redraw]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => () => {
    cancelAnimation();
    isSpinningRef.current = false;
  }, [cancelAnimation]);

  return (
    <dialog
      ref={dialogRef}
      className="wheel-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        closeSafely();
      }}
    >
      <div className="wheel-shell">
        <header className="wheel-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button ref={closeButtonRef} type="button" className="wheel-close" onClick={closeSafely} disabled={isSpinning} aria-label="Đóng vòng quay">×</button>
        </header>

        <div className="wheel-stage">
          <div className="wheel-pointer" aria-hidden="true">▼</div>
          <canvas ref={canvasRef} className="wheel-canvas" role="img" aria-label={description}>Trình duyệt không hỗ trợ canvas. {description}</canvas>
          <button type="button" className="wheel-spin-button" onClick={startSpin} disabled={isSpinning || items.length === 0}>{isSpinning ? "ĐANG QUAY" : "QUAY"}</button>
        </div>
        <p className="wheel-count">{countLabel ?? `Có ${items.length} mục đang tham gia vòng quay.`}</p>
        <p className="sr-only" aria-live="polite">{liveMessage}</p>

        {selectedItem && !autoResolveResult && (
          <section className="wheel-result" aria-labelledby={resultTitleId} aria-live="polite">
            <h3 id={resultTitleId}>{resultTitle}</h3>
            {renderResult ? renderResult(selectedItem) : <p>{selectedItem.label}</p>}
            <div className="wheel-actions">
              {onConfirmResult && <button type="button" className="button button-primary" onClick={() => onConfirmResult(selectedItem.id)}>{confirmLabel}</button>}
              <button type="button" className="button button-secondary" onClick={startSpin}>QUAY LẠI</button>
              <button type="button" className="button button-secondary" onClick={closeSafely}>Đóng</button>
            </div>
          </section>
        )}
      </div>
    </dialog>
  );
}
