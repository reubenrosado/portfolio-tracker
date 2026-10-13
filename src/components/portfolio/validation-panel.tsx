"use client";

import { parentsOf, themeLabel } from "@/domain/selectors";
import { parentSumLabel, sumMessage } from "@/domain/validation";
import { useDesigner } from "@/components/portfolio/designer-context";

export function ValidationPanel() {
  const { portfolio, validation } = useDesigner();
  const parents = parentsOf(portfolio);
  const childProblems = parents.filter(
    (parent) => validation.childrenByParent[parent.id]?.status !== "ok",
  );

  return (
    <section
      aria-live="polite"
      className={`rounded-2xl border p-4 shadow-[var(--shadow)] ${
        validation.isValid
          ? "border-ok/30 bg-ok-bg text-ok"
          : "border-warning/30 bg-warning-bg text-warning"
      }`}
    >
      <h2 className="font-serif text-xl tracking-tight text-foreground">Allocation check</h2>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        <li>{sumMessage("Parents", validation.parents)}</li>
        {validation.isValid ? (
          <li>{parents.length} position groups sum to 100%.</li>
        ) : (
          childProblems.map((parent) => {
            const sum = validation.childrenByParent[parent.id];
            if (!sum) return null;
            return <li key={parent.id}>{sumMessage(parentSumLabel(parent), sum)}</li>;
          })
        )}
        {validation.issues.map((issue) => {
          const theme = portfolio.themes.find((item) => item.id === issue.themeId);
          const label = theme ? themeLabel(theme, "Untitled") : "Theme";
          return (
            <li key={`${issue.themeId}-${issue.field}`}>
              {label}: {issue.message}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
