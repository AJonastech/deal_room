"use client";

import { Bell, Search, Upload } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/documents": "Documents",
  "/dashboard/links": "Share Links",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/dashboard/documents/")) return "Document Detail";
  return "Dashboard";
}

interface TopbarProps {
  onUpload?: () => void;
}

export default function Topbar({ onUpload }: TopbarProps) {
  const pathname = usePathname();
  const [hasNotif] = useState(true);

  return (
    <header
      className="flex items-center gap-4 px-6 py-4 sticky top-0 z-20"
      style={{
        background: "rgba(12,12,12,0.85)",
        borderBottom: "1px solid var(--border-color)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Page title */}
      <div className="flex-1">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {getTitle(pathname)}
        </h2>
      </div>

      {/* Search */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          color: "var(--text-muted)",
          width: 220,
        }}
      >
        <Search size={14} className="shrink-0" />
        <span className="text-xs">Search documents…</span>
        <kbd
          className="ml-auto text-xs px-1.5 py-0.5 rounded"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "10px" }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Notification bell */}
      <button
        id="topbar-notifications"
        aria-label="Notifications"
        className="relative p-2 rounded-xl transition-all hover:bg-[var(--bg-elevated)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bell size={18} />
        {hasNotif && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "var(--accent-amber)" }}
          />
        )}
      </button>

      {/* Upload CTA */}
      <button
        id="topbar-upload"
        onClick={onUpload}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
        style={{
          background: "var(--accent-amber)",
          color: "var(--accent-amber-fg)",
        }}
      >
        <Upload size={14} />
        <span className="hidden sm:inline">Upload</span>
      </button>
    </header>
  );
}
