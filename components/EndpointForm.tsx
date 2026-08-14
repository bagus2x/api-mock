"use client";

import type { EndpointParam, MockEndpoint } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const PARAM_LOCATIONS = ["query", "path", "header"];

function prettyJson(value: unknown): string {
  if (value === null || value === undefined) return "";
  return JSON.stringify(value, null, 2);
}

/* ---------------------------------------------------------- */
/* JsonEditor — textarea dengan feel text editor (Tab, auto-  */
/* indent, auto-close bracket, syntax highlight overlay)      */
/* ---------------------------------------------------------- */

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJson(code: string): string {
  const escaped = escapeHtml(code);
  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str, colon, bool) => {
      let color = "#d19a66"; // number
      if (str) {
        color = colon ? "#61afef" : "#98c379"; // key : / string
      } else if (bool || match === "null") {
        color = "#c678dd";
      }
      return `<span style="color:${color}">${match}</span>`;
    },
  );
}

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hasError?: boolean;
}

function JsonEditor({
  value,
  onChange,
  placeholder,
  rows = 18,
  hasError,
}: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  function syncScroll() {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }

  function currentLineIndent(text: string, caretPos: number) {
    const lineStart = text.lastIndexOf("\n", caretPos - 1) + 1;
    const line = text.slice(lineStart, caretPos);
    return { lineStart, indent: line.match(/^\s*/)?.[0] ?? "" };
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // Tab / Shift+Tab -> indent, jangan pindah fokus
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        const { lineStart, indent } = currentLineIndent(value, start);
        const stripped = indent.replace(/^ {1,2}/, "");
        const removed = indent.length - stripped.length;
        if (removed > 0) {
          const next =
            value.slice(0, lineStart) +
            stripped +
            value.slice(lineStart + indent.length);
          onChange(next);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = Math.max(
              start - removed,
              lineStart,
            );
          });
        }
        return;
      }
      const next = value.slice(0, start) + "  " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
      return;
    }

    // Auto-close pasangan { } [ ] " "
    const pairs: Record<string, string> = { "{": "}", "[": "]", '"': '"' };
    if (pairs[e.key] && start === end) {
      e.preventDefault();
      const close = pairs[e.key];
      const next = value.slice(0, start) + e.key + close + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 1;
      });
      return;
    }

    // Auto-indent saat Enter
    if (e.key === "Enter") {
      e.preventDefault();
      const { indent } = currentLineIndent(value, start);
      const before = value.slice(0, start);
      const after = value.slice(start);
      const lastChar = before.trim().slice(-1);
      const nextChar = after[0];

      if (lastChar === "{" || lastChar === "[") {
        const extraIndent = indent + "  ";
        let insertion = "\n" + extraIndent;
        const cursorPos = start + insertion.length;
        if (nextChar === "}" || nextChar === "]") {
          insertion += "\n" + indent;
        }
        onChange(before + insertion + after);
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = cursorPos;
        });
        return;
      }

      const insertion = "\n" + indent;
      onChange(before + insertion + after);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + insertion.length;
      });
    }
  }

  return (
    <div
      className={`relative rounded-md border ${
        hasError ? "border-del/60" : "border-border"
      } bg-canvas overflow-hidden`}
      style={{ height: `${rows * 1.5}em` }}
    >
      <pre
        ref={preRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-sm leading-6"
        style={{ color: "#9da5b4", tabSize: 2 }}
      >
        <code
          dangerouslySetInnerHTML={{
            __html: (value ? highlightJson(value) : "") + "\n",
          }}
        />
      </pre>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre-wrap break-words bg-transparent px-4 py-3 font-mono text-sm leading-6 placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
        style={{ color: "transparent", caretColor: "#e5e5e5", tabSize: 2 }}
      />
    </div>
  );
}

/* ---------------------------------------------------------- */
/* EndpointForm                                                */
/* ---------------------------------------------------------- */

export default function EndpointForm({ initial }: { initial?: MockEndpoint }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [path, setPath] = useState(initial?.path ?? "");
  const [method, setMethod] = useState(initial?.method ?? "GET");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [statusCode, setStatusCode] = useState(initial?.statusCode ?? 200);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [params, setParams] = useState<EndpointParam[]>(initial?.params ?? []);
  const [requestBody, setRequestBody] = useState(
    prettyJson(initial?.requestBody),
  );
  const [responseBody, setResponseBody] = useState(
    prettyJson(initial?.responseBody),
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function addParam() {
    setParams((p) => [
      ...p,
      { name: "", in: "query", type: "string", required: false, example: "" },
    ]);
  }

  function updateParam(index: number, patch: Partial<EndpointParam>) {
    setParams((p) =>
      p.map((param, i) => (i === index ? { ...param, ...patch } : param)),
    );
  }

  function removeParam(index: number) {
    setParams((p) => p.filter((_, i) => i !== index));
  }

  function parseJsonField(
    raw: string,
    field: string,
  ): unknown | null | undefined {
    if (!raw.trim()) return null;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(field);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const nextErrors: Record<string, string> = {};
    if (!path.trim()) nextErrors.path = "Path wajib diisi";
    else if (!path.startsWith("/"))
      nextErrors.path = "Path harus diawali dengan /";

    let parsedRequestBody: unknown = null;
    let parsedResponseBody: unknown = null;
    try {
      parsedRequestBody = parseJsonField(requestBody, "requestBody");
    } catch {
      nextErrors.requestBody = "JSON tidak valid";
    }
    try {
      parsedResponseBody = parseJsonField(responseBody, "responseBody");
    } catch {
      nextErrors.responseBody = "JSON tidak valid";
    }

    for (const p of params) {
      if (!p.name.trim()) {
        nextErrors.params = "Setiap parameter harus punya nama";
        break;
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const payload = {
      path: path.trim(),
      method,
      summary: summary.trim(),
      statusCode: Number(statusCode) || 200,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      params,
      requestBody: parsedRequestBody,
      responseBody: parsedResponseBody,
    };

    const res = await fetch(
      isEdit ? `/api/endpoints/${initial!.id}` : "/api/endpoints",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setServerError(data.error ?? "Gagal menyimpan endpoint");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {serverError && (
        <p className="rounded-md border border-del/30 bg-del/10 px-3 py-2 text-sm text-del">
          {serverError}
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <h2 className="text-sm font-semibold text-ink">Detail endpoint</h2>

        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm font-mono font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Path</label>
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/users/:id atau /api/users/{id}"
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {errors.path && (
              <p className="mt-1 text-xs text-del">{errors.path}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">
            Deskripsi (opsional)
          </label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ambil daftar user"
            className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">
              Status code respons
            </label>
            <input
              type="number"
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm font-mono text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Tags (pisahkan koma)
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="users, auth"
              className="w-full rounded-md border border-border bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            Parameter (query / path / header)
          </h2>
          <button
            type="button"
            onClick={addParam}
            className="rounded-md border border-border px-2.5 py-1 text-xs text-ink hover:border-accent/40"
          >
            + Tambah parameter
          </button>
        </div>

        {errors.params && <p className="text-xs text-del">{errors.params}</p>}

        {params.length === 0 ? (
          <p className="text-sm text-muted">Belum ada parameter.</p>
        ) : (
          <div className="space-y-2">
            {params.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_100px_90px_70px_1fr_auto] gap-2 items-center"
              >
                <input
                  value={p.name}
                  onChange={(e) => updateParam(i, { name: e.target.value })}
                  placeholder="nama"
                  className="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <select
                  value={p.in}
                  onChange={(e) => updateParam(i, { in: e.target.value })}
                  className="rounded-md border border-border bg-canvas px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {PARAM_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <input
                  value={p.type}
                  onChange={(e) => updateParam(i, { type: e.target.value })}
                  placeholder="type"
                  className="rounded-md border border-border bg-canvas px-2 py-1.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <label className="flex items-center justify-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={p.required}
                    onChange={(e) =>
                      updateParam(i, { required: e.target.checked })
                    }
                  />
                  wajib
                </label>
                <input
                  value={(p.example as string) ?? ""}
                  onChange={(e) => updateParam(i, { example: e.target.value })}
                  placeholder="contoh nilai"
                  className="rounded-md border border-border bg-canvas px-2.5 py-1.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => removeParam(i)}
                  className="text-del text-xs hover:underline"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-6 space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            Request body (payload)
          </h2>
          <JsonEditor
            value={requestBody}
            onChange={setRequestBody}
            placeholder='{ "name": "Budi" }'
            rows={18}
            hasError={!!errors.requestBody}
          />
          {errors.requestBody && (
            <p className="text-xs text-del">{errors.requestBody}</p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 space-y-2">
          <h2 className="text-sm font-semibold text-ink">
            Response body (mock)
          </h2>
          <JsonEditor
            value={responseBody}
            onChange={setResponseBody}
            placeholder='{ "id": 1, "name": "Budi" }'
            rows={18}
            hasError={!!errors.responseBody}
          />
          {errors.responseBody && (
            <p className="text-xs text-del">{errors.responseBody}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-canvas hover:bg-accent/90 disabled:opacity-40"
        >
          {saving
            ? "Menyimpan..."
            : isEdit
              ? "Simpan perubahan"
              : "Buat endpoint"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md px-4 py-2.5 text-sm text-muted hover:text-ink"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
