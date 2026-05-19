import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pencil, Trash2, Info } from "lucide-react"
import ContextMenu from "./ContextMenu.jsx"

/**
 * DesktopIcon
 *
 * Props:
 *  - id                  : string  — unique key (e.g. "notes")
 *  - label               : string  — display name
 *  - icon                : ReactNode
 *  - position            : { x: number, y: number }
 *  - onPositionChange(id, { x, y }) — called after drag ends
 *  - onOpen()            — called on double-click
 *  - onRename(id)        — called when Rename is selected
 *  - onDelete(id)        — called when Delete is selected
 *  - onProperties(id)    — called when Properties is selected
 */
function DesktopIcon({
  id,
  label,
  icon,
  position,
  onPositionChange,
  onOpen,
  onRename,
  onDelete,
  onProperties,
}) {
  const elRef = useRef(null)

  // ─── drag state kept in refs so we don't re-render mid-drag ───
  const dragState = useRef({
    dragging: false,
    startMouseX: 0,
    startMouseY: 0,
    startElX: 0,
    startElY: 0,
    moved: false,
  })

  // visual position tracked in state so the icon actually moves
  const [pos, setPos] = useState(position)

  // context menu state
  const [ctxMenu, setCtxMenu] = useState({ visible: false, x: 0, y: 0 })

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

  // ── right-click: show icon context menu ─────────────────────────
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation() // prevent desktop context menu from firing too
      setCtxMenu({ visible: true, x: e.clientX, y: e.clientY })
    },
    []
  )

  // ── pointer-based drag (works on mouse + touch) ─────────────────
  const onPointerDown = useCallback(
    (e) => {
      // only primary button / touch; right-click is handled by onContextMenu
      if (e.button !== undefined && e.button !== 0) return

      // close any open context menu on left-click drag start
      setCtxMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev))

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
        const vw = window.innerWidth
        const vh = window.innerHeight
        const el = elRef.current
        const iconW = el ? el.offsetWidth  : 80
        const iconH = el ? el.offsetHeight : 90

        const clampedX = Math.min(Math.max(0, pos.x), vw - iconW - 10)
        const clampedY = Math.min(Math.max(0, pos.y), vh - iconH - 80)

        const finalPos = { x: Math.round(clampedX), y: Math.round(clampedY) }
        setPos(finalPos)
        onPositionChange(id, finalPos)
      }
    },
    [id, pos, onPositionChange]
  )

  // ── icon context menu items ─────────────────────────────────────
  const menuItems = [
    {
      label: "Open",
      icon: <Play size={14} />,
      action: () => onOpen(),
    },
    { separator: true },
    {
      label: "Rename",
      icon: <Pencil size={14} />,
      action: () => onRename?.(id),
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      action: () => onDelete?.(id),
      danger: true,
    },
    { separator: true },
    {
      label: "Properties",
      icon: <Info size={14} />,
      action: () => onProperties?.(id),
    },
  ]

  return (
    <>
      <div
        ref={elRef}
        className="absolute select-none touch-none"
        style={{ left: pos.x, top: pos.y, zIndex: ctxMenu.visible ? 20 : 5 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <div
          className={[
            "flex flex-col items-center gap-1 w-20 cursor-pointer",
            "group transition-transform duration-150",
            ctxMenu.visible
              ? "scale-105"
              : dragState.current.dragging
              ? "scale-110 opacity-80"
              : "hover:scale-110 hover:-translate-y-1",
          ].join(" ")}
        >
          {/* icon wrapper */}
          <div
            className={[
              "relative flex items-center justify-center",
              "w-16 h-16 rounded-2xl text-white",
              "transition-all duration-200",
              ctxMenu.visible
                ? "bg-white/15 backdrop-blur-sm shadow-lg shadow-black/20 ring-1 ring-white/20"
                : "group-hover:bg-white/10 group-hover:backdrop-blur-sm group-hover:shadow-lg group-hover:shadow-black/20",
            ].join(" ")}
          >
            {icon}
          </div>

          {/* label */}
          <span
            className={[
              "text-xs font-medium text-white text-center leading-tight",
              "px-1 py-0.5 rounded",
              "backdrop-blur-sm drop-shadow-sm",
              "max-w-[72px] truncate",
              ctxMenu.visible ? "bg-white/25" : "bg-black/20",
            ].join(" ")}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Icon-level context menu — rendered outside the positioned div
          so z-index stacking is clean */}
      <ContextMenu
        visible={ctxMenu.visible}
        x={ctxMenu.x}
        y={ctxMenu.y}
        items={menuItems}
        onClose={() => setCtxMenu((prev) => ({ ...prev, visible: false }))}
      />
    </>
  )
}

export default DesktopIcon
