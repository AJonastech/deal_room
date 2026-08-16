"use client";

import { useState } from "react";
import { Copy, Check, Eye, ToggleLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ShareLink } from "@/lib/mock-data";

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ShareLinkCardProps {
  link: ShareLink;
  documentId: string;
}

export default function ShareLinkCard({ link, documentId }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(!!link.revokedAt);
  const [revoking, setRevoking] = useState(false);
  const isRevoked = revoked || !!link.revokedAt;

  const shareUrl = typeof window === "undefined"
    ? `/view/${link.token}`
    : `${window.location.origin}/view/${link.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeLink = async () => {
    if (revoking || isRevoked) return;
    setRevoking(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/links/${link.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to revoke share link.");
      setRevoked(true);
    } catch {
      // Keep the link active unless the server confirms the revoke.
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div
      className="p-4 rounded-2xl transition-all"
      style={{
        background: isRevoked ? "var(--bg-elevated)" : "var(--bg-card-alt)",
        border: `1px solid ${isRevoked ? "var(--border-subtle)" : "var(--border-color)"}`,
        opacity: isRevoked ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Status dot */}
        <div className="mt-0.5 shrink-0 pt-1">
          <span
            className="w-2 h-2 rounded-full block"
            style={{ background: isRevoked ? "var(--text-muted)" : "var(--accent-green)" }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Label + badge */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {link.label}
            </span>
            {isRevoked ? (
              <Badge
                className="text-xs px-1.5 py-0 rounded-md border-0"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--accent-red)" }}
              >
                Revoked
              </Badge>
            ) : (
              <Badge
                className="text-xs px-1.5 py-0 rounded-md border-0"
                style={{ background: "rgba(34,197,94,0.1)", color: "var(--accent-green)" }}
              >
                Active
              </Badge>
            )}
          </div>

          {/* Token URL row */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
            style={{ background: "var(--bg-base)", border: "1px solid var(--border-subtle)" }}
          >
            <code
              className="text-xs flex-1 truncate"
              style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}
            >
              {shareUrl}
            </code>
            {!isRevoked && (
              <>
                {/* Copy */}
                <div
                  role="button"
                  tabIndex={0}
                  title={copied ? "Copied!" : "Copy link"}
                  onClick={copyLink}
                  onKeyDown={(e) => e.key === "Enter" && copyLink()}
                  className="p-1 rounded cursor-pointer transition-colors shrink-0"
                  style={{ color: copied ? "var(--accent-green)" : "var(--text-muted)" }}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </div>
                {/* Open */}
                <a
                  href={`/view/${link.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open investor view"
                  className="p-1 rounded transition-colors shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  <ExternalLink size={13} />
                </a>
              </>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Eye size={12} />
              {link.viewCount} genuine {link.viewCount === 1 ? "view" : "views"}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Created {formatDate(link.createdAt)}
            </span>

            {!isRevoked && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => void revokeLink()}
                onKeyDown={(e) => e.key === "Enter" && void revokeLink()}
                className="ml-auto flex items-center gap-1.5 text-xs cursor-pointer transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
              >
                <ToggleLeft size={16} />
                {revoking ? "Revoking..." : "Revoke"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
