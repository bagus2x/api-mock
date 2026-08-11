"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MethodBadge from "./MethodBadge";
import ImportOpenApiModal from "./ImportOpenApiModal";
import type { MockEndpoint } from "@/lib/types";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function EndpointTable() {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyMockUrl(e: MockEndpoint) {
    const url = `${window.location.origin}/api/mock${e.path.startsWith("/") ? e.path : `/${e.path}`}`;
    navigator.clipboard.writeText(url);
    setCopiedId(e.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function load() {
    setLoading(true);
    const res = await fetch("/api/endpoints");
    const data = await res.json();
    setEndpoints(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return endpoints.filter((e) => {
      const matchesQuery =
        !query ||
        e.path.toLowerCase().includes(query.toLowerCase()) ||
        (e.summary ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesMethod = !methodFilter || e.method === methodFilter;
      return matchesQuery && matchesMethod;
    });
  }, [endpoints, query, methodFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Hapus endpoint ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeletingId(id);
    await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">Daftar endpoint mock</h1>
          <p className="text-sm text-muted mt-0.5">
            {loading ? "Memuat..." : `${filtered.length} dari ${endpoints.length} endpoint`}
          </p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="self-start sm:self-auto rounded-md border border-border bg-surface2 px-3.5 py-2 text-sm font-medium text-ink hover:border-accent/40 transition-colors"
        >
          ⇪ Import OpenAPI / Swagger
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari path atau deskripsi..."
          className="w-full sm:max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setMethodFilter(null)}
            className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold ${
              methodFilter === null
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-border text-muted hover:text-ink"
            }`}
          >
            ALL
          </button>
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(methodFilter === m ? null : m)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold transition-colors ${
                methodFilter === m
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border text-muted hover:text-ink"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted">Memuat endpoint...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">
              {endpoints.length === 0
                ? "Belum ada endpoint. Tambah manual atau import dari file OpenAPI/Swagger."
                : "Tidak ada endpoint yang cocok dengan pencarian."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface2/60 transition-colors">
                  <td className="px-4 py-3">
                    <MethodBadge method={e.method} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-ink">{e.path}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted">{e.summary || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted">{e.statusCode}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button onClick={() => copyMockUrl(e)} className="text-muted hover:text-ink">
                        {copiedId === e.id ? "Tersalin!" : "Salin URL mock"}
                      </button>
                      <Link href={`/endpoints/${e.id}/edit`} className="text-accent hover:underline">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-del hover:underline disabled:opacity-40"
                      >
                        {deletingId === e.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ImportOpenApiModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          load();
        }}
      />
    </div>
  );
}
