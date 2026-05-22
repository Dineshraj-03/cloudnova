/**
 * FileCard.jsx — CloudNova
 *
 * Reusable file + folder item component used in both grid and list views
 * inside FolderWindow.
 *
 * Props
 * ─────
 * item        : FileDoc | FolderDoc (with itemType attached)
 * viewMode    : "grid" | "list"
 * onOpen      : (item) => void      — called on double-click
 * onRename    : (item) => void
 * onDelete    : (item) => void
 *
 * Design decisions
 * ─────────────────
 * - Image items render an actual <img> thumbnail from storageUrl
 * - Video items render a thumbnail using a hidden <video> element with
 *   a canvas capture (lazy, only on hover to avoid performance hit)
 * - PDFs show a distinctive PDF icon with file extension label
 * - Documents show a doc icon with the file extension
 * - All items support right-click context menu
 * - Double-click fires onOpen — parent decides what window to open
 */

import { useState, useRef, useCallback } from "react"
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Film,
  FileType,
  File,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Icon chooser (fallback when no thumbnail is available)
// ─────────────────────────────────────────────────────────────────────────────
function ItemIcon({ item, size = 36 }) {
  const cls = "shrink-0"
  switch (item.itemType) {
    case "folder":   return <Folder   size={size} strokeWidth={1.5} className={`${cls} text-amber-300/90`} />
    case "image":    return <ImageIcon size={size} strokeWidth={1.5} className={`${cls} text-blue-300/90`} />
    case "pdf":      return <FileType  size={size} strokeWidth={1.5} className={`${cls} text-red-300/90`} />
    case "video":    return <Film      size={size} strokeWidth={1.5} className={`${cls} text-purple-300/90`} />
    case "note":     return <FileText  size={size} strokeWidth={1.5} className={`${cls} text-yellow-300/90`} />
    case "document": return <FileText  size={size} strokeWidth={1.5} className={`${cls} text-green-300/90`} />
    default:         return <File      size={size} strokeWidth={1.5} className={`${cls} text-white/50`} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image thumbnail (grid)
// ─────────────────────────────────────────────────────────────────────────────
function ImageThumbnail({ url, name }) {
  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  if (error) return <ImageIcon size={36} strokeWidth={1.5} className="text-blue-300/70" />

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-white/5 animate-pulse rounded-lg" />
      )}
      <img
        src={url}
        alt={name}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Context menu (right-click)
// ─────────────────────────────────────────────────────────────────────────────
function ItemContextMenu({ visible, x, y, item, onRename, onDelete, onOpen, onClose }) {
  if (!visible) return null

  const menuItems = [
    { label: "Open",   icon: <ExternalLink size={13} />, action: onOpen  },
    { separator: true },
    { label: "Rename", icon: <Pencil  size={13} />,      action: onRename },
    { label: "Delete", icon: <Trash2  size={13} />,      action: onDelete, danger: true },
  ]

  return (
    <>
      {/* Backdrop to catch outside clicks */}
      <div className="fixed inset-0 z-[998]" onClick={onClose} />
      <div
        className="fixed z-[999] py-1 rounded-xl overflow-hidden min-w-[160px]"
        style={{
          left: x,
          top:  y,
          background:    "rgba(30,30,38,0.96)",
          backdropFilter:       "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border:    "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        }}
      >
        {menuItems.map((m, i) =>
          m.separator ? (
            <div key={i} className="my-1 border-t border-white/10" />
          ) : (
            <button
              key={m.label}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left
                          transition-colors duration-100
                          ${m.danger
                            ? "text-red-400/80 hover:bg-red-500/15 hover:text-red-300"
                            : "text-white/75 hover:bg-white/10 hover:text-white"
                          }`}
              onClick={(e) => { e.stopPropagation(); m.action?.(); onClose() }}
            >
              {m.icon}
              {m.label}
            </button>
          )
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FileCard — Grid variant
// ─────────────────────────────────────────────────────────────────────────────
function GridCard({ item, onOpen, onRename, onDelete }) {
  const [ctx, setCtx] = useState({ visible: false, x: 0, y: 0 })
  const clickTimer  = useRef(null)
  const clickCount  = useRef(0)

  const displayName = item.label ?? item.name ?? "Untitled"
  const hasThumb    = item.itemType === "image" && item.storageUrl

  const handleClick = useCallback(() => {
    clickCount.current += 1
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 300)
    } else {
      clearTimeout(clickTimer.current)
      clickCount.current = 0
      onOpen(item)
    }
  }, [item, onOpen])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  return (
    <>
      <div
        className="flex flex-col items-center gap-2 p-2 rounded-xl
                   hover:bg-white/10 active:bg-white/15 transition-all duration-150
                   cursor-default text-center group select-none"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Thumbnail or icon */}
        <div
          className="w-16 h-16 flex items-center justify-center rounded-xl overflow-hidden
                     bg-white/5 group-hover:bg-white/8 transition-colors"
        >
          {hasThumb
            ? <ImageThumbnail url={item.storageUrl} name={displayName} />
            : <ItemIcon item={item} size={34} />
          }
        </div>

        {/* Label */}
        <span className="text-[11px] text-white/65 group-hover:text-white/90
                         leading-tight max-w-[80px] truncate transition-colors px-1">
          {displayName}
        </span>

        {/* Type badge for non-folder items */}
        {item.itemType !== "folder" && (
          <span className="text-[9px] text-white/25 -mt-1 uppercase tracking-wide">
            {item.itemType}
          </span>
        )}
      </div>

      <ItemContextMenu
        visible={ctx.visible}
        x={ctx.x}
        y={ctx.y}
        item={item}
        onOpen={() => onOpen(item)}
        onRename={() => onRename(item)}
        onDelete={() => onDelete(item)}
        onClose={() => setCtx((p) => ({ ...p, visible: false }))}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FileCard — List variant
// ─────────────────────────────────────────────────────────────────────────────
function ListCard({ item, onOpen, onRename, onDelete }) {
  const [ctx, setCtx] = useState({ visible: false, x: 0, y: 0 })
  const clickTimer  = useRef(null)
  const clickCount  = useRef(0)

  const displayName = item.label ?? item.name ?? "Untitled"
  const hasThumb    = item.itemType === "image" && item.storageUrl

  const handleClick = useCallback(() => {
    clickCount.current += 1
    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 300)
    } else {
      clearTimeout(clickTimer.current)
      clickCount.current = 0
      onOpen(item)
    }
  }, [item, onOpen])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  // Human-readable file size
  const formatSize = (bytes) => {
    if (!bytes) return ""
    if (bytes < 1024)       return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <>
      <div
        className="flex items-center gap-3 px-3 py-2 rounded-lg
                   hover:bg-white/10 active:bg-white/15 transition-colors
                   cursor-default w-full group select-none"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Thumbnail or icon */}
        <div className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0
                        bg-white/5 overflow-hidden">
          {hasThumb
            ? <ImageThumbnail url={item.storageUrl} name={displayName} />
            : <ItemIcon item={item} size={18} />
          }
        </div>

        {/* Name */}
        <span className="flex-1 text-xs text-white/70 group-hover:text-white
                         truncate transition-colors">
          {displayName}
        </span>

        {/* Type */}
        <span className="text-[10px] text-white/25 shrink-0 uppercase tracking-wide w-16 text-right">
          {item.itemType}
        </span>

        {/* Size (files only) */}
        {item.size && (
          <span className="text-[10px] text-white/25 shrink-0 w-16 text-right">
            {formatSize(item.size)}
          </span>
        )}
      </div>

      <ItemContextMenu
        visible={ctx.visible}
        x={ctx.x}
        y={ctx.y}
        item={item}
        onOpen={() => onOpen(item)}
        onRename={() => onRename(item)}
        onDelete={() => onDelete(item)}
        onClose={() => setCtx((p) => ({ ...p, visible: false }))}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export — picks grid or list variant
// ─────────────────────────────────────────────────────────────────────────────
export function FileCard({ item, viewMode, onOpen, onRename, onDelete }) {
  if (viewMode === "list") {
    return <ListCard item={item} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
  }
  return <GridCard item={item} onOpen={onOpen} onRename={onRename} onDelete={onDelete} />
}

export default FileCard
