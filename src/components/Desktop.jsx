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

function Desktop() {

  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)

  const [isNotesMinimized, setIsNotesMinimized] = useState(false)
  const [isCalculatorMinimized, setIsCalculatorMinimized] = useState(false)

  const [activeWindow, setActiveWindow] = useState("")
  const [isFilesOpen, setIsFilesOpen] = useState(false)

const [isFilesMinimized, setIsFilesMinimized] = useState(false)

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

            }}
            className="w-20 flex flex-col items-center text-white cursor-pointer"
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

      <Taskbar
        isNotesOpen={isNotesOpen}
        isCalculatorOpen={isCalculatorOpen}
        isFilesOpen={isFilesOpen}
        logout={() => signOut(auth)}

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
      />

    </div>
  )
}

export default Desktop