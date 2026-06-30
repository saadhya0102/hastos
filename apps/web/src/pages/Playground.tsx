import { useState } from "react";
import type { LanguageId, RunResult } from "@hasystor/shared";
import { ALL_LANGUAGE_IDS, LANGUAGES } from "@hasystor/shared";
import { runCode } from "@/lib/api";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { OutputConsole } from "@/components/ide/OutputConsole";
import { Button } from "@/components/ui";

const SAMPLES: Partial<Record<LanguageId, string>> = {
  c: `#include <stdio.h>\nint main(void){ printf("sizeof(void*) = %zu\\n", sizeof(void*)); return 0; }\n`,
  cpp: `#include <iostream>\nint main(){ std::cout << "hello from C++\\n"; }\n`,
  python: `print("hello from Python")\n`,
  rust: `fn main(){ println!("hello from Rust"); }\n`,
  go: `package main\nimport "fmt"\nfunc main(){ fmt.Println("hello from Go") }\n`,
  asm: `; NASM x86-64 (Linux)\nsection .text\nglobal _start\n_start:\n  mov rax, 60\n  xor rdi, rdi\n  syscall\n`,
};

export function Playground() {
  const [language, setLanguage] = useState<LanguageId>("c");
  const [code, setCode] = useState(SAMPLES.c ?? "");
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  function pickLanguage(l: LanguageId) {
    setLanguage(l);
    setCode(SAMPLES[l] ?? "");
    setResult(null);
  }

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      setResult(await runCode({ language, source: code, stdin }));
    } catch (e) {
      setResult({ stdout: "", stderr: (e as Error).message, exitCode: null, status: "error" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-6xl flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Playground</h1>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => pickLanguage(e.target.value as LanguageId)}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm"
          >
            {ALL_LANGUAGE_IDS.map((l) => (
              <option key={l} value={l}>{LANGUAGES[l].label}</option>
            ))}
          </select>
          <Button onClick={run} disabled={running}>{running ? "Running…" : "Run"}</Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border">
          <CodeEditor language={language} value={code} onChange={setCode} />
        </div>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="mb-1 text-xs text-muted">stdin</p>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-bg p-2 font-mono text-sm"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-surface">
            <OutputConsole result={result} />
          </div>
        </div>
      </div>
    </div>
  );
}
