"use client";

import { useState } from "react";

export default function ImportOpenApiModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  if (!open) return null;

  function reset() {
    setText("");
    setFileName(null);
    setError(null);
    setResult(null);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const content = await file.text();
    setText(content);
  }

  async function handleImport() {
    setError(null);
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("File/teks bukan JSON yang valid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/import-openapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengimpor dokumen.");
        return;
      }
      setResult(data.imported);
      onImported();
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-ink">Import dari OpenAPI / Swagger JSON</h2>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-muted">
            Upload file <code className="text-accent">.json</code> (OpenAPI 3 atau Swagger 2.0), atau tempel isinya
            langsung. Endpoint dengan path + method yang sudah ada akan diperbarui, sisanya ditambahkan baru.
          </p>

          <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-4 text-sm text-muted hover:border-accent/50 hover:text-ink cursor-pointer transition-colors">
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {fileName ? `📄 ${fileName}` : "Klik untuk pilih file swagger.json"}
          </label>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder='{ "openapi": "3.0.0", "paths": { ... } }'
            rows={8}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {error && (
            <p className="rounded-md border border-del/30 bg-del/10 px-3 py-2 text-sm text-del">{error}</p>
          )}
          {result !== null && (
            <p className="rounded-md border border-post/30 bg-post/10 px-3 py-2 text-sm text-post">
              Berhasil mengimpor {result} endpoint.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-md px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Tutup
          </button>
          <button
            onClick={handleImport}
            disabled={!text || loading}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-canvas hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Mengimpor..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
