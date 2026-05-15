import { useEffect, useState } from "react"

import Window from "./Window"

import { auth, db } from "../firebase"

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore"

function Notes(props) {

  const [note, setNote] = useState("")

  useEffect(() => {

    const loadNote = async () => {

      const user = auth.currentUser

      if (!user) return

      const docRef = doc(db, "notes", user.uid)

      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setNote(docSnap.data().content)
      }

    }

    loadNote()

  }, [])

  const saveNote = async (value) => {

    setNote(value)

    const user = auth.currentUser

    if (!user) return

    await setDoc(
      doc(db, "notes", user.uid),
      {
        content: value,
      }
    )
  }

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
        onChange={(e) =>
          saveNote(e.target.value)
        }
        placeholder="Write something..."
        className="w-full h-full bg-zinc-800 text-white p-4 outline-none resize-none"
      />

    </Window>
  )
}

export default Notes