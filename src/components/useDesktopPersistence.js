/**
 * useDesktopPersistence.js — CloudNova
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BUG FIXES (see inline WHY comments)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FIXED Bug 1 — Stale uid inside persistDesktop
 * ─────────────────────────────────────────────
 * OLD: uid was kept in uidRef via useEffect(() => { uidRef.current = uid }, [uid])
 *      useEffect runs AFTER the render that changed uid.
 *      If persistDesktop fired in the SAME render cycle (e.g. handleNewFolder
 *      called right after auth resolved), uidRef.current was still null.
 *
 * FIX: uid is no longer stored in a ref at all inside this hook.
 *      persistDesktop now accepts uid as a direct argument:
 *        persistDesktop(uid, nextPositions, nextItems)
 *      The caller always has the latest uid in scope at call time.
 *      No ref, no useEffect, no staleness possible.
 *
 * FIXED Bug 2 — customItemsRef / iconPositionsRef one render behind
 * ─────────────────────────────────────────────────────────────────
 * OLD: Desktop.jsx synced these refs with useEffect — same problem.
 *      Handlers that read the refs in the same cycle got the previous value.
 *
 * FIX: This hook has no opinion on those refs.
 *      Desktop.jsx uses write-through refs: update ref AND setState together,
 *      so every synchronous handler reads the freshly-computed next value
 *      directly, never relying on a ref that might lag.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Contract
 * ─────────────────────────────────────────────────────────────────────────────
 * loadDesktopData(uid)                      → Promise<{ customItems, iconPositions }>
 * persistDesktop(uid, positions, items)     → void (debounced 800 ms)
 */

import { useRef, useCallback, useEffect } from "react"
import { doc, getDoc, setDoc }            from "firebase/firestore"
import { db }                             from "../firebase"

// ─────────────────────────────────────────────────────────────────────────────
// Pure async loader — no hooks, no closures, easily testable
// ─────────────────────────────────────────────────────────────────────────────
export async function loadDesktopData(uid) {
  const empty = { customItems: [], iconPositions: {} }
  if (!uid) return empty

  try {
    const snap = await getDoc(doc(db, "usersettings", uid))
    if (!snap.exists()) return empty

    const data = snap.data()

    const customItems = Array.isArray(data.customItems)
      ? data.customItems.filter(
          (i) =>
            i &&
            typeof i.id    === "string" &&
            typeof i.label === "string" &&
            typeof i.type  === "string"
        )
      : []

    const iconPositions =
      data.iconPositions && typeof data.iconPositions === "object"
        ? Object.fromEntries(
            Object.entries(data.iconPositions).filter(
              ([, v]) => v && typeof v.x === "number" && typeof v.y === "number"
            )
          )
        : {}

    return { customItems, iconPositions }
  } catch (err) {
    console.error("CloudNova [loadDesktopData]:", err)
    return empty
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useDesktopPersistence() {
  // WHY: No uid param here anymore. Accepting uid as a direct argument to
  // persistDesktop means the caller passes the live value at call time.
  // There is no ref to go stale, no useEffect delay to race against.

  const timer = useRef(null)

  // uid arrives as a direct argument — always current, never from a stale closure
  const persistDesktop = useCallback((uid, nextPositions, nextItems) => {
    // WHY: Guard here instead of in a ref-check so the message is meaningful.
    if (!uid) {
      console.warn("CloudNova [persistDesktop]: uid not available yet — write skipped")
      return
    }

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await setDoc(
          doc(db, "usersettings", uid),
          {
            // WHY: Strip icon (JSX) and any extra fields — only plain data to Firestore.
            customItems: nextItems.map(({ id, label, type }) => ({ id, label, type })),
            iconPositions: nextPositions,
          },
          { merge: true }
        )
        console.debug(
          `CloudNova [persistDesktop]: saved ${nextItems.length} items,`,
          `${Object.keys(nextPositions).length} positions`
        )
      } catch (err) {
        console.error("CloudNova [persistDesktop]:", err)
      }
    }, 800)
  }, []) // stable forever — no captured state, uid is an argument

  useEffect(() => () => clearTimeout(timer.current), [])

  return { persistDesktop }
}