/**
 * PDFViewer.jsx — CloudNova
 *
 * PDF viewer wrapped in Window.jsx.
 *
 * Strategy: embed the PDF via an <iframe> pointing at the Firebase Storage
 * download URL. The browser's native PDF renderer handles rendering.
 * This avoids any PDF.js bundle weight and works cross-browser.
 *
 * Falls back to a download link if the browser blocks inline PDF display
 * (some privacy modes / mobile browsers).
 *
 * Props — same shape as ImageViewer.
 */

import { useState } from "react"
import { Download, ExternalLink } from "lucide-react"
import Window from "../Window"

function PDFViewer({
  file,
  onClose,
  onMinimize,
  isActive,
  focusWindow,
  setIsAnyWindowMaximized,
}) {
  const [iframeError, setIframeError] = useState(false)

  // Some browsers won't load cross-origin PDFs in an iframe.
  // We detect the error and show a fallback.
  const handleIframeLoad = (e) => {
    try {
      // If the iframe document is empty or blocked, the title will be empty
      const doc = e.target.contentDocument
      if (doc && doc.title === "" && doc.body && doc.body.children.length === 0) {
        setIframeError(true)
      }
    } catch {
      // Cross-origin frame — can't inspect; assume it loaded fine
    }
  }

  return (
    <Window
      title={file.name ?? "PDF"}
      closeWindow={onClose}
      minimizeWindow={onMinimize}
      isActive={isActive}
      focusWindow={focusWindow}
      setIsAnyWindowMaximized={setIsAnyWindowMaximized}
      defaultPosition={{ x: 200, y: 60 }}
      width="72vw"
      height="82vh"
    >
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-xs text-white/50 truncate max-w-[60%]">{file.name}</span>
          <div className="flex items-center gap-1">
            <a
              href={file.storageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                         text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={13} />
              Open
            </a>
            <a
              href={file.storageUrl}
              download={file.name}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                         text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Download PDF"
            >
              <Download size={13} />
              Download
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 relative bg-zinc-900">
          {iframeError ? (
            <FallbackView file={file} />
          ) : (
            <iframe
              key={file.storageUrl}
              src={file.storageUrl}
              title={file.name}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={() => setIframeError(true)}
            />
          )}
        </div>
      </div>
    </Window>
  )
}

function FallbackView({ file }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-8">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(239,68,68,0.15)" }}
      >
        📄
      </div>
      <div>
        <p className="text-white/60 text-sm font-medium">{file.name}</p>
        <p className="text-white/30 text-xs mt-2">
          Your browser blocked inline PDF rendering.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href={file.storageUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     text-white hover:brightness-110 transition-all"
          style={{ background: "rgba(59,130,246,0.3)", border: "1px solid rgba(96,165,250,0.3)" }}
        >
          <ExternalLink size={15} />
          View in Browser
        </a>
        <a
          href={file.storageUrl}
          download={file.name}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     text-white/70 hover:text-white hover:bg-white/10 transition-all"
          style={{ border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <Download size={15} />
          Download
        </a>
      </div>
    </div>
  )
}

export default PDFViewer
