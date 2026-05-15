import { useState } from "react"

import Window from "./Window"

function Browser(props) {

  const [url, setUrl] = useState("https://example.com")

  const [currentUrl, setCurrentUrl] = useState(
    "https://example.com"
  )

  const openWebsite = () => {

    let formattedUrl = url

    if (!formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl
    }

    setCurrentUrl(formattedUrl)
  }

  return (
    <Window
      title="Browser"
      closeWindow={props.closeBrowser}
      minimizeWindow={props.minimizeBrowser}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 220,
        y: 90,
      }}
      width="900px"
      height="600px"
    >

      <div className="flex flex-col h-full bg-zinc-900">

        <div className="p-3 border-b border-zinc-700 flex gap-2">

          <input
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            placeholder="Enter website..."
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded-lg outline-none"
          />

          <button
            onClick={openWebsite}
            className="bg-blue-500 hover:bg-blue-600 transition text-white px-4 rounded-lg"
          >
            Go
          </button>

        </div>

        <iframe
          src={currentUrl}
          title="Browser"
          className="flex-1 bg-white"
        />

      </div>

    </Window>
  )
}

export default Browser