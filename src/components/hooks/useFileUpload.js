/**
 * useFileUpload.js — CloudNova
 *
 * Handles file uploads to Firebase Storage + Firestore metadata.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Metadata structure written to Firestore (users/{uid}/files/{fileId})
 * ─────────────────────────────────────────────────────────────────────────────
 * {
 *   id          : string   (Firestore auto-id)
 *   folderId    : string   (parent folder)
 *   type        : "image" | "pdf" | "video" | "document" | "upload"
 *   name        : string   (original filename)
 *   storagePath : string   (path inside Firebase Storage bucket)
 *   downloadURL : string   (publicly accessible URL)
 *   mimeType    : string
 *   size        : number   (bytes)
 *   createdAt   : Timestamp
 *   updatedAt   : Timestamp
 * }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY Firebase Storage + Firestore (not just Firestore)?
 * ─────────────────────────────────────────────────────────────────────────────
 * Firestore documents max out at 1 MB. Binary files must live in Storage.
 * Firestore holds only metadata + the download URL, keeping documents small
 * and queries fast.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage
 * ─────────────────────────────────────────────────────────────────────────────
 * const { uploads, uploadFiles, cancelUpload, clearCompleted } = useFileUpload(uid, folderId)
 *
 * uploads: Array<UploadEntry> — live upload progress list
 *   { id, name, progress, status: "uploading"|"done"|"error", error? }
 *
 * uploadFiles(FileList | File[]) — start uploading one or many files
 * cancelUpload(id)               — cancel an in-progress upload
 * clearCompleted()               — remove done/error entries from the list
 */

import { useState, useCallback, useRef } from "react"
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage"
import { storage } from "../../firebase"
import { createFile } from "../filesystem"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a CloudNova file type from a MIME type string.
 * Falls back to "upload" for unknown types.
 */
function mimeToType(mimeType = "") {
  if (mimeType.startsWith("image/"))                           return "image"
  if (mimeType === "application/pdf")                          return "pdf"
  if (mimeType.startsWith("video/"))                          return "video"
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )                                                            return "document"
  return "upload"
}

/**
 * Build the Storage path for a user's file.
 * Pattern: uploads/{uid}/{folderId}/{timestamp}_{filename}
 * The timestamp prefix prevents collisions when the same file is re-uploaded.
 */
function buildStoragePath(uid, folderId, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
  return `uploads/${uid}/${folderId}/${Date.now()}_${safeName}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useFileUpload(uid, folderId, onUploadComplete) {
  // uploads: Array<{ id, name, progress, status, error, task }>
  const [uploads, setUploads] = useState([])

  // WHY ref: tasksRef holds the UploadTask objects so cancelUpload()
  // can call task.cancel() without them being in state (which would
  // cause re-renders on every progress tick).
  const tasksRef = useRef({})

  const updateUpload = useCallback((id, patch) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    )
  }, [])

  const uploadFiles = useCallback(
    (fileList) => {
      if (!uid || !folderId) {
        console.warn("CloudNova [useFileUpload]: uid or folderId missing")
        return
      }

      const files = Array.from(fileList)

      files.forEach((file) => {
        const uploadId  = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const path      = buildStoragePath(uid, folderId, file.name)
        const fileType  = mimeToType(file.type)
        const sRef      = storageRef(storage, path)
        const task      = uploadBytesResumable(sRef, file)

        // Register in state immediately so UI shows the entry
        setUploads((prev) => [
          ...prev,
          { id: uploadId, name: file.name, progress: 0, status: "uploading" },
        ])

        // Store task reference for cancellation
        tasksRef.current[uploadId] = task

        task.on(
          "state_changed",
          // Progress snapshot
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
            updateUpload(uploadId, { progress: pct })
          },
          // Error
          (err) => {
            console.error("CloudNova [useFileUpload] upload error:", err)
            updateUpload(uploadId, { status: "error", error: err.message })
            delete tasksRef.current[uploadId]
          },
          // Complete
          async () => {
            try {
              const downloadURL = await getDownloadURL(task.snapshot.ref)

              // Write metadata to Firestore
              await createFile(uid, {
                name:       file.name,
                type:       fileType,
                folderId,
                content:    "",
                mimeType:   file.type,
                storageUrl: downloadURL,
                storagePath: path,
                size:       file.size,
              })

              updateUpload(uploadId, { status: "done", progress: 100 })
              delete tasksRef.current[uploadId]

              // Notify parent to reload folder contents
              onUploadComplete?.()
            } catch (err) {
              console.error("CloudNova [useFileUpload] metadata write error:", err)
              updateUpload(uploadId, { status: "error", error: err.message })
              delete tasksRef.current[uploadId]
            }
          }
        )
      })
    },
    [uid, folderId, onUploadComplete, updateUpload]
  )

  const cancelUpload = useCallback((id) => {
    tasksRef.current[id]?.cancel()
    delete tasksRef.current[id]
    setUploads((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((u) => u.status === "uploading"))
  }, [])

  return { uploads, uploadFiles, cancelUpload, clearCompleted }
}