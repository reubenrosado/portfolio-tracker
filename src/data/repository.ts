import type { Portfolio } from "@/domain/types";

/**
 * Storage seam for the target portfolio.
 *
 * The UI talks only to this interface. The current implementation reads and
 * writes localStorage. A later Supabase implementation can replace it in
 * src/data/index.ts without changing the designer.
 *
 * load() returns the example portfolio when nothing has been saved.
 */
export interface PortfolioRepository {
  load(): Promise<Portfolio>;
  save(portfolio: Portfolio): Promise<void>;
}
