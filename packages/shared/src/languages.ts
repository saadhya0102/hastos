/**
 * Judge0 language configuration.
 *
 * IDs are the Judge0 CE defaults; the authoritative IDs MUST be read from the live
 * instance via `GET /languages` at deploy time and reconciled here. `multiFileId`
 * (89) is used for harness/concurrency/unit grading with custom compile/run scripts.
 */

export type LanguageId = "c" | "cpp" | "rust" | "go" | "asm" | "python";

export interface LanguageConfig {
  id: LanguageId;
  label: string;
  /** Monaco editor language id. */
  monaco: string;
  /** Judge0 single-file language_id (verify against the live instance). */
  judge0Id: number;
  /** File extension used when assembling harness bundles. */
  ext: string;
  /** Whether this language is "gated" (only offered when a problem/lesson requires it). */
  gated: boolean;
  /**
   * Whether this language can run fully in the browser via WebAssembly (no server
   * grader needed). Only Python (Pyodide) is supported today. When the server
   * grader (Piston) is offline, non-WASM languages are disabled with a note.
   */
  wasm: boolean;
}

/** Judge0 multi-file program language id (custom compile/run bash scripts). */
export const JUDGE0_MULTIFILE_ID = 89;

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  c: { id: "c", label: "C (GCC)", monaco: "c", judge0Id: 50, ext: "c", gated: false, wasm: false },
  cpp: { id: "cpp", label: "C++ (GCC)", monaco: "cpp", judge0Id: 54, ext: "cpp", gated: false, wasm: false },
  rust: { id: "rust", label: "Rust", monaco: "rust", judge0Id: 73, ext: "rs", gated: false, wasm: false },
  go: { id: "go", label: "Go", monaco: "go", judge0Id: 60, ext: "go", gated: true, wasm: false },
  asm: { id: "asm", label: "x86-64 Assembly (NASM)", monaco: "asm", judge0Id: 45, ext: "asm", gated: true, wasm: false },
  python: { id: "python", label: "Python 3", monaco: "python", judge0Id: 71, ext: "py", gated: false, wasm: true },
};

/** Language slugs that can run in the browser via WASM (no server grader). */
export const WASM_LANGUAGES: LanguageId[] = (Object.values(LANGUAGES) as LanguageConfig[])
  .filter((l) => l.wasm)
  .map((l) => l.id);

export const ALL_LANGUAGE_IDS = Object.keys(LANGUAGES) as LanguageId[];

export function languageById(id: string): LanguageConfig | undefined {
  return (LANGUAGES as Record<string, LanguageConfig>)[id];
}
