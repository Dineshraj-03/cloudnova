import { useEffect, useState } from "react"

import {
  FileText,
  Calculator,
  Folder,
  Terminal,
  Globe,
  Cloud,
} from "lucide-react"

function Taskbar({
  isAnyWindowMaximized,
  logout,
  isFilesOpen,
  openFiles,
  isNotesOpen,
  openNotes,
  isCalculatorOpen,
  openCalculator,
  isTerminalOpen,
  openTerminal,
  isBrowserOpen,
  openBrowser,
}) {
  const [time, setTime] = useState("")
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false)
  const [isDockVisible, setIsDockVisible] = useState(true)

  const showDock = !isAnyWindowMaximized || isDockVisible

  useEffect(() => {
    if (!isAnyWindowMaximized) {
      setIsDockVisible(true)
    }
  }, [isAnyWindowMaximized])

  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      setTime(currentTime)
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">

      {/* HOVER TRIGGER — only active when dock is hidden */}
      {isAnyWindowMaximized && (
        <div
          className="absolute bottom-0 left-0 w-full h-3 pointer-events-auto"
          onMouseEnter={() => setIsDockVisible(true)}
        />
      )}

      {/* START MENU */}
      {isStartMenuOpen && (
        <div className="
          absolute bottom-24 left-6 w-72
          backdrop-blur-2xl bg-zinc-900/80
          border border-white/10
          rounded-3xl
          shadow-[0_10px_40px_rgba(0,0,0,0.45)]
          p-4
          pointer-events-auto
        ">
          <h2 className="text-white text-xl font-semibold mb-4">
            CloudNova
          </h2>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { openNotes(); setIsStartMenuOpen(false) }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-4 py-3 rounded-2xl text-left flex items-center gap-3"
            >
              <FileText size={22} /> Notes
            </button>

            <button
              onClick={() => { openCalculator(); setIsStartMenuOpen(false) }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-4 py-3 rounded-2xl text-left flex items-center gap-3"
            >
              <Calculator size={22} /> Calculator
            </button>

            <button
              onClick={() => { openFiles(); setIsStartMenuOpen(false) }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-4 py-3 rounded-2xl text-left flex items-center gap-3"
            >
              <Folder size={22} /> Files
            </button>

            <button
              onClick={() => { openTerminal(); setIsStartMenuOpen(false) }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-4 py-3 rounded-2xl text-left flex items-center gap-3"
            >
              <Terminal size={22} /> Terminal
            </button>

            <button
              onClick={() => { openBrowser(); setIsStartMenuOpen(false) }}
              className="bg-white/5 hover:bg-white/10 transition text-white px-4 py-3 rounded-2xl text-left flex items-center gap-3"
            >
              <Globe size={22} /> Browser
            </button>
          </div>
        </div>
      )}

      {/* DOCK */}
      <div
        onMouseLeave={() => {
          if (isAnyWindowMaximized) setIsDockVisible(false)
        }}
        className="
          fixed left-1/2 -translate-x-1/2
          pointer-events-auto
          px-5 py-3
          rounded-[28px]
          backdrop-blur-2xl bg-zinc-900/70
          border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.45)]
          flex items-center gap-3
          transition-all duration-300 ease-out
        "
        style={{
          bottom: showDock ? "8px" : "-120px",
          opacity: showDock ? 1 : 0,
        }}
      >

        {/* START BUTTON */}
        <button
          onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
          className="
            w-14 h-14 flex items-center justify-center
            rounded-2xl bg-blue-500/90 hover:bg-blue-500
            transition-all duration-200 transform-gpu text-white
            hover:scale-125 hover:-translate-y-2 active:scale-95
          "
        >
          <Cloud size={28} />
        </button>

        {/* NOTES */}
        {isNotesOpen && (
          <button
            onClick={openNotes}
            className="
              w-14 h-14 flex items-center justify-center
              rounded-2xl bg-white/5 hover:bg-white/10
              transition-all duration-200 transform-gpu text-white/90
              hover:scale-125 hover:-translate-y-2 active:scale-95
            "
          >
            <FileText size={30} />
          </button>
        )}

        {/* CALCULATOR */}
        {isCalculatorOpen && (
          <button
            onClick={openCalculator}
            className="
              w-14 h-14 flex items-center justify-center
              rounded-2xl bg-white/5 hover:bg-white/10
              transition-all duration-200 transform-gpu text-white/90
              hover:scale-125 hover:-translate-y-2 active:scale-95
            "
          >
            <Calculator size={30} />
          </button>
        )}

        {/* FILES */}
        {isFilesOpen && (
          <button
            onClick={openFiles}
            className="
              w-14 h-14 flex items-center justify-center
              rounded-2xl bg-white/5 hover:bg-white/10
              transition-all duration-200 transform-gpu text-white/90
              hover:scale-125 hover:-translate-y-2 active:scale-95
            "
          >
            <Folder size={30} />
          </button>
        )}

        {/* TERMINAL */}
        {isTerminalOpen && (
          <button
            onClick={openTerminal}
            className="
              w-14 h-14 flex items-center justify-center
              rounded-2xl bg-white/5 hover:bg-white/10
              transition-all duration-200 transform-gpu text-white/90
              hover:scale-125 hover:-translate-y-2 active:scale-95
            "
          >
            <Terminal size={30} />
          </button>
        )}

        {/* BROWSER */}
        {isBrowserOpen && (
          <button
            onClick={openBrowser}
            className="
              w-14 h-14 flex items-center justify-center
              rounded-2xl bg-white/5 hover:bg-white/10
              transition-all duration-200 transform-gpu text-white/90
              hover:scale-125 hover:-translate-y-2 active:scale-95
            "
          >
            <Globe size={30} />
          </button>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 ml-3 pl-3 border-l border-white/10">
          <button
            onClick={logout}
            className="bg-red-500/90 hover:bg-red-500 transition px-4 py-2 rounded-xl text-white font-medium"
          >
            Logout
          </button>

          <div className="text-white/90 font-medium text-sm min-w-[48px] text-center">
            {time}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Taskbar