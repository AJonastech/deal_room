"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentIcon } from "@/components/ui/document-icon";
import { Input } from "@/components/ui/input";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: () => Promise<void>;
}

type Phase = "idle" | "uploading" | "processing" | "done";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Upload the document via XHR so we can report genuine upload progress
 * (fetch() exposes no upload-progress events). Resolves on 2xx, rejects with a
 * useful message otherwise; `onXhr` hands back the request so the caller can
 * abort it.
 */
function uploadDocument(
  file: File,
  name: string,
  handlers: {
    onProgress: (pct: number) => void;
    onTransferComplete: () => void;
    onXhr: (xhr: XMLHttpRequest) => void;
  },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("name", name);

    const xhr = new XMLHttpRequest();
    handlers.onXhr(xhr);
    xhr.open("POST", "/api/documents");

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        handlers.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.upload.addEventListener("load", handlers.onTransferComplete);
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      let message = "Upload failed. Please try again.";
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: string };
        if (parsed?.error) message = parsed.error;
      } catch {
        /* keep the default message */
      }
      reject(new Error(message));
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Network error — check your connection and try again.")),
    );
    xhr.addEventListener("abort", () => reject(new DOMException("Upload cancelled.", "AbortError")));

    xhr.send(body);
  });
}

export default function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [progressTarget, setProgressTarget] = useState(0);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const uploadAttemptRef = useRef(0);

  const busy = phase === "uploading" || phase === "processing";

  // Smooth sparse browser progress events so fast local uploads still have a
  // readable progression without claiming more bytes than XHR has reported.
  useEffect(() => {
    if (!busy || progress >= progressTarget) return;
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= progressTarget) return current;
        const step = Math.max(1, Math.ceil((progressTarget - current) * 0.2));
        return Math.min(progressTarget, current + step);
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [busy, progress, progressTarget]);

  const resetState = useCallback(() => {
    setFile(null);
    setDocName("");
    setError(null);
    setProgress(0);
    setProgressTarget(0);
    setPhase("idle");
  }, []);

  const closeModal = useCallback(() => {
    uploadAttemptRef.current += 1;
    xhrRef.current?.abort();
    xhrRef.current = null;
    resetState();
    onClose();
  }, [resetState, onClose]);

  const cancelUpload = useCallback(() => {
    uploadAttemptRef.current += 1;
    const request = xhrRef.current;
    xhrRef.current = null;
    request?.abort();
    setProgress(0);
    setProgressTarget(0);
    setPhase("idle");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setDocName(f.name.replace(/\.[^.]+$/, "")); }
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setDocName(f.name.replace(/\.[^.]+$/, "")); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !docName.trim() || busy) return;
    const attempt = ++uploadAttemptRef.current;
    const startedAt = performance.now();
    setError(null);
    setProgress(0);
    setProgressTarget(1);
    setPhase("uploading");
    try {
      await uploadDocument(file, docName.trim(), {
        onProgress: (pct) => {
          // The server still needs to validate and persist the document after
          // all bytes arrive, so network transfer tops out at 95%.
          setProgressTarget(Math.max(1, Math.min(95, Math.round(pct * 0.95))));
        },
        onTransferComplete: () => {
          if (uploadAttemptRef.current !== attempt) return;
          setProgressTarget(95);
          setPhase("processing");
        },
        onXhr: (xhr) => { xhrRef.current = xhr; },
      });
      if (uploadAttemptRef.current !== attempt) return;
      xhrRef.current = null;
      setProgressTarget(95);

      // Keep very fast local transfers legible, then complete the final server
      // stage only after the API has confirmed persistence.
      await delay(Math.max(0, 700 - (performance.now() - startedAt)));
      if (uploadAttemptRef.current !== attempt) return;
      setProgressTarget(100);
      await Promise.all([onUploaded(), delay(300)]);
      if (uploadAttemptRef.current !== attempt) return;
      setProgress(100);
      setPhase("done");
      window.setTimeout(closeModal, 1000);
    } catch (uploadError) {
      xhrRef.current = null;
      setProgress(0);
      setProgressTarget(0);
      setPhase("idle");
      // A user-initiated abort isn't an error — just return to the form.
      if (uploadError instanceof DOMException && uploadError.name === "AbortError") return;
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) return;
        closeModal();
      }}
    >
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden gap-0 rounded-lg"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
      >
        <DialogHeader
          className="px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--border-color)" }}
        >
          <DialogTitle className="text-sm font-bold font-heading" style={{ color: "var(--text-primary)" }}>
            Upload document
          </DialogTitle>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Add a document to your deal room
          </p>
        </DialogHeader>

        {phase === "done" ? (
          /* ── Success ── */
          <div className="flex flex-col items-center py-12 gap-3 animate-fade-up">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 56, height: 56, background: "var(--accent-light)", border: "1px solid var(--accent-border)" }}
            >
              <CheckCircle2 size={30} style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>Upload complete</p>
            <p className="text-xs text-center px-6 truncate max-w-full" style={{ color: "var(--text-muted)" }}>
              {docName.trim()} is ready to share
            </p>
          </div>
        ) : busy ? (
          /* ── Progress ── */
          <div className="flex min-w-0 flex-col gap-5 px-4 py-7 sm:px-5 sm:py-8 animate-fade-up">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              {file && (
                <div className="shrink-0">
                  <DocumentIcon filename={file.name} size={40} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="block max-w-full truncate text-sm font-medium" title={file?.name} style={{ color: "var(--text-primary)" }}>
                  {file?.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {phase === "processing" ? "Finalizing upload..." : "Uploading..."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {phase === "processing" && (
                  <Loader2 size={16} className="animate-spin" style={{ color: "var(--accent)" }} />
                )}
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--accent)" }}>
                  {progress}%
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-100 ease-out"
                style={{ width: `${progress}%`, background: "var(--accent)" }}
              />
            </div>

            {phase === "uploading" && (
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={cancelUpload}
                className="w-full"
              >
                Cancel upload
              </Button>
            )}
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Drop zone */}
            <div
              id="upload-dropzone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className="relative min-w-0 rounded-md p-4 text-center cursor-pointer transition-all sm:p-6"
              style={{
                border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border-color)"}`,
                background: dragOver ? "var(--accent-light)" : "var(--bg-base)",
              }}
            >
              <input
                type="file"
                id="upload-file-input"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                onChange={handleFile}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="shrink-0">
                    <DocumentIcon filename={file.name} size={36} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="block max-w-full truncate text-sm font-medium" title={file.name} style={{ color: "var(--text-primary)" }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); setDocName(""); }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    aria-label={`Remove ${file.name}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={22} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Drop a file here</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>PDF, DOCX, XLSX, ZIP · up to 50 MB</p>
                </>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="upload-doc-name" className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                Document name
              </label>
              <Input
                id="upload-doc-name"
                type="text"
                placeholder="e.g. Series A Pitch Deck"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                required
              />
            </div>

            {/* Actions */}
            {error && <p role="alert" className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="xl"
                onClick={closeModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                id="upload-submit"
                type="submit"
                size="xl"
                disabled={!file || !docName.trim()}
                className="flex-1"
              >
                <Upload size={14} />
                Upload
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
