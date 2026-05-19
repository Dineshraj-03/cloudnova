import { useRef, useState, useEffect, useCallback } from "react"

/**
 * DesktopIcon
 *
 * Props:
 *  - id         : string  — unique key for this icon (e.g. "notes")
 *  - label      : string  — display name shown below icon
 *  - icon       : ReactNode
 *  - position   : { x: number, y: number }
 *  - onPositionChange(id, { x, y }) — called after a drag ends
 *  - onOpen()   — called on double-click (or single-click on touch)
 */
function DesktopIcon({ id, label, icon, position, onPositionChange, onOpen }) {
  const elRef = useRef(null)

  // ─── drag state kept in refs so we don't re-render mid-drag ───
  const dragState = useRef({
    dragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startElX: 0,
    startElY: 0,
  })

  // visual position tracked in state so the icon actually moves
  const [pos, setPos] = useState(position)

  // keep local pos in sync when Firestore position arrives / changes
  useEffect(() => {
    setPos(position)
  }, [position.x, position.y])

  // ── double-click guard ──────────────────────────────────────────
  const clickTimer = useRef(null)
  const clickCount = useRef(0)

  const handleClick = useCallback(() => {
    // ignore clicks that were actually drag ends
    if (dragState.current.moved) return

    clickCount.current += 1

    if (clickCount.current === 1) {
      clickTimer.current = setTimeout(() => {
        clickCount.current = 0
      }, 300)
    } else if (clickCount.current === 2) {
      clearTimeout(clickTimer.current)
      clickCount.current = 0
      onOpen()
    }
  }, [onOpen])

  // ── pointer-based drag (works on mouse + touch) ─────────────────
  const onPointerDown = useCallback(
    (e) => {
      // only primary button / touch
      if (e.button !== undefined && e.button !== 0) return

      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)

      dragState.current = {
        dragging: true,
        moved: false,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startElX: pos.x,
        startElY: pos.y,
      }
    },
    [pos]
  )

  const onPointerMove = useCallback((e) => {
    if (!dragState.current.dragging) return

    const dx = e.clientX - dragState.current.startMouseX
    const dy = e.clientY - dragState.current.startMouseY

    // only count as a drag if the pointer moved > 4 px
    if (!dragState.current.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
    dragState.current.moved = true

    const newX = Math.max(0, dragState.current.startElX + dx)
    const newY = Math.max(0, dragState.current.startElY + dy)

    setPos({ x: newX, y: newY })
  }, [])

  const onPointerUp = useCallback(
    (e) => {
      if (!dragState.current.dragging) return
      dragState.current.dragging = false

      if (dragState.current.moved) {
        // clamp to viewport (leave room for icon width/height)
        const vw = window.innerWidth
        const vh = window.innerHeight
        const el = elRef.current
        const iconW = el ? el.offsetWidth : 80
        const iconH = el ? el.offsetHeight : 90

        const clampedX = Math.min(Math.max(0, pos.x), vw - iconW - 10)
        const clampedY = Math.min(Math.max(0, pos.y), vh - iconH - 80) // 80 = dock height buffer

        const finalPos = { x: Math.round(clampedX), y: Math.round(clampedY) }
        setPos(finalPos)
        onPositionChange(id, finalPos)
      }
    },
    [id, pos, onPositionChange]
  )

  return (
    <div
      ref={elRef}
      className="absolute select-none touch-none"
      style={{ left: pos.x, top: pos.y, zIndex: 5 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={handleClick}
    >
      <div
        className={[
          "flex flex-col items-center gap-1 w-20 cursor-pointer",
          "group transition-transform duration-150",
          dragState.current.dragging
            ? "scale-110 opacity-80"
            : "hover:scale-110 hover:-translate-y-1",
        ].join(" ")}
      >
        {/* icon wrapper with subtle glass pill on hover */}
        <div
          className="
            relative flex items-center justify-center
            w-16 h-16 rounded-2xl
            text-white
            group-hover:bg-white/10
            group-hover:backdrop-blur-sm
            group-hover:shadow-lg
            group-hover:shadow-black/20
            transition-all duration-200
          "
        >
          {icon}
        </div>

        {/* label with shadow for readability on any wallpaper */}
        <span
          className="
            text-xs font-medium text-white text-center leading-tight
            px-1 py-0.5 rounded
            bg-black/20 backdrop-blur-sm
            drop-shadow-sm
            max-w-[72px] truncate
          "
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export default DesktopIcon
