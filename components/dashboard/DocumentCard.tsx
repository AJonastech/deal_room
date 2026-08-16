"use client";

import { useRouter } from "next/navigation";
import {
  Eye,
  Link2,
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowUpRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DocumentIcon } from "@/components/ui/document-icon";
import type { Document } from "@/lib/mock-data";

const typeConfig = {
  pitch_deck: { label: "Pitch Deck", color: "var(--accent-amber)" },
  financials:  { label: "Financials", color: "var(--accent-green)" },
  term_sheet:  { label: "Term Sheet", color: "var(--accent-blue)" },
  data_room:   { label: "Data Room", color: "var(--accent-orange)" },
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface DocumentCardProps {
  doc: Document;
}

export default function DocumentCard({ doc }: DocumentCardProps) {
  const router = useRouter();
  const { label, color } = typeConfig[doc.type];

  return (
    <div
      className="p-5 rounded-2xl hover-lift cursor-pointer relative group animate-fade-up"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
      onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/dashboard/documents/${doc.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <DocumentIcon type={doc.type} alt={label} size={40} />

        {/* Action menu */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  id={`doc-menu-${doc.id}`}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="Document options"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="gap-2 text-xs cursor-pointer"
                onClick={() => router.push(`/dashboard/documents/${doc.id}`)}
              >
                <ArrowUpRight size={14} /> Open detail
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <Copy size={14} /> Copy share link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer text-destructive focus:text-destructive">
                <Trash2 size={14} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Name */}
      <h3
        className="text-sm font-semibold mb-1 leading-snug"
        style={{ color: "var(--text-primary)" }}
      >
        {doc.name}
      </h3>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        {doc.size} · Uploaded {formatRelative(doc.uploadedAt)}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-3">
        <Badge
          variant="secondary"
          className="gap-1.5 text-xs font-medium px-2 py-1 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <Eye size={11} />
          {doc.viewCount} views
        </Badge>
        <Badge
          variant="secondary"
          className="gap-1.5 text-xs font-medium px-2 py-1 rounded-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
          }}
        >
          <Link2 size={11} />
          {doc.linkCount} link{doc.linkCount !== 1 ? "s" : ""}
        </Badge>

        <span className="ml-auto">
          <Badge
            className="text-xs px-2 py-0.5 rounded-md font-medium"
            style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}
          >
            {label}
          </Badge>
        </span>
      </div>

      {/* Last viewed indicator */}
      {doc.lastViewedAt && (
        <div
          className="flex items-center gap-1.5 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--accent-green)" }}
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last viewed {formatRelative(doc.lastViewedAt)}
          </span>
        </div>
      )}
    </div>
  );
}
