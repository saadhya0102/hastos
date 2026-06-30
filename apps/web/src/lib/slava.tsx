import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { HintLevel, SlavaContext as SlavaCtxKind, TestResultSummary, LanguageId } from "@hasystor/shared";

interface SlavaBinding {
  context: SlavaCtxKind;
  refId?: string;
  title?: string;
  language?: LanguageId;
  getCode?: () => string;
}

interface SlavaController {
  open: boolean;
  binding: SlavaBinding;
  pendingExplain: { tests: TestResultSummary[] } | null;
  defaultHint: HintLevel;
  setOpen: (v: boolean) => void;
  bind: (b: SlavaBinding) => void;
  explainFailingTest: (tests: TestResultSummary[]) => void;
  clearPending: () => void;
}

const Ctx = createContext<SlavaController | null>(null);

export function SlavaProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [binding, setBinding] = useState<SlavaBinding>({ context: "general" });
  const [pendingExplain, setPendingExplain] = useState<{ tests: TestResultSummary[] } | null>(null);
  const bindingRef = useRef(binding);
  bindingRef.current = binding;

  const bind = useCallback((b: SlavaBinding) => setBinding(b), []);

  const explainFailingTest = useCallback((tests: TestResultSummary[]) => {
    setPendingExplain({ tests });
    setOpen(true);
  }, []);

  const value = useMemo<SlavaController>(
    () => ({
      open,
      binding,
      pendingExplain,
      defaultHint: "nudge",
      setOpen,
      bind,
      explainFailingTest,
      clearPending: () => setPendingExplain(null),
    }),
    [open, binding, pendingExplain, bind, explainFailingTest],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSlava(): SlavaController {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSlava must be used within SlavaProvider");
  return ctx;
}
