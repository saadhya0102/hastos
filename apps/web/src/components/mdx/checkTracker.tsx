import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface CheckTracker {
  register: (id: string) => void;
  setPassed: (id: string, passed: boolean) => void;
}

const Ctx = createContext<CheckTracker | null>(null);

export function CheckTrackerProvider({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange?: (passed: number, total: number) => void;
}) {
  const [state, setState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const total = Object.keys(state).length;
    const passed = Object.values(state).filter(Boolean).length;
    onChange?.(passed, total);
  }, [state, onChange]);

  const value: CheckTracker = {
    register: (id) =>
      setState((s) => (id in s ? s : { ...s, [id]: false })),
    setPassed: (id, passed) => setState((s) => ({ ...s, [id]: passed })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCheckTracker(): CheckTracker | null {
  return useContext(Ctx);
}
