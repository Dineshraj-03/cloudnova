/**
 * FolderWindow.jsx — CloudNova
 *
 * Phases 2–5: macOS Finder-style folder window.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES (this revision)
 * ─────────────────────────────────────────────────────────────────────────────
 * Fix 1 — Toolbar UploadButton
 *   The hidden <input> is now rendered directly in FolderWindow with a stable
 *   id ("upload-input-{folderId}") and a ref (uploadInputRef).
 *   UploadButton no longer owns its own input; it receives a plain onClick
 *   prop and just triggers uploadInputRef.current.click().
 *   This sidesteps any pointer-capture / stop-propagation concern entirely.
 *
 * Fix 2 — Sidebar Upload button
 *   Now also calls uploadInputRef.current?.click() — the same real input —
 *   instead of the broken document.getElementById lookup that previously
 *   targeted a non-existent id.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef, useCallback } from "react"
import {
  Folder,
  Plus,
  RefreshCw,
  ChevronLeft,
  LayoutGrid,
  List,
  Upload,
} from "lucide-react"

import { useFolderContents }  from "./hooks/useFolderContents"
import { useFileUpload }      from "./hooks/useFileUpload"
import { FileCard }           from "./FileCard"
import {
  DropOverlay,
  UploadProgressPanel,
  UploadButton,
}                             from "./UploadZone"
import ImageViewer            from "./viewers/ImageViewer"
import PDFViewer              from "./viewers/PDFViewer"
import VideoPlayer            from "./viewers/VideoPlayer"
import {
  createFile,
  createFolder,
  renameFile,
  renameFolder,
  deleteFile,
  deleteFolder,
} from "./filesystem"

// ─────────────────────────────────────────────────────────────────────────────
// FolderWindow
// ─────────────────────────────────────────────────────────────────────────────
function FolderWindow({
  folderId,
  label,
  uid,
  onClose,
  onMinimize,
  isActive,
  onFocus,
  setIsAnyWindowMaximized,
}) {
  // ── Window drag ────────────────────────────────────────────────────────────
  const INITIAL = { x: 160, y: 80 }
  const [pos,  setPos]  = useState(INITIAL)
  const dragRef         = useRef({ active: false })

  const onTitlePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = {
      active:  true,
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

  // ── View state ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("grid") // "grid" | "list"

  // ── Navigation stack: [{ folderId, label }, ...] ───────────────────────────
  const [navStack, setNavStack] = useState([{ folderId, label }])
  const current = navStack[navStack.length - 1]

  // ── Folder contents ────────────────────────────────────────────────────────
  const { allItems, loading, reload } = useFolderContents(uid, current.folderId)

  // ── File upload ────────────────────────────────────────────────────────────
  const { uploads, uploadFiles, cancelUpload, clearCompleted } = useFileUpload(
    uid,
    current.folderId,
    reload
  )

  // ── Single shared hidden file input ───────────────────────────────────────
  // FIX 1 + FIX 2: one <input> owned here, triggered by both the toolbar
  // UploadButton and the sidebar shortcut. UploadButton.jsx no longer needs
  // to manage its own input; it accepts an onClick prop instead.
  const uploadInputRef = useRef(null)

  const triggerUploadInput = useCallback(() => {
    uploadInputRef.current?.click()
  }, [])

  const handleUploadInputChange = useCallback((e) => {
    if (e.target.files?.length) {
      uploadFiles(e.target.files)
      // Reset so the same file(s) can be re-selected immediately
      e.target.value = ""
    }
  }, [uploadFiles])

  // ── Drag-and-drop onto window ───────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current += 1
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current -= 1
    if (dragCounter.current === 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files?.length) uploadFiles(files)
  }, [uploadFiles])

  // ── Open viewer windows ────────────────────────────────────────────────────
  const [openViewers, setOpenViewers] = useState([])
  const [activeViewer, setActiveViewer] = useState(null)

  const openFile = useCallback((item) => {
    if (item.itemType === "folder") {
      setNavStack((prev) => [...prev, { folderId: item.id, label: item.label }])
      return
    }

    if (item.itemType === "note") {
      const newContent = window.prompt(`Edit note: ${item.name}`, item.content ?? "")
      if (newContent !== null) {
        import("./filesystem").then(({ updateFileContent }) => {
          updateFileContent(uid, item.id, newContent).then(reload)
        })
      }
      return
    }

    const viewerId = `viewer_${item.id}_${Date.now()}`
    setOpenViewers((prev) => [...prev, { id: viewerId, type: item.itemType, file: item }])
    setActiveViewer(viewerId)
  }, [uid, reload])

  const closeViewer = useCallback((viewerId) => {
    setOpenViewers((prev) => prev.filter((v) => v.id !== viewerId))
  }, [])

  // ── Item rename ────────────────────────────────────────────────────────────
  const handleRename = useCallback(async (item) => {
    const currentName = item.label ?? item.name ?? ""
    const newName = window.prompt("Rename:", currentName)
    if (!newName?.trim() || newName.trim() === currentName) return

    if (item.itemType === "folder") {
      await renameFolder(uid, item.id, newName.trim())
    } else {
      await renameFile(uid, item.id, newName.trim())
    }
    reload()
  }, [uid, reload])

  // ── Item delete ────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (item) => {
    const name = item.label ?? item.name ?? "this item"
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return

    if (item.itemType === "folder") {
      await deleteFolder(uid, item.id)
    } else {
      await deleteFile(uid, item.id, item.storagePath ?? null)
    }
    reload()
  }, [uid, reload])

  // ── Create new note ────────────────────────────────────────────────────────
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
    reload()
  }, [uid, current.folderId, reload])

  // ── Create sub-folder ──────────────────────────────────────────────────────
  const handleNewSubFolder = useCallback(async () => {
    if (!uid) return
    const name = window.prompt("Folder name:", "New Folder")
    if (!name?.trim()) return
    await createFolder(uid, name.trim(), current.folderId)
    reload()
  }, [uid, current.folderId, reload])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goBack = useCallback(() => {
    setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
        Single shared hidden file input.
        Both the toolbar UploadButton and the sidebar shortcut call
        triggerUploadInput(), which resolves to this element.
        Placed outside the window div so pointer-capture on the title bar
        cannot interfere with it.
      */}
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={handleUploadInputChange}
      />

      {/* ── Folder window ────────────────────────────────────────────────── */}
      <div
        className="absolute select-none"
        style={{
          left:   pos.x,
          top:    pos.y,
          width:  680,
          height: 480,
          zIndex: isActive ? 50 : 40,
        }}
        onPointerDown={onFocus}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className="flex flex-col w-full h-full rounded-2xl overflow-hidden relative"
          style={{
            background:           "rgba(20, 20, 28, 0.82)",
            backdropFilter:       "blur(32px) saturate(1.5)",
            WebkitBackdropFilter: "blur(32px) saturate(1.5)",
            border: isActive
              ? "1px solid rgba(255,255,255,0.18)"
              : "1px solid rgba(255,255,255,0.08)",
            boxShadow: isActive
              ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06) inset"
              : "0 16px 48px rgba(0,0,0,0.4)",
            transition: "border 0.15s, box-shadow 0.15s",
          }}
        >
          {/* ── Drop overlay ───────────────────────────────────────────── */}
          <DropOverlay
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          {/* ── Title bar ─────────────────────────────────────────────── */}
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
              <button
                className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-300 transition-colors"
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>

            {/* Back button */}
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

            {/* Breadcrumb */}
            <div className="flex-1 flex items-center gap-1 overflow-hidden">
              <Folder size={14} className="text-amber-300/80 shrink-0" />
              <span className="text-white/80 text-sm font-medium truncate">
                {navStack.map((n, i) => (
                  <span key={`${n.folderId}_${i}`}>
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
            <div
              className="flex items-center gap-1 shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                onClick={reload}
                title="Refresh"
              >
                <RefreshCw size={13} />
              </button>

              {/* View toggle */}
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

              <div className="w-px h-4 mx-1" style={{ background: "rgba(255,255,255,0.1)" }} />

              {/*
                FIX 1: UploadButton now receives onClick instead of onFiles.
                It no longer manages its own hidden input — triggerUploadInput
                points at the single shared input declared above.
              */}
              <UploadButton onClick={triggerUploadInput} />

              {/* New note */}
              <button
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium
                           text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                onClick={handleNewNote}
                title="New note"
              >
                <Plus size={12} />
                Note
              </button>

              {/* New folder */}
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

          {/* ── Sidebar + Content ─────────────────────────────────────── */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div
              className="w-36 shrink-0 flex flex-col gap-1 p-3"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1 px-2">
                Favourites
              </p>
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                           text-xs text-white/60 hover:text-white hover:bg-white/10
                           transition-colors text-left w-full"
                onClick={() => setNavStack([{ folderId, label }])}
              >
                <Folder size={13} className="text-amber-300/70" />
                {label}
              </button>

              {/*
                FIX 2: calls triggerUploadInput() — the same ref-based handler
                used by the toolbar button — instead of the broken
                document.getElementById lookup.
              */}
              <button
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                           text-xs text-white/40 hover:text-white/70 hover:bg-white/10
                           transition-colors text-left w-full mt-auto"
                onClick={triggerUploadInput}
              >
                <Upload size={13} />
                Upload
              </button>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <LoadingSkeleton viewMode={viewMode} />
              ) : allItems.length === 0 ? (
                <EmptyState
                  onNewNote={handleNewNote}
                  onNewFolder={handleNewSubFolder}
                  onUpload={triggerUploadInput}
                />
              ) : viewMode === "grid" ? (
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}
                >
                  {allItems.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      viewMode="grid"
                      onOpen={openFile}
                      onRename={handleRename}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {/* List header */}
                  <div className="flex items-center gap-3 px-3 py-1.5 mb-1">
                    <div className="w-8 shrink-0" />
                    <span className="flex-1 text-[10px] font-semibold text-white/25 uppercase tracking-wider">Name</span>
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider w-16 text-right">Type</span>
                    <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider w-16 text-right">Size</span>
                  </div>
                  {allItems.map((item) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      viewMode="list"
                      onOpen={openFile}
                      onRename={handleRename}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Upload progress panel ──────────────────────────────────── */}
          <UploadProgressPanel
            uploads={uploads}
            onCancel={cancelUpload}
            onClear={clearCompleted}
          />

          {/* ── Status bar ─────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-4 py-1.5 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[11px] text-white/30">
              {allItems.length} {allItems.length === 1 ? "item" : "items"}
            </span>
            {uploads.filter((u) => u.status === "uploading").length > 0 && (
              <span className="text-[11px] text-blue-400/70">
                Uploading {uploads.filter((u) => u.status === "uploading").length} file(s)…
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Viewer windows ────────────────────────────────────────────── */}
      {openViewers.map((viewer) => {
        const commonProps = {
          key:                    viewer.id,
          file:                   viewer.file,
          onClose:                () => closeViewer(viewer.id),
          onMinimize:             () => closeViewer(viewer.id),
          isActive:               activeViewer === viewer.id,
          focusWindow:            () => setActiveViewer(viewer.id),
          setIsAnyWindowMaximized,
        }

        switch (viewer.type) {
          case "image":
            return <ImageViewer {...commonProps} />
          case "pdf":
            return <PDFViewer {...commonProps} />
          case "video":
            return <VideoPlayer {...commonProps} />
          default:
            return null
        }
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (loading / empty)
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ onNewNote, onNewFolder, onUpload }) {
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
        <p className="text-white/20 text-xs mt-1">
          Create a note, subfolder, or upload files
        </p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
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
        <button
          onClick={onUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                     text-white/60 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Upload size={12} /> Upload File
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton({ viewMode }) {
  const count = 6
  if (viewMode === "grid") {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))" }}>
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
          <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0" />
          <div className="flex-1 h-2.5 rounded bg-white/10" />
          <div className="w-12 h-2 rounded bg-white/8" />
        </div>
      ))}
    </div>
  )
}

export default FolderWindow
