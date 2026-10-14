import { normalizePortfolio } from "@/domain/selectors";
import type { Portfolio, Theme, ThresholdMode } from "@/domain/types";

const THRESHOLD_MODES = new Set<ThresholdMode>(["absolute_pp", "relative_percent"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTheme(value: unknown): Theme | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || value.id.length === 0) return null;
  if (typeof value.name !== "string") return null;
  if (typeof value.targetWeight !== "number" || !Number.isFinite(value.targetWeight)) return null;
  if (typeof value.lowerThreshold !== "number" || !Number.isFinite(value.lowerThreshold)) return null;
  if (typeof value.upperThreshold !== "number" || !Number.isFinite(value.upperThreshold)) return null;
  if (typeof value.sortOrder !== "number" || !Number.isFinite(value.sortOrder)) return null;
  if (value.parentId !== null && typeof value.parentId !== "string") return null;
  if (value.color !== null && value.color !== undefined && typeof value.color !== "string") {
    return null;
  }

  let currentWeight: number | null = null;
  if (typeof value.currentWeight === "number" && Number.isFinite(value.currentWeight)) {
    currentWeight = value.currentWeight;
  }

  return {
    id: value.id,
    parentId: value.parentId ?? null,
    name: value.name,
    targetWeight: value.targetWeight,
    lowerThreshold: value.lowerThreshold,
    upperThreshold: value.upperThreshold,
    currentWeight,
    sortOrder: value.sortOrder,
    color: typeof value.color === "string" ? value.color : null,
  };
}

/** Accept the versioned envelope, or a bare portfolio object. */
export function parsePortfolio(value: unknown): Portfolio | null {
  if (!isRecord(value)) return null;
  const stored = value.version === 1 && isRecord(value.portfolio) ? value.portfolio : value;
  if (!isRecord(stored)) return null;
  if (typeof stored.id !== "string" || typeof stored.name !== "string") return null;
  if (typeof stored.thresholdMode !== "string" || !THRESHOLD_MODES.has(stored.thresholdMode as ThresholdMode)) {
    return null;
  }
  if (typeof stored.defaultBand !== "number" || !Number.isFinite(stored.defaultBand)) return null;
  if (!Array.isArray(stored.themes)) return null;

  const themes: Theme[] = [];
  for (const item of stored.themes) {
    const theme = parseTheme(item);
    if (theme) themes.push(theme);
  }
  if (!themes.some((theme) => theme.parentId === null)) return null;

  return normalizePortfolio({
    id: stored.id,
    name: stored.name,
    thresholdMode: stored.thresholdMode as ThresholdMode,
    defaultBand: stored.defaultBand,
    themes,
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date(0).toISOString(),
  });
}
