"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Link2,
  Settings,
  ChevronRight,
  LogOut,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { founderMock } from "@/lib/mock-data";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/links", label: "Share Links", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 overflow-y-auto"
      style={{
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-color)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center px-5 py-5"
        style={{ borderBottom: "1px solid var(--border-color)" }}
      >
        <Logo size="md" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "text-amber-400"
                  : "hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              style={
                active
                  ? {
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.15)",
                      color: "var(--accent-amber)",
                    }
                  : {}
              }
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {active && (
                <ChevronRight size={14} style={{ color: "var(--accent-amber)", opacity: 0.6 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 space-y-0.5" style={{ borderTop: "1px solid var(--border-color)" }}>
        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </Link>
        ))}

        {/* User */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 cursor-pointer transition-all hover:bg-[var(--bg-elevated)] group"
          style={{ border: "1px solid var(--border-color)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--accent-amber)", color: "var(--bg-base)" }}
          >
            {founderMock.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {founderMock.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {founderMock.company}
            </p>
          </div>
          <LogOut
            size={14}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>
    </aside>
  );
}
