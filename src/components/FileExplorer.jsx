import { useState } from "react"
import Window from "./Window"

function FileExplorer(props) {

  const folders = {
    Desktop: [
      "CloudNova.txt",
      "Ideas.md",
      "Wallpaper.png",
    ],

    Documents: [
      "Resume.pdf",
      "ReactNotes.txt",
      "ProjectIdeas.docx",
    ],

    Downloads: [
      "song.mp3",
      "setup.exe",
      "image.jpg",
    ],
  }

  const [activeFolder, setActiveFolder] = useState("Desktop")

  return (
    <Window
      title="Files"
      closeWindow={props.closeFiles}
      minimizeWindow={props.minimizeFiles}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 350,
        y: 120,
      }}
      width="700px"
      height="450px"
    >

      <div className="flex h-[calc(100%-48px)] text-white">

        <div className="w-48 bg-zinc-900 p-4 border-r border-zinc-700">

          <h2 className="text-sm font-semibold mb-4 text-zinc-400">
            Folders
          </h2>

          <div className="flex flex-col gap-2">

            {Object.keys(folders).map((folder) => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`text-left px-3 py-2 rounded-lg hover:bg-zinc-700 transition ${
                  activeFolder === folder
                    ? "bg-zinc-700"
                    : ""
                }`}
              >
                📁 {folder}
              </button>
            ))}

          </div>

        </div>

        <div className="flex-1 p-4">

          <h2 className="text-lg font-semibold mb-4">
            {activeFolder}
          </h2>

          <div className="grid grid-cols-3 gap-4">

            {folders[activeFolder].map((file) => (
              <div
                key={file}
                className="bg-zinc-800 hover:bg-zinc-700 transition p-4 rounded-xl cursor-pointer border border-zinc-700"
              >
                📄 {file}
              </div>
            ))}

          </div>

        </div>

      </div>

    </Window>
  )
}

export default FileExplorer