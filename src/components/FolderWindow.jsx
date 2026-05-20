/**
 * FolderWindow.jsx — CloudNova
 *
 * Phase 2: macOS Finder-style folder window with glassmorphism UI.
 *
 * Props
 * ─────
 * folderId   string        Firestore folder ID
 * label      string        Display name shown in title bar
 * uid        string        Current user's Firebase UID
 * onClose    () => void
 * onMinimize () => void
 * isActive   bool
 * onFocus    () => void
 *
 * Architecture
 * ────────────
 * - Loads files + sub-folders from Firestore via filesystem.js helpers
 * - Draggable via pointer events (same pattern as other CloudNova windows)
 * - Empty state shown when folder has no contents
 * - Ready for Phase 4 (notes inside folders) — double-click a note file
 *   to open it in a NoteEditor (stub provided)
 */

import { useState, useEffect, useRef, useCallback } from "react"
import {
  X,
  Minus,
  Folder,
  FileText,
  Image,
  File,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react"
import { getFiles, getFolders, createFile, createFolder } from "./filesystem"

// ─────────────────────────────────────────────────────────────────────────────
// File type → icon mapping
// ─────────────────────────────────────────────────────────────────────────────
function FileIcon({ type, size = 32 }) {
  const props = { size, strokeWidth: 1.5, className: "text-white/70" }
  switch (type) {
    case "note":    return <FileText  {...props} className="text-yellow-300/80" />
    case "image":   return <Image     {...props} className="text-blue-300/80" />
    case "folder":  return <Folder    {...props} className="text-amber-300/80" />
    default:        return <File      {...props} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FolderWindow
// ─────────────────────────────────────────────────────────────────────────────
function FolderWindow({ folderId, label, uid, onClose, onMinimize, isActive, onFocus }) {
  // ── Window drag ────────────────────────────────────────────────────
  const INITIAL = { x: 160, y: 80 }
  const [pos,     setPos]     = useState(INITIAL)
  const [size,    setSize]    = useState({ w: 680, h: 440 })
  const dragRef   = useRef({ active: false })
  const windowRef = useRef(null)

  const onTitlePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      active: true,
      startMX: e.clientX, startMY: e.clientY,
      startX:  pos.x,     startY:  pos.y,
    }
    onFocus()
  }, [pos, onFocus])

  const onTitlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startMX
    const dy = e.clientY - dragRef.current.startMY
    setPos({
      x: Math.max(0, dragRef.current.startX + dx),
      y: Math.max(0, dragRef.current.startY + dy),
    })
  }, [])

  const onTitlePointerUp = useCallback(() => {
    dragRef.current.active = false
  }, [])

  // ── Filesystem state ────────────────────────────────────────────────
  const [folders,  setFolders]  = useState([])
  const [files,    setFiles]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [viewMode, setViewMode] = useState("grid") // "grid" | "list"

  // Navigation stack: array of { folderId, label }
  const [navStack, setNavStack] = useState([{ folderId, label }])
  const current = navStack[navStack.length - 1]

  const loadContents = useCallback(async () => {
    if (!uid || !current.folderId) return
    setLoading(true)
    try {
      const [f, fi] = await Promise.all([
        getFolders(uid, current.folderId),
        getFiles(uid, current.folderId),
      ])
      setFolders(f)
      setFiles(fi)
    } catch (err) {
      console.error("CloudNova [FolderWindow] load:", err)
    } finally {
      setLoading(false)
    }
  }, [uid, current.folderId])

  useEffect(() => { loadContents() }, [loadContents])

  // ── Navigation ──────────────────────────────────────────────────────
  const openSubFolder = useCallback((subId, subLabel) => {
    setNavStack((prev) => [...prev, { folderId: subId, label: subLabel }])
  }, [])

  const goBack = useCallback(() => {
    setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  // ── Create new note inside this folder ─────────────────────────────
  const handleNewNote = useCallback(async () => {
    if (!uid) return
    const name = window.prompt("Note name:", "Untitled Note")
    if (!name?.trim()) return
    await createFile(uid, {
      name:     name.trim(),
      type:     "note",
      folderId: current.folderId,
      content:  "",
    })
    loadContents()
  }, [uid, current.folderId, loadContents])

  // ── Create sub-folder ────────────────────────────────────────────────
  const handleNewSubFolder = useCallback(async () => {
    if (!uid) return
    const name = window.prompt("Folder name:", "New Folder")
    if (!name?.trim()) return
    await createFolder(uid, name.trim(), current.folderId)
    loadContents()
  }, [uid, current.folderId, loadContents])

  const allItems = [
    ...folders.map((f) => ({ ...f, itemType: "folder" })),
    ...files.map((f)   => ({ ...f, itemType: f.type })),
  ]

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      ref={windowRef}
      className="absolute select-none"
      style={{
        left:   pos.x,
        top:    pos.y,
        width:  size.w,
        height: size.h,
        zIndex: isActive ? 50 : 40,
      }}
      onPointerDown={onFocus}
    >
      <div
        className="flex flex-col w-full h-full rounded-2xl overflow-hidden"
        style={{
          background:    "rgba(20, 20, 28, 0.82)",
          backdropFilter:         "blur(32px) saturate(1.5)",
          WebkitBackdropFilter:   "blur(32px) saturate(1.5)",
          border:     isActive
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: isActive
            ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06) inset"
            : "0 16px 48px rgba(0,0,0,0.4)",
          transition: "border 0.15s, box-shadow 0.15s",
        }}
      >
        {/* ── Title bar ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-default shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          onPointerDown={onTitlePointerDown}
          onPointerMove={onTitlePointerMove}
          onPointerUp={onTitlePointerUp}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <button
              className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-300 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onClose}
            />
            <button
              className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onMinimize}
            />
            {/* Green button — resize stub */}
            <button
              className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>

          {/* Back / forward */}
          <div className="flex items-center gap-1 ml-1">
            <button
              className={`p-1 rounded-md transition-colors ${
                navStack.length > 1
                  ? "text-white/60 hover:text-white hover:bg-white/10"
                  : "text-white/20 cursor-default"
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={goBack}
              disabled={navStack.length <= 1}
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Breadcrumb title */}
          <div className="flex-1 flex items-center gap-1 overflow-hidden">
            <Folder size={14} className="text-amber-300/80 shrink-0" />
            <span className="text-white/80 text-sm font-medium truncate">
              {navStack.map((n, i) => (
                <span key={n.folderId}>
                  {i > 0 && <span className="text-white/30 mx-1">/</span>}
                  <span
                    className={
                      i < navStack.length - 1
                        ? "text-white/40 hover:text-white/70 cursor-pointer transition-colors"
                        : "text-white/80"
                    }
                    onClick={() =>
                      i < navStack.length - 1 &&
                      setNavStack((prev) => prev.slice(0, i + 1))
                    }
                  >
                    {n.label}
                  </span>
                </span>
              ))}
            </span>
          </div>

          {/* Toolbar right */}
          <div className="flex items-center gap-1 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
            <button
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              onClick={loadContents}
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "text-white bg-white/15"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "text-white bg-white/15"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              <List size={13} />
            </button>
            <div
              className="w-px h-4 mx-1"
              style={{ background: "rgba(255,255,255,0.1)" }}
            />
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                         text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={handleNewNote}
              title="New note"
            >
              <Plus size={12} />
              Note
            </button>
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                         text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              onClick={handleNewSubFolder}
              title="New folder"
            >
              <Plus size={12} />
              Folder
            </button>
          </div>
        </div>

        {/* ── Sidebar + Content ─────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Sidebar */}
          <div
            className="w-36 shrink-0 flex flex-col gap-1 p-3"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-2">
              Favourites
            </p>
            {[
              { label: "This Folder", icon: <Folder size={13} className="text-amber-300/70" /> },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                           text-xs text-white/60 hover:text-white hover:bg-white/10
                           transition-colors text-left w-full"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <LoadingSkeleton viewMode={viewMode} />
            ) : allItems.length === 0 ? (
              <EmptyState onNewNote={handleNewNote} onNewFolder={handleNewSubFolder} />
            ) : viewMode === "grid" ? (
              <GridView
                items={allItems}
                onOpenFolder={openSubFolder}
              />
            ) : (
              <ListView
                items={allItems}
                onOpenFolder={openSubFolder}
              />
            )}
          </div>
        </div>

        {/* ── Status bar ────────────────────────────────────────── */}
        <div
          className="flex items-center px-4 py-1.5 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-[11px] text-white/30">
            {allItems.length} {allItems.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onNewNote, onNewFolder }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <Folder size={32} strokeWidth={1} className="text-white/20" />
      </div>
      <div>
        <p className="text-white/40 text-sm font-medium">This folder is empty</p>
        <p className="text-white/20 text-xs mt-1">Create a note or subfolder to get started</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Plus size={12} /> New Note
        </button>
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Plus size={12} /> New Folder
        </button>
      </div>
    </div>
  )
}

function GridView({ items, onOpenFolder }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
      {items.map((item) => (
        <button
          key={item.id}
          className="flex flex-col items-center gap-2 p-2 rounded-xl
                     hover:bg-white/10 active:bg-white/15 transition-colors
                     cursor-default text-center group"
          onDoubleClick={() =>
            item.itemType === "folder" && onOpenFolder(item.id, item.label)
          }
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl
                          group-hover:bg-white/5 transition-colors">
            <FileIcon type={item.itemType} size={36} />
          </div>
          <span className="text-[11px] text-white/70 group-hover:text-white
                           leading-tight max-w-full truncate transition-colors">
            {item.label ?? item.name}
          </span>
        </button>
      ))}
    </div>
  )
}

function ListView({ items, onOpenFolder }) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <button
          key={item.id}
          className="flex items-center gap-3 px-3 py-2 rounded-lg
                     hover:bg-white/10 active:bg-white/15 transition-colors
                     cursor-default text-left w-full group"
          onDoubleClick={() =>
            item.itemType === "folder" && onOpenFolder(item.id, item.label)
          }
        >
          <FileIcon type={item.itemType} size={18} />
          <span className="flex-1 text-xs text-white/70 group-hover:text-white
                           truncate transition-colors">
            {item.label ?? item.name}
          </span>
          <span className="text-[10px] text-white/25 shrink-0">
            {item.itemType}
          </span>
        </button>
      ))}
    </div>
  )
}

function LoadingSkeleton({ viewMode }) {
  const count = 6
  if (viewMode === "grid") {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))" }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-2 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-white/10" />
            <div className="w-14 h-2.5 rounded bg-white/10" />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
          <div className="w-4 h-4 rounded bg-white/10 shrink-0" />
          <div className="flex-1 h-2.5 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export default FolderWindow
