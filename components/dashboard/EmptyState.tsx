"use client";

import { FolderOpen, Upload } from "lucide-react";

interface EmptyStateProps {
  onUpload: () => void;
}

export default function EmptyState({ onUpload }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
      {/* Decorative ring */}
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 0 60px rgba(245,158,11,0.06)",
          }}
        >
          <FolderOpen size={36} style={{ color: "var(--text-muted)" }} />
        </div>
        {/* Dotted ring */}
        <div
          className="absolute -inset-3 rounded-[2rem] border-2 border-dashed"
          style={{ borderColor: "var(--border-color)" }}
        />
      </div>

      <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        No documents yet
      </h3>
      <p className="text-sm text-center max-w-xs mb-8" style={{ color: "var(--text-secondary)" }}>
        Upload your first fundraising document to start sharing with investors
        and tracking engagement.
      </p>

      <button
        id="empty-state-upload"
        onClick={onUpload}
        className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ background: "var(--accent-amber)", color: "var(--accent-amber-fg)" }}
      >
        <Upload size={16} />
        Upload your first document
      </button>
    </div>
  );
}
