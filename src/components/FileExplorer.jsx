import { useState } from "react"
import Window from "./Window"

function FileExplorer(props) {

  const folders = {

    Desktop: [
      {
        name: "CloudNova.txt",
        icon: "📄",
      },

      {
        name: "Ideas.md",
        icon: "📝",
      },

      {
        name: "Wallpaper.png",
        icon: "🖼️",
      },
    ],

    Documents: [
      {
        name: "Resume.pdf",
        icon: "📕",
      },

      {
        name: "ReactNotes.txt",
        icon: "📘",
      },

      {
        name: "ProjectIdeas.docx",
        icon: "📄",
      },
    ],

    Downloads: [
      {
        name: "song.mp3",
        icon: "🎵",
      },

      {
        name: "setup.exe",
        icon: "💻",
      },

      {
        name: "image.jpg",
        icon: "🖼️",
      },
    ],
  }

  const [activeFolder, setActiveFolder] =
    useState("Desktop")

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
      width="60vw"
      height="60vh"
    >

      <div className="
flex
h-full
text-white
overflow-hidden
">

        <div className="
w-[220px]
min-w-[180px]
max-w-[240px]
bg-black/20
border-r
border-white/10
p-4
overflow-auto
">

          <h2 className="
text-sm
font-bold
uppercase
tracking-widest
text-zinc-500
mb-6
">
            Folders
          </h2>

          <div className="
flex
flex-col
gap-2
">

            {Object.keys(folders).map(
              (folder) => (

              <button
                key={folder}
                onClick={() =>
                  setActiveFolder(folder)
                }

                className={`
flex
items-center
gap-3
px-4
py-3
rounded-2xl
transition-all
duration-200
font-medium
text-left
${
  activeFolder === folder
    ? `
bg-white/10
border
border-white/10
shadow-inner
`
    : `
hover:bg-white/5
`
}
`}
              >

                <span className="text-xl">
                  📁
                </span>

                <span className="truncate">
                  {folder}
                </span>

              </button>
            ))}

          </div>

        </div>

        <div className="
flex-1
overflow-auto
p-6
">

          <h2 className="
text-5xl
font-bold
mb-8
text-white/90
tracking-tight
">
            {activeFolder}
          </h2>

          <div className="
grid
grid-cols-[repeat(auto-fit,minmax(140px,1fr))]
gap-6
">

            {folders[activeFolder].map(
              (file) => (

              <div
                key={file.name}

                className="
aspect-square
min-h-[120px]
rounded-3xl
bg-white/[0.04]
border
border-white/10
hover:bg-white/[0.08]
transition-all
duration-300
cursor-pointer
flex
flex-col
items-center
justify-center
gap-4
p-4
backdrop-blur-xl
"
              >

                <div className="
text-5xl
">
                  {file.icon}
                </div>

                <p className="
text-sm
text-center
break-words
leading-tight
text-white/85
max-w-full
">
                  {file.name}
                </p>

              </div>
            ))}

          </div>

        </div>

      </div>

    </Window>
  )
}

export default FileExplorer