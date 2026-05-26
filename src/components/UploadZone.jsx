/**
 * UploadZone.jsx — CloudNova
 *
 * Three focused UI components used by FolderWindow for the upload system:
 *
 *   DropOverlay          — full-window drag-over overlay with animated border
 *   UploadProgressPanel  — collapsible panel showing per-file upload progress
 *   UploadButton         — toolbar button (no input — FolderWindow owns the input)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY these are separate from FolderWindow?
 * ─────────────────────────────────────────────────────────────────────────────
 * FolderWindow is already large. Extracting these keeps each concern isolated:
 *   - DropOverlay  →  purely presentational, controlled by isDragging prop
 *   - UploadButton →  purely presentational, receives onClick, renders nothing else
 *   - UploadProgressPanel → reads uploads[], calls cancel/clear — no Firestore
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * UploadButton design decision
 * ─────────────────────────────────────────────────────────────────────────────
 * FolderWindow owns ONE hidden <input type="file"> with a stable ref.
 * UploadButton receives a plain onClick that calls inputRef.current.click().
 * This avoids the pointer-capture / bubbling bug that occurs when a button
 * inside a draggable title bar owns its own input.
 */

import { useState } from "react"
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  XCircle,
  Loader2,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// DropOverlay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full-window overlay shown while the user drags files over FolderWindow.
 * Rendered as an absolute layer inside the window div so it covers only that
 * window, not the whole desktop.
 *
 * Props
 * ─────
 * isDragging   : boolean
 * onDragOver   : React drag event handler (keeps the overlay alive)
 * onDragLeave  : React drag event handler
 * onDrop       : React drag event handler
 */
export function DropOverlay({ isDragging, onDragOver, onDragLeave, onDrop }) {
  if (!isDragging) return null

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center
                 rounded-2xl pointer-events-auto"
      style={{
        background:    "rgba(59,130,246,0.12)",
        backdropFilter:       "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        border: "2px dashed rgba(96,165,250,0.6)",
        boxShadow: "inset 0 0 60px rgba(59,130,246,0.08)",
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Animated upload icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(59,130,246,0.2)",
          border:     "1px solid rgba(96,165,250,0.35)",
          animation:  "pulse 1.5s ease-in-out infinite",
        }}
      >
        <Upload size={36} className="text-blue-300" strokeWidth={1.5} />
      </div>

      <p className="text-white text-lg font-semibold tracking-tight">
        Drop to upload
      </p>
      <p className="text-blue-300/70 text-sm mt-1">
        Files will be added to this folder
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadProgressPanel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Collapsible panel anchored to the bottom of FolderWindow (above the status
 * bar) that shows per-file upload progress.
 *
 * Hides itself entirely when there are no uploads.
 *
 * Props
 * ─────
 * uploads      : Array<{ id, name, status, progress, error }>
 * onCancel     : (id: string) => void
 * onClear      : () => void   — removes done/error/cancelled entries
 */
export function UploadProgressPanel({ uploads, onCancel, onClear }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!uploads.length) return null

  const active    = uploads.filter((u) => u.status === "uploading").length
  const completed = uploads.filter((u) => u.status !== "uploading").length

  return (
    <div
      className="shrink-0 mx-3 mb-2 rounded-xl overflow-hidden"
      style={{
        background: "rgba(15,15,20,0.85)",
        border:     "1px solid rgba(255,255,255,0.09)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer
                   hover:bg-white/5 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          {active > 0 ? (
            <Loader2 size={13} className="text-blue-400 animate-spin" />
          ) : (
            <CheckCircle2 size={13} className="text-green-400" />
          )}
          <span className="text-xs text-white/70 font-medium">
            {active > 0
              ? `Uploading ${active} file${active > 1 ? "s" : ""}…`
              : `${completed} upload${completed > 1 ? "s" : ""} complete`
            }
          </span>
        </div>
        <div className="flex items-center gap-1">
          {completed > 0 && (
            <button
              className="px-2 py-0.5 rounded text-[10px] text-white/40
                         hover:text-white/70 hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); onClear() }}
            >
              Clear
            </button>
          )}
          {collapsed
            ? <ChevronUp   size={13} className="text-white/40" />
            : <ChevronDown size={13} className="text-white/40" />
          }
        </div>
      </div>

      {/* File list */}
      {!collapsed && (
        <div className="max-h-36 overflow-y-auto px-3 pb-2 flex flex-col gap-1.5">
          {uploads.map((u) => (
            <UploadRow
              key={u.id}
              upload={u}
              onCancel={() => onCancel(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Single upload row inside the panel */
function UploadRow({ upload, onCancel }) {
  const { name, status, progress, error } = upload

  // Truncate long filenames in the middle
  const display = name.length > 32
    ? `${name.slice(0, 18)}…${name.slice(-10)}`
    : name

  return (
    <div className="flex items-center gap-2">
      {/* Status icon */}
      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
        {status === "uploading" && (
          <Loader2 size={12} className="text-blue-400 animate-spin" />
        )}
        {status === "done" && (
          <CheckCircle2 size={12} className="text-green-400" />
        )}
        {status === "error" && (
          <AlertCircle size={12} className="text-red-400" />
        )}
        {status === "cancelled" && (
          <XCircle size={12} className="text-white/30" />
        )}
      </div>

      {/* Name + progress bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className="text-[11px] truncate"
            style={{
              color: status === "error"     ? "rgba(248,113,113,0.9)"
                   : status === "cancelled" ? "rgba(255,255,255,0.3)"
                   : "rgba(255,255,255,0.65)",
            }}
          >
            {display}
          </span>
          {status === "uploading" && (
            <span className="text-[10px] text-white/30 ml-1 shrink-0">
              {progress}%
            </span>
          )}
          {status === "error" && error && (
            <span className="text-[10px] text-red-400/70 ml-1 shrink-0 truncate max-w-[80px]">
              {error}
            </span>
          )}
        </div>

        {/* Progress bar (only while uploading) */}
        {status === "uploading" && (
          <div className="w-full h-1 rounded-full bg-white/10">
            <div
              className="h-1 rounded-full bg-blue-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Cancel button (only while uploading) */}
      {status === "uploading" && (
        <button
          className="shrink-0 p-0.5 rounded text-white/25 hover:text-red-400/80
                     hover:bg-white/10 transition-colors"
          onClick={onCancel}
          title="Cancel upload"
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadButton
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple toolbar button that triggers file selection.
 * Does NOT own a hidden <input> — FolderWindow owns one shared input and
 * passes onClick = () => inputRef.current.click().
 *
 * Props
 * ─────
 * onClick : () => void
 */
export function UploadButton({ onClick }) {
  return (
    <button
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
      onClick={onClick}
      title="Upload files"
    >
      <Upload size={12} />
      Upload
    </button>
  )
}
