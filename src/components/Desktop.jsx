import { useEffect, useState, useCallback, useRef } from "react"
import { signOut } from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase"           // ← make sure db is exported from your firebase.js
import {
  StickyNote,
  Calculator,
  FolderOpen,
  Globe2,
  TerminalSquare,
  Settings,
} from "lucide-react"

import Taskbar from "./Taskbar"
import Notes from "./Notes"
import CalculatorApp from "./CalculatorApp"
import FileExplorer from "./FileExplorer"
import Terminal from "./Terminal"
import Browser from "./Browser"
import SettingsApp from "./Settings"
import DesktopIcon from "./DesktopIcon"

// ─────────────────────────────────────────────────────────────────────────────
// Default icon layout (column on the left, macOS-style)
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
        // Merge with defaults so new icons always have a fallback position
        return { ...DEFAULT_POSITIONS, ...data.iconPositions }
      }
    }
  } catch (err) {
    console.error("CloudNova: failed to load icon positions", err)
  }
  return { ...DEFAULT_POSITIONS }
}

// Debounce helper — saves at most once every `delay` ms per drag session
function useDebouncedSave(delay = 800) {
  const timer = useRef(null)
  return useCallback((uid, positions) => {
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
  }, [delay])
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

  // current user uid (resolved once auth state is known)
  const [uid, setUid] = useState(null)

  const savePositions = useDebouncedSave(800)

  // ── resolve uid from Firebase Auth ─────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setUid(user ? user.uid : null)
    })
    return unsub
  }, [])

  // ── load positions from Firestore when uid is known ─────────────
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

  // ── called by DesktopIcon after each drag ends ──────────────────
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

  // ── open app helpers ────────────────────────────────────────────
  const openApp = useCallback((name) => {
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

  // ── app definitions ─────────────────────────────────────────────
  const apps = [
    { id: "notes",      label: "Notes",      icon: <StickyNote    size={40} strokeWidth={1.5} /> },
    { id: "calculator", label: "Calculator", icon: <Calculator    size={40} strokeWidth={1.5} /> },
    { id: "files",      label: "Files",      icon: <FolderOpen    size={40} strokeWidth={1.5} /> },
    { id: "terminal",   label: "Terminal",   icon: <TerminalSquare size={40} strokeWidth={1.5} /> },
    { id: "browser",    label: "Browser",    icon: <Globe2        size={40} strokeWidth={1.5} /> },
    { id: "settings",   label: "Settings",   icon: <Settings      size={40} strokeWidth={1.5} /> },
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

      {/* Desktop surface */}
      <div
  className="relative z-10 h-full"
  onContextMenu={(e) => e.preventDefault()}
>

        {/* ── Draggable desktop icons ──────────────────────────── */}
        {/*
            We only render icons once positions have loaded from Firestore,
            so they never flash at default positions first.
        */}
        {positionsLoaded && apps.map((app) => (
          <DesktopIcon
            key={app.id}
            id={app.id}
            label={app.label}
            icon={app.icon}
            position={iconPositions[app.id] ?? DEFAULT_POSITIONS[app.id]}
            onPositionChange={handlePositionChange}
            onOpen={() => openApp(app.id)}
          />
        ))}

        {/* Skeleton / loading shimmer while positions are loading */}
        {!positionsLoaded && apps.map((app, i) => (
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

      </div>
    </div>
  )
}

export default Desktop
