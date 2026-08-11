"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MethodBadge from "./MethodBadge";
import ImportOpenApiModal from "./ImportOpenApiModal";
import type { MockEndpoint } from "@/lib/types";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const UNTAGGED = "__untagged__";

export default function EndpointTable() {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set());
  const [collapsedTags, setCollapsedTags] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
    setSelectedIds(new Set());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Base filter: search query + method (tags are handled at group level)
  const filteredBySearch = useMemo(() => {
    return endpoints.filter((e) => {
      const matchesQuery =
        !query ||
        e.path.toLowerCase().includes(query.toLowerCase()) ||
        (e.summary ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesMethod = !methodFilter || e.method === methodFilter;
      return matchesQuery && matchesMethod;
    });
  }, [endpoints, query, methodFilter]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    let hasUntagged = false;
    for (const e of endpoints) {
      if (e.tags && e.tags.length > 0) {
        e.tags.forEach((t) => set.add(t));
      } else {
        hasUntagged = true;
      }
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return hasUntagged ? [...sorted, UNTAGGED] : sorted;
  }, [endpoints]);

  // Group filtered endpoints by tag; endpoints w/o tags fall into UNTAGGED
  const groups = useMemo(() => {
    const map = new Map<string, MockEndpoint[]>();
    for (const e of filteredBySearch) {
      const tags = e.tags && e.tags.length > 0 ? e.tags : [UNTAGGED];
      for (const t of tags) {
        if (!map.has(t)) map.set(t, []);
        map.get(t)!.push(e);
      }
    }
    let entries = Array.from(map.entries());
    if (tagFilter.size > 0) {
      entries = entries.filter(([t]) => tagFilter.has(t));
    }
    entries.sort(([a], [b]) => {
      if (a === UNTAGGED) return 1;
      if (b === UNTAGGED) return -1;
      return a.localeCompare(b);
    });
    return entries;
  }, [filteredBySearch, tagFilter]);

  const totalMatched = useMemo(() => {
    const ids = new Set<string>();
    groups.forEach(([, list]) => list.forEach((e) => ids.add(e.id)));
    return ids.size;
  }, [groups]);

  function toggleTagFilter(tag: string) {
    setTagFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function toggleCollapsed(tag: string) {
    setCollapsedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectGroup(list: MockEndpoint[]) {
    const ids = list.map((e) => e.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus endpoint ini? Tindakan ini tidak bisa dibatalkan."))
      return;
    setDeletingId(id);
    await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
    setEndpoints((prev) => prev.filter((e) => e.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setDeletingId(null);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (
      !confirm(
        `Hapus ${ids.length} endpoint terpilih? Tindakan ini tidak bisa dibatalkan.`,
      )
    )
      return;
    setBulkDeleting(true);
    await Promise.all(
      ids.map((id) => fetch(`/api/endpoints/${id}`, { method: "DELETE" })),
    );
    setEndpoints((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setBulkDeleting(false);
  }

  function tagLabel(tag: string) {
    return tag === UNTAGGED ? "Tanpa tag" : tag;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            Daftar endpoint mock
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {loading
              ? "Memuat..."
              : `${totalMatched} dari ${endpoints.length} endpoint`}
          </p>
        </div>
        <button
          onClick={() => setImportOpen(true)}
          className="self-start sm:self-auto rounded-md border border-border bg-surface2 px-3.5 py-2 text-sm font-medium text-ink hover:border-accent/40 transition-colors"
        >
          ⇪ Import OpenAPI / Swagger
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-3">
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

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs text-muted mr-1">Tags:</span>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => toggleTagFilter(t)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                tagFilter.has(t)
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-border text-muted hover:text-ink"
              }`}
            >
              {tagLabel(t)}
            </button>
          ))}
          {tagFilter.size > 0 && (
            <button
              onClick={() => setTagFilter(new Set())}
              className="text-[11px] text-muted hover:text-ink underline ml-1"
            >
              Reset tag
            </button>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-accent/30 bg-accent/10 px-3.5 py-2 mb-3 text-sm">
          <span className="text-ink">{selectedIds.size} endpoint dipilih</span>
          <div className="flex items-center gap-3">
            <button
              onClick={clearSelection}
              className="text-xs text-muted hover:text-ink"
            >
              Batal pilih
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="rounded-md border border-del/40 bg-del/10 px-3 py-1.5 text-xs font-medium text-del hover:bg-del/20 disabled:opacity-40 transition-colors"
            >
              {bulkDeleting
                ? "Menghapus..."
                : `Hapus terpilih (${selectedIds.size})`}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted">
          Memuat endpoint...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted">
            {endpoints.length === 0
              ? "Belum ada endpoint. Tambah manual atau import dari file OpenAPI/Swagger."
              : "Tidak ada endpoint yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(([tag, list]) => {
            const collapsed = collapsedTags.has(tag);
            const ids = list.map((e) => e.id);
            const allSelected =
              ids.length > 0 && ids.every((id) => selectedIds.has(id));
            const someSelected = ids.some((id) => selectedIds.has(id));

            return (
              <div
                key={tag}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 bg-surface2/50 border-b border-border">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={() => toggleSelectGroup(list)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <button
                    onClick={() => toggleCollapsed(tag)}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    <span className="text-muted text-xs w-3">
                      {collapsed ? "▸" : "▾"}
                    </span>
                    <span className="text-sm font-medium text-ink">
                      {tagLabel(tag)}
                    </span>
                    <span className="text-xs text-muted">({list.length})</span>
                  </button>
                </div>

                {!collapsed && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                        <th className="px-4 py-2.5 font-medium w-8"></th>
                        <th className="px-4 py-2.5 font-medium">Method</th>
                        <th className="px-4 py-2.5 font-medium">Path</th>
                        <th className="px-4 py-2.5 font-medium hidden md:table-cell">
                          Deskripsi
                        </th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-border last:border-0 hover:bg-surface2/60 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(e.id)}
                              onChange={() => toggleSelect(e.id)}
                              className="h-4 w-4 rounded border-border accent-accent"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <MethodBadge method={e.method} />
                          </td>
                          <td className="px-4 py-3 font-mono text-[13px] text-ink">
                            {e.path}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-muted">
                            {e.summary || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-muted">
                              {e.statusCode}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-3 text-xs">
                              <button
                                onClick={() => copyMockUrl(e)}
                                className="text-muted hover:text-ink"
                              >
                                {copiedId === e.id
                                  ? "Tersalin!"
                                  : "Salin URL mock"}
                              </button>
                              <Link
                                href={`/endpoints/${e.id}/edit`}
                                className="text-accent hover:underline"
                              >
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
            );
          })}
        </div>
      )}

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
