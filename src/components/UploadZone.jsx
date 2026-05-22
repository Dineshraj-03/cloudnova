/**
 * UploadZone.jsx — CloudNova
 *
 * Drag-and-drop file upload overlay + progress list.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGE (this revision)
 * ─────────────────────────────────────────────────────────────────────────────
 * UploadButton no longer owns a hidden <input> or an onFiles prop.
 * It now accepts a plain onClick prop and delegates entirely to the caller
 * (FolderWindow), which holds the single shared hidden input.
 *
 * Before:
 *   <UploadButton onFiles={uploadFiles} />
 *   // internally created its own <input ref={inputRef}> and called inputRef.click()
 *
 * After:
 *   <UploadButton onClick={triggerUploadInput} />
 *   // just a styled button — no input, no ref
 *
 * Everything else (UploadItem, UploadProgressPanel, DropOverlay) is unchanged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Upload progress item
// ─────────────────────────────────────────────────────────────────────────────
function UploadItem({ upload, onCancel }) {
  const { id, name, progress, status, error } = upload

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.06)" }}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {status === "uploading" && (
          <Loader2 size={16} className="text-blue-400 animate-spin" />
        )}
        {status === "done" && (
          <CheckCircle2 size={16} className="text-emerald-400" />
        )}
        {status === "error" && (
          <AlertCircle size={16} className="text-red-400" />
        )}
      </div>

      {/* Name + progress bar */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/80 truncate">{name}</p>

        {status === "uploading" && (
          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {status === "error" && (
          <p className="text-[10px] text-red-400/80 mt-0.5 truncate">{error}</p>
        )}

        {status === "done" && (
          <p className="text-[10px] text-emerald-400/70 mt-0.5">Upload complete</p>
        )}
      </div>

      {/* Progress % / cancel */}
      <div className="shrink-0 flex items-center gap-2">
        {status === "uploading" && (
          <>
            <span className="text-[10px] text-white/40">{progress}%</span>
            <button
              className="text-white/30 hover:text-white/70 transition-colors"
              onClick={() => onCancel(id)}
              title="Cancel upload"
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload progress panel (shown at bottom of FolderWindow when uploads exist)
// ─────────────────────────────────────────────────────────────────────────────
export function UploadProgressPanel({ uploads, onCancel, onClear }) {
  if (uploads.length === 0) return null

  const hasCompleted = uploads.some((u) => u.status === "done" || u.status === "error")

  return (
    <div
      className="flex flex-col gap-2 p-3 shrink-0"
      style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          Uploads
        </span>
        {hasCompleted && (
          <button
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            onClick={onClear}
          >
            Clear completed
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 max-h-32 overflow-auto">
        {uploads.map((u) => (
          <UploadItem key={u.id} upload={u} onCancel={onCancel} />
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Drop overlay (shown when dragging files over the window)
// ─────────────────────────────────────────────────────────────────────────────
export function DropOverlay({ isDragging, onDragOver, onDragLeave, onDrop }) {
  if (!isDragging) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl"
      style={{
        background:           "rgba(59, 130, 246, 0.15)",
        backdropFilter:       "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        border: "2px dashed rgba(96, 165, 250, 0.6)",
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className="flex flex-col items-center gap-3 p-8 rounded-2xl"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        <Upload size={40} className="text-blue-400" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-white/90 text-sm font-medium">Drop files here</p>
          <p className="text-white/50 text-xs mt-1">Images, PDFs, videos, documents</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload button
// ─────────────────────────────────────────────────────────────────────────────
// CHANGED: no longer manages its own hidden <input>.
// Receives onClick from FolderWindow, which triggers the single shared input.
export function UploadButton({ onClick, className = "" }) {
  return (
    <button
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                  text-white/70 hover:text-white hover:bg-white/10 transition-colors ${className}`}
      onClick={onClick}
      title="Upload files"
    >
      <Upload size={12} />
      Upload
    </button>
  )
}
