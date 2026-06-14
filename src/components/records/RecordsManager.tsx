"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, ImageIcon, Upload, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export type RecordItem = {
  id: string;
  title: string;
  category: string;
  recordDate: string;
  mimeType: string;
  viewUrl?: string | null;
};

const CATEGORIES = [
  { value: "ALL", label: "All" },
  { value: "LAB_REPORT", label: "Lab reports" },
  { value: "PRESCRIPTION", label: "Prescriptions" },
  { value: "SCAN", label: "Scans" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
];

const DEMO_KEY = "xeivoramed:demo:records";

/**
 * Full records UI: search + category filter + the real S3 upload flow.
 *
 * Production path:  presign (POST /api/records/upload-url) → PUT file to S3 →
 *                   persist metadata (POST /api/records).
 * Demo path (S3 not configured): the same UX, but the file is kept in-browser
 * (object URL) and metadata is cached in localStorage so the list survives reloads.
 */
export function RecordsManager({
  initialRecords,
  s3Enabled,
}: {
  initialRecords: RecordItem[];
  s3Enabled: boolean;
}) {
  const [records, setRecords] = useState<RecordItem[]>(initialRecords);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("LAB_REPORT");
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Hydrate demo records cached locally (demo mode only). Dedupe by id so the
  // StrictMode double-invoke (and re-mounts) can't insert duplicate keys.
  useEffect(() => {
    if (s3Enabled) return;
    try {
      const cached = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]") as RecordItem[];
      if (!cached.length) return;
      setRecords((prev) => {
        // Dedupe against what's already shown AND within the cached array itself
        // (older buggy sessions may have stored duplicate ids).
        const seen = new Set(prev.map((r) => r.id));
        const fresh: RecordItem[] = [];
        for (const r of cached) {
          if (r?.id && !seen.has(r.id)) {
            seen.add(r.id);
            fresh.push(r);
          }
        }
        return fresh.length ? [...fresh, ...prev] : prev;
      });
    } catch {
      /* ignore */
    }
  }, [s3Enabled]);

  const filtered = useMemo(() => {
    const seen = new Set<string>();
    return records.filter((r) => {
      if (seen.has(r.id)) return false; // final safety guard against duplicate keys
      seen.add(r.id);
      const matchCat = category === "ALL" || r.category === category;
      const matchQ = !query || r.title.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [records, query, category]);

  function cacheDemo(record: RecordItem) {
    try {
      const cached = JSON.parse(localStorage.getItem(DEMO_KEY) || "[]") as RecordItem[];
      localStorage.setItem(DEMO_KEY, JSON.stringify([{ ...record, viewUrl: null }, ...cached]));
    } catch {
      /* ignore */
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file || !title.trim()) {
      setError("Add a title and choose a file.");
      return;
    }
    setStatus("uploading");

    try {
      if (s3Enabled) {
        // 1) Ask the server for a short-lived presigned PUT URL.
        const presignRes = await fetch("/api/records/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" }),
        });
        if (!presignRes.ok) throw new Error(`Could not get upload URL (${presignRes.status}).`);
        const { url, key } = (await presignRes.json()) as { url: string; key: string };

        // 2) Upload the file directly to S3.
        const putRes = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!putRes.ok) throw new Error(`Upload to storage failed (${putRes.status}).`);

        // 3) Persist the record metadata.
        const metaRes = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category: uploadCategory,
            s3Key: key,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
          }),
        });
        if (!metaRes.ok) throw new Error(`Saving record failed (${metaRes.status}).`);
        const { record } = (await metaRes.json()) as { record: RecordItem };
        setRecords((prev) => [record, ...prev]);
      } else {
        // Demo fallback — same UX, kept in-browser. Robustly-unique id so two
        // uploads in the same millisecond never collide.
        const record: RecordItem = {
          id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title: title.trim(),
          category: uploadCategory,
          recordDate: new Date().toISOString(),
          mimeType: file.type || "application/octet-stream",
          viewUrl: URL.createObjectURL(file),
        };
        setRecords((prev) => [record, ...prev]);
        cacheDemo(record);
      }

      setStatus("done");
      setFile(null);
      setTitle("");
      (document.getElementById("record-file") as HTMLInputElement | null)?.value &&
        ((document.getElementById("record-file") as HTMLInputElement).value = "");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search + filter */}
      <Card>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            className="w-full text-sm outline-none"
            placeholder="Search reports, prescriptions, scans…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`badge ${category === c.value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Upload */}
      <Card>
        <SectionTitle title="Upload a document" icon={<Upload className="h-5 w-5 text-brand-600" />} />
        {!s3Enabled && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Demo mode — S3 isn’t configured, so uploads are kept in your browser. With AWS keys set,
            the same form uploads directly to encrypted S3.
          </p>
        )}
        <form onSubmit={handleUpload} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="record-title">Title</label>
            <input id="record-title" className="input" placeholder="e.g. Lipid Profile" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="record-category">Category</label>
            <select id="record-category" className="input" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
              {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <label
            htmlFor="record-file"
            className="sm:col-span-2 cursor-pointer rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-brand-300"
          >
            <Upload className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">{file ? file.name : "Click to choose a file"}</p>
            <p className="text-xs text-slate-400">PDF, JPG or PNG · up to 25MB · uploaded directly to encrypted S3</p>
            <input
              id="record-file"
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {error && (
            <p className="sm:col-span-2 flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}

          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={status === "uploading"} className="btn-primary">
              {status === "uploading" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "uploading" ? "Uploading…" : "Save to records"}
            </button>
            {status === "done" && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

      {/* List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
            {records.length === 0
              ? "Upload a medical document to begin building your verified record."
              : "No records match your search."}
          </p>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {r.mimeType.startsWith("image") ? <ImageIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-400">{formatDate(r.recordDate)}</p>
                <div className="mt-1.5">
                  <Badge tone="brand">{r.category.replace(/_/g, " ").toLowerCase()}</Badge>
                </div>
              </div>
              {r.viewUrl ? (
                <a href={r.viewUrl} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-xs">View</a>
              ) : (
                <button className="btn-secondary px-3 py-1.5 text-xs" disabled title="Available once stored in S3">View</button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
