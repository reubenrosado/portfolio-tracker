import { clampWeight } from "./format";
import type { Portfolio, Theme } from "./types";

export function bySort(left: Theme, right: Theme): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

export function parentsOf(portfolio: Portfolio): Theme[] {
  return portfolio.themes.filter((theme) => theme.parentId === null).sort(bySort);
}

export function childrenOf(portfolio: Portfolio, parentId: string): Theme[] {
  return portfolio.themes.filter((theme) => theme.parentId === parentId).sort(bySort);
}

export function absoluteChildWeight(parentTarget: number, childTarget: number): number {
  return (parentTarget * childTarget) / 100;
}

export function themeLabel(theme: Theme, fallback: string): string {
  const name = theme.name.trim();
  return name.length > 0 ? name : fallback;
}

/** Drop orphans, force one level, and keep weights inside 0 to 100. */
export function normalizePortfolio(portfolio: Portfolio): Portfolio {
  const parentIds = new Set(
    portfolio.themes.filter((theme) => theme.parentId === null).map((theme) => theme.id),
  );
  const themes = portfolio.themes
    .filter(
      (theme) =>
        theme.parentId === null ||
        (theme.parentId !== null && parentIds.has(theme.parentId)),
    )
    .map((theme) => ({
      ...theme,
      targetWeight: clampWeight(theme.targetWeight),
      lowerThreshold: clampWeight(theme.lowerThreshold),
      upperThreshold: clampWeight(theme.upperThreshold),
      currentWeight:
        theme.currentWeight === null ? null : clampWeight(theme.currentWeight),
    }));

  return {
    ...portfolio,
    defaultBand: clampWeight(portfolio.defaultBand),
    themes,
  };
}
