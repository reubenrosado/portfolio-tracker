const LATER_PHASES = [
  { id: "track", label: "Track" },
  { id: "manage", label: "Manage" },
  { id: "evaluate", label: "Evaluate" },
  { id: "find", label: "Find" },
] as const;

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function PhaseRail() {
  return (
    <nav aria-label="Product phases" className="flex flex-wrap items-center gap-2">
      <span
        aria-current="page"
        className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-white"
      >
        Target
      </span>
      <span className="px-1 text-xs uppercase tracking-[0.14em] text-faint">Later</span>
      {LATER_PHASES.map((phase) => (
        <span
          key={phase.id}
          title="Not built yet"
          className="rounded-full border border-dashed border-line px-3 py-1 text-sm text-faint"
        >
          {phase.label}
          <span className="sr-only">, not built yet</span>
        </span>
      ))}
    </nav>
  );
}
