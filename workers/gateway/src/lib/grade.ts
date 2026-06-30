import type { Judge0Result } from "./judge0";
import type { HarnessProblem } from "./problems";
import type { SubmitResult, TestResultSummary, Verdict } from "../types";

const TEST_LINE = /HASYSTOR_TEST\s+name="([^"]+)"\s+status=(PASS|FAIL)(?:\s+msg="([^"]*)")?/g;

function detectSanitizer(stderr: string): "asan" | "ubsan" | null {
  if (/AddressSanitizer|ERROR: AddressSanitizer|heap-buffer-overflow|stack-buffer-overflow/.test(stderr))
    return "asan";
  if (/runtime error:|UndefinedBehaviorSanitizer/.test(stderr)) return "ubsan";
  return null;
}

/** Normalize a Judge0 result for a harness-graded problem into per-test results. */
export function gradeHarness(problem: HarnessProblem, r: Judge0Result): SubmitResult {
  const compileOut = r.compile_output ?? "";
  const stderr = r.stderr ?? "";
  const stdout = r.stdout ?? "";

  // Compile error (Judge0 status 6) — return the learner's own compiler output.
  if (r.status.id === 6 || (compileOut && !stdout)) {
    return {
      verdict: "compile_error",
      testsPassed: 0,
      testsTotal: 0,
      tests: [],
      compile: { status: "error", stderr: compileOut || "Compilation failed." },
    };
  }

  const tests: TestResultSummary[] = [];
  let match: RegExpExecArray | null;
  TEST_LINE.lastIndex = 0;
  while ((match = TEST_LINE.exec(stdout)) !== null) {
    const [, name, status, msg] = match;
    tests.push({
      name,
      visibility: problem.testVisibility[name] ?? "hidden",
      status: status === "PASS" ? "pass" : "fail",
      message: status === "FAIL" ? msg || "assertion failed" : undefined,
    });
  }

  // Sort: sample tests first, preserving encounter order within each group.
  tests.sort((a, b) => (a.visibility === b.visibility ? 0 : a.visibility === "sample" ? -1 : 1));

  const san = detectSanitizer(stderr);
  if (san) {
    tests.push({
      name: san === "asan" ? "memory_safety" : "undefined_behavior",
      visibility: "hidden",
      status: "error",
      message:
        san === "asan"
          ? "AddressSanitizer reported a memory error (out-of-bounds or invalid access)."
          : "UndefinedBehaviorSanitizer reported undefined behavior.",
    });
  }

  const total = tests.length;
  const passed = tests.filter((t) => t.status === "pass").length;

  let verdict: Verdict;
  if (r.status.id === 5) verdict = "time_limit";
  else if (san === "asan") verdict = "leak_detected";
  else if (total === 0) verdict = r.status.id >= 7 ? "runtime_error" : "wrong_answer";
  else if (passed === total) verdict = "accepted";
  else if (passed > 0) verdict = "partial";
  else verdict = "wrong_answer";

  return {
    verdict,
    testsPassed: passed,
    testsTotal: total,
    tests,
    compile: { status: "ok", stderr: "" },
  };
}
