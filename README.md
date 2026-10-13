# Portfolio tracker

A target allocation designer for a personal portfolio. Themes are the unit of planning, not a flat list of tickers. This screen is the foundation. Four later phases can hang off the same model: Track, Manage, Evaluate, and Find.

The app is local for now. Nothing is priced, nothing is synced, and no account is required.

## Vision

A portfolio here is a set of themes.

A parent theme is an asset class or a job the money does. Equities, Crypto, and Hedges are parents. A parent weight is a percent of the whole portfolio, and the parents should sum to 100%.

A child theme is a sleeve or a specific position inside that parent. Altcoins, or Gold - physical, are children. A child weight is a percent of its parent, and the children of a parent should sum to 100%. The share of the whole portfolio is parent weight times child weight. Equities at 38% and Hodl - S&P 500 at 45% of Equities is 17.1% of the portfolio.

Each theme also has a lower and an upper rebalance threshold, in the same percent units as its target. Live weights are not computed yet. The field exists (`currentWeight` on each theme, `current_weight` in the draft schema) so a later phase can compare a live weight with the band and raise an alert.

The product can stay a personal tool or become a small SaaS later. The data model, the repository interface, and the draft Supabase migration are shaped for that, without pretending the accounts exist today.

## The four phases

Target, this repository, is the allocation you are aiming at. The four phases below are not built yet.

1. **Track.** Bring in holdings and prices, and compute a current weight for each theme.
2. **Manage.** Compare those current weights with the lower and upper thresholds. When a theme leaves its band, raise a rebalance alert.
3. **Evaluate.** Research a position against the theme it belongs to, and keep that research next to the target.
4. **Find.** Look for ideas that fit a theme that is under its target.

Agent driven work belongs in those later phases. This screen stays a clear, editable source of truth for the mix.

## Weight rules

- Parent `targetWeight` is a percent of the portfolio.
- Child `targetWeight` is a percent of its parent.
- Implied portfolio weight of a child is `parent target * child target / 100`.
- A position at 0% is allowed. Cleveland is 0% of Real Estate in the example, so it stays in the editor and does not take a slice of the chart.
- The designer says when parents, or the positions inside one parent, do not sum to 100%, and by how many percentage points.

The double donut keeps children lined up under their parent. If a group does not sum to 100%, slice angles scale inside that parent so the rings still match. Tooltips and the allocation check keep the real numbers.

## Rebalance bands

Lower and upper are always weights. The band style does not change those units. It only changes how a single width becomes the two weights when you apply it.

- **Percentage points** use a fixed width. 5 points on a 40% target runs from 35% to 45%. This is the default, because a zero target can still have a band above it.
- **Percent of target** scales with the weight. 20 percent of a 40% target runs from 32% to 48%. A target of 0 stays at 0, because a percent of zero is zero.

New themes take the current width. Changing a target keeps the band in step when that theme still uses the default width. A hand edited band stays put. Apply band to all themes rewrites every theme from the width.

The example portfolio starts with a 5 point band, clamped so a threshold never leaves 0% to 100%. Newport house is 100%, so its band is 95% to 100%. Cleveland is 0%, so its band is 0% to 5%.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Recharts for the double donut
- Local React state, persisted to `localStorage`
- A `PortfolioRepository` interface so storage can be swapped
- A draft SQL migration for Supabase. The app does not connect to a database.

## Project layout

```
src/domain        types, weight math, validation, chart model, edits
src/data          seed portfolio, repository interface, localStorage store
src/components    target designer, chart, theme editor
src/app           route, layout, styles
supabase/migrations   draft tables, not applied
```

`createPortfolioRepository()` in `src/data/index.ts` is the only switch. A future `SupabasePortfolioRepository` should implement `load` and `save` on `PortfolioRepository` and replace that function.

## Example portfolio

The first load seeds the mix from the working spreadsheet. Restore example in the header puts it back.

| Parent | Weight | Positions, as a percent of the parent |
| --- | --- | --- |
| Equities | 38% | Hodl - S&P 500 45, Hodl - QQQ (nasdaq) 10, Swing - QLD (nasdaq) 15, Swing - Other 15, Other 15 |
| Crypto | 10% | BTC 50, ETH 10, Alts 8, Swings 32 |
| Metals | 8% | Gold - physical 25, Silver - physical 40, Gold - miners & ETF 20, Swing - metals 15 |
| Real Estate | 19% | Newport house 100, Cleveland 0 |
| Cash | 20% | Physical cash 3, Checking 11, Yield savings 20, Bonds 16, Stable yield 50 |
| Hedges | 4% | Long vol 80, Crash hedge 20 |
| Other | 1% | Biz ideas 70, Domains etc 30 |

Parents sum to 100%. Each position group sums to 100%.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edits stay in this browser under the key `portfolio-tracker.target.v1`.

No environment variables are required. Copy `.env.example` to `.env.local` only when you are ready to point a future Supabase client at a project. Do not commit real keys. `.env.example` is the only env file tracked here, and its values are empty.

## Scripts

```bash
npm run dev        # local app
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # domain and parser tests
npm run build      # production build
```

## Draft database

`supabase/migrations/20261013180000_target_portfolio.sql` describes `portfolios` and `themes`.

- `themes.parent_id` is null for a parent and set for a position. Deleting a parent deletes its positions.
- `themes.target_weight`, `lower_threshold`, and `upper_threshold` are percentages.
- `themes.current_weight` is nullable and unused by the app today.
- `portfolios.threshold_mode` is `absolute_pp` or `relative_percent`.
- `portfolios.owner_id` is reserved for `auth.users` when accounts exist. Row level security is written in comments and is not enabled yet.

The migration is a draft. Do not treat it as applied.
