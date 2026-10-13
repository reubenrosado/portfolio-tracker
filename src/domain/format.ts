export const SUM_TARGET = 100;
export const SUM_EPSILON = 0.05;

export function roundWeight(value: number): number {
  return Math.round(value * 100) / 100;
}

export function nearlyEqual(left: number, right: number, epsilon = 0.001): boolean {
  return Math.abs(left - right) <= epsilon;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(roundWeight(value), 0, SUM_TARGET);
}

export function formatWeight(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return roundWeight(value).toFixed(2).replace(/\.?0+$/, "");
}

export function formatPercent(value: number): string {
  return `${formatWeight(value)}%`;
}

export function isWeightDraft(text: string): boolean {
  return text === "" || /^\d*\.?\d*$/.test(text);
}

/** Parse an in-progress weight. Trailing dots count. Empty or "." do not. */
export function parseDraftWeight(text: string): number | null {
  if (!/^\d+\.?\d*$/.test(text) && !/^\.\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}
