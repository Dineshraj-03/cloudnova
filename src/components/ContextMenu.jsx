import { useEffect, useRef } from "react"

/**
 * ContextMenu
 *
 * A reusable glassmorphism context menu.
 *
 * Props:
 *  - x, y        : number   — cursor position
 *  - items       : Array<{ label, icon, action, separator, danger }>
 *  - onClose     : () => void
 *  - visible     : boolean
 */
function ContextMenu({ x, y, items, onClose, visible }) {
  const menuRef = useRef(null)

  // ── close on outside click or Escape ──────────────────────────
  useEffect(() => {
    if (!visible) return

    const handleDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") onClose()
    }

    // Use mousedown so the menu closes before any click handlers fire
    document.addEventListener("mousedown", handleDown, true)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleDown, true)
      document.removeEventListener("keydown", handleKey)
    }
  }, [visible, onClose])

  // ── clamp menu position so it never overflows viewport ─────────
  const clampedStyle = (() => {
    if (!menuRef.current) return { left: x, top: y }
    const W = menuRef.current.offsetWidth  || 200
    const H = menuRef.current.offsetHeight || 200
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      left: Math.min(x, vw - W - 8),
      top:  Math.min(y, vh - H - 8),
    }
  })()

  if (!visible) return null

  return (
    <div
      ref={menuRef}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[9999] min-w-[200px] py-1.5 rounded-xl overflow-hidden"
      style={{
        ...clampedStyle,
        // Glassmorphism core
        background: "rgba(28, 28, 32, 0.82)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.55), 0 1.5px 0 rgba(255,255,255,0.06) inset",
        // Animate in
        animation: "ctxFadeIn 0.14s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <style>{`
        @keyframes ctxFadeIn {
          from { opacity: 0; transform: scale(0.94) translateY(-4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);     }
        }
      `}</style>

      {items.map((item, i) => {
        if (item.separator) {
          return (
            <div
              key={`sep-${i}`}
              className="my-1.5 mx-3"
              style={{ height: "1px", background: "rgba(255,255,255,0.08)" }}
            />
          )
        }

        return (
          <button
            key={item.label}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              item.action?.()
              onClose()
            }}
            className={[
              "w-full flex items-center gap-2.5 px-3 py-1.5",
              "text-[13px] font-medium text-left",
              "rounded-lg mx-0 transition-all duration-100",
              "cursor-default select-none",
              item.danger
                ? "text-red-400 hover:bg-red-500/20 hover:text-red-300"
                : "text-white/85 hover:bg-white/10 hover:text-white",
            ].join(" ")}
            style={{ outline: "none" }}
          >
            {item.icon && (
              <span
                className={`flex-shrink-0 opacity-70 ${item.danger ? "text-red-400" : "text-white/70"}`}
                style={{ width: 16, height: 16 }}
              >
                {item.icon}
              </span>
            )}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="text-[11px] text-white/30 ml-2">{item.shortcut}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default ContextMenu
