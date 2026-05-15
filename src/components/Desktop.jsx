import CalculatorApp from "./CalculatorApp"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import {
  StickyNote,
  Calculator,
  Folder,
} from "lucide-react"
import { useState } from "react"
import Taskbar from "./Taskbar"
import Notes from "./Notes"
import FileExplorer from "./FileExplorer"
import Terminal from "./Terminal"

function Desktop({ shutdownSystem }) {

  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  const [isNotesMinimized, setIsNotesMinimized] = useState(false)
  const [isCalculatorMinimized, setIsCalculatorMinimized] = useState(false)

  const [activeWindow, setActiveWindow] = useState("")
  const [isFilesOpen, setIsFilesOpen] = useState(false)

  const [isFilesMinimized, setIsFilesMinimized] = useState(false)

  const [isTerminalOpen, setIsTerminalOpen] = useState(false)

const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)

  const apps = [
    {
      name: "Notes",
      icon: <StickyNote size={40} />,
    },
    {
      name: "Calculator",
      icon: <Calculator size={40} />,
    },
    {
      name: "Files",
      icon: <Folder size={40} />,
    },
    {
      name: "Terminal",
      icon: "💻",
    },
  ]

  return (
    <div className="h-screen bg-zinc-900 relative overflow-hidden">

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
        />
      )}

      {isCalculatorOpen && !isCalculatorMinimized && (
        <CalculatorApp
          closeCalculator={() => setIsCalculatorOpen(false)}
          minimizeCalculator={() => setIsCalculatorMinimized(true)}
          isActive={activeWindow === "calculator"}
          focusWindow={() => setActiveWindow("calculator")}
        />
      )}
      {isFilesOpen && !isFilesMinimized && (
        <FileExplorer
          closeFiles={() => setIsFilesOpen(false)}
          minimizeFiles={() => setIsFilesMinimized(true)}
          isActive={activeWindow === "files"}
          focusWindow={() => setActiveWindow("files")}
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
        />
      )}

      <Taskbar
        isNotesOpen={isNotesOpen}
        isCalculatorOpen={isCalculatorOpen}
        isFilesOpen={isFilesOpen}
        logout={() => signOut(auth)}
        isTerminalOpen={isTerminalOpen}

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
          console.log("FILES BUTTON CLICKED")

          setIsFilesOpen(true)
          setIsFilesMinimized(false)
          setActiveWindow("files")
        }}
        openTerminal={() => {
          setIsTerminalOpen(true)
          setIsTerminalMinimized(false)
          setActiveWindow("terminal")
        }}
      />

    </div>
  )
}

export default Desktop