"use client";

import { useEffect, useId, useRef, useState } from "react";
import { clampWeight, formatWeight, isWeightDraft, parseDraftWeight } from "@/domain/format";

interface WeightFieldProps {
  label: string;
  value: number;
  hint?: string;
  invalid?: boolean;
  onChange: (value: number) => void;
}

export function WeightField({ label, value, hint, invalid = false, onChange }: WeightFieldProps) {
  const id = useId();
  const hintId = useId();
  const focused = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? formatWeight(value);

  useEffect(() => {
    if (!focused.current) setDraft(null);
  }, [value]);

  function publish(raw: string) {
    const parsed = parseDraftWeight(raw);
    if (parsed === null) return;
    onChange(clampWeight(parsed));
  }

  return (
    <div className="min-w-[4.75rem]">
      <label htmlFor={id} className="block text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
        {label}
      </label>
      <div
        className={`mt-1 flex items-center rounded-md border bg-surface px-2 focus-within:border-accent ${
          invalid ? "border-danger" : "border-line"
        }`}
      >
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={hint ? hintId : undefined}
          value={text}
          onFocus={() => {
            focused.current = true;
            setDraft(formatWeight(value));
          }}
          onBlur={(event) => {
            focused.current = false;
            const raw = event.currentTarget.value;
            if (parseDraftWeight(raw) === null) {
              setDraft(null);
              return;
            }
            publish(raw);
            setDraft(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          onChange={(event) => {
            const nextText = event.target.value;
            if (!isWeightDraft(nextText)) return;
            setDraft(nextText);
            publish(nextText);
          }}
          className="w-12 bg-transparent py-1.5 text-right text-sm tabular-nums outline-none"
        />
        <span className="pl-1 text-sm text-muted" aria-hidden="true">
          %
        </span>
      </div>
      {hint ? (
        <p id={hintId} className="mt-1 text-[11px] text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
