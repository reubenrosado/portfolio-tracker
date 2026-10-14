import { clampWeight, formatWeight, nearlyEqual } from "./format";
import type { Theme, ThresholdMode } from "./types";

export const DEFAULT_ABSOLUTE_BAND = 5;
export const DEFAULT_RELATIVE_BAND = 20;

export function stockBand(mode: ThresholdMode): number {
  return mode === "absolute_pp" ? DEFAULT_ABSOLUTE_BAND : DEFAULT_RELATIVE_BAND;
}

export function bandAround(
  targetWeight: number,
  mode: ThresholdMode,
  band: number,
): { lowerThreshold: number; upperThreshold: number } {
  const target = clampWeight(targetWeight);
  const width = clampWeight(band);
  const lower =
    mode === "absolute_pp" ? target - width : target * (1 - width / 100);
  const upper =
    mode === "absolute_pp" ? target + width : target * (1 + width / 100);
  return {
    lowerThreshold: clampWeight(lower),
    upperThreshold: clampWeight(upper),
  };
}

export function isDefaultBand(theme: Theme, mode: ThresholdMode, band: number): boolean {
  const expected = bandAround(theme.targetWeight, mode, band);
  return (
    nearlyEqual(theme.lowerThreshold, expected.lowerThreshold) &&
    nearlyEqual(theme.upperThreshold, expected.upperThreshold)
  );
}

function gapPhrase(delta: number, direction: "below" | "above"): string {
  if (delta >= -0.001) {
    return `${formatWeight(Math.max(delta, 0))} points ${direction}`;
  }
  const opposite = direction === "below" ? "above" : "below";
  return `${formatWeight(Math.abs(delta))} points ${opposite} the target`;
}

/** Describe the actual lower and upper weights, which are always percent weights. */
export function describeThresholds(theme: Theme): string {
  const below = theme.targetWeight - theme.lowerThreshold;
  const above = theme.upperThreshold - theme.targetWeight;
  return `${gapPhrase(below, "below")}, ${gapPhrase(above, "above")}`;
}
