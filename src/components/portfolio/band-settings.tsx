"use client";

import { bandAround } from "@/domain/thresholds";
import { formatPercent, formatWeight } from "@/domain/format";
import { useDesigner } from "@/components/portfolio/designer-context";
import { WeightField } from "@/components/portfolio/weight-field";

export function BandSettings() {
  const { portfolio, actions } = useDesigner();
  const sample = bandAround(40, portfolio.thresholdMode, portfolio.defaultBand);
  const sampleText =
    portfolio.thresholdMode === "absolute_pp"
      ? `Percentage points keep the same width on every position. A width of ${formatWeight(portfolio.defaultBand)} points on a 40% target runs from ${formatPercent(sample.lowerThreshold)} to ${formatPercent(sample.upperThreshold)}.`
      : `Percent of target scales with the position. A width of ${formatWeight(portfolio.defaultBand)} percent on a 40% target runs from ${formatPercent(sample.lowerThreshold)} to ${formatPercent(sample.upperThreshold)}.`;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <h2 className="font-serif text-xl tracking-tight">Rebalance band</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Lower and upper on each theme are weights. This style only changes how the width becomes
        those two weights. Switching style does not rewrite them until you apply it.
      </p>
      <div
        role="radiogroup"
        aria-label="Band style"
        className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
      >
        <ModeButton mode="absolute_pp" label="Percentage points" />
        <ModeButton mode="relative_percent" label="Percent of target" />
      </div>
      <div className="mt-4">
        <WeightField
          label="Width"
          value={portfolio.defaultBand}
          onChange={actions.setDefaultBand}
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{sampleText}</p>
      {portfolio.thresholdMode === "relative_percent" ? (
        <p className="mt-2 text-sm leading-6 text-muted">
          A target of 0 stays at 0 in this style, because a percent of zero is zero. Percentage
          points still open a band above zero.
        </p>
      ) : null}
      <button
        type="button"
        onClick={actions.applyDefaultBand}
        className="mt-4 inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-strong"
      >
        Apply band to all themes
      </button>
    </section>
  );
}

function ModeButton({
  mode,
  label,
}: {
  mode: "absolute_pp" | "relative_percent";
  label: string;
}) {
  const { portfolio, actions } = useDesigner();
  const selected = portfolio.thresholdMode === mode;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => actions.setThresholdMode(mode)}
      className={`rounded-md px-2 py-2 text-sm font-medium transition ${
        selected ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
