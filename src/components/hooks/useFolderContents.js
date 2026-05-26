import { useState, useEffect, useCallback } from "react"
import { getFolders, getFiles } from "../filesystem"

export function useFolderContents(uid, folderId) {
  const [allItems, setAllItems] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tick,     setTick]     = useState(0)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (!uid) {
      setAllItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      getFolders(uid, folderId),
      getFiles(uid, folderId),
    ])
      .then(([folders, files]) => {
        if (cancelled) return
        const folderItems = folders.map((f) => ({ ...f, itemType: "folder" }))
        const fileItems   = files.map((f)   => ({ ...f, itemType: f.type  }))
        const ms = (ts) => ts?.toMillis?.() ?? 0
        folderItems.sort((a, b) => ms(a.createdAt) - ms(b.createdAt))
        fileItems.sort((a, b)   => ms(a.createdAt) - ms(b.createdAt))
        setAllItems([...folderItems, ...fileItems])
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("CloudNova [useFolderContents]:", err)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [uid, folderId, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  return { allItems, loading, reload }
}

export default useFolderContents
