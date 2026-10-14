import { formatWeight, roundWeight, SUM_EPSILON, SUM_TARGET } from "./format";
import { childrenOf, parentsOf, themeLabel } from "./selectors";
import type { Portfolio, Theme } from "./types";

export interface WeightSum {
  total: number;
  /** total minus 100. Positive means over. */
  delta: number;
  status: "ok" | "short" | "over";
}

export type ThemeIssueField = "name" | "lowerThreshold" | "upperThreshold";

export interface ThemeIssue {
  themeId: string;
  field: ThemeIssueField;
  message: string;
}

export interface PortfolioValidation {
  parents: WeightSum;
  childrenByParent: Record<string, WeightSum>;
  issues: ThemeIssue[];
  isValid: boolean;
}

export function weightSum(values: number[]): WeightSum {
  const raw = values.reduce((sum, value) => sum + value, 0);
  const total = roundWeight(raw);
  const delta = roundWeight(raw - SUM_TARGET);
  let status: WeightSum["status"] = "ok";
  if (raw < SUM_TARGET - SUM_EPSILON) status = "short";
  if (raw > SUM_TARGET + SUM_EPSILON) status = "over";
  return { total, delta, status };
}

export function sumMessage(subject: string, sum: WeightSum): string {
  if (sum.status === "ok") return `${subject} sum to 100%.`;
  const amount = formatWeight(Math.abs(sum.delta));
  const direction = sum.status === "short" ? "Short" : "Over";
  return `${subject} sum to ${formatWeight(sum.total)}%. ${direction} by ${amount} percentage points.`;
}

function themeIssues(theme: Theme): ThemeIssue[] {
  const issues: ThemeIssue[] = [];
  if (theme.name.trim().length === 0) {
    issues.push({
      themeId: theme.id,
      field: "name",
      message: "Give this theme a name.",
    });
  }
  if (theme.lowerThreshold > theme.upperThreshold + 0.001) {
    issues.push({
      themeId: theme.id,
      field: "lowerThreshold",
      message: "Lower threshold is above the upper threshold.",
    });
    return issues;
  }
  if (theme.lowerThreshold > theme.targetWeight + 0.001) {
    issues.push({
      themeId: theme.id,
      field: "lowerThreshold",
      message: "Lower threshold is above the target.",
    });
  }
  if (theme.upperThreshold < theme.targetWeight - 0.001) {
    issues.push({
      themeId: theme.id,
      field: "upperThreshold",
      message: "Upper threshold is below the target.",
    });
  }
  return issues;
}

export function issueMessage(
  issues: ThemeIssue[],
  themeId: string,
  field: ThemeIssueField,
): string | null {
  return issues.find((issue) => issue.themeId === themeId && issue.field === field)?.message ?? null;
}

export function validatePortfolio(portfolio: Portfolio): PortfolioValidation {
  const parents = parentsOf(portfolio);
  const parentSum = weightSum(parents.map((parent) => parent.targetWeight));
  const childrenByParent: Record<string, WeightSum> = {};
  const issues: ThemeIssue[] = [];

  for (const parent of parents) {
    const children = childrenOf(portfolio, parent.id);
    childrenByParent[parent.id] = weightSum(children.map((child) => child.targetWeight));
    issues.push(...themeIssues(parent));
    for (const child of children) issues.push(...themeIssues(child));
  }

  const childrenOk = Object.values(childrenByParent).every((sum) => sum.status === "ok");
  return {
    parents: parentSum,
    childrenByParent,
    issues,
    isValid: parentSum.status === "ok" && childrenOk && issues.length === 0,
  };
}

export function parentSumLabel(parent: Theme): string {
  return `${themeLabel(parent, "Untitled")} positions`;
}
