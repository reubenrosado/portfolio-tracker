import { createSeedPortfolio } from "@/data/seed";
import { parsePortfolio } from "@/data/parse-portfolio";
import type { PortfolioRepository } from "@/data/repository";
import type { Portfolio } from "@/domain/types";

export const PORTFOLIO_STORAGE_KEY = "portfolio-tracker.target.v1";

interface StoredPortfolio {
  version: 1;
  portfolio: Portfolio;
}

/**
 * Browser store. Swap this class for a Supabase repository with the same
 * load and save methods when the database phase starts.
 */
export class LocalStoragePortfolioRepository implements PortfolioRepository {
  async load(): Promise<Portfolio> {
    if (typeof window === "undefined") return createSeedPortfolio();
    try {
      const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
      if (!raw) return createSeedPortfolio();
      const parsed = parsePortfolio(JSON.parse(raw) as unknown);
      return parsed ?? createSeedPortfolio();
    } catch {
      return createSeedPortfolio();
    }
  }

  async save(portfolio: Portfolio): Promise<void> {
    if (typeof window === "undefined") return;
    const envelope: StoredPortfolio = { version: 1, portfolio };
    try {
      window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      // Private mode and full storage should not crash the designer.
    }
  }
}
