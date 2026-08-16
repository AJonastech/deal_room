"use client";

import { Bot, Clock, Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ViewEvent } from "@/lib/mock-data";

function formatTime(str: string) {
  const d = new Date(str);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

function parseDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function detectDevice(ua: string) {
  if (/iPhone|iPad|Android/i.test(ua)) return "mobile";
  return "desktop";
}

interface ViewTimelineProps {
  events: ViewEvent[];
}

export default function ViewTimeline({ events }: ViewTimelineProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 rounded-2xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
      >
        <Clock size={28} className="mb-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          No views yet. Share a link to start tracking.
        </p>
      </div>
    );
  }

  const genuine = events.filter((e) => !e.isBot);
  const filtered = events.filter((e) => e.isBot);

  return (
    <div className="space-y-3">
      {/* Summary badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{
            background: "rgba(34,197,94,0.1)",
            color: "var(--accent-green)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          {genuine.length} genuine {genuine.length === 1 ? "session" : "sessions"}
        </span>
        {filtered.length > 0 && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: "rgba(239,68,68,0.08)",
              color: "var(--accent-red)",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
          >
            {filtered.length} bot{filtered.length > 1 ? "s" : ""} filtered
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-[19px] top-4 bottom-4 w-px"
          style={{ background: "var(--border-color)" }}
        />

        <div className="space-y-3">
          {events.map((event, i) => {
            const { date, time } = formatTime(event.openedAt);
            const device = detectDevice(event.userAgent);

            return (
              <div
                key={event.id}
                className="flex gap-4 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Timeline dot */}
                <div className="relative z-10 shrink-0 mt-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: event.isBot
                        ? "rgba(239,68,68,0.08)"
                        : "rgba(34,197,94,0.08)",
                      border: `1px solid ${event.isBot ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                    }}
                  >
                    {event.isBot ? (
                      <Bot size={16} style={{ color: "var(--accent-red)" }} />
                    ) : device === "mobile" ? (
                      <Smartphone size={16} style={{ color: "var(--accent-green)" }} />
                    ) : (
                      <Monitor size={16} style={{ color: "var(--accent-green)" }} />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div
                  className="flex-1 p-4 rounded-2xl"
                  style={{
                    background: event.isBot ? "var(--bg-elevated)" : "var(--bg-card)",
                    border: `1px solid ${event.isBot ? "var(--border-subtle)" : "var(--border-color)"}`,
                    opacity: event.isBot ? 0.6 : 1,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {date} at {time}
                        </span>
                        {event.isBot && (
                          <Badge
                            className="text-xs px-1.5 py-0 rounded-md"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "var(--accent-red)",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            Bot filtered
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {event.ipAddress} · {event.userAgent}
                      </p>
                    </div>

                    {event.sessionDuration !== null && (
                      <div className="shrink-0 text-right">
                        <p
                          className="text-sm font-bold tabular-nums"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {parseDuration(event.sessionDuration)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          session
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
