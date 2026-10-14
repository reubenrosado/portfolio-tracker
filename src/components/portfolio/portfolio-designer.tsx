"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { BandSettings } from "@/components/portfolio/band-settings";
import {
  DesignerProvider,
  useDesigner,
  type DesignerContextValue,
} from "@/components/portfolio/designer-context";
import { Mark, PhaseRail } from "@/components/portfolio/phase-rail";
import { ThemeEditor } from "@/components/portfolio/theme-editor";
import { ValidationPanel } from "@/components/portfolio/validation-panel";
import { createPortfolioRepository } from "@/data";
import type { PortfolioRepository } from "@/data/repository";
import { createSeedPortfolio, restoreExamplePortfolio } from "@/data/seed";
import {
  addChild,
  addParent,
  applyDefaultBand,
  deleteTheme,
  moveTheme,
  renameTheme,
  setDefaultBand,
  setLowerThreshold,
  setPortfolioName,
  setTargetWeight,
  setThresholdMode,
  setUpperThreshold,
} from "@/domain/mutations";
import type { Portfolio } from "@/domain/types";
import { validatePortfolio } from "@/domain/validation";

export function PortfolioDesigner() {
  const [portfolio, setPortfolio] = useState<Portfolio>(() => createSeedPortfolio());
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const repoRef = useRef<PortfolioRepository | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    const repository = createPortfolioRepository();
    repoRef.current = repository;
    let cancelled = false;
    void repository
      .load()
      .then((loaded) => {
        if (cancelled || dirtyRef.current) return;
        setPortfolio(loaded);
      })
      .catch(() => {
        if (!cancelled && !dirtyRef.current) setPortfolio(createSeedPortfolio());
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !repoRef.current) return;
    const repository = repoRef.current;
    const timeout = window.setTimeout(() => {
      void repository.save(portfolio);
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [portfolio, hydrated]);

  function update(recipe: (current: Portfolio) => Portfolio) {
    dirtyRef.current = true;
    setPortfolio((current) => recipe(current));
  }

  const validation = useMemo(() => validatePortfolio(portfolio), [portfolio]);

  const value: DesignerContextValue = {
    portfolio,
    validation,
    activeId,
    setActiveId,
    pendingDeleteId,
    requestDelete: (themeId) => setPendingDeleteId(themeId),
    cancelDelete: () => setPendingDeleteId(null),
    confirmDelete: () => {
      if (!pendingDeleteId) return;
      update((current) => deleteTheme(current, pendingDeleteId));
      setActiveId((current) => (current === pendingDeleteId ? null : current));
      setPendingDeleteId(null);
    },
    confirmRestore,
    requestRestore: () => setConfirmRestore(true),
    cancelRestore: () => setConfirmRestore(false),
    actions: {
      setName: (name) => update((current) => setPortfolioName(current, name)),
      setThresholdMode: (mode) => update((current) => setThresholdMode(current, mode)),
      setDefaultBand: (band) => update((current) => setDefaultBand(current, band)),
      applyDefaultBand: () => update((current) => applyDefaultBand(current)),
      restoreExample: () => {
        dirtyRef.current = true;
        setPendingDeleteId(null);
        setConfirmRestore(false);
        setActiveId(null);
        setPortfolio(restoreExamplePortfolio());
      },
      addParent: () => update((current) => addParent(current)),
      addChild: (parentId) => update((current) => addChild(current, parentId)),
      renameTheme: (themeId, name) => update((current) => renameTheme(current, themeId, name)),
      setTargetWeight: (themeId, target) =>
        update((current) => setTargetWeight(current, themeId, target)),
      setLowerThreshold: (themeId, lower) =>
        update((current) => setLowerThreshold(current, themeId, lower)),
      setUpperThreshold: (themeId, upper) =>
        update((current) => setUpperThreshold(current, themeId, upper)),
      moveTheme: (themeId, direction) =>
        update((current) => moveTheme(current, themeId, direction)),
      deleteTheme: (themeId) => update((current) => deleteTheme(current, themeId)),
    },
  };

  return (
    <DesignerProvider value={value}>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="border-b border-line pb-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-white">
                  <Mark className="size-6" />
                </span>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
                  Portfolio tracker
                </p>
              </div>
              <h1 className="mt-3 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
                Target portfolio
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
                Set the weights you want to hold. Parent themes split the whole portfolio.
                Positions split their parent. The chart shows both, and each position also shows
                its share of the portfolio.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Track, Manage, Evaluate, and Find come later. Thresholds are stored now so Manage
                can flag a rebalance once live weights exist.
              </p>
            </div>
            <PortfolioName />
          </div>
          <div className="mt-5">
            <PhaseRail />
          </div>
        </header>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]">
          <div className="order-2 min-w-0 lg:order-1">
            <ThemeEditor />
          </div>
          <div className="order-1 min-w-0 space-y-4 lg:sticky lg:top-4 lg:order-2 lg:self-start">
            <AllocationChart />
            <ValidationPanel />
            <BandSettings />
          </div>
        </div>
      </div>
    </DesignerProvider>
  );
}

function PortfolioName() {
  const { portfolio, confirmRestore, requestRestore, cancelRestore, actions } = useDesigner();

  return (
    <div className="flex w-full max-w-sm flex-col gap-3 lg:items-end">
      <label className="w-full text-xs font-medium uppercase tracking-[0.12em] text-faint">
        Portfolio name
        <input
          value={portfolio.name}
          maxLength={80}
          onChange={(event) => actions.setName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium tracking-normal text-foreground normal-case"
        />
      </label>
      {confirmRestore ? (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <p className="text-sm text-muted">Replace your edits with the example?</p>
          <button
            type="button"
            onClick={actions.restoreExample}
            className="rounded-md bg-accent px-2.5 py-1.5 text-sm font-medium text-white"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={cancelRestore}
            className="rounded-md px-2.5 py-1.5 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={requestRestore}
          className="self-start text-sm font-medium text-muted underline decoration-line underline-offset-4 hover:text-foreground lg:self-end"
        >
          Restore example
        </button>
      )}
      <p className="text-xs text-faint lg:text-right">Stored in this browser.</p>
    </div>
  );
}
