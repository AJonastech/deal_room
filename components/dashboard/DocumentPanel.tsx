"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X, Download, Eye, Link2,
  Copy, Check, ExternalLink,
  ToggleLeft,
  Bot, Monitor, Smartphone,
  Clock, Plus, Trash2, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import type { DashboardDocument as Document, DashboardShareLink as ShareLink, DashboardViewEvent as ViewEvent } from "@/lib/dashboard-types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const typeConfig = {
  pitch_deck: { label: "Pitch Deck",  icon: "/document_icons/pdf.png" },
  financials:  { label: "Financials",  icon: "/document_icons/xls.png" },
  term_sheet:  { label: "Term Sheet",  icon: "/document_icons/doc.png" },
  data_room:   { label: "Data Room",   icon: "/document_icons/pdf.png" },
};

function fmt(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(s: string) {
  const d = new Date(s);
  return {
    date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}
function parseDur(s: number) {
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

/* ── Link row ─────────────────────────────────────────────────────────────── */
function LinkRow({ link, documentId, onChanged }: { link: ShareLink; documentId: string; onChanged: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(!!link.revokedAt);
  const [revoking, setRevoking] = useState(false);
  const isRevoked = revoked || !!link.revokedAt;
  const url = typeof window === "undefined"
    ? `/view/${link.token}`
    : `${window.location.origin}/view/${link.token}`;

  const copy = () => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revoke = async () => {
    if (revoking || isRevoked) return;
    setRevoking(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/links/${link.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to revoke share link.");
      setRevoked(true);
      await onChanged();
    } catch {
      // Keep the link active when the server did not confirm the revoke.
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)", opacity: isRevoked ? 0.5 : 1 }}>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isRevoked ? "var(--text-muted)" : "#16a34a" }}
          />
          <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {link.label}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={
              isRevoked
                ? { background: "#fef2f2", color: "var(--red)" }
                : { background: "#f0fdf4", color: "#16a34a" }
            }
          >
            {isRevoked ? "Revoked" : "Active"}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
          <Eye size={11} /> {link.viewCount}
        </span>
      </div>

      <div
        className="flex items-center gap-2 px-2.5 py-2 rounded-md mb-2.5"
        style={{ background: "var(--bg-base)", border: "1px solid var(--border-color)" }}
      >
        <code className="text-xs flex-1 truncate" style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>
          {url}
        </code>
        {!isRevoked && (
          <>
            <div
              role="button"
              tabIndex={0}
              onClick={copy}
              onKeyDown={(e) => e.key === "Enter" && copy()}
              style={{ cursor: "pointer", color: copied ? "#16a34a" : "var(--text-muted)" }}
              className="transition-opacity hover:opacity-60"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </div>
            <a
              href={`/view/${link.token}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-muted)" }}
              className="transition-opacity hover:opacity-60"
            >
              <ExternalLink size={12} />
            </a>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Created {fmt(link.createdAt)}</span>
        {!isRevoked && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => void revoke()}
            onKeyDown={(e) => e.key === "Enter" && void revoke()}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
            style={{ cursor: "pointer", color: revoked ? "#16a34a" : "var(--text-muted)" }}
          >
            <ToggleLeft size={14} />
            {revoking ? "Revoking..." : "Revoke"}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Event row ───────────────────────────────────────────────────────────── */
function EventRow({ event }: { event: ViewEvent }) {
  const { date, time } = fmtTime(event.openedAt);
  const isMobile = /iPhone|iPad|Android/i.test(event.userAgent);
  return (
    <div className="flex items-start gap-3 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)", opacity: event.isBot ? 0.45 : 1 }}>
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: event.isBot ? "#fef2f2" : "#eff6ff", border: `1px solid ${event.isBot ? "#fecaca" : "#bfcfff"}` }}
      >
        {event.isBot ? (
          <Bot size={13} style={{ color: "var(--red)" }} />
        ) : isMobile ? (
          <Smartphone size={13} style={{ color: "var(--accent)" }} />
        ) : (
          <Monitor size={13} style={{ color: "var(--accent)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {date} · {time}
          </span>
          {event.isBot && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#fef2f2", color: "var(--red)" }}>
              Bot filtered
            </span>
          )}
        </div>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
          {event.ipAddress} · {event.userAgent}
        </p>
      </div>
      {event.sessionDuration != null && (
        <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: "var(--text-secondary)" }}>
          {parseDur(event.sessionDuration)}
        </span>
      )}
    </div>
  );
}

/* ── Chart tooltip ───────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5 rounded-md text-xs" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-semibold" style={{ color: "var(--accent)" }}>{payload[0].value} views</p>
    </div>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */
interface DocumentPanelProps {
  doc: Document | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export default function DocumentPanel({ doc, onClose, onChanged }: DocumentPanelProps) {
  const [tab, setTab] = useState<"links" | "timeline">("links");
  const [newLinkOpen, setNewLinkOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !newLinkOpen && !deleteOpen) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [deleteOpen, newLinkOpen, onClose]);

  if (!doc) return null;

  const createLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!linkLabel.trim()) return;
    setCreatingLink(true);
    setLinkError(null);
    try {
      const response = await fetch(`/api/documents/${doc.id}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: linkLabel.trim() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Unable to create share link.");
      await onChanged();
      setLinkLabel("");
      setNewLinkOpen(false);
    } catch (error) {
      setLinkError(error instanceof Error ? error.message : "Unable to create share link.");
    } finally {
      setCreatingLink(false);
    }
  };

  const deleteDocument = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      const result = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Unable to delete document.");
      await onChanged();
      setDeleteOpen(false);
      onClose();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const links = doc.shareLinks;
  const allEvents = links.flatMap((l) => l.events);
  const totalViews = links.reduce((s, l) => s + l.viewCount, 0);
  const activeLinks = links.filter((l) => !l.revokedAt).length;
  const { label, icon } = typeConfig[doc.type];

  const chartData = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      views: allEvents.filter((event) => !event.isBot && event.openedAt.slice(0, 10) === key).length,
    };
  });
  const rows = [
    { key: "Type",         value: label },
    { key: "Size",         value: doc.size },
    { key: "Uploaded",     value: new Date(doc.uploadedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
    { key: "Last viewed",  value: doc.lastViewedAt ? new Date(doc.lastViewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never", accent: !!doc.lastViewedAt },
    { key: "Genuine views",value: `${totalViews}`, icon: <Eye size={12} className="mr-1" style={{ color: "var(--accent)" }} /> },
    { key: "Active links", value: `${activeLinks} / ${links.length}`, icon: <Link2 size={12} className="mr-1" style={{ color: "var(--accent)" }} /> },
  ];

  return (
    <>
      {/* Backdrop — very light, no blur */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: "rgba(15,19,36,0.06)" }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel — floating card, detached from the viewport edges with rounded corners on all sides */}
      <div
        className="fixed z-50 flex flex-col overflow-hidden rounded-xl animate-slide-right"
        style={{
          top: 10,
          right: 10,
          bottom: 10,
          width: "min(520px, calc(100vw - 20px))",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 18px 50px rgba(15, 19, 36, 0.16)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Image src={icon} alt={label} width={30} height={30} className="shrink-0 object-contain" style={{ width: 30, height: 30 }} />
            <div className="min-w-0">
              <h2 className="text-sm font-bold font-heading truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                {doc.name}
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label} · {doc.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <a
              href={`/api/documents/${doc.id}/download`}
              title="Download"
              aria-label={`Download ${doc.name}`}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: "var(--text-muted)", cursor: "pointer" }}
            >
              <Download size={15} />
            </a>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
              title="Delete document"
              aria-label={`Delete ${doc.name}`}
              className="p-1.5 rounded-md transition-colors hover:bg-red-50"
              style={{ color: "var(--red)", cursor: "pointer" }}
            >
              <Trash2 size={15} />
            </button>
            <button
              id="panel-close"
              onClick={onClose}
              title="Close"
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-elevated)]"
              style={{ color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar">

          {/* Metadata rows */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            {rows.map(({ key, value, accent, icon: rowIcon }) => (
              <div
                key={key}
                className="flex items-center justify-between py-2.5 text-sm"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <span style={{ color: "var(--text-muted)", minWidth: 100 }}>{key}</span>
                <span
                  className="flex items-center font-medium"
                  style={{ color: accent ? "#16a34a" : "var(--text-primary)" }}
                >
                  {rowIcon}
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <p className="text-xs font-semibold mb-3 tracking-wider" style={{ color: "var(--text-muted)" }}>
              VIEW ACTIVITY
            </p>
            <div style={{ height: 80 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<ChartTip />} cursor={{ stroke: "var(--border-color)" }} />
                  <Area type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={1.5} fill="url(#grad)" dot={false} activeDot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-5 pt-4 pb-0" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <div className="flex items-center justify-between">
              <div className="flex gap-5">
                {(["links", "timeline"] as const).map((t) => (
                  <button
                    key={t}
                    id={`panel-tab-${t}`}
                    onClick={() => setTab(t)}
                    className="text-sm font-semibold pb-3 transition-colors"
                    style={{
                      cursor: "pointer",
                      color: tab === t ? "var(--accent)" : "var(--text-muted)",
                      borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    {t === "links" ? "Share Links" : "Timeline"}
                    <span
                      className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: tab === t ? "var(--accent-light)" : "var(--bg-elevated)",
                        color: tab === t ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      {t === "links" ? links.length : allEvents.filter((e) => !e.isBot).length}
                    </span>
                  </button>
                ))}
              </div>
              {tab === "links" && (
                <button
                  id="generate-link"
                  onClick={() => setNewLinkOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-80 mb-3"
                    style={{ cursor: "pointer", background: "var(--accent)", color: "#fff" }}
                >
                  <Plus size={11} /> New link
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="px-5 py-3 pb-10">
            {tab === "links" ? (
              links.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Link2 size={22} style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No share links yet</p>
                </div>
              ) : (
                links.map((l) => <LinkRow key={l.id} link={l} documentId={doc.id} onChanged={onChanged} />)
              )
            ) : allEvents.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Clock size={22} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No views yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2 pt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    {allEvents.filter((e) => !e.isBot).length} genuine
                  </span>
                  {allEvents.some((e) => e.isBot) && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "var(--red)" }}>
                      {allEvents.filter((e) => e.isBot).length} filtered
                    </span>
                  )}
                </div>
                {allEvents.map((ev) => <EventRow key={ev.id} event={ev} />)}
              </>
            )}
          </div>
        </div>
      </div>
      <Dialog open={newLinkOpen} onOpenChange={setNewLinkOpen}>
        <DialogContent
          className="sm:max-w-sm p-0 overflow-hidden gap-0 rounded-lg"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
        >
          <DialogHeader className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <DialogTitle className="text-sm font-bold font-heading" style={{ color: "var(--text-primary)" }}>
              Create share link
            </DialogTitle>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{doc.name}</p>
          </DialogHeader>
          <form onSubmit={createLink} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="share-link-label" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Recipient or purpose
              </label>
              <input
                id="share-link-label"
                value={linkLabel}
                onChange={(event) => setLinkLabel(event.target.value)}
                placeholder="e.g. Sequoia Capital"
                maxLength={100}
                autoFocus
                className="w-full px-3 py-2.5 rounded-md text-sm outline-none"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border-color)", color: "var(--text-primary)" }}
              />
            </div>
            {linkError && <p className="text-xs" style={{ color: "var(--red)" }}>{linkError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setNewLinkOpen(false)} className="flex-1 py-2.5 rounded-md text-sm font-medium" style={{ border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button type="submit" disabled={!linkLabel.trim() || creatingLink} className="flex-1 py-2.5 rounded-md text-sm font-semibold disabled:opacity-40" style={{ background: "var(--accent)", color: "#fff" }}>
                {creatingLink ? "Creating..." : "Create link"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
        <DialogContent
          className="sm:max-w-sm p-0 overflow-hidden gap-0 rounded-lg"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}
        >
          <DialogHeader className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <div
              className="mb-1 flex h-10 w-10 items-center justify-center rounded-md"
              style={{ background: "#fef2f2", color: "var(--red)" }}
            >
              <AlertTriangle size={19} />
            </div>
            <DialogTitle className="text-sm font-bold font-heading" style={{ color: "var(--text-primary)" }}>
              Delete document?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              This permanently deletes {doc.name}, its share links, and all view activity. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-3">
            {deleteError && <p role="alert" className="text-xs" style={{ color: "var(--red)" }}>{deleteError}</p>}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="xl"
                onClick={() => void deleteDocument()}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 size={15} />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
