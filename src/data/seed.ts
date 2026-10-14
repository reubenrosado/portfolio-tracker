import { PARENT_PALETTE } from "@/domain/colors";
import { bandAround, DEFAULT_ABSOLUTE_BAND } from "@/domain/thresholds";
import type { Portfolio, Theme } from "@/domain/types";

export const SEED_UPDATED_AT = "2026-01-15T00:00:00.000Z";
export const SEED_PORTFOLIO_ID = "primary-target";

interface SeedChild {
  id: string;
  name: string;
  targetWeight: number;
}

interface SeedParent {
  id: string;
  name: string;
  targetWeight: number;
  color: string;
  children: SeedChild[];
}

/**
 * Example mix from the working spreadsheet.
 * Parent numbers are a percent of the portfolio.
 * Child numbers are a percent of that parent.
 */
const SEED_PARENTS: SeedParent[] = [
  {
    id: "equities",
    name: "Equities",
    targetWeight: 38,
    color: PARENT_PALETTE[0],
    children: [
      { id: "equities-spy", name: "Hodl - S&P 500", targetWeight: 45 },
      { id: "equities-qqq", name: "Hodl - QQQ (nasdaq)", targetWeight: 10 },
      { id: "equities-qld", name: "Swing - QLD (nasdaq)", targetWeight: 15 },
      { id: "equities-swing-other", name: "Swing - Other", targetWeight: 15 },
      { id: "equities-other", name: "Other", targetWeight: 15 },
    ],
  },
  {
    id: "crypto",
    name: "Crypto",
    targetWeight: 10,
    color: PARENT_PALETTE[1],
    children: [
      { id: "crypto-btc", name: "BTC", targetWeight: 50 },
      { id: "crypto-eth", name: "ETH", targetWeight: 10 },
      { id: "crypto-alts", name: "Alts", targetWeight: 8 },
      { id: "crypto-swings", name: "Swings", targetWeight: 32 },
    ],
  },
  {
    id: "metals",
    name: "Metals",
    targetWeight: 8,
    color: PARENT_PALETTE[2],
    children: [
      { id: "metals-gold", name: "Gold - physical", targetWeight: 25 },
      { id: "metals-silver", name: "Silver - physical", targetWeight: 40 },
      { id: "metals-miners", name: "Gold - miners & ETF", targetWeight: 20 },
      { id: "metals-swing", name: "Swing - metals", targetWeight: 15 },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    targetWeight: 19,
    color: PARENT_PALETTE[3],
    children: [
      { id: "real-estate-newport", name: "Newport house", targetWeight: 100 },
      { id: "real-estate-cleveland", name: "Cleveland", targetWeight: 0 },
    ],
  },
  {
    id: "cash",
    name: "Cash",
    targetWeight: 20,
    color: PARENT_PALETTE[4],
    children: [
      { id: "cash-physical", name: "Physical cash", targetWeight: 3 },
      { id: "cash-checking", name: "Checking", targetWeight: 11 },
      { id: "cash-yield", name: "Yield savings", targetWeight: 20 },
      { id: "cash-bonds", name: "Bonds", targetWeight: 16 },
      { id: "cash-stable", name: "Stable yield", targetWeight: 50 },
    ],
  },
  {
    id: "hedges",
    name: "Hedges",
    targetWeight: 4,
    color: PARENT_PALETTE[5],
    children: [
      { id: "hedges-long-vol", name: "Long vol", targetWeight: 80 },
      { id: "hedges-crash", name: "Crash hedge", targetWeight: 20 },
    ],
  },
  {
    id: "other",
    name: "Other",
    targetWeight: 1,
    color: PARENT_PALETTE[6],
    children: [
      { id: "other-biz", name: "Biz ideas", targetWeight: 70 },
      { id: "other-domains", name: "Domains etc", targetWeight: 30 },
    ],
  },
];

function seedTheme(
  id: string,
  parentId: string | null,
  name: string,
  targetWeight: number,
  sortOrder: number,
  color: string | null,
): Theme {
  return {
    id,
    parentId,
    name,
    targetWeight,
    ...bandAround(targetWeight, "absolute_pp", DEFAULT_ABSOLUTE_BAND),
    currentWeight: null,
    sortOrder,
    color,
  };
}

export function createSeedPortfolio(): Portfolio {
  const themes: Theme[] = [];
  SEED_PARENTS.forEach((parent, parentIndex) => {
    themes.push(
      seedTheme(parent.id, null, parent.name, parent.targetWeight, parentIndex, parent.color),
    );
    parent.children.forEach((child, childIndex) => {
      themes.push(
        seedTheme(child.id, parent.id, child.name, child.targetWeight, childIndex, null),
      );
    });
  });

  return {
    id: SEED_PORTFOLIO_ID,
    name: "Primary target",
    thresholdMode: "absolute_pp",
    defaultBand: DEFAULT_ABSOLUTE_BAND,
    themes,
    updatedAt: SEED_UPDATED_AT,
  };
}

export function restoreExamplePortfolio(): Portfolio {
  return {
    ...createSeedPortfolio(),
    updatedAt: new Date().toISOString(),
  };
}
