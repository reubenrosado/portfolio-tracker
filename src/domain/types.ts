/**
 * Target portfolio model.
 *
 * A parent theme (parentId null) is an asset class or a job the money does.
 * Its targetWeight is a percent of the whole portfolio.
 *
 * A child theme is a sleeve or a position inside that parent.
 * Its targetWeight is a percent of the parent, not of the portfolio.
 *
 * lowerThreshold and upperThreshold use the same percent units as targetWeight.
 * currentWeight is reserved for a later phase that fills live weights from prices.
 */

export const THRESHOLD_MODES = ["absolute_pp", "relative_percent"] as const;

export type ThresholdMode = (typeof THRESHOLD_MODES)[number];

export interface Theme {
  id: string;
  parentId: string | null;
  name: string;
  targetWeight: number;
  lowerThreshold: number;
  upperThreshold: number;
  currentWeight: number | null;
  sortOrder: number;
  /** Family color for a parent. Children derive shades from the parent color. */
  color: string | null;
}

export interface Portfolio {
  id: string;
  name: string;
  thresholdMode: ThresholdMode;
  /** Width used by "Apply band". Percentage points, or percent of the target. */
  defaultBand: number;
  themes: Theme[];
  updatedAt: string;
}
