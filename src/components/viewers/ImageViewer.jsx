/**
 * ImageViewer.jsx — CloudNova
 *
 * Full image viewer wrapped in the existing Window.jsx shell.
 * Supports zoom, pan, and fit-to-window.
 *
 * Props
 * ─────
 * file        : FileDoc  { name, storageUrl, ... }
 * onClose     : () => void
 * onMinimize  : () => void
 * isActive    : boolean
 * focusWindow : () => void
 * setIsAnyWindowMaximized : setter
 */

import { useState, useCallback, useRef } from "react"
import { ZoomIn, ZoomOut, Maximize2, RotateCw } from "lucide-react"
import Window from "../Window"

function ImageViewer({
  file,
  onClose,
  onMinimize,
  isActive,
  focusWindow,
  setIsAnyWindowMaximized,
}) {
  const [zoom,    setZoom]    = useState(1)
  const [rotate,  setRotate]  = useState(0)
  const [loaded,  setLoaded]  = useState(false)
  const [error,   setError]   = useState(false)

  // Pan state
  const [pan,     setPan]     = useState({ x: 0, y: 0 })
  const panRef    = useRef({ dragging: false, startMX: 0, startMY: 0, startPX: 0, startPY: 0 })
  const containerRef = useRef(null)

  const handleZoomIn  = useCallback(() => setZoom((z) => Math.min(z + 0.25, 4)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.25)), [])
  const handleFit     = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])
  const handleRotate  = useCallback(() => setRotate((r) => (r + 90) % 360), [])

  // Pan via pointer events on the image itself
  const onImagePointerDown = useCallback((e) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    panRef.current = {
      dragging: true,
      startMX: e.clientX, startMY: e.clientY,
      startPX: pan.x,     startPY: pan.y,
    }
  }, [pan])

  const onImagePointerMove = useCallback((e) => {
    if (!panRef.current.dragging) return
    const dx = e.clientX - panRef.current.startMX
    const dy = e.clientY - panRef.current.startMY
    setPan({ x: panRef.current.startPX + dx, y: panRef.current.startPY + dy })
  }, [])

  const onImagePointerUp = useCallback(() => {
    panRef.current.dragging = false
  }, [])

  // Scroll to zoom
  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(0.25, Math.min(4, z + delta)))
  }, [])

  return (
    <Window
      title={file.name ?? "Image"}
      closeWindow={onClose}
      minimizeWindow={onMinimize}
      isActive={isActive}
      focusWindow={focusWindow}
      setIsAnyWindowMaximized={setIsAnyWindowMaximized}
      defaultPosition={{ x: 180, y: 80 }}
      width="70vw"
      height="75vh"
    >
      <div className="flex flex-col h-full bg-black/40">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <button
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-white/40 min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            onClick={handleFit}
            title="Fit to window"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            onClick={handleRotate}
            title="Rotate 90°"
          >
            <RotateCw size={14} />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-white/25 truncate max-w-[200px]">{file.name}</span>
        </div>

        {/* Image canvas */}
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden flex items-center justify-center relative"
          onWheel={onWheel}
          style={{ cursor: zoom > 1 ? "grab" : "default" }}
        >
          {!loaded && !error && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
              <p className="text-white/30 text-xs">Loading image…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-2 text-white/30">
              <p className="text-sm">Failed to load image</p>
              <p className="text-xs">{file.storageUrl}</p>
            </div>
          )}

          {file.storageUrl && (
            <img
              src={file.storageUrl}
              alt={file.name}
              draggable={false}
              className={`max-w-none select-none transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`,
                transformOrigin: "center center",
                transition: panRef.current.dragging ? "none" : "transform 0.15s ease",
                cursor: zoom > 1 ? "grab" : "default",
                maxHeight: "100%",
                maxWidth:  "100%",
              }}
              onLoad={()  => setLoaded(true)}
              onError={() => setError(true)}
              onPointerDown={onImagePointerDown}
              onPointerMove={onImagePointerMove}
              onPointerUp={onImagePointerUp}
            />
          )}
        </div>
      </div>
    </Window>
  )
}

export default ImageViewer
