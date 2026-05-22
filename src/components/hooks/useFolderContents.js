/**
 * useFolderContents.js — CloudNova
 *
 * Reusable hook that loads folders + files for a given folderId.
 * Extracted from FolderWindow so it can be used by any component
 * that needs to display filesystem contents.
 *
 * WHY a hook instead of inline useEffect in FolderWindow:
 * - Allows multiple windows to independently load the same folder
 *   without sharing state (each mount gets its own loading/error/data)
 * - Makes the load logic unit-testable outside of any component tree
 * - Keeps FolderWindow.jsx focused on UI concerns only
 *
 * Returns
 * ───────
 * {
 *   folders   : Array<FolderDoc>
 *   files     : Array<FileDoc>
 *   allItems  : Array<FolderDoc|FileDoc>   merged, folders first
 *   loading   : boolean
 *   error     : string | null
 *   reload    : () => void
 * }
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { getFolders, getFiles } from "../filesystem"

export function useFolderContents(uid, folderId) {
  const [folders,  setFolders]  = useState([])
  const [files,    setFiles]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // WHY: reloadKey is a counter that loadContents closes over.
  // Calling reload() increments it, which triggers the useEffect
  // without needing to pass reload as a dep of loadContents.
  const [reloadKey, setReloadKey] = useState(0)

  // WHY: cancelled flag prevents setState after unmount when the
  // async getFolders/getFiles resolves on a component that's gone.
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false
    return () => { cancelledRef.current = true }
  }, [])

  useEffect(() => {
    if (!uid || !folderId) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getFolders(uid, folderId),
      getFiles(uid, folderId),
    ])
      .then(([f, fi]) => {
        if (cancelled || cancelledRef.current) return
        setFolders(f)
        setFiles(fi)
        setError(null)
      })
      .catch((err) => {
        if (cancelled || cancelledRef.current) return
        console.error("CloudNova [useFolderContents]:", err)
        setError(err.message ?? "Failed to load folder contents")
      })
      .finally(() => {
        if (cancelled || cancelledRef.current) return
        setLoading(false)
      })

    return () => { cancelled = true }
  // reloadKey intentionally included so reload() triggers a re-fetch
  }, [uid, folderId, reloadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  // Merge folders + files into one list, folders always first
  const allItems = [
    ...folders.map((f) => ({ ...f, itemType: "folder" })),
    ...files.map((f)   => ({ ...f, itemType: f.type   })),
  ]

  return { folders, files, allItems, loading, error, reload }
}