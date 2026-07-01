import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GraderStatus } from "@hasystor/shared";
import { gatewayUrl } from "./api";
import { warmPyodide } from "./wasm";

interface GraderState {
  status: GraderStatus | null;
  loading: boolean;
  /** True while we can reach the server grader (Piston/Judge0). */
  online: boolean;
  refresh: () => void;
}

const FALLBACK: GraderStatus = {
  online: false,
  backend: "none",
  capabilities: { sanitizers: false, threads: false, languages: ["python"] },
  note: "Grader status unknown — assuming offline. Python runs in your browser (WASM).",
};

const GraderContext = createContext<GraderState>({
  status: null,
  loading: true,
  online: false,
  refresh: () => {},
});

const POLL_MS = 30_000;

export function GraderProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GraderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const warmed = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${gatewayUrl}/grader-status`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(String(res.status));
      const s = (await res.json()) as GraderStatus;
      setStatus(s);
      // If the server grader is down, warm the in-browser runtime proactively.
      if (!s.online && !warmed.current) {
        warmed.current = true;
        warmPyodide();
      }
    } catch {
      setStatus(FALLBACK);
      if (!warmed.current) {
        warmed.current = true;
        warmPyodide();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const value = useMemo<GraderState>(
    () => ({
      status,
      loading,
      online: status?.online ?? false,
      refresh: () => void refresh(),
    }),
    [status, loading, refresh],
  );

  return <GraderContext.Provider value={value}>{children}</GraderContext.Provider>;
}

export function useGrader(): GraderState {
  return useContext(GraderContext);
}
