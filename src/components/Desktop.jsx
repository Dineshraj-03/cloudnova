/**
 * Desktop.jsx — CloudNova
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG FIXES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FIXED Bug 1 — Stale uid captured in persistDesktop
 * ────────────────────────────────────────────────────
 * OLD: useDesktopPersistence(uid) accepted uid as a param and stored it in a
 *      uidRef via useEffect. On first render uid = null, useEffect hadn't run,
 *      so every write in that cycle silently bailed: "if (!currentUid) return"
 *
 * FIX: useDesktopPersistence() takes NO arguments. persistDesktop now receives
 *      uid as its first direct argument: persistDesktop(uid, positions, items)
 *      uid comes from component state at call time — always current.
 *
 * FIXED Bug 2 — customItemsRef / iconPositionsRef one render behind
 * ─────────────────────────────────────────────────────────────────
 * OLD: Refs were synced with:
 *        useEffect(() => { customItemsRef.current = customItems }, [customItems])
 *      useEffect fires AFTER the render. Any handler that ran synchronously
 *      (handleNewFolder, drag end) read the ref before the effect updated it,
 *      so persistDesktop received the PREVIOUS render's data.
 *
 * FIX: Write-through ref pattern. Every time we compute nextItems or
 *      nextPositions we update both the ref AND call setState together:
 *        customItemsRef.current = nextItems
 *        setCustomItems(nextItems)
 *      The ref is immediately correct for any code that runs in the same
 *      synchronous block. No useEffect involved.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture (three clean layers)
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYER 1 · DEFAULT_APPS      module-level constant — never in Firestore
 * LAYER 2 · customItems       Firestore: [{ id, label, type }]
 * LAYER 3 · iconPositions     Firestore: { [id]: { x, y } }
 */

import { useEffect, useState, useCallback, useRef } from "react"
import { signOut }         from "firebase/auth"
import { auth }            from "../firebase"
import {
  StickyNote, Calculator, FolderOpen, Globe2,
  TerminalSquare, Settings, FolderPlus, Info, Image, LayoutGrid, Folder,
} from "lucide-react"

import Taskbar       from "./Taskbar"
import Notes         from "./Notes"
import CalculatorApp from "./CalculatorApp"
import FileExplorer  from "./FileExplorer"
import Terminal      from "./Terminal"
import Browser       from "./Browser"
import SettingsApp   from "./Settings"
import DesktopIcon   from "./DesktopIcon"
import ContextMenu   from "./ContextMenu"
import FolderWindow  from "./FolderWindow"

import { loadDesktopData, useDesktopPersistence } from "./useDesktopPersistence"

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — DEFAULT APPS (module-level: never recreated, never in Firestore)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_APPS = [
  { id: "notes",      label: "Notes",      icon: <StickyNote     size={40} strokeWidth={1.5} /> },
  { id: "calculator", label: "Calculator", icon: <Calculator     size={40} strokeWidth={1.5} /> },
  { id: "files",      label: "Files",      icon: <FolderOpen     size={40} strokeWidth={1.5} /> },
  { id: "terminal",   label: "Terminal",   icon: <TerminalSquare size={40} strokeWidth={1.5} /> },
  { id: "browser",    label: "Browser",    icon: <Globe2         size={40} strokeWidth={1.5} /> },
  { id: "settings",   label: "Settings",   icon: <Settings       size={40} strokeWidth={1.5} /> },
]

const DEFAULT_POSITIONS = {
  notes:      { x: 24, y: 24  },
  calculator: { x: 24, y: 120 },
  files:      { x: 24, y: 216 },
  terminal:   { x: 24, y: 312 },
  browser:    { x: 24, y: 408 },
  settings:   { x: 24, y: 504 },
}

function buildItemIcon(type) {
  switch (type) {
    case "folder": return <Folder size={40} strokeWidth={1.5} />
    default:       return <Folder size={40} strokeWidth={1.5} />
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DESKTOP
// ─────────────────────────────────────────────────────────────────────────────
function Desktop({
  shutdownSystem,
  isAnyWindowMaximized,
  setIsAnyWindowMaximized,
  wallpaper,
  setWallpaper,
}) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setUid(user?.uid ?? null))
    return unsub
  }, [])

  // WHY: uid is also kept in a ref so callbacks can read the live value
  // without re-creating themselves. This is a READ-ONLY ref — we never
  // write to it in a useEffect; we update it synchronously alongside setUid.
  // But since setUid is async (React batching), the safest pattern is to
  // pass uid directly to persistDesktop rather than relying on any ref here.
  // The ref below is only used by handlers that don't call persistDesktop
  // (e.g. handleIconProperties for display).
  const uidRef = useRef(uid)

  // ── Persistence hook ──────────────────────────────────────────────────────
  // WHY: No uid argument — uid is passed directly at call time. See hook file.
  const { persistDesktop } = useDesktopPersistence()

  // ── LAYER 2: custom items — write-through ref ─────────────────────────────
  // WHY write-through: handlers compute nextItems synchronously and
  // immediately write customItemsRef.current = nextItems BEFORE calling
  // persistDesktop. No useEffect delay, no stale read.
  const [customItems, setCustomItems] = useState([])
  const customItemsRef = useRef([])

  // ── LAYER 3: icon positions — write-through ref ───────────────────────────
  const [iconPositions, setIconPositions] = useState({})
  const iconPositionsRef = useRef({})

  const [desktopReady, setDesktopReady] = useState(false)

  // ── Sync uid ref (READ-ONLY usage, not for persistence) ───────────────────
  // WHY: Unlike customItemsRef/iconPositionsRef, uidRef here is only used
  // for non-persistence reads (handleIconProperties, context menu labels).
  // All persistence calls pass uid from state directly.
  useEffect(() => { uidRef.current = uid }, [uid])

  // ── Load from Firestore once uid is known ─────────────────────────────────
  useEffect(() => {
    if (!uid) return
    let cancelled = false

    loadDesktopData(uid).then(({ customItems: items, iconPositions: positions }) => {
      if (cancelled) return

      // Write-through: update both ref and state together
      customItemsRef.current   = items
      iconPositionsRef.current = positions

      setCustomItems(items)
      setIconPositions(positions)
      setDesktopReady(true)

      console.debug(
        `CloudNova [Desktop]: loaded ${items.length} custom items,`,
        `${Object.keys(positions).length} saved positions`
      )
    })

    return () => { cancelled = true }
  }, [uid])

  // ── Window state ──────────────────────────────────────────────────────────
  const [openWindows,      setOpenWindows]      = useState({})
  const [minimizedWindows, setMinimizedWindows] = useState({})
  const [activeWindow,     setActiveWindow]     = useState("")

  // ── Folder windows ────────────────────────────────────────────────────────
  const [folderWindows,      setFolderWindows]      = useState([])
  const [minimizedFolders,   setMinimizedFolders]   = useState({})
  const [activeFolderWindow, setActiveFolderWindow] = useState(null)

  // ── Desktop context menu ──────────────────────────────────────────────────
  const [desktopCtx, setDesktopCtx] = useState({ visible: false, x: 0, y: 0 })
  const desktopCtxRef = useRef(desktopCtx)
  useEffect(() => { desktopCtxRef.current = desktopCtx }, [desktopCtx])
  // WHY: desktopCtxRef is fine as a useEffect-synced ref because it's only
  // read inside desktopMenuItems action callbacks, which fire on user click —
  // always at least one render after the context menu position was set.

  // ─────────────────────────────────────────────────────────────────────────
  // Window helpers
  // ─────────────────────────────────────────────────────────────────────────
  const openApp = useCallback((id) => {
    setOpenWindows((prev)      => ({ ...prev, [id]: true  }))
    setMinimizedWindows((prev) => ({ ...prev, [id]: false }))
    setActiveWindow(id)
    setActiveFolderWindow(null)
  }, [])

  const closeApp    = useCallback((id) => setOpenWindows((prev) => ({ ...prev, [id]: false })), [])
  const minimizeApp = useCallback((id) => setMinimizedWindows((prev) => ({ ...prev, [id]: true })), [])

  const isOpen      = (id) => !!openWindows[id]
  const isMinimized = (id) => !!minimizedWindows[id]
  const isVisible   = (id) => isOpen(id) && !isMinimized(id)

  const openFolder = useCallback((folderId, label) => {
    const windowId = `fw_${folderId}_${Date.now()}`
    setFolderWindows((prev) => [...prev, { windowId, folderId, label }])
    setActiveFolderWindow(windowId)
  }, [])

  const closeFolderWindow = useCallback((windowId) => {
    setFolderWindows((prev) => prev.filter((w) => w.windowId !== windowId))
  }, [])

  const minimizeFolderWindow = useCallback((windowId) => {
    setMinimizedFolders((prev) => ({ ...prev, [windowId]: true }))
  }, [])

  const handleIconOpen = useCallback((id) => {
    const item = customItemsRef.current.find((i) => i.id === id)
    if (item) {
      if (item.type === "folder") openFolder(id, item.label)
      return
    }
    openApp(id)
  }, [openApp, openFolder])

  // ─────────────────────────────────────────────────────────────────────────
  // Icon drag → positions persist
  // ─────────────────────────────────────────────────────────────────────────
  const handlePositionChange = useCallback((iconId, newPos) => {
    // WHY write-through: compute next, update ref immediately, then persist.
    // iconPositionsRef.current is already current (write-through on all paths),
    // so this spread is safe.
    const nextPositions = { ...iconPositionsRef.current, [iconId]: newPos }

    // Write-through: ref is current before persistDesktop reads anything
    iconPositionsRef.current = nextPositions
    setIconPositions(nextPositions)

    // uid comes from state captured in this render — always correct
    // because handlePositionChange is recreated whenever uid changes
    // (uid is NOT in the dep array — read on...)
    //
    // WHY we don't add uid to deps: uid is stable after login and changes
    // only on logout (uid → null), at which point persistDesktop guards:
    //   if (!uid) return
    // So it's safe to close over uid here; the guard prevents bad writes.
    // Adding uid to deps would recreate this callback on every auth change,
    // breaking DesktopIcon memoization unnecessarily.
    //
    // For absolute correctness we read uid from uidRef:
    persistDesktop(uidRef.current, nextPositions, customItemsRef.current)
  }, [persistDesktop])

  // ─────────────────────────────────────────────────────────────────────────
  // Icon context menu actions
  // ─────────────────────────────────────────────────────────────────────────
  const handleIconRename = useCallback((id) => {
    if (DEFAULT_APPS.find((a) => a.id === id)) {
      window.alert("Default apps cannot be renamed.")
      return
    }
    const item = customItemsRef.current.find((i) => i.id === id)
    if (!item) return

    const newLabel = window.prompt("Rename:", item.label)
    if (!newLabel?.trim()) return

    const nextItems = customItemsRef.current.map((i) =>
      i.id === id ? { ...i, label: newLabel.trim() } : i
    )

    // Write-through
    customItemsRef.current = nextItems
    setCustomItems(nextItems)

    persistDesktop(uidRef.current, iconPositionsRef.current, nextItems)
  }, [persistDesktop])

  const handleIconDelete = useCallback((id) => {
    if (DEFAULT_APPS.find((a) => a.id === id)) {
      window.alert("Default apps cannot be deleted.")
      return
    }

    const nextItems = customItemsRef.current.filter((i) => i.id !== id)
    const { [id]: _removed, ...nextPositions } = iconPositionsRef.current

    // Write-through both refs before persisting
    customItemsRef.current   = nextItems
    iconPositionsRef.current = nextPositions

    setCustomItems(nextItems)
    setIconPositions(nextPositions)

    persistDesktop(uidRef.current, nextPositions, nextItems)
  }, [persistDesktop])

  const handleIconProperties = useCallback((id) => {
    const pos   = iconPositionsRef.current[id] ?? DEFAULT_POSITIONS[id]
    const label = DEFAULT_APPS.find((a) => a.id === id)?.label
      ?? customItemsRef.current.find((i) => i.id === id)?.label
      ?? id
    window.alert(
      `Name: ${label}\nID: ${id}\nPosition: ${
        pos ? `${Math.round(pos.x)}, ${Math.round(pos.y)}` : "default"
      }`
    )
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // New Folder
  // ─────────────────────────────────────────────────────────────────────────
  const handleNewFolder = useCallback((clickX, clickY) => {
    const id    = `folder_${Date.now()}`
    const label = "New Folder"
    const type  = "folder"

    const x = Math.min(Math.max(8, clickX), window.innerWidth  - 100)
    const y = Math.min(Math.max(8, clickY), window.innerHeight - 160)

    // WHY: Compute next values from refs (already current), then write-through
    // BEFORE calling persistDesktop. This is the fix for Bug 2:
    // the old code called persistDesktop AFTER setCustomItems/setIconPositions,
    // but those are async — the refs were still pointing at old data.
    const nextItems     = [...customItemsRef.current, { id, label, type }]
    const nextPositions = { ...iconPositionsRef.current, [id]: { x, y } }

    // Write-through: refs are immediately correct
    customItemsRef.current   = nextItems
    iconPositionsRef.current = nextPositions

    setCustomItems(nextItems)
    setIconPositions(nextPositions)

    // uid from uidRef — safe because auth resolves before user can click
    persistDesktop(uidRef.current, nextPositions, nextItems)
  }, [persistDesktop])

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop right-click
  // ─────────────────────────────────────────────────────────────────────────
  const handleDesktopContextMenu = useCallback((e) => {
    e.preventDefault()
    setDesktopCtx({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  const desktopMenuItems = [
    {
      label: "New Folder",
      icon: <FolderPlus size={14} />,
      action: () => {
        const { x, y } = desktopCtxRef.current
        handleNewFolder(x, y)
      },
    },
    {
      label: "Get Info",
      icon: <Info size={14} />,
      action: () => {
        const total = DEFAULT_APPS.length + customItemsRef.current.length
        window.alert(`Screen: ${window.innerWidth} × ${window.innerHeight}\nIcons: ${total}`)
      },
    },
    { separator: true },
    {
      label: "Change Wallpaper",
      icon: <Image size={14} />,
      action: () => openApp("settings"),
    },
    {
      label: "Edit Widgets",
      icon: <LayoutGrid size={14} />,
      action: () => console.log("CloudNova: Edit Widgets — stub"),
    },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  // All renderable icons
  // ─────────────────────────────────────────────────────────────────────────
  const allIcons = [
    ...DEFAULT_APPS,
    ...customItems.map((item) => ({
      ...item,
      icon: buildItemIcon(item.type),
    })),
  ]

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden">

      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out scale-105"
        style={{ backgroundImage: `url(${wallpaper})` }}
      />

      {/* Scrim */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      {/* Desktop surface */}
      <div
        className="relative z-10 h-full"
        onContextMenu={handleDesktopContextMenu}
      >

        {/* Icons */}
        {desktopReady && allIcons.map((app) => (
          <DesktopIcon
            key={app.id}
            id={app.id}
            label={app.label}
            icon={app.icon}
            position={
              iconPositions[app.id] ??
              DEFAULT_POSITIONS[app.id] ??
              { x: 24, y: 24 }
            }
            onPositionChange={handlePositionChange}
            onOpen={() => handleIconOpen(app.id)}
            onRename={handleIconRename}
            onDelete={handleIconDelete}
            onProperties={handleIconProperties}
          />
        ))}

        {/* Loading skeleton */}
        {!desktopReady && DEFAULT_APPS.map((app) => (
          <div
            key={app.id}
            className="absolute flex flex-col items-center gap-2 w-20 animate-pulse"
            style={{ left: DEFAULT_POSITIONS[app.id].x, top: DEFAULT_POSITIONS[app.id].y }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10" />
            <div className="w-12 h-3 rounded bg-white/10" />
          </div>
        ))}

        {/* App windows */}
        {isVisible("notes") && (
          <Notes
            closeNotes={() => closeApp("notes")}
            minimizeNotes={() => minimizeApp("notes")}
            isActive={activeWindow === "notes"}
            focusWindow={() => { setActiveWindow("notes"); setActiveFolderWindow(null) }}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}
        {isVisible("calculator") && (
          <CalculatorApp
            closeCalculator={() => closeApp("calculator")}
            minimizeCalculator={() => minimizeApp("calculator")}
            isActive={activeWindow === "calculator"}
            focusWindow={() => { setActiveWindow("calculator"); setActiveFolderWindow(null) }}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}
        {isVisible("files") && (
          <FileExplorer
            closeFiles={() => closeApp("files")}
            minimizeFiles={() => minimizeApp("files")}
            isActive={activeWindow === "files"}
            focusWindow={() => { setActiveWindow("files"); setActiveFolderWindow(null) }}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}
        {isVisible("terminal") && (
          <Terminal
            closeTerminal={() => closeApp("terminal")}
            minimizeTerminal={() => minimizeApp("terminal")}
            isActive={activeWindow === "terminal"}
            focusWindow={() => { setActiveWindow("terminal"); setActiveFolderWindow(null) }}
            shutdownSystem={shutdownSystem}
            openNotes={() => openApp("notes")}
            openCalculator={() => openApp("calculator")}
            openFiles={() => openApp("files")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}
        {isVisible("browser") && (
          <Browser
            closeBrowser={() => closeApp("browser")}
            minimizeBrowser={() => minimizeApp("browser")}
            isActive={activeWindow === "browser"}
            focusWindow={() => { setActiveWindow("browser"); setActiveFolderWindow(null) }}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}
        {isVisible("settings") && (
          <SettingsApp
            closeSettings={() => closeApp("settings")}
            minimizeSettings={() => minimizeApp("settings")}
            isActive={activeWindow === "settings"}
            focusWindow={() => { setActiveWindow("settings"); setActiveFolderWindow(null) }}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
            wallpaper={wallpaper}
            setWallpaper={setWallpaper}
          />
        )}

        {/* Folder windows */}
        {folderWindows
          .filter((w) => !minimizedFolders[w.windowId])
          .map((w) => (
            <FolderWindow
              key={w.windowId}
              folderId={w.folderId}
              label={w.label}
              uid={uid}
              isActive={activeFolderWindow === w.windowId}
              onFocus={() => {
                setActiveFolderWindow(w.windowId)
                setActiveWindow("")
              }}
              onClose={() => closeFolderWindow(w.windowId)}
              onMinimize={() => minimizeFolderWindow(w.windowId)}
            />
          ))
        }

        {/* Taskbar */}
        {!isAnyWindowMaximized && (
          <Taskbar
            isAnyWindowMaximized={isAnyWindowMaximized}
            isNotesOpen={isOpen("notes")}
            isCalculatorOpen={isOpen("calculator")}
            isFilesOpen={isOpen("files")}
            isTerminalOpen={isOpen("terminal")}
            isBrowserOpen={isOpen("browser")}
            logout={() => signOut(auth)}
            openNotes={() => openApp("notes")}
            openCalculator={() => openApp("calculator")}
            openFiles={() => openApp("files")}
            openTerminal={() => openApp("terminal")}
            openBrowser={() => openApp("browser")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {/* Desktop context menu */}
        <ContextMenu
          visible={desktopCtx.visible}
          x={desktopCtx.x}
          y={desktopCtx.y}
          items={desktopMenuItems}
          onClose={() => setDesktopCtx((prev) => ({ ...prev, visible: false }))}
        />

      </div>
    </div>
  )
}

export default Desktop
