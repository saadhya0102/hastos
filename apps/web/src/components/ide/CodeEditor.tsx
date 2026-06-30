import Editor from "@monaco-editor/react";
import { LANGUAGES, type LanguageId } from "@hasystor/shared";

export function CodeEditor({
  language,
  value,
  onChange,
  height = "100%",
  readOnly = false,
}: {
  language: LanguageId;
  value: string;
  onChange?: (v: string) => void;
  height?: string | number;
  readOnly?: boolean;
}) {
  return (
    <Editor
      height={height}
      theme="vs-dark"
      language={LANGUAGES[language]?.monaco ?? "plaintext"}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        automaticLayout: true,
        tabSize: 4,
        renderWhitespace: "selection",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      }}
      loading={<div className="p-4 text-sm text-muted">Loading editor…</div>}
    />
  );
}
