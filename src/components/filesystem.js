/**
 * filesystem.js — CloudNova
 *
 * Phase 3: Firestore filesystem schema + helper functions
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COLLECTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * users/{uid}/folders/{folderId}
 * ┌───────────────┬──────────────────────────────────────────────────────────┐
 * │ id            │ string   auto-id                                         │
 * │ label         │ string   display name                                    │
 * │ parentId      │ string | null   null = desktop root                      │
 * │ createdAt     │ Timestamp                                                │
 * │ updatedAt     │ Timestamp                                                │
 * └───────────────┴──────────────────────────────────────────────────────────┘
 *
 * users/{uid}/files/{fileId}
 * ┌───────────────┬──────────────────────────────────────────────────────────┐
 * │ id            │ string   auto-id                                         │
 * │ name          │ string   display name                                    │
 * │ type          │ "note" | "image" | "pdf" | "video" | "document"         │
 * │               │          | "upload" | "shortcut"                         │
 * │ folderId      │ string | null   null = desktop root                      │
 * │ content       │ string   (notes: markdown text; shortcut: target appId) │
 * │ mimeType      │ string | null   (for binary uploads)                     │
 * │ storageUrl    │ string | null   (Firebase Storage download URL)          │
 * │ storagePath   │ string | null   (Firebase Storage path, for deletion)    │
 * │ size          │ number | null   (bytes)                                  │
 * │ createdAt     │ Timestamp                                                │
 * │ updatedAt     │ Timestamp                                                │
 * └───────────────┴──────────────────────────────────────────────────────────┘
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY SUB-COLLECTIONS, NOT A FLAT ARRAY ON usersettings/{uid}?
 * ─────────────────────────────────────────────────────────────────────────────
 * - Firestore documents are limited to 1 MB. A flat array in usersettings
 *   would hit that ceiling with enough files.
 * - Sub-collections support real-time listeners per folder without pulling
 *   the entire filesystem on every mount.
 * - Security rules can be scoped: users can only read/write their own subtree.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXTENSIONS in this version
 * ─────────────────────────────────────────────────────────────────────────────
 * - createFile now accepts `storagePath` and `size` fields (for uploads)
 * - deleteFile accepts an optional `storagePath` and deletes from Storage too
 * - new: deleteUploadedFile(uid, fileId, storagePath) — Storage + Firestore
 * - new: getFileById(uid, fileId) — single file fetch
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import {
  ref as storageRef,
  deleteObject,
} from "firebase/storage"
import { db, storage } from "../firebase"

// ─────────────────────────────────────────────────────────────────────────────
// Collection references
// ─────────────────────────────────────────────────────────────────────────────

export const foldersRef = (uid) =>
  collection(db, "users", uid, "folders")

export const filesRef = (uid) =>
  collection(db, "users", uid, "files")

// ─────────────────────────────────────────────────────────────────────────────
// FOLDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new folder.
 * @param {string}      uid
 * @param {string}      label       Display name
 * @param {string|null} parentId    null = desktop root
 * @returns {Promise<string>}       New folder's Firestore ID
 */
export async function createFolder(uid, label, parentId = null) {
  const ref = await addDoc(foldersRef(uid), {
    label,
    parentId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Fetch all folders at a given parent level.
 * Pass parentId = null to list desktop-root folders.
 * @returns {Promise<Array<{ id, label, parentId, createdAt }>>}
 */
export async function getFolders(uid, parentId = null) {
  const q = query(
    foldersRef(uid),
    where("parentId", "==", parentId),
    orderBy("createdAt", "asc")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Rename a folder.
 */
export async function renameFolder(uid, folderId, newLabel) {
  await updateDoc(doc(foldersRef(uid), folderId), {
    label:     newLabel,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a folder and all its direct files (including Storage objects).
 * For nested folders call this recursively from the UI layer.
 */
export async function deleteFolder(uid, folderId) {
  // Delete all files inside this folder (+ their Storage objects)
  const q    = query(filesRef(uid), where("folderId", "==", folderId))
  const snap = await getDocs(q)

  const deletions = snap.docs.map(async (d) => {
    const data = d.data()
    if (data.storagePath) {
      try {
        await deleteObject(storageRef(storage, data.storagePath))
      } catch (err) {
        // Storage object may already be gone — log but don't block
        console.warn("CloudNova [deleteFolder] storage delete:", err.code)
      }
    }
    return deleteDoc(d.ref)
  })

  await Promise.all(deletions)
  await deleteDoc(doc(foldersRef(uid), folderId))
}

// ─────────────────────────────────────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new file (note, upload, shortcut, etc.)
 *
 * @param {string} uid
 * @param {object} payload
 *   name        string
 *   type        "note" | "image" | "pdf" | "video" | "document" | "upload"
 *   folderId    string | null
 *   content     string               (for notes)
 *   mimeType    string | null
 *   storageUrl  string | null        (Firebase Storage download URL)
 *   storagePath string | null        (Firebase Storage path — for deletion)
 *   size        number | null        (bytes)
 * @returns {Promise<string>} New file's Firestore ID
 */
export async function createFile(uid, {
  name,
  type        = "note",
  folderId    = null,
  content     = "",
  mimeType    = null,
  storageUrl  = null,
  storagePath = null,
  size        = null,
}) {
  const ref = await addDoc(filesRef(uid), {
    name,
    type,
    folderId,
    content,
    mimeType,
    storageUrl,
    storagePath,
    size,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Fetch a single file by ID.
 */
export async function getFileById(uid, fileId) {
  const snap = await getDoc(doc(filesRef(uid), fileId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Fetch all files in a folder.
 * Pass folderId = null to list desktop-root files.
 * @returns {Promise<Array>}
 */
export async function getFiles(uid, folderId = null) {
  const q = query(
    filesRef(uid),
    where("folderId", "==", folderId),
    orderBy("createdAt", "asc")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Update file content (e.g. autosave a note).
 */
export async function updateFileContent(uid, fileId, content) {
  await updateDoc(doc(filesRef(uid), fileId), {
    content,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Rename a file.
 */
export async function renameFile(uid, fileId, newName) {
  await updateDoc(doc(filesRef(uid), fileId), {
    name:      newName,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a file.
 * If the file has a storagePath, also deletes the Storage object.
 *
 * @param {string}      uid
 * @param {string}      fileId
 * @param {string|null} storagePath   Pass to also delete the Storage file.
 */
export async function deleteFile(uid, fileId, storagePath = null) {
  if (storagePath) {
    try {
      await deleteObject(storageRef(storage, storagePath))
    } catch (err) {
      console.warn("CloudNova [deleteFile] storage delete:", err.code)
    }
  }
  await deleteDoc(doc(filesRef(uid), fileId))
}

/**
 * Move a file to a different folder.
 */
export async function moveFile(uid, fileId, newFolderId) {
  await updateDoc(doc(filesRef(uid), fileId), {
    folderId:  newFolderId,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Move a folder to a different parent (for nested folders).
 */
export async function moveFolder(uid, folderId, newParentId) {
  await updateDoc(doc(foldersRef(uid), folderId), {
    parentId:  newParentId,
    updatedAt: serverTimestamp(),
  })
}