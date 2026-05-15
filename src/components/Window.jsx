import { useState } from "react"

function Window({
  title,
  children,
  closeWindow,
  minimizeWindow,
  isActive,
  focusWindow,
  defaultPosition,
  width,
  height,
}) {

  const [position, setPosition] = useState(defaultPosition)

  const handleDrag = (e) => {
    setPosition({
      x: e.clientX - 150,
      y: e.clientY - 20,
    })
  }

  return (
<div
  onMouseDown={focusWindow}
  className={`
absolute
bg-zinc-800
rounded-xl
shadow-2xl
overflow-hidden
transition-all
duration-200
ease-out
animate-[popIn_0.2s_ease-out]
${isActive
  ? "border border-blue-500 shadow-blue-500/20"
  : "border border-zinc-700 opacity-95"
}
`}
  style={{
    left: position.x,
    top: position.y,
    width,
    height,
    zIndex: isActive ? 20 : 10,
  }}
>

      <div
        onMouseMove={(e) => {
          if (e.buttons === 1) {
            handleDrag(e)
          }
        }}
        className="h-12 bg-zinc-900 flex items-center justify-between px-4 text-white cursor-move"
      >

        <h2 className="font-semibold">
          {title}
        </h2>

        <div className="flex gap-2">

          <button
            onClick={minimizeWindow}
            className="bg-yellow-500 w-6 h-6 rounded-full hover:bg-yellow-600"
          >
          </button>

          <button
            onClick={closeWindow}
            className="bg-red-500 w-6 h-6 rounded-full hover:bg-red-600"
          >
          </button>

        </div>

      </div>

      {children}

    </div>
  )
}

export default Window