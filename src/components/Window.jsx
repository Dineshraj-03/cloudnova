import {
  useState,
  useEffect,
  useRef,
} from "react"

function Window({
  title,
  children,
  closeWindow,
  minimizeWindow,
  isActive,
  focusWindow,
  defaultPosition = {
    x: 100,
    y: 100,
  },
  width = "60vw",
  height = "60vh",
}) {

  const windowRef = useRef(null)

  const getInitialSize = () => {

    let calculatedWidth
    let calculatedHeight

    if (
      typeof width === "string" &&
      width.includes("vw")
    ) {

      calculatedWidth =
        window.innerWidth *
        (parseInt(width) / 100)

    } else {

      calculatedWidth =
        parseInt(width)
    }

    if (
      typeof height === "string" &&
      height.includes("vh")
    ) {

      calculatedHeight =
        window.innerHeight *
        (parseInt(height) / 100)

    } else {

      calculatedHeight =
        parseInt(height)
    }

    return {

      width: Math.min(
        calculatedWidth,
        window.innerWidth * 0.92
      ),

      height: Math.min(
        calculatedHeight,
        window.innerHeight * 0.88
      ),
    }
  }

  const [size, setSize] =
    useState(getInitialSize)

  const [position, setPosition] =
    useState(defaultPosition)

  const [isDragging, setIsDragging] =
    useState(false)

  const [isResizing, setIsResizing] =
    useState(false)

  const [resizeDirection, setResizeDirection] =
    useState(null)

  const [offset, setOffset] =
    useState({
      x: 0,
      y: 0,
    })

  const [resizeStart, setResizeStart] =
    useState(null)

  const [isMaximized, setIsMaximized] =
    useState(false)

  const EDGE_SIZE = 10

  const MIN_WIDTH = 320
  const MIN_HEIGHT = 220

  /* KEEP WINDOW INSIDE VIEWPORT */

  useEffect(() => {

    const handleViewportResize = () => {

      const maxX =
        window.innerWidth -
        size.width

      const maxY =
        window.innerHeight -
        size.height

      setPosition((prev) => ({

        x: Math.max(
          0,
          Math.min(prev.x, maxX)
        ),

        y: Math.max(
          0,
          Math.min(prev.y, maxY)
        ),
      }))
    }

    window.addEventListener(
      "resize",
      handleViewportResize
    )

    return () => {

      window.removeEventListener(
        "resize",
        handleViewportResize
      )
    }

  }, [size.width, size.height])

  const startDragging = (e) => {

    if (
      isMaximized ||
      isResizing
    ) return

    setIsDragging(true)

    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const detectResizeDirection = (e) => {

    if (!windowRef.current)
      return null

    const rect =
      windowRef.current.getBoundingClientRect()

    const top =
      e.clientY <= rect.top + EDGE_SIZE

    const bottom =
      e.clientY >= rect.bottom - EDGE_SIZE

    const left =
      e.clientX <= rect.left + EDGE_SIZE

    const right =
      e.clientX >= rect.right - EDGE_SIZE

    if (top && left)
      return "nw"

    if (top && right)
      return "ne"

    if (bottom && left)
      return "sw"

    if (bottom && right)
      return "se"

    if (left) return "w"

    if (right) return "e"

    if (top) return "n"

    if (bottom) return "s"

    return null
  }

  const getCursor = (dir) => {

    switch (dir) {

      case "n":
      case "s":
        return "ns-resize"

      case "e":
      case "w":
        return "ew-resize"

      case "nw":
      case "se":
        return "nwse-resize"

      case "ne":
      case "sw":
        return "nesw-resize"

      default:
        return "default"
    }
  }

  const handleMouseDown = (e) => {

    const dir =
      detectResizeDirection(e)

    if (
      dir &&
      !isMaximized
    ) {

      const rect =
        windowRef.current.getBoundingClientRect()

      setIsResizing(true)

      setResizeDirection(dir)

      setResizeStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        width: rect.width,
        height: rect.height,
        x: position.x,
        y: position.y,
      })

      return
    }

    focusWindow()
  }

  useEffect(() => {

    const move = (e) => {

      /* DRAGGING */

      if (isDragging) {

        requestAnimationFrame(() => {

          setPosition({
            x: e.clientX - offset.x,
            y: e.clientY - offset.y,
          })

        })
      }

      /* RESIZING */

      if (
        isResizing &&
        resizeStart
      ) {

        const dx =
          e.clientX -
          resizeStart.mouseX

        const dy =
          e.clientY -
          resizeStart.mouseY

        let newWidth =
          resizeStart.width

        let newHeight =
          resizeStart.height

        let newX =
          resizeStart.x

        let newY =
          resizeStart.y

        if (
          resizeDirection.includes("e")
        ) {
          newWidth += dx
        }

        if (
          resizeDirection.includes("s")
        ) {
          newHeight += dy
        }

        if (
          resizeDirection.includes("w")
        ) {

          newWidth -= dx
          newX += dx
        }

        if (
          resizeDirection.includes("n")
        ) {

          newHeight -= dy
          newY += dy
        }

        if (newWidth >= MIN_WIDTH) {

          setSize((prev) => ({
            ...prev,
            width: newWidth,
          }))

          setPosition((prev) => ({
            ...prev,
            x: newX,
          }))
        }

        if (newHeight >= MIN_HEIGHT) {

          setSize((prev) => ({
            ...prev,
            height: newHeight,
          }))

          setPosition((prev) => ({
            ...prev,
            y: newY,
          }))
        }
      }
    }

    const stop = () => {

      setIsDragging(false)

      setIsResizing(false)

      setResizeDirection(null)
    }

    window.addEventListener(
      "mousemove",
      move
    )

    window.addEventListener(
      "mouseup",
      stop
    )

    return () => {

      window.removeEventListener(
        "mousemove",
        move
      )

      window.removeEventListener(
        "mouseup",
        stop
      )
    }

  }, [
    isDragging,
    offset,
    isResizing,
    resizeDirection,
    resizeStart,
  ])

  return (

    <div
      ref={windowRef}

      onMouseMove={(e) => {

        const dir =
          detectResizeDirection(e)

        e.currentTarget.style.cursor =
          getCursor(dir)
      }}

      onMouseDown={handleMouseDown}

      className={`
absolute
flex
flex-col
overflow-hidden
backdrop-blur-2xl
border
select-none
transition-shadow
duration-200

${isActive
  ? `
border-white/10
shadow-[0_10px_40px_rgba(0,0,0,0.28)]
`
  : `
border-white/5
opacity-95
shadow-[0_6px_24px_rgba(0,0,0,0.18)]
`
}
`}

      style={{

        left:
          isMaximized
            ? 0
            : position.x,

        top:
          isMaximized
            ? 0
            : position.y,

        width:
          isMaximized
            ? "100vw"
            : `${size.width}px`,

        height:
          isMaximized
            ? "calc(100vh - 56px)"
            : `${size.height}px`,

        minWidth: "320px",
        minHeight: "220px",

        maxWidth: "92vw",
        maxHeight: "88vh",

        borderRadius:
          isMaximized
            ? "0px"
            : "18px",

        background:
          "rgba(28,28,30,0.58)",

        WebkitBackdropFilter:
          "blur(30px)",

        backdropFilter:
          "blur(30px)",

        zIndex:
          isActive ? 20 : 10,
      }}
    >

      {/* TITLE BAR */}

      <div
        onMouseDown={startDragging}

        onDoubleClick={() =>
          setIsMaximized(
            !isMaximized
          )
        }

        className="
h-12
shrink-0
flex
items-center
justify-between
px-4
cursor-move
border-b
border-white/10
bg-gradient-to-b
from-white/10
to-transparent
"
      >

        <div className="
flex
gap-3
">

          <button
            onClick={closeWindow}
            className="
w-3.5
h-3.5
rounded-full
bg-[#ff5f57]
"
          />

          <button
            onClick={minimizeWindow}
            className="
w-3.5
h-3.5
rounded-full
bg-[#ffbd2e]
"
          />

          <button
            onClick={() =>
              setIsMaximized(
                !isMaximized
              )
            }
            className="
w-3.5
h-3.5
rounded-full
bg-[#28c840]
"
          />

        </div>

        <h2 className="
text-sm
font-medium
text-white/90
truncate
">
          {title}
        </h2>

        <div className="w-16"></div>

      </div>

      {/* CONTENT */}

      <div className="
flex-1
min-h-0
overflow-auto
">
        {children}
      </div>

    </div>
  )
}

export default Window