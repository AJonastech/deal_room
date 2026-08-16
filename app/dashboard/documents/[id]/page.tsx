"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Eye,
  Link2,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  mockDocuments,
  mockShareLinks,
  mockViewEvents,
  mockViewStats,
} from "@/lib/mock-data";
import ShareLinkCard from "@/components/dashboard/ShareLinkCard";
import ViewTimeline from "@/components/dashboard/ViewTimeline";
import { DocumentIcon } from "@/components/ui/document-icon";

const typeConfig = {
  pitch_deck: { label: "Pitch Deck", color: "#f59e0b" },
  financials:  { label: "Financials", color: "#22c55e" },
  term_sheet:  { label: "Term Sheet", color: "#60a5fa" },
  data_room:   { label: "Data Room", color: "#f97316" },
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-color)",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="font-bold mt-0.5" style={{ color: "#f59e0b" }}>
          {payload[0].value} views
        </p>
      </div>
    );
  }
  return null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"links" | "timeline">("links");

  const doc = mockDocuments.find((d) => d.id === id) ?? mockDocuments[0];
  const links = mockShareLinks[doc.id] ?? [];
  const allEvents = links.flatMap((l) => mockViewEvents[l.id] ?? []);

  const { label, color } = typeConfig[doc.type];
  const totalViews = links.reduce((s, l) => s + l.viewCount, 0);
  const activeLinks = links.filter((l) => !l.revokedAt).length;

  return (
    <div className="space-y-8 animate-fade-up">
      {/* ── Back ── */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={14} />
        Overview
      </button>

      {/* ── Document header ── */}
      <div
        className="p-6 rounded-2xl relative overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <div className="absolute inset-0 hatch-bg opacity-25 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4">
            <DocumentIcon type={doc.type} alt={label} size={48} />
            <div>
              <h1
                className="text-xl font-bold font-heading mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {doc.name}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-lg mr-2"
                  style={{ background: `${color}12`, color }}
                >
                  {label}
                </span>
                {doc.size} · Uploaded{" "}
                {new Date(doc.uploadedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

              {/* Quick stats */}
              <div className="flex items-center gap-5 mt-3">
                <div className="flex items-center gap-1.5">
                  <Eye size={13} style={{ color: "#f59e0b" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {totalViews}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    genuine views
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link2 size={13} style={{ color: "#60a5fa" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {activeLinks}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    active links
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            id="doc-download"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80 shrink-0"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
            }}
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* ── Activity chart ── */}
      <div
        className="p-6 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm font-semibold font-heading" style={{ color: "var(--text-primary)" }}>
            View activity
          </p>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last 14 days
          </span>
        </div>
        <div style={{ height: 110 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockViewStats}
              margin={{ top: 0, right: 0, bottom: 0, left: -28 }}
            >
              <defs>
                <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "var(--border-color)" }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#amberGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Share links / Timeline ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        {/* Tab bar */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-elevated)" }}>
            {(["links", "timeline"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={
                  activeTab === tab
                    ? {
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                {tab === "links" ? "Share Links" : "View Timeline"}
              </button>
            ))}
          </div>

          {activeTab === "links" && (
            <button
              id="generate-share-link"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: "var(--accent-amber)", color: "#0c0c0c" }}
            >
              <Plus size={13} />
              New link
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === "links" ? (
            <div className="space-y-3">
              {links.length === 0 ? (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "var(--text-muted)" }}
                >
                  No share links yet. Create one above.
                </p>
              ) : (
                links.map((link) => <ShareLinkCard key={link.id} link={link} documentId={doc.id} />)
              )}
            </div>
          ) : (
            <ViewTimeline events={allEvents} />
          )}
        </div>
      </div>
    </div>
  );
}
