import { LocalStoragePortfolioRepository } from "@/data/local-storage-repository";
import type { PortfolioRepository } from "@/data/repository";

/**
 * The only place the app chooses a store.
 * Replace the body with a SupabasePortfolioRepository when that phase starts.
 */
export function createPortfolioRepository(): PortfolioRepository {
  return new LocalStoragePortfolioRepository();
}
