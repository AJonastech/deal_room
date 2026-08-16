"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Eye, Link2, Upload, ArrowUpRight, Clock3, ExternalLink } from "lucide-react";
import type { DashboardActivity, DashboardData, DashboardDocument as Document } from "@/lib/dashboard-types";
import DocumentPanel from "@/components/dashboard/DocumentPanel";
import UploadModal from "@/components/dashboard/UploadModal";

/* Map each doc type to a public icon and a colour tint */
const typeConfig = {
  pitch_deck: { label: "Pitch Deck",  icon: "/document_icons/pdf.png", color: "#ef4444" },
  financials:  { label: "Financials",  icon: "/document_icons/xls.png", color: "#16a34a" },
  term_sheet:  { label: "Term Sheet",  icon: "/document_icons/doc.png", color: "#2563eb" },
  data_room:   { label: "Data Room",   icon: "/document_icons/pdf.png", color: "#d97706" },
};

function relativeDate(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({ documents: [], recentActivity: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (opts?: { silent?: boolean }) => {
    // A silent refresh (after upload / edits) keeps the current view on screen
    // and swaps in fresh data — no full-page skeleton flash.
    if (!opts?.silent) setLoading(true);
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      if (!response.ok) throw new Error("Dashboard request failed");
      const nextData = await response.json() as DashboardData;
      setData(nextData);
      setSelectedDoc((current) => current ? nextData.documents.find((document) => document.id === current.id) ?? null : null);
      setError(null);
    } catch {
      setError("Unable to load your documents.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  // Stable identity for post-mutation refreshes that shouldn't show skeletons.
  const refreshDashboard = useCallback(() => loadDashboard({ silent: true }), [loadDashboard]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  const documents = data.documents;

  const totalViews = documents.reduce((s, d) => s + d.viewCount, 0);
  const activeLinks = documents.reduce((s, d) => s + d.linkCount, 0);

  return (
    <div
      className="flex flex-col min-h-[calc(100dvh-64px)]"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="px-8 py-8 w-full max-w-[860px] mx-auto flex-1"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8 animate-fade-up">
          <div>
            <h1 className="text-xl font-bold font-heading mb-0.5" style={{ color: "var(--text-primary)" }}>
              Documents
            </h1>
            {loading ? (
              <div className="h-3.5 w-64 mt-1 rounded animate-pulse" style={{ background: "var(--bg-elevated)" }} />
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {documents.length} documents · {totalViews} genuine views · {activeLinks} active links
              </p>
            )}
          </div>
          <button
            id="upload-doc-btn"
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            <Upload size={13} />
            Upload
          </button>
        </div>

        {/* ── Document list ── */}
        <div
          className="rounded-md overflow-hidden animate-fade-up"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            animationDelay: "40ms",
          }}
        >
          {/* Header row */}
          <div
            className="grid items-center px-4 py-2.5 text-xs font-semibold"
            style={{
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--border-color)",
              gridTemplateColumns: "minmax(0,1fr) 110px 64px 64px 90px 20px",
              gap: "1rem",
            }}
          >
            <span>Name</span>
            <span>Type</span>
            <span className="text-right">Views</span>
            <span className="text-right">Links</span>
            <span className="text-right">Uploaded</span>
            <span />
          </div>

          {/* Rows */}
          {error ? (
            <p className="px-4 py-8 text-sm" style={{ color: "var(--red)" }}>{error}</p>
          ) : loading ? (
            <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="grid items-center px-4 py-3.5 animate-pulse" style={{ gridTemplateColumns: "minmax(0,1fr) 110px 64px 64px 90px 20px", gap: "1rem" }}>
                  <div className="flex items-center gap-3"><span className="w-7 h-7 rounded-md" style={{ background: "var(--bg-elevated)" }} /><span className="h-3 w-40 rounded" style={{ background: "var(--bg-elevated)" }} /></div>
                  <span className="h-5 w-20 rounded-md" style={{ background: "var(--bg-elevated)" }} />
                  <span className="h-3 w-6 justify-self-end rounded" style={{ background: "var(--bg-elevated)" }} />
                  <span className="h-3 w-6 justify-self-end rounded" style={{ background: "var(--bg-elevated)" }} />
                  <span className="h-3 w-14 justify-self-end rounded" style={{ background: "var(--bg-elevated)" }} />
                  <span />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <p className="px-4 py-8 text-sm" style={{ color: "var(--text-muted)" }}>No documents uploaded yet.</p>
          ) : documents.map((doc, i) => {
            const { label, icon, color } = typeConfig[doc.type];
            const isLast = i === documents.length - 1;
            const isHov = hovered === doc.id;
            const isSelected = selectedDoc?.id === doc.id;

            return (
              <div
                key={doc.id}
                className="grid items-center px-4 py-3.5 transition-colors"
                style={{
                  cursor: "pointer",
                  gridTemplateColumns: "minmax(0,1fr) 110px 64px 64px 90px 20px",
                  gap: "1rem",
                  borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                  background: isSelected
                    ? "var(--accent-light)"
                    : isHov
                    ? "var(--bg-elevated)"
                    : "transparent",
                  borderLeft: isSelected ? `3px solid var(--accent)` : "3px solid transparent",
                }}
                onMouseEnter={() => setHovered(doc.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelectedDoc(isSelected ? null : doc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelectedDoc(isSelected ? null : doc)}
              >
                {/* Name + icon */}
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={icon}
                    alt={label}
                    width={28}
                    height={28}
                    className="shrink-0 object-contain"
                    style={{ width: 28, height: 28 }}
                  />
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isSelected ? "var(--accent)" : "var(--text-primary)" }}
                    >
                      {doc.name}
                    </p>
                    {doc.lastViewedAt && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Last viewed{" "}
                        <span style={{ color: "var(--green)" }}>
                          {relativeDate(doc.lastViewedAt)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Type badge */}
                <span
                  className="text-xs font-medium px-2 py-1 rounded-md"
                  style={{ background: `${color}12`, color }}
                >
                  {label}
                </span>

                {/* Views */}
                <div className="flex items-center justify-end gap-1.5">
                  <Eye size={11} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {doc.viewCount}
                  </span>
                </div>

                {/* Links */}
                <div className="flex items-center justify-end gap-1.5">
                  <Link2 size={11} style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {doc.linkCount}
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-right" style={{ color: "var(--text-muted)" }}>
                  {relativeDate(doc.uploadedAt)}
                </p>

                {/* Arrow */}
                <ArrowUpRight
                  size={13}
                  style={{
                    color: isSelected ? "var(--accent)" : "var(--text-muted)",
                    opacity: isHov || isSelected ? 1 : 0,
                    transition: "opacity 0.15s",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Recent activity ── */}
        <div className="mt-8 animate-fade-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-muted)" }}>
                RECENT ACTIVITY
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Latest genuine sessions across your room
              </p>
            </div>
            <button
              className="hidden sm:flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--accent)" }}
            >
              View analytics <ExternalLink size={12} />
            </button>
          </div>
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", boxShadow: "0 6px 18px rgba(15, 19, 36, 0.04)" }}
          >
            {loading ? (
              <div className="divide-y animate-pulse" style={{ borderColor: "var(--border-subtle)" }}>
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="w-8 h-8 rounded-md" style={{ background: "var(--bg-elevated)" }} />
                    <div className="flex-1 space-y-2"><span className="block h-3 w-36 rounded" style={{ background: "var(--bg-elevated)" }} /><span className="block h-2.5 w-20 rounded" style={{ background: "var(--bg-elevated)" }} /></div>
                    <span className="h-5 w-14 rounded-md" style={{ background: "var(--bg-elevated)" }} />
                    <span className="h-3 w-24 rounded" style={{ background: "var(--bg-elevated)" }} />
                  </div>
                ))}
              </div>
            ) : data.recentActivity.length === 0 ? (
              <p className="px-4 py-8 text-sm" style={{ color: "var(--text-muted)" }}>No document views yet.</p>
            ) : data.recentActivity.map((item: DashboardActivity, i, arr) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: `${typeConfig[item.documentType].color}12`, color: typeConfig[item.documentType].color, border: `1px solid ${typeConfig[item.documentType].color}25` }}
                >
                  {item.linkLabel.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: typeConfig[item.documentType].color }} />
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {item.documentName}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    via {item.linkLabel}
                  </p>
                </div>
                <span
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md shrink-0 font-medium"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}
                >
                  <Clock3 size={11} />
                  {item.sessionDuration == null ? "—" : `${Math.floor(item.sessionDuration / 60)}m ${item.sessionDuration % 60}s`}
                </span>
                <span className="text-xs w-28 text-right hidden sm:block" style={{ color: "var(--text-muted)" }}>
                  {new Date(item.openedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel + Upload */}
      <DocumentPanel key={selectedDoc?.id ?? "empty"} doc={selectedDoc} onClose={() => setSelectedDoc(null)} onChanged={refreshDashboard} />
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={refreshDashboard} />
    </div>
  );
}
