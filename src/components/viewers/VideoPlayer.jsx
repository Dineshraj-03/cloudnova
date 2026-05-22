/**
 * VideoPlayer.jsx — CloudNova
 *
 * Video player wrapped in Window.jsx.
 * Uses the native HTML5 <video> element — no external library needed.
 * Firebase Storage URLs are direct, so the video element streams them
 * via HTTP range requests automatically.
 *
 * Props — same shape as ImageViewer / PDFViewer.
 */

import { useRef, useState } from "react"
import { Download } from "lucide-react"
import Window from "../Window"

function VideoPlayer({
  file,
  onClose,
  onMinimize,
  isActive,
  focusWindow,
  setIsAnyWindowMaximized,
}) {
  const videoRef = useRef(null)
  const [error, setError] = useState(false)

  return (
    <Window
      title={file.name ?? "Video"}
      closeWindow={onClose}
      minimizeWindow={onMinimize}
      isActive={isActive}
      focusWindow={focusWindow}
      setIsAnyWindowMaximized={setIsAnyWindowMaximized}
      defaultPosition={{ x: 160, y: 80 }}
      width="72vw"
      height="78vh"
    >
      <div className="flex flex-col h-full bg-black">
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.4)" }}
        >
          <span className="text-xs text-white/50 truncate max-w-[70%]">{file.name}</span>
          <a
            href={file.storageUrl}
            download={file.name}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                       text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download size={13} />
            Download
          </a>
        </div>

        {/* Video area */}
        <div className="flex-1 flex items-center justify-center bg-black relative">
          {error ? (
            <div className="flex flex-col items-center gap-3 text-center px-8">
              <span className="text-3xl">🎬</span>
              <p className="text-white/50 text-sm">Could not play this video.</p>
              <p className="text-white/25 text-xs">
                Your browser may not support this format.
              </p>
              <a
                href={file.storageUrl}
                download={file.name}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "rgba(59,130,246,0.3)", border: "1px solid rgba(96,165,250,0.3)" }}
              >
                <Download size={15} />
                Download to play locally
              </a>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={file.storageUrl}
              controls
              autoPlay={false}
              className="max-w-full max-h-full rounded-lg"
              style={{ outline: "none" }}
              onError={() => setError(true)}
            >
              {/* Fallback for unsupported format */}
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </Window>
  )
}

export default VideoPlayer
