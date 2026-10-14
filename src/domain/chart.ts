import { childShade, GAP_COLOR } from "./colors";
import { SUM_EPSILON, SUM_TARGET } from "./format";
import {
  absoluteChildWeight,
  childrenOf,
  parentsOf,
  themeLabel,
} from "./selectors";
import type { Portfolio, Theme } from "./types";

export interface ChartSlice {
  key: string;
  name: string;
  /** Angular weight. Groups are scaled so children stay under their parent. */
  value: number;
  fill: string;
  kind: "parent" | "child" | "gap";
  targetWeight: number;
  absoluteWeight: number;
  parentName: string | null;
  lowerThreshold: number | null;
  upperThreshold: number | null;
  themeId: string | null;
  scaled: boolean;
}

export interface ChartModel {
  parents: ChartSlice[];
  children: ChartSlice[];
}

const CHART_PARENT_FILL = "#8d8578";

function parentSlice(parent: Theme): ChartSlice {
  const name = themeLabel(parent, "Untitled");
  return {
    key: parent.id,
    name,
    value: Math.max(0, parent.targetWeight),
    fill: parent.color ?? CHART_PARENT_FILL,
    kind: "parent",
    targetWeight: parent.targetWeight,
    absoluteWeight: parent.targetWeight,
    parentName: null,
    lowerThreshold: parent.lowerThreshold,
    upperThreshold: parent.upperThreshold,
    themeId: parent.id,
    scaled: false,
  };
}

function gapSlice(key: string, value: number, name: string, parentName: string | null): ChartSlice {
  return {
    key,
    name,
    value,
    fill: GAP_COLOR,
    kind: "gap",
    targetWeight: value,
    absoluteWeight: value,
    parentName,
    lowerThreshold: null,
    upperThreshold: null,
    themeId: null,
    scaled: false,
  };
}

/**
 * Inner slices are parents. Outer slices are children grouped in the same order.
 * Each child group sums to its parent value, so the outer ring lines up underneath.
 * When a child group does not sum to 100, angles scale inside the parent only.
 * Tooltips still report the real target and absolute weights.
 */
export function buildChart(portfolio: Portfolio): ChartModel {
  const parents = parentsOf(portfolio);
  const parentSlices = parents.map(parentSlice).filter((slice) => slice.value > 0);
  const parentTotal = parentSlices.reduce((sum, slice) => sum + slice.value, 0);

  const childSlices: ChartSlice[] = [];
  for (const parent of parents) {
    const parentValue = Math.max(0, parent.targetWeight);
    if (parentValue <= 0) continue;
    const children = childrenOf(portfolio, parent.id);
    const positive = children.filter((child) => child.targetWeight > 0);
    const childTotal = children.reduce((sum, child) => sum + Math.max(0, child.targetWeight), 0);
    const parentName = themeLabel(parent, "Untitled");

    if (positive.length === 0 || childTotal <= 0) {
      childSlices.push(
        gapSlice(`gap-${parent.id}`, parentValue, "No positions", parentName),
      );
      continue;
    }

    const scaled = Math.abs(childTotal - SUM_TARGET) > SUM_EPSILON;
    positive.forEach((child, index) => {
      const share = child.targetWeight / childTotal;
      childSlices.push({
        key: child.id,
        name: themeLabel(child, "Untitled"),
        value: parentValue * share,
        fill: childShade(parent.color ?? CHART_PARENT_FILL, index, positive.length),
        kind: "child",
        targetWeight: child.targetWeight,
        absoluteWeight: absoluteChildWeight(parent.targetWeight, child.targetWeight),
        parentName,
        lowerThreshold: child.lowerThreshold,
        upperThreshold: child.upperThreshold,
        themeId: child.id,
        scaled,
      });
    });
  }

  if (parentTotal < SUM_TARGET - SUM_EPSILON) {
    const gap = SUM_TARGET - parentTotal;
    parentSlices.push(gapSlice("gap-parents", gap, "Unallocated", null));
    childSlices.push(gapSlice("gap-children", gap, "Unallocated", null));
  }

  return { parents: parentSlices, children: childSlices };
}

export function isChartSlice(value: unknown): value is ChartSlice {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.key === "string" &&
    typeof record.name === "string" &&
    typeof record.value === "number" &&
    (record.kind === "parent" || record.kind === "child" || record.kind === "gap")
  );
}

export function sliceIsActive(
  slice: ChartSlice,
  activeId: string | null,
  themes: Theme[],
): boolean {
  if (!activeId) return true;
  if (slice.themeId === activeId) return true;
  if (slice.kind === "gap" && slice.key === `gap-${activeId}`) return true;
  const active = themes.find((theme) => theme.id === activeId);
  if (!active) return false;
  if (active.parentId === null) {
    const child = themes.find((theme) => theme.id === slice.themeId);
    return child?.parentId === active.id;
  }
  return slice.themeId === active.parentId;
}

export function chartSummary(portfolio: Portfolio): string {
  const parts = parentsOf(portfolio).map((parent) => {
    const parentName = themeLabel(parent, "Untitled");
    const children = childrenOf(portfolio, parent.id)
      .map((child) => {
        const absolute = absoluteChildWeight(parent.targetWeight, child.targetWeight);
        return `${themeLabel(child, "Untitled")} ${child.targetWeight}% of ${parentName}, ${absolute}% of the portfolio`;
      })
      .join("; ");
    return `${parentName} ${parent.targetWeight}% of the portfolio. ${children}`;
  });
  return `Target mix. Inner ring is parent themes. Outer ring is positions. ${parts.join(". ")}.`;
}
