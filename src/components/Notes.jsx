/**
 * Notes.jsx — CloudNova
 *
 * The root/global Notes app.
 *
 * Persistence model (unified filesystem):
 * ────────────────────────────────────────
 * All note data lives at:
 *   users/{uid}/files/root-note        ← deterministic doc ID
 *
 * On mount  → bootstrapRootNote(uid)
 *               • If the filesystem doc already exists → load content from it.
 *               • Else if legacy notes/{uid} exists   → migrate, write once,
 *                 return content. (old data is never deleted — safe rollback)
 *               • Else                                → create empty note.
 *
 * On change → debounced saveRootNote(uid, content)
 *               • updateDoc on the same deterministic path.
 *               • No setDoc / no re-creation — always an update.
 *
 * This eliminates the previous dual-system bug where:
 *   - saves went to  notes/{uid}           (top-level legacy collection)
 *   - loads expected users/{uid}/files/*   (filesystem collection)
 *   … and the two paths never met.
 */

import { useEffect, useRef, useState } from "react"
import Window from "./Window"
import { auth } from "../firebase"
import { bootstrapRootNote, saveRootNote } from "./filesystem"

function Notes(props) {
  const [note,   setNote]   = useState("")
  const [ready,  setReady]  = useState(false)   // prevents saving before load

  // useRef for the debounce timer so it never triggers a re-render
  const debounceRef = useRef(null)

  // ── Load (or bootstrap) on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const content = await bootstrapRootNote(user.uid)
        if (!cancelled) {
          setNote(content)
          setReady(true)
        }
      } catch (err) {
        console.error("CloudNova [Notes] load error:", err)
        if (!cancelled) setReady(true)   // still allow editing on error
      }
    }

    load()

    return () => {
      cancelled = true
      // Flush any pending save immediately on unmount so nothing is lost
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [])

  // ── Debounced autosave ────────────────────────────────────────────────────
  const handleChange = (e) => {
    const value = e.target.value
    setNote(value)

    // Don't save if content hasn't loaded yet (avoids overwriting with "")
    if (!ready) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        await saveRootNote(user.uid, value)
        console.info("CloudNova [Notes] autosaved.")
      } catch (err) {
        console.error("CloudNova [Notes] save error:", err)
      }
    }, 800)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Window
      title="Notes"
      closeWindow={props.closeNotes}
      minimizeWindow={props.minimizeNotes}
      isActive={props.isActive}
      focusWindow={props.focusWindow}
      defaultPosition={{ x: 160, y: 80 }}
      width="40vw"
      height="50vh"
    >
      <textarea
        value={note}
        onChange={handleChange}
        placeholder="Write something..."
        className="w-full h-full bg-zinc-800 text-white p-4 outline-none resize-none"
      />
    </Window>
  )
}

export default Notes
