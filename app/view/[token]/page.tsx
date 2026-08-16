"use client";

import { use, useEffect, useState } from "react";
import { FileText, Download, Shield } from "lucide-react";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface LinkData {
  label: string;
  documentId: string;
  documentName: string;
  documentType: string;
  mimeType: string;
}

export default function InvestorViewPage({ params }: PageProps) {
  const { token } = use(params);
  const [link, setLink] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const storageKey = `dealroom_view_session_${token}`;
    let sessionKey = window.sessionStorage.getItem(storageKey);
    if (!sessionKey) {
      sessionKey = crypto.randomUUID();
      window.sessionStorage.setItem(storageKey, sessionKey);
    }

    fetch(`/api/share-links/${encodeURIComponent(token)}`, {
      headers: { "X-DealRoom-Session": sessionKey },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data: LinkData | null) => { if (active) setLink(data); })
      .catch(() => { if (active) setLink(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-base)" }}>
        <div className="h-[52px] shrink-0 animate-pulse" style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-color)" }} />
        <main className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-5xl rounded-md animate-pulse" style={{ height: "calc(100dvh - 140px)", minHeight: 580, background: "var(--bg-surface)", border: "1px solid var(--border-color)" }} />
        </main>
        <div className="h-[49px] shrink-0 animate-pulse" style={{ borderTop: "1px solid var(--border-color)" }} />
      </div>
    );
  }

  if (!link) {
    return (
      <div
        className="min-h-dvh flex flex-col items-center justify-center gap-5 p-6"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="w-12 h-12 rounded-md flex items-center justify-center"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <Shield size={22} style={{ color: "var(--accent-red)" }} />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold font-heading mb-1.5" style={{ color: "var(--text-primary)" }}>
            Link unavailable
          </h1>
          <p className="text-sm max-w-xs" style={{ color: "var(--text-secondary)" }}>
            {loading ? "Loading this secure document link..." : "This share link is unavailable. Please contact the document owner for a new link."}
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}
        >
          <FileText size={11} />
          Powered by DealRoom
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-20 flex items-center gap-4 px-6"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-color)",
          height: 52,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Image src="/document_icons/doc.png" alt="DealRoom" width={15} height={15} />
          </div>
          <Logo size="sm" />
        </div>

        <div className="w-px h-4" style={{ background: "var(--border-color)" }} />

        <p className="text-sm flex-1 truncate" style={{ color: "var(--text-secondary)" }}>
          {link.label} — Confidential
        </p>

        <div className="flex items-center gap-1">
          <a href={`/api/share-links/${encodeURIComponent(token)}/download`} id="viewer-download" className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors" style={{ color: "var(--text-secondary)" }} aria-label="Download"><Download size={14} /></a>
        </div>
      </header>

      {/* Document canvas */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        {link.mimeType === "application/pdf" ? (
          <iframe
            title={link.documentName}
            src={`/api/share-links/${encodeURIComponent(token)}/download?inline=1`}
            className="w-full max-w-5xl rounded-md shadow-sm animate-fade-up"
            style={{ height: "calc(100dvh - 140px)", minHeight: 580, border: "1px solid var(--border-color)", background: "var(--bg-surface)" }}
          />
        ) : (
          <div className="w-full max-w-2xl rounded-md p-10 text-center shadow-sm" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)" }}>
            <FileText size={32} className="mx-auto mb-3" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This file type cannot be previewed in the browser. Download it to open the document.</p>
          </div>
        )}
      </main>

      <footer
        className="flex items-center justify-center gap-1.5 py-4 text-xs"
        style={{ borderTop: "1px solid var(--border-color)", color: "var(--text-muted)" }}
      >
        <FileText size={10} />
        Shared via <span style={{ color: "var(--text-secondary)", marginLeft: 3 }}>DealRoom</span>
        <span className="mx-2">·</span>
        Views are tracked and deduped
      </footer>
    </div>
  );
}
