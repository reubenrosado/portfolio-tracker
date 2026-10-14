"use client";

import { absoluteChildWeight, childrenOf, parentsOf, themeLabel } from "@/domain/selectors";
import { describeThresholds, isDefaultBand } from "@/domain/thresholds";
import { formatPercent } from "@/domain/format";
import { issueMessage, parentSumLabel, sumMessage } from "@/domain/validation";
import { useDesigner } from "@/components/portfolio/designer-context";
import { WeightField } from "@/components/portfolio/weight-field";
import type { Theme } from "@/domain/types";

export function ThemeEditor() {
  const { portfolio, actions } = useDesigner();
  const parents = parentsOf(portfolio);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl tracking-tight">Themes</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
          Parents should sum to 100% of the portfolio. Positions should sum to 100% of their
          parent. The portfolio figure on a position is parent weight times position weight.
        </p>
      </div>
      {parents.map((parent) => (
        <ParentCard key={parent.id} parent={parent} />
      ))}
      <button
        type="button"
        onClick={actions.addParent}
        className="flex w-full items-center justify-center rounded-2xl border border-dashed border-line bg-surface/60 px-4 py-4 text-sm font-medium text-foreground transition hover:border-accent hover:bg-surface"
      >
        Add parent theme
      </button>
    </section>
  );
}

function ParentCard({ parent }: { parent: Theme }) {
  const { portfolio, validation, activeId, setActiveId, actions } = useDesigner();
  const children = childrenOf(portfolio, parent.id);
  const childSum = validation.childrenByParent[parent.id];
  const familyActive =
    activeId === parent.id || children.some((child) => child.id === activeId);
  const nameIssue = issueMessage(validation.issues, parent.id, "name");

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-surface shadow-[var(--shadow)] ${
        familyActive ? "border-accent/50" : "border-line"
      }`}
      onMouseEnter={() => setActiveId(parent.id)}
      onMouseLeave={() => setActiveId(null)}
    >
      <div className="h-1.5" style={{ backgroundColor: parent.color ?? "#8d8578" }} />
      <div
        className="space-y-3 px-4 py-4"
        onMouseEnter={() => setActiveId(parent.id)}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <ReorderButtons
              label={themeLabel(parent, "Untitled parent")}
              disableUp={parentsOf(portfolio)[0]?.id === parent.id}
              disableDown={parentsOf(portfolio).at(-1)?.id === parent.id}
              onUp={() => actions.moveTheme(parent.id, -1)}
              onDown={() => actions.moveTheme(parent.id, 1)}
            />
            <div className="min-w-0 flex-1">
              <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                Parent theme
                <input
                  value={parent.name}
                  maxLength={80}
                  placeholder="Theme name"
                  aria-invalid={Boolean(nameIssue)}
                  onChange={(event) => actions.renameTheme(parent.id, event.target.value)}
                  onFocus={() => setActiveId(parent.id)}
                  className={`mt-1 w-full bg-transparent font-serif text-2xl tracking-tight outline-none ${
                    nameIssue ? "text-danger" : "text-foreground"
                  }`}
                />
              </label>
              {nameIssue ? <p className="mt-1 text-xs text-danger">{nameIssue}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <WeightField
              label="Target"
              hint="of portfolio"
              value={parent.targetWeight}
              onChange={(value) => actions.setTargetWeight(parent.id, value)}
            />
            <WeightField
              label="Lower"
              value={parent.lowerThreshold}
              invalid={Boolean(issueMessage(validation.issues, parent.id, "lowerThreshold"))}
              onChange={(value) => actions.setLowerThreshold(parent.id, value)}
            />
            <WeightField
              label="Upper"
              value={parent.upperThreshold}
              invalid={Boolean(issueMessage(validation.issues, parent.id, "upperThreshold"))}
              onChange={(value) => actions.setUpperThreshold(parent.id, value)}
            />
            <DeleteControl theme={parent} noun="theme" />
          </div>
        </div>
        <BandNote theme={parent} />
      </div>
      <div className="border-t border-line bg-surface-2 px-4 py-3">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Positions</h3>
          {childSum ? (
            <p className={`text-xs ${childSum.status === "ok" ? "text-ok" : "text-warning"}`}>
              {sumMessage(parentSumLabel(parent), childSum)}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          {children.map((child) => (
            <ChildRow key={child.id} child={child} parent={parent} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => actions.addChild(parent.id)}
          className="mt-3 text-sm font-medium text-accent transition hover:text-accent-strong"
        >
          Add position
        </button>
      </div>
    </article>
  );
}

function ChildRow({ child, parent }: { child: Theme; parent: Theme }) {
  const { portfolio, validation, activeId, setActiveId, actions } = useDesigner();
  const siblings = childrenOf(portfolio, parent.id);
  const nameIssue = issueMessage(validation.issues, child.id, "name");
  const absolute = absoluteChildWeight(parent.targetWeight, child.targetWeight);
  const active = activeId === child.id;

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        active ? "border-accent/40 bg-white" : "border-line bg-surface"
      }`}
      onMouseEnter={(event) => {
        event.stopPropagation();
        setActiveId(child.id);
      }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="flex min-w-0 flex-1 items-end gap-2">
          <ReorderButtons
            label={themeLabel(child, "Untitled position")}
            disableUp={siblings[0]?.id === child.id}
            disableDown={siblings.at(-1)?.id === child.id}
            onUp={() => actions.moveTheme(child.id, -1)}
            onDown={() => actions.moveTheme(child.id, 1)}
          />
          <div className="min-w-0 flex-1">
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
              Position
              <input
                value={child.name}
                maxLength={80}
                placeholder="Position name"
                aria-invalid={Boolean(nameIssue)}
                onChange={(event) => actions.renameTheme(child.id, event.target.value)}
                onFocus={() => setActiveId(child.id)}
                className="mt-1 w-full bg-transparent text-sm font-medium outline-none"
              />
            </label>
            {nameIssue ? <p className="mt-1 text-xs text-danger">{nameIssue}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <WeightField
            label="Target"
            hint="of parent"
            value={child.targetWeight}
            onChange={(value) => actions.setTargetWeight(child.id, value)}
          />
          <WeightField
            label="Lower"
            value={child.lowerThreshold}
            invalid={Boolean(issueMessage(validation.issues, child.id, "lowerThreshold"))}
            onChange={(value) => actions.setLowerThreshold(child.id, value)}
          />
          <WeightField
            label="Upper"
            value={child.upperThreshold}
            invalid={Boolean(issueMessage(validation.issues, child.id, "upperThreshold"))}
            onChange={(value) => actions.setUpperThreshold(child.id, value)}
          />
          <div className="min-w-[6.5rem] pb-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
              Portfolio
            </p>
            <p className="mt-1 text-sm font-medium tabular-nums">{formatPercent(absolute)}</p>
          </div>
          <DeleteControl theme={child} noun="position" />
        </div>
      </div>
      <div className="mt-2 pl-9">
        <BandNote theme={child} />
      </div>
    </div>
  );
}

function BandNote({ theme }: { theme: Theme }) {
  const { portfolio, validation } = useDesigner();
  const custom = !isDefaultBand(theme, portfolio.thresholdMode, portfolio.defaultBand);
  const lowerIssue = issueMessage(validation.issues, theme.id, "lowerThreshold");
  const upperIssue = issueMessage(validation.issues, theme.id, "upperThreshold");
  return (
    <div>
      <p className="text-xs text-faint">
        {describeThresholds(theme)}
        {custom ? " Custom band." : ""}
      </p>
      {lowerIssue ? <p className="mt-1 text-xs text-danger">{lowerIssue}</p> : null}
      {upperIssue ? <p className="mt-1 text-xs text-danger">{upperIssue}</p> : null}
    </div>
  );
}

function DeleteControl({ theme, noun }: { theme: Theme; noun: "theme" | "position" }) {
  const { pendingDeleteId, requestDelete, cancelDelete, confirmDelete } = useDesigner();
  const pending = pendingDeleteId === theme.id;
  const label = themeLabel(theme, noun === "theme" ? "this theme" : "this position");

  if (!pending) {
    return (
      <button
        type="button"
        onClick={() => requestDelete(theme.id)}
        className="mb-1 rounded-md px-2 py-1.5 text-sm text-muted transition hover:bg-danger-bg hover:text-danger"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="mb-1 flex items-center gap-1">
      <button
        type="button"
        onClick={confirmDelete}
        className="rounded-md bg-danger px-2 py-1.5 text-sm font-medium text-white"
      >
        Delete {noun}
      </button>
      <button
        type="button"
        onClick={cancelDelete}
        className="rounded-md px-2 py-1.5 text-sm text-muted hover:text-foreground"
      >
        Cancel
      </button>
      <span className="sr-only">
        {noun === "theme"
          ? `Delete ${label} and its positions.`
          : `Delete ${label}.`}
      </span>
    </div>
  );
}

function ReorderButtons({
  label,
  disableUp,
  disableDown,
  onUp,
  onDown,
}: {
  label: string;
  disableUp: boolean;
  disableDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex flex-col">
      <IconButton label={`Move ${label} up`} disabled={disableUp} onClick={onUp}>
        <Chevron direction="up" />
      </IconButton>
      <IconButton label={`Move ${label} down`} disabled={disableDown} onClick={onDown}>
        <Chevron direction="down" />
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-6 items-center justify-center rounded text-muted transition hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Chevron({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
      {direction === "up" ? (
        <path d="M3 10.5 8 5.5l5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M3 5.5 8 10.5l5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      )}
    </svg>
  );
}
