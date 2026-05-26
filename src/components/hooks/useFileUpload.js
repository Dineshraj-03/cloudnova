import { useState, useCallback } from "react"
import { createFile } from "../filesystem"

const CLOUD_NAME    = "dppdlfyew"
const UPLOAD_PRESET = "cloudnova"
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`

function mimeToType(mimeType = "") {
  if (mimeType.startsWith("image/"))  return "image"
  if (mimeType.startsWith("video/"))  return "video"
  if (mimeType === "application/pdf") return "pdf"
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("presentation")
  ) return "document"
  return "upload"
}

let _counter = 0
const nextId = () => `upload_${Date.now()}_${++_counter}`

export function useFileUpload(uid, folderId, onSuccess) {
  const [uploads, setUploads] = useState([])

  const patchUpload = useCallback((id, patch) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    )
  }, [])

  const uploadFiles = useCallback((fileList) => {
    if (!uid) return
    const files = Array.from(fileList)
    if (!files.length) return

    files.forEach((file) => {
      const id  = nextId()
      const xhr = new XMLHttpRequest()

      setUploads((prev) => [
        ...prev,
        { id, name: file.name, status: "uploading", progress: 0, error: null, xhr },
      ])

      // Only upload_preset and folder are allowed for unsigned uploads
      const form = new FormData()
      form.append("file",          file)
      form.append("upload_preset", UPLOAD_PRESET)
      form.append("folder",        `cloudnova/${uid}/${folderId ?? "root"}`)

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return
        patchUpload(id, { progress: Math.round((e.loaded / e.total) * 100) })
      }

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText)
            await createFile(uid, {
              name:        file.name,
              type:        mimeToType(file.type),
              folderId:    folderId ?? null,
              content:     "",
              mimeType:    file.type || null,
              storageUrl:  res.secure_url,
              storagePath: res.public_id,
              size:        file.size,
            })
            patchUpload(id, { status: "done", progress: 100 })
            onSuccess?.()
          } catch (err) {
            patchUpload(id, { status: "error", error: err.message ?? "Failed to save metadata" })
          }
        } else {
          let message = "Upload failed"
          try { message = JSON.parse(xhr.responseText)?.error?.message ?? message } catch {}
          patchUpload(id, { status: "error", error: message })
        }
      }

      xhr.onerror = () => patchUpload(id, { status: "error", error: "Network error" })
      xhr.onabort = () => patchUpload(id, { status: "cancelled", progress: 0, error: null })

      xhr.open("POST", UPLOAD_URL)
      xhr.send(form)
    })
  }, [uid, folderId, onSuccess, patchUpload])

  const cancelUpload = useCallback((id) => {
    setUploads((prev) => {
      const u = prev.find((u) => u.id === id)
      if (u?.xhr && u.status === "uploading") u.xhr.abort()
      return prev
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading"))
  }, [])

  return { uploads, uploadFiles, cancelUpload, clearCompleted }
}

export default useFileUpload