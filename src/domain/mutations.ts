import { nextParentColor } from "./colors";
import { clampWeight } from "./format";
import { childrenOf, parentsOf } from "./selectors";
import { bandAround, isDefaultBand, stockBand } from "./thresholds";
import type { Portfolio, Theme, ThresholdMode } from "./types";

function touch(portfolio: Portfolio, themes: Theme[], patch: Partial<Portfolio> = {}): Portfolio {
  return {
    ...portfolio,
    ...patch,
    themes,
    updatedAt: new Date().toISOString(),
  };
}

function updateTheme(
  portfolio: Portfolio,
  themeId: string,
  recipe: (theme: Theme) => Theme,
): Portfolio {
  let changed = false;
  const themes = portfolio.themes.map((theme) => {
    if (theme.id !== themeId) return theme;
    const next = recipe(theme);
    if (next !== theme) changed = true;
    return next;
  });
  if (!changed) return portfolio;
  return touch(portfolio, themes);
}

function nextSortOrder(themes: Theme[]): number {
  return themes.reduce((max, theme) => Math.max(max, theme.sortOrder), -1) + 1;
}

function uniqueName(themes: Theme[], base: string): string {
  const names = new Set(themes.map((theme) => theme.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function newId(): string {
  return crypto.randomUUID();
}

export function setPortfolioName(portfolio: Portfolio, name: string): Portfolio {
  if (name === portfolio.name) return portfolio;
  return touch(portfolio, portfolio.themes, { name });
}

export function setThresholdMode(portfolio: Portfolio, mode: ThresholdMode): Portfolio {
  if (mode === portfolio.thresholdMode) return portfolio;
  const defaultBand = isSameBand(portfolio.defaultBand, stockBand(portfolio.thresholdMode))
    ? stockBand(mode)
    : portfolio.defaultBand;
  return touch(portfolio, portfolio.themes, { thresholdMode: mode, defaultBand });
}

function isSameBand(left: number, right: number): boolean {
  return Math.abs(left - right) < 0.001;
}

export function setDefaultBand(portfolio: Portfolio, band: number): Portfolio {
  const defaultBand = clampWeight(band);
  if (defaultBand === portfolio.defaultBand) return portfolio;
  return touch(portfolio, portfolio.themes, { defaultBand });
}

export function applyDefaultBand(portfolio: Portfolio): Portfolio {
  const themes = portfolio.themes.map((theme) => ({
    ...theme,
    ...bandAround(theme.targetWeight, portfolio.thresholdMode, portfolio.defaultBand),
  }));
  return touch(portfolio, themes);
}

export function renameTheme(portfolio: Portfolio, themeId: string, name: string): Portfolio {
  return updateTheme(portfolio, themeId, (theme) =>
    theme.name === name ? theme : { ...theme, name },
  );
}

export function setTargetWeight(
  portfolio: Portfolio,
  themeId: string,
  targetWeight: number,
): Portfolio {
  const nextTarget = clampWeight(targetWeight);
  return updateTheme(portfolio, themeId, (theme) => {
    if (theme.targetWeight === nextTarget) return theme;
    const nextBand = isDefaultBand(theme, portfolio.thresholdMode, portfolio.defaultBand)
      ? bandAround(nextTarget, portfolio.thresholdMode, portfolio.defaultBand)
      : {
          lowerThreshold: theme.lowerThreshold,
          upperThreshold: theme.upperThreshold,
        };
    return { ...theme, targetWeight: nextTarget, ...nextBand };
  });
}

export function setLowerThreshold(
  portfolio: Portfolio,
  themeId: string,
  lowerThreshold: number,
): Portfolio {
  const nextLower = clampWeight(lowerThreshold);
  return updateTheme(portfolio, themeId, (theme) =>
    theme.lowerThreshold === nextLower ? theme : { ...theme, lowerThreshold: nextLower },
  );
}

export function setUpperThreshold(
  portfolio: Portfolio,
  themeId: string,
  upperThreshold: number,
): Portfolio {
  const nextUpper = clampWeight(upperThreshold);
  return updateTheme(portfolio, themeId, (theme) =>
    theme.upperThreshold === nextUpper ? theme : { ...theme, upperThreshold: nextUpper },
  );
}

export function addParent(portfolio: Portfolio): Portfolio {
  const parents = parentsOf(portfolio);
  const used = parents.reduce((sum, parent) => sum + parent.targetWeight, 0);
  const targetWeight = clampWeight(Math.max(0, 100 - used));
  const theme: Theme = {
    id: newId(),
    parentId: null,
    name: uniqueName(parents, "New theme"),
    targetWeight,
    ...bandAround(targetWeight, portfolio.thresholdMode, portfolio.defaultBand),
    currentWeight: null,
    sortOrder: nextSortOrder(parents),
    color: nextParentColor(parents.map((parent) => parent.color)),
  };
  return touch(portfolio, [...portfolio.themes, theme]);
}

export function addChild(portfolio: Portfolio, parentId: string): Portfolio {
  const parent = portfolio.themes.find((theme) => theme.id === parentId && theme.parentId === null);
  if (!parent) return portfolio;
  const siblings = childrenOf(portfolio, parentId);
  const used = siblings.reduce((sum, child) => sum + child.targetWeight, 0);
  const targetWeight = clampWeight(Math.max(0, 100 - used));
  const theme: Theme = {
    id: newId(),
    parentId,
    name: uniqueName(siblings, "New position"),
    targetWeight,
    ...bandAround(targetWeight, portfolio.thresholdMode, portfolio.defaultBand),
    currentWeight: null,
    sortOrder: nextSortOrder(siblings),
    color: null,
  };
  return touch(portfolio, [...portfolio.themes, theme]);
}

export function deleteTheme(portfolio: Portfolio, themeId: string): Portfolio {
  const themes = portfolio.themes.filter(
    (theme) => theme.id !== themeId && theme.parentId !== themeId,
  );
  if (themes.length === portfolio.themes.length) return portfolio;
  return touch(portfolio, themes);
}

export function moveTheme(portfolio: Portfolio, themeId: string, direction: -1 | 1): Portfolio {
  const theme = portfolio.themes.find((item) => item.id === themeId);
  if (!theme) return portfolio;
  const siblings = portfolio.themes.filter((item) => item.parentId === theme.parentId).sort(
    (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
  );
  const index = siblings.findIndex((item) => item.id === themeId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= siblings.length) return portfolio;
  const reordered = siblings.slice();
  const [moved] = reordered.splice(index, 1);
  if (!moved) return portfolio;
  reordered.splice(targetIndex, 0, moved);
  const order = new Map(reordered.map((item, itemIndex) => [item.id, itemIndex]));
  const themes = portfolio.themes.map((item) => {
    const sortOrder = order.get(item.id);
    return sortOrder === undefined ? item : { ...item, sortOrder };
  });
  return touch(portfolio, themes);
}
