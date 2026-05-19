import CalculatorApp from "./CalculatorApp"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import {
  StickyNote,
  Calculator,
  FolderOpen,
  Globe2,
  TerminalSquare,
  Settings,
} from "lucide-react"
import { useState } from "react"
import Taskbar from "./Taskbar"
import Notes from "./Notes"
import FileExplorer from "./FileExplorer"
import Terminal from "./Terminal"
import Browser from "./Browser"
import SettingsApp from "./Settings"

function Desktop({
  shutdownSystem,
  isAnyWindowMaximized,
  setIsAnyWindowMaximized,
}) {

  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  const [isNotesMinimized, setIsNotesMinimized] = useState(false)
  const [isCalculatorMinimized, setIsCalculatorMinimized] = useState(false)

  const [activeWindow, setActiveWindow] = useState("")
  const [isFilesOpen, setIsFilesOpen] = useState(false)

  const [isFilesMinimized, setIsFilesMinimized] = useState(false)

  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)
  const [isBrowserOpen, setIsBrowserOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

const [isSettingsMinimized, setIsSettingsMinimized] = useState(false)

  const [isBrowserMinimized, setIsBrowserMinimized] = useState(false)

  const apps = [
    {
      name: "Notes",
      icon: <StickyNote size={46} strokeWidth={1.5} />,
    },
    {
      name: "Calculator",
      icon: <Calculator size={46} strokeWidth={1.5} />,
    },
    {
      name: "Files",
      icon: <FolderOpen size={46} strokeWidth={1.5} />,
    },
    {
      name: "Terminal",
      icon: <TerminalSquare size={46} strokeWidth={1.5} />,
    },
    {
      name: "Browser",
      icon: <Globe2 size={46} strokeWidth={1.5} />,
    },
    {
  name: "Settings",
  icon: <Settings size={46} strokeWidth={1.5} />,
},
  ]

  return (
    <div className="fixed inset-0 bg-zinc-900 overflow-hidden">

      <div className="p-6 flex flex-col gap-6">

        {apps.map((app) => (
          <div
            key={app.name}
            onClick={() => {

              if (app.name === "Notes") {
                setIsNotesOpen(true)
                setIsNotesMinimized(false)
                setActiveWindow("notes")
              }

              if (app.name === "Calculator") {
                setIsCalculatorOpen(true)
                setIsCalculatorMinimized(false)
                setActiveWindow("calculator")
              }

              if (app.name === "Files") {
                setIsFilesOpen(true)
                setIsFilesMinimized(false)
                setActiveWindow("files")
              }

              if (app.name === "Terminal") {
                setIsTerminalOpen(true)
                setIsTerminalMinimized(false)
                setActiveWindow("terminal")
              }

              if (app.name === "Browser") {
                setIsBrowserOpen(true)
                setIsBrowserMinimized(false)
                setActiveWindow("browser")
              }
              if (app.name === "Settings") {
                setIsSettingsOpen(true)
                setIsSettingsMinimized(false)
                setActiveWindow("settings")
              }
            }}
            className="
              w-20
              flex
              flex-col
              items-center
              text-white
              cursor-pointer
              transition-all
              duration-200
              hover:scale-110
              hover:-translate-y-1
              hover:text-blue-400
            "
          >
            <div className="text-4xl">
              {app.icon}
            </div>
            <p className="mt-2 text-sm">
              {app.name}
            </p>
          </div>
        ))}

      </div>

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
          openNotes={() => {
            setIsNotesOpen(true)
            setIsNotesMinimized(false)
            setActiveWindow("notes")
          }}
          openCalculator={() => {
            setIsCalculatorOpen(true)
            setIsCalculatorMinimized(false)
            setActiveWindow("calculator")
          }}
          openFiles={() => {
            setIsFilesOpen(true)
            setIsFilesMinimized(false)
            setActiveWindow("files")
          }}
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
/>
)}

      {!isAnyWindowMaximized && (

  <Taskbar
    isAnyWindowMaximized={
      isAnyWindowMaximized
    }

    isNotesOpen={isNotesOpen}
    isCalculatorOpen={isCalculatorOpen}
    isFilesOpen={isFilesOpen}

    logout={() => signOut(auth)}

    isTerminalOpen={isTerminalOpen}
    isBrowserOpen={isBrowserOpen}

    openNotes={() => {
      setIsNotesOpen(true)
      setIsNotesMinimized(false)
      setActiveWindow("notes")
    }}

    openCalculator={() => {
      setIsCalculatorOpen(true)
      setIsCalculatorMinimized(false)
      setActiveWindow("calculator")
    }}

    openFiles={() => {
      setIsFilesOpen(true)
      setIsFilesMinimized(false)
      setActiveWindow("files")
    }}

    openTerminal={() => {
      setIsTerminalOpen(true)
      setIsTerminalMinimized(false)
      setActiveWindow("terminal")
    }}

    openBrowser={() => {
      setIsBrowserOpen(true)
      setIsBrowserMinimized(false)
      setActiveWindow("browser")
    }}

    setIsAnyWindowMaximized={
      setIsAnyWindowMaximized
    }

  />

)}

    </div>
  )
}

export default Desktop
