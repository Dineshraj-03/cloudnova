import { useEffect, useState, useCallback, useRef } from "react"
import { signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import {
  StickyNote,
  Calculator,
  FolderOpen,
  Globe2,
  TerminalSquare,
  Settings,
  FolderPlus,
  Info,
  Image,
  LayoutGrid,
} from "lucide-react"

import Taskbar from "./Taskbar"
import Notes from "./Notes"
import CalculatorApp from "./CalculatorApp"
import FileExplorer from "./FileExplorer"
import Terminal from "./Terminal"
import Browser from "./Browser"
import SettingsApp from "./Settings"
import DesktopIcon from "./DesktopIcon"
import ContextMenu from "./ContextMenu.jsx"

// ─────────────────────────────────────────────────────────────────────────────
// Default icon layout
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_POSITIONS = {
  notes:      { x: 24, y: 24  },
  calculator: { x: 24, y: 120 },
  files:      { x: 24, y: 216 },
  terminal:   { x: 24, y: 312 },
  browser:    { x: 24, y: 408 },
  settings:   { x: 24, y: 504 },
}

// ─────────────────────────────────────────────────────────────────────────────
// Firestore helpers
// ─────────────────────────────────────────────────────────────────────────────
async function loadIconPositions(uid) {
  try {
    const ref = doc(db, "usersettings", uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      const data = snap.data()
      if (data.iconPositions) {
        return { ...DEFAULT_POSITIONS, ...data.iconPositions }
      }
    }
  } catch (err) {
    console.error("CloudNova: failed to load icon positions", err)
  }
  return { ...DEFAULT_POSITIONS }
}

function useDebouncedSave(delay = 800) {
  const timer = useRef(null)
  return useCallback(
    (uid, positions) => {
      if (!uid) return
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        try {
          const ref = doc(db, "usersettings", uid)
          await setDoc(ref, { iconPositions: positions }, { merge: true })
        } catch (err) {
          console.error("CloudNova: failed to save icon positions", err)
        }
      }, delay)
    },
    [delay]
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop
// ─────────────────────────────────────────────────────────────────────────────
function Desktop({
  shutdownSystem,
  isAnyWindowMaximized,
  setIsAnyWindowMaximized,
  wallpaper,
  setWallpaper,
}) {
  // ── window open/minimized state ─────────────────────────────────
  const [isNotesOpen,      setIsNotesOpen]      = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isFilesOpen,      setIsFilesOpen]      = useState(false)
  const [isTerminalOpen,   setIsTerminalOpen]   = useState(false)
  const [isBrowserOpen,    setIsBrowserOpen]    = useState(false)
  const [isSettingsOpen,   setIsSettingsOpen]   = useState(false)

  const [isNotesMinimized,      setIsNotesMinimized]      = useState(false)
  const [isCalculatorMinimized, setIsCalculatorMinimized] = useState(false)
  const [isFilesMinimized,      setIsFilesMinimized]      = useState(false)
  const [isTerminalMinimized,   setIsTerminalMinimized]   = useState(false)
  const [isBrowserMinimized,    setIsBrowserMinimized]    = useState(false)
  const [isSettingsMinimized,   setIsSettingsMinimized]   = useState(false)

  const [activeWindow, setActiveWindow] = useState("")

  // ── icon positions ──────────────────────────────────────────────
  const [iconPositions, setIconPositions] = useState(DEFAULT_POSITIONS)
  const [positionsLoaded, setPosLoaded]   = useState(false)
  const [uid, setUid]                     = useState(null)
  const savePositions                     = useDebouncedSave(800)

  // ── desktop context menu state ──────────────────────────────────
  const [desktopCtx, setDesktopCtx] = useState({ visible: false, x: 0, y: 0 })
    // ── app definitions ─────────────────────────────────────────────
const DEFAULT_APPS = [
  {
    id: "notes",
    label: "Notes",
    icon: (
      <StickyNote
        size={40}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: "calculator",
    label: "Calculator",
    icon: (
      <Calculator
        size={40}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: "files",
    label: "Files",
    icon: (
      <FolderOpen
        size={40}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: "terminal",
    label: "Terminal",
    icon: (
      <TerminalSquare
        size={40}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: "browser",
    label: "Browser",
    icon: (
      <Globe2
        size={40}
        strokeWidth={1.5}
      />
    ),
  },

  {
    id: "settings",
    label: "Settings",
    icon: (
      <Settings
        size={40}
        strokeWidth={1.5}
      />
    ),
  },
]
const [apps, setApps] =
  useState(DEFAULT_APPS)

  // ── rename / properties / delete state (stubs ready for your impl) ──
  const [renamingId, setRenamingId] = useState(null) // extend as needed

  // ── resolve uid ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user ? user.uid : null)
    })
    return unsub
  }, [])
  useEffect(() => {

  if (!uid) return

  const loadApps = async () => {

    const ref =
      doc(db, "usersettings", uid)

    const snap =
      await getDoc(ref)

    if (!snap.exists()) return

    const data = snap.data()

    if (data.apps) {

      const mergedApps = [

  ...DEFAULT_APPS,

  ...data.apps.filter(
    (app) =>
      app.id.startsWith("folder_")
  ),

]

setApps(

  mergedApps.map((app) => ({

    ...app,

    icon:
      app.id.startsWith("folder_")
        ? (
            <FolderOpen
              size={40}
              strokeWidth={1.5}
            />
          )
        : DEFAULT_APPS.find(
            (a) => a.id === app.id
          )?.icon,

  }))

)

    }

  }

  loadApps()

}, [uid])

  // ── load icon positions ─────────────────────────────────────────
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    loadIconPositions(uid).then((positions) => {
      if (!cancelled) {
        setIconPositions(positions)
        setPosLoaded(true)
      }
    })
    return () => { cancelled = true }
  }, [uid])

  // ── icon drag → Firestore ───────────────────────────────────────
  const handlePositionChange = useCallback(
    (iconId, newPos) => {
      setIconPositions((prev) => {
        const updated = { ...prev, [iconId]: newPos }
        savePositions(uid, updated)
        return updated
      })
    },
    [uid, savePositions]
  )

  // ── open app helper ─────────────────────────────────────────────
  const openApp = useCallback((name) => {
    if (name.startsWith("folder_")) {

    alert("Folder opened")

    return

  }
    const map = {
      notes:      () => { setIsNotesOpen(true);      setIsNotesMinimized(false);      setActiveWindow("notes")      },
      calculator: () => { setIsCalculatorOpen(true); setIsCalculatorMinimized(false); setActiveWindow("calculator") },
      files:      () => { setIsFilesOpen(true);      setIsFilesMinimized(false);      setActiveWindow("files")      },
      terminal:   () => { setIsTerminalOpen(true);   setIsTerminalMinimized(false);   setActiveWindow("terminal")   },
      browser:    () => { setIsBrowserOpen(true);    setIsBrowserMinimized(false);    setActiveWindow("browser")    },
      settings:   () => { setIsSettingsOpen(true);   setIsSettingsMinimized(false);   setActiveWindow("settings")   },
    }
    map[name]?.()
  }, [])

  // ── icon context menu handlers ──────────────────────────────────
const handleIconRename = useCallback((id) => {

  const currentApp =
    apps.find(
      (app) => app.id === id
    )

  if (!currentApp) return

  const newLabel =
    window.prompt(
      "Rename icon:",
      currentApp.label
    )

  if (
    !newLabel ||
    !newLabel.trim()
  ) return

  setApps((prev) =>
    prev.map((app) => {

      if (app.id === id) {

        return {
          ...app,
          label:
            newLabel.trim(),
        }

      }

      return app

    })
  )

}, [apps])

  const handleIconDelete = useCallback((id) => {
    // Stub: wire up to your delete logic (remove from iconPositions / Firestore)
    console.log("Delete icon:", id)
    // Example: hide the icon by removing its position entry
    setIconPositions((prev) => {
      const updated = { ...prev }
      delete updated[id]
      savePositions(uid, updated)
      return updated
    })
  }, [uid, savePositions])

  const handleIconProperties = useCallback((id) => {
    // Stub: open a Properties dialog
    console.log("Properties:", id)
    // You can open a modal here, e.g. setPropertiesTarget(id)
    window.alert(`Properties for: ${id}\nPosition: ${JSON.stringify(iconPositions[id])}`)
  }, [iconPositions])

  // ── desktop right-click → show desktop context menu ─────────────
  // Only fires when clicking the desktop surface itself (not on icons,
  // because DesktopIcon calls e.stopPropagation() on its onContextMenu).
  const handleDesktopContextMenu = useCallback((e) => {
    e.preventDefault()
    // Close any already-open menu before opening a new one
    setDesktopCtx({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  // ── desktop menu items ──────────────────────────────────────────
  const desktopMenuItems = [
    {
      label: "New Folder",
      icon: <FolderPlus size={14} />,
      action: async () => {

  const newId =
    `folder_${Date.now()}`

  const newPos = {
    x: desktopCtx.x,
    y: desktopCtx.y,
  }

  const updatedApps = [
  ...apps,
  {
    id: newId,
    label: "New Folder",
  },
]

setApps(
  updatedApps.map((app) => ({
    ...app,
    icon:
      app.id.startsWith("folder_")
        ? (
            <FolderOpen
              size={40}
              strokeWidth={1.5}
            />
          )
        : app.icon,
  }))
)

await setDoc(
  doc(db, "usersettings", uid),
  {
    apps: updatedApps.map(
      ({ icon, ...rest }) => rest
    ),
  },
  { merge: true }
)

  setIconPositions((prev) => {

    const updated = {
      ...prev,
      [newId]: newPos,
    }

    savePositions(uid, updated)

    return updated

  })

},
    },
    {
      label: "Get Info",
      icon: <Info size={14} />,
      action: async () => {
        // Stub: show desktop info
        console.log("Get Info")
        const screenInfo = `Screen: ${window.innerWidth} × ${window.innerHeight}\nIcons: ${Object.keys(iconPositions).length}`
        window.alert(screenInfo)
      },
    },
    { separator: true },
    {
      label: "Change Wallpaper",
      icon: <Image size={14} />,
      action: () => {
        // Opens the Settings app on the Wallpaper tab
        openApp("settings")
      },
    },
    {
      label: "Edit Widgets",
      icon: <LayoutGrid size={14} />,
      action: () => {
        // Stub: open widget editor
        console.log("Edit Widgets")
      },
    },
  ]



  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 overflow-hidden">

      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out scale-105"
        style={{ backgroundImage: `url(${wallpaper})` }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

      {/* Desktop surface
          onContextMenu here fires ONLY when the target is the desktop itself,
          because DesktopIcon calls e.stopPropagation() on its own onContextMenu.
      */}
      <div
        className="relative z-10 h-full"
        onContextMenu={handleDesktopContextMenu}
      >

        {/* ── Draggable desktop icons ──────────────────────────── */}
        {positionsLoaded && apps.map((app) => (
          <DesktopIcon
            key={app.id}
            id={app.id}
            label={app.label}
            icon={app.icon}
            position={
  iconPositions[app.id] ??
  DEFAULT_POSITIONS[app.id] ?? {
    x: 100,
    y: 100,
  }
}
            onPositionChange={handlePositionChange}
            onOpen={() => openApp(app.id)}
            onRename={handleIconRename}
            onDelete={handleIconDelete}
            onProperties={handleIconProperties}
          />
        ))}

        {/* Skeleton while positions load */}
        {!positionsLoaded && apps.map((app) => (
          <div
            key={app.id}
            className="absolute flex flex-col items-center gap-2 w-20 animate-pulse"
            style={{ left: DEFAULT_POSITIONS[app.id].x, top: DEFAULT_POSITIONS[app.id].y }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white/10" />
            <div className="w-12 h-3 rounded bg-white/10" />
          </div>
        ))}

        {/* ── App windows ─────────────────────────────────────── */}
        {isNotesOpen && !isNotesMinimized && (
          <Notes
            closeNotes={() => setIsNotesOpen(false)}
            minimizeNotes={() => setIsNotesMinimized(true)}
            isActive={activeWindow === "notes"}
            focusWindow={() => setActiveWindow("notes")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {isCalculatorOpen && !isCalculatorMinimized && (
          <CalculatorApp
            closeCalculator={() => setIsCalculatorOpen(false)}
            minimizeCalculator={() => setIsCalculatorMinimized(true)}
            isActive={activeWindow === "calculator"}
            focusWindow={() => setActiveWindow("calculator")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {isFilesOpen && !isFilesMinimized && (
          <FileExplorer
            closeFiles={() => setIsFilesOpen(false)}
            minimizeFiles={() => setIsFilesMinimized(true)}
            isActive={activeWindow === "files"}
            focusWindow={() => setActiveWindow("files")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {isTerminalOpen && !isTerminalMinimized && (
          <Terminal
            closeTerminal={() => setIsTerminalOpen(false)}
            minimizeTerminal={() => setIsTerminalMinimized(true)}
            isActive={activeWindow === "terminal"}
            focusWindow={() => setActiveWindow("terminal")}
            shutdownSystem={shutdownSystem}
            openNotes={() => openApp("notes")}
            openCalculator={() => openApp("calculator")}
            openFiles={() => openApp("files")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {isBrowserOpen && !isBrowserMinimized && (
          <Browser
            closeBrowser={() => setIsBrowserOpen(false)}
            minimizeBrowser={() => setIsBrowserMinimized(true)}
            isActive={activeWindow === "browser"}
            focusWindow={() => setActiveWindow("browser")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {isSettingsOpen && !isSettingsMinimized && (
          <SettingsApp
            closeSettings={() => setIsSettingsOpen(false)}
            minimizeSettings={() => setIsSettingsMinimized(true)}
            isActive={activeWindow === "settings"}
            focusWindow={() => setActiveWindow("settings")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
            wallpaper={wallpaper}
            setWallpaper={setWallpaper}
          />
        )}

        {/* ── Taskbar / Dock ───────────────────────────────────── */}
        {!isAnyWindowMaximized && (
          <Taskbar
            isAnyWindowMaximized={isAnyWindowMaximized}
            isNotesOpen={isNotesOpen}
            isCalculatorOpen={isCalculatorOpen}
            isFilesOpen={isFilesOpen}
            isTerminalOpen={isTerminalOpen}
            isBrowserOpen={isBrowserOpen}
            logout={() => signOut(auth)}
            openNotes={() => openApp("notes")}
            openCalculator={() => openApp("calculator")}
            openFiles={() => openApp("files")}
            openTerminal={() => openApp("terminal")}
            openBrowser={() => openApp("browser")}
            setIsAnyWindowMaximized={setIsAnyWindowMaximized}
          />
        )}

        {/* ── Desktop context menu ─────────────────────────────── */}
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
