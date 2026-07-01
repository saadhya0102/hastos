import type { RunResult } from "@hasystor/shared";

/**
 * In-browser code execution via WebAssembly. Used as a fallback when the server
 * grader (Piston) is offline, and for quick client-side runs of WASM-capable
 * languages. Today only Python (via Pyodide) is supported.
 *
 * WASM limitations (why other languages/problems are "banned" when offline):
 *  - No native compiler in-browser for C/C++/Rust/Go/ASM here (Pyodide is Python).
 *  - No OS threads, no raw syscalls, no filesystem/network — so concurrency,
 *    sanitizer-graded, and syscall-heavy problems cannot run under WASM.
 *  - Graded harnesses (hidden C drivers) require the server grader.
 */

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

// Minimal shape of the Pyodide runtime we use.
interface PyodideRuntime {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
  setStdin(opts: { stdin: () => string | undefined }): void;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

let pyodidePromise: Promise<PyodideRuntime> | null = null;

/** Whether a language slug can run in-browser via WASM. */
export function isWasmLanguage(lang: string): boolean {
  return lang === "python";
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector("script[data-pyodide]")) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.pyodide = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load the Pyodide script."));
    document.head.appendChild(s);
  });
}

/** Lazily load + boot Pyodide (cached for the session). */
export async function getPyodide(): Promise<PyodideRuntime> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_CDN}pyodide.js`);
      if (!window.loadPyodide) throw new Error("Pyodide failed to initialize.");
      return window.loadPyodide({ indexURL: PYODIDE_CDN });
    })().catch((e) => {
      pyodidePromise = null;
      throw e;
    });
  }
  return pyodidePromise;
}

/** Preload the runtime in the background (call when we know the grader is down). */
export function warmPyodide(): void {
  void getPyodide().catch(() => {});
}

/** Run Python entirely in the browser and normalize to a RunResult. */
export async function runPythonWasm(code: string, stdin = ""): Promise<RunResult> {
  const started = performance.now();
  let py: PyodideRuntime;
  try {
    py = await getPyodide();
  } catch (e) {
    return {
      stdout: "",
      stderr: `In-browser Python runtime failed to load: ${(e as Error).message}`,
      exitCode: null,
      status: "error",
    };
  }

  let out = "";
  let err = "";
  const lines = stdin.length ? stdin.split("\n") : [];
  let idx = 0;

  py.setStdout({ batched: (s) => (out += s + "\n") });
  py.setStderr({ batched: (s) => (err += s + "\n") });
  py.setStdin({ stdin: () => (idx < lines.length ? lines[idx++] : undefined) });

  try {
    await py.runPythonAsync(code);
    return {
      stdout: out,
      stderr: err,
      exitCode: 0,
      timeMs: Math.round(performance.now() - started),
      status: "finished",
    };
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    return {
      stdout: out,
      stderr: (err ? err + "\n" : "") + msg,
      exitCode: 1,
      timeMs: Math.round(performance.now() - started),
      status: "error",
    };
  }
}
