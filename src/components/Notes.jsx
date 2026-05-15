import { useEffect, useState } from "react"
import Window from "./Window"

function Notes(props) {

  const [note, setNote] = useState("")

  useEffect(() => {
    const savedNote = localStorage.getItem("cloudnova-note")

    if (savedNote) {
      setNote(savedNote)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("cloudnova-note", note)
  }, [note])

  return (
    <Window
      title="Notes"
      closeWindow={props.closeNotes}
      minimizeWindow={props.minimizeNotes}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{
        x: 160,
        y: 80,
      }}
      width="500px"
      height="350px"
    >

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Write something..."
        className="w-full h-full bg-zinc-800 text-white p-4 outline-none resize-none"
      />

    </Window>
  )
}

export default Notes