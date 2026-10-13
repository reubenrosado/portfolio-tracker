"use client";

import { createContext, useContext } from "react";
import type { PortfolioValidation } from "@/domain/validation";
import type { Portfolio, ThresholdMode } from "@/domain/types";

export interface DesignerActions {
  setName: (name: string) => void;
  setThresholdMode: (mode: ThresholdMode) => void;
  setDefaultBand: (band: number) => void;
  applyDefaultBand: () => void;
  restoreExample: () => void;
  addParent: () => void;
  addChild: (parentId: string) => void;
  renameTheme: (themeId: string, name: string) => void;
  setTargetWeight: (themeId: string, value: number) => void;
  setLowerThreshold: (themeId: string, value: number) => void;
  setUpperThreshold: (themeId: string, value: number) => void;
  moveTheme: (themeId: string, direction: -1 | 1) => void;
  deleteTheme: (themeId: string) => void;
}

export interface DesignerContextValue {
  portfolio: Portfolio;
  validation: PortfolioValidation;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  pendingDeleteId: string | null;
  requestDelete: (themeId: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  confirmRestore: boolean;
  requestRestore: () => void;
  cancelRestore: () => void;
  actions: DesignerActions;
}

const DesignerContext = createContext<DesignerContextValue | null>(null);

export function DesignerProvider({
  value,
  children,
}: {
  value: DesignerContextValue;
  children: React.ReactNode;
}) {
  return <DesignerContext.Provider value={value}>{children}</DesignerContext.Provider>;
}

export function useDesigner(): DesignerContextValue {
  const value = useContext(DesignerContext);
  if (!value) {
    throw new Error("useDesigner must be used within PortfolioDesigner");
  }
  return value;
}
