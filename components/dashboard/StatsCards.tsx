"use client";

import { TrendingUp, Eye, Link2, FileText } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent?: string;
  trend?: string;
  trendUp?: boolean;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "var(--accent-amber)",
  trend,
  trendUp,
}: StatCardProps) {
  return (
    <div
      className="p-5 rounded-2xl relative overflow-hidden hover-lift group"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* Hatched bg accent */}
      <div className="absolute inset-0 hatch-bg opacity-40 pointer-events-none" />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 relative z-10"
        style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
      >
        <Icon size={18} style={{ color: accent }} />
      </div>

      {/* Value */}
      <div className="relative z-10">
        <p
          className="text-3xl font-bold tracking-tight mb-0.5"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </p>
        <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {trend && (
            <span
              className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: trendUp ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: trendUp ? "var(--accent-green)" : "var(--accent-red)",
              }}
            >
              <TrendingUp size={11} />
              {trend}
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
}

interface StatsCardsProps {
  totalDocs: number;
  totalViews: number;
  activeLinks: number;
  uniqueSessions: number;
}

export default function StatsCards({
  totalDocs,
  totalViews,
  activeLinks,
  uniqueSessions,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 stagger">
      <div className="animate-fade-up">
        <StatCard
          label="Total Documents"
          value={totalDocs}
          sub="in your deal room"
          icon={FileText}
          accent="var(--accent-amber)"
        />
      </div>
      <div className="animate-fade-up">
        <StatCard
          label="Genuine Views"
          value={totalViews}
          sub="bot-filtered sessions"
          icon={Eye}
          accent="var(--accent-blue)"
          trend="+18%"
          trendUp
        />
      </div>
      <div className="animate-fade-up">
        <StatCard
          label="Active Links"
          value={activeLinks}
          sub="share links live"
          icon={Link2}
          accent="var(--accent-green)"
        />
      </div>
      <div className="animate-fade-up">
        <StatCard
          label="Unique Sessions"
          value={uniqueSessions}
          sub="this week"
          icon={TrendingUp}
          accent="var(--accent-orange)"
          trend="+5"
          trendUp
        />
      </div>
    </div>
  );
}
