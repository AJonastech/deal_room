import Link from "next/link";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user) redirect("/");

  const displayName = user.name ?? user.email.split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-8"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-color)",
          height: 64,
        }}
      >
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <Logo size="md" />
        </Link>

        {/* User */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
            style={{
              background: "var(--accent-light)",
              border: "1px solid var(--accent-border)",
              color: "var(--accent)",
            }}
          >
            {initials}
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--text-secondary)" }}>
            {displayName.split(" ")[0]}
          </span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1 text-xs ml-1 transition-opacity hover:opacity-60"
              style={{ color: "var(--text-muted)" }}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={14} />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
