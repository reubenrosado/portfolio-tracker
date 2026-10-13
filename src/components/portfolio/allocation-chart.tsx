"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import {
  buildChart,
  chartSummary,
  isChartSlice,
  sliceIsActive,
  type ChartSlice,
} from "@/domain/chart";
import { formatPercent } from "@/domain/format";
import { parentsOf } from "@/domain/selectors";
import { useDesigner } from "@/components/portfolio/designer-context";

const SURFACE = "#fffcf8";

export function AllocationChart() {
  const { portfolio, validation, activeId, setActiveId } = useDesigner();
  const chart = buildChart(portfolio);
  const parents = parentsOf(portfolio);
  const parentTotal = validation.parents.total;
  const hasZero = portfolio.themes.some(
    (theme) => theme.parentId !== null && theme.targetWeight === 0,
  );
  const empty = chart.parents.length === 0;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl tracking-tight">Mix</h2>
        <p className="text-xs text-muted">Inner parents, outer positions</p>
      </div>
      {empty ? (
        <div className="flex h-[420px] items-center justify-center text-center text-sm text-muted">
          Add a parent theme with a target above 0% to draw the mix.
        </div>
      ) : (
        <div
          className="relative h-[420px]"
          role="img"
          aria-label={chartSummary(portfolio)}
          onMouseLeave={() => setActiveId(null)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chart.parents}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="46%"
                outerRadius="66%"
                startAngle={90}
                endAngle={-270}
                stroke={SURFACE}
                strokeWidth={1}
                isAnimationActive={false}
                paddingAngle={0}
                onMouseEnter={(_data, index) => {
                  const slice = chart.parents[index];
                  if (slice?.themeId) setActiveId(slice.themeId);
                }}
              >
                {chart.parents.map((slice) => (
                  <Cell
                    key={slice.key}
                    fill={slice.fill}
                    fillOpacity={sliceIsActive(slice, activeId, portfolio.themes) ? 1 : 0.35}
                    stroke={SURFACE}
                  />
                ))}
              </Pie>
              <Pie
                data={chart.children}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="70%"
                outerRadius="92%"
                startAngle={90}
                endAngle={-270}
                stroke={SURFACE}
                strokeWidth={1}
                isAnimationActive={false}
                paddingAngle={0}
                onMouseEnter={(_data, index) => {
                  const slice = chart.children[index];
                  if (slice?.themeId) setActiveId(slice.themeId);
                }}
              >
                {chart.children.map((slice) => (
                  <Cell
                    key={slice.key}
                    fill={slice.fill}
                    fillOpacity={sliceIsActive(slice, activeId, portfolio.themes) ? 1 : 0.35}
                    stroke={SURFACE}
                  />
                ))}
              </Pie>
              <Tooltip
                content={(props) => <ChartTooltip {...props} />}
                animationDuration={0}
                wrapperStyle={{ zIndex: 30, outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p
                className={`font-serif text-4xl tabular-nums tracking-tight ${
                  validation.parents.status === "ok" ? "text-foreground" : "text-warning"
                }`}
              >
                {formatPercent(parentTotal)}
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Parents</p>
            </div>
          </div>
        </div>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-2">
        {parents.map((parent) => (
          <li key={parent.id}>
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-full px-1.5 py-1 text-xs ${
                activeId === parent.id ? "bg-surface-2" : ""
              }`}
              onMouseEnter={() => setActiveId(parent.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(parent.id)}
              onBlur={() => setActiveId(null)}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: parent.color ?? "#8d8578" }}
                aria-hidden="true"
              />
              <span>{parent.name || "Untitled"}</span>
              <span className="tabular-nums text-muted">{formatPercent(parent.targetWeight)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-muted">
        Hover a slice or a theme for the weights. Child colors stay in the parent family.
        {hasZero ? " A position at 0% stays in the editor and does not take a slice." : ""}
        {!validation.isValid
          ? " If a group is not 100%, angles scale inside that parent so the rings still line up. The check has the exact gap."
          : ""}
      </p>
    </section>
  );
}

function ChartTooltip({ active, payload }: Partial<TooltipContentProps>) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]?.payload;
  if (!isChartSlice(slice)) return null;
  return (
    <div className="max-w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-[var(--shadow)]">
      <p className="font-medium text-foreground">{slice.name}</p>
      <SliceDetails slice={slice} />
    </div>
  );
}

function SliceDetails({ slice }: { slice: ChartSlice }) {
  if (slice.kind === "gap") {
    return (
      <p className="mt-1 text-muted">
        {slice.name === "Unallocated"
          ? "No parent theme covers this share of the portfolio."
          : `${slice.parentName ?? "This parent"} has no weighted positions.`}
      </p>
    );
  }
  if (slice.kind === "parent") {
    return (
      <>
        <p className="mt-1 tabular-nums text-foreground">
          {formatPercent(slice.targetWeight)} of the portfolio
        </p>
        {slice.lowerThreshold !== null && slice.upperThreshold !== null ? (
          <p className="mt-1 text-muted">
            Band {formatPercent(slice.lowerThreshold)} to {formatPercent(slice.upperThreshold)}
          </p>
        ) : null}
      </>
    );
  }
  return (
    <>
      <p className="mt-1 text-muted">{slice.parentName}</p>
      <p className="tabular-nums text-foreground">
        {formatPercent(slice.targetWeight)} of the parent
      </p>
      <p className="tabular-nums text-foreground">
        {formatPercent(slice.absoluteWeight)} of the portfolio
      </p>
      {slice.lowerThreshold !== null && slice.upperThreshold !== null ? (
        <p className="mt-1 text-muted">
          Band {formatPercent(slice.lowerThreshold)} to {formatPercent(slice.upperThreshold)}
        </p>
      ) : null}
      {slice.scaled ? (
        <p className="mt-1 text-muted">
          This slice is scaled so the family stays under its parent. The percents above are the
          real weights.
        </p>
      ) : null}
    </>
  );
}
