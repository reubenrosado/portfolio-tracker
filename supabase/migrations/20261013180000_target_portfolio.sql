-- Draft schema for a later Supabase phase.
-- The app does not connect to a database yet. The designer stores the
-- portfolio in localStorage through PortfolioRepository.
--
-- Weights are percentages, not fractions: 38 means 38%.
-- A parent theme has parent_id null. target_weight is a percent of the portfolio.
-- A child theme points at its parent. target_weight is a percent of that parent.
-- lower_threshold and upper_threshold use those same percent units.
-- current_weight is reserved. A later Track phase can fill it from prices,
-- and Manage can compare it with the thresholds.

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  name text not null,
  threshold_mode text not null default 'absolute_pp'
    constraint portfolios_threshold_mode_check
    check (threshold_mode in ('absolute_pp', 'relative_percent')),
  default_band numeric(8, 3) not null default 5
    constraint portfolios_default_band_check
    check (default_band >= 0 and default_band <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.portfolios is
  'One target allocation. owner_id stays null until accounts exist.';

comment on column public.portfolios.threshold_mode is
  'How Apply band turns default_band into lower and upper weights. absolute_pp is percentage points. relative_percent is a percent of the target weight.';

comment on column public.portfolios.owner_id is
  'Reserved for auth.users when this becomes a multi user app.';

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios (id) on delete cascade,
  parent_id uuid references public.themes (id) on delete cascade,
  name text not null,
  target_weight numeric(8, 3) not null default 0
    constraint themes_target_weight_check
    check (target_weight >= 0 and target_weight <= 100),
  lower_threshold numeric(8, 3) not null default 0
    constraint themes_lower_threshold_check
    check (lower_threshold >= 0 and lower_threshold <= 100),
  upper_threshold numeric(8, 3) not null default 0
    constraint themes_upper_threshold_check
    check (upper_threshold >= 0 and upper_threshold <= 100),
  current_weight numeric(8, 3),
  sort_order integer not null default 0,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint themes_parent_not_self check (parent_id is null or parent_id <> id),
  constraint themes_threshold_order_check check (lower_threshold <= upper_threshold),
  constraint themes_current_weight_check check (
    current_weight is null
    or (current_weight >= 0 and current_weight <= 100)
  )
);

comment on table public.themes is
  'Parent and child themes for one portfolio. The app keeps a single level: children do not contain children.';

comment on column public.themes.parent_id is
  'Null for a parent theme. Set to a parent theme id for a position. Child target_weight is a percent of that parent.';

comment on column public.themes.target_weight is
  'Percent. Parents are a percent of the portfolio. Children are a percent of their parent.';

comment on column public.themes.lower_threshold is
  'Lower rebalance bound, in the same percent units as target_weight.';

comment on column public.themes.upper_threshold is
  'Upper rebalance bound, in the same percent units as target_weight.';

comment on column public.themes.current_weight is
  'Reserved. Null until prices fill a live weight for rebalance checks.';

comment on column public.themes.color is
  'Parent family color. Child shades are derived in the app, not stored.';

create index themes_portfolio_sort_idx
  on public.themes (portfolio_id, parent_id, sort_order);

create index themes_parent_id_idx
  on public.themes (parent_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portfolios_set_updated_at
  before update on public.portfolios
  for each row
  execute function public.set_updated_at();

create trigger themes_set_updated_at
  before update on public.themes
  for each row
  execute function public.set_updated_at();

-- Row level security stays off until auth exists. Intended policies:
--   alter table public.portfolios enable row level security;
--   alter table public.themes enable row level security;
--   create policy portfolios_owner on public.portfolios
--     for all
--     using (owner_id = auth.uid())
--     with check (owner_id = auth.uid());
--   create policy themes_owner on public.themes
--     for all
--     using (
--       exists (
--         select 1 from public.portfolios
--         where portfolios.id = themes.portfolio_id
--           and portfolios.owner_id = auth.uid()
--       )
--     )
--     with check (
--       exists (
--         select 1 from public.portfolios
--         where portfolios.id = themes.portfolio_id
--           and portfolios.owner_id = auth.uid()
--       )
--     );
