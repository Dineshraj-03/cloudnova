/**
 * filesystem.js — CloudNova
 *
 * Firestore filesystem schema + helper functions.
 * Storage backend: Cloudinary (free tier, no credit card required).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloudinary deletion
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloudinary's unsigned upload preset does NOT allow client-side deletion —
 * the Delete API requires an API secret which must never be in client code.
 *
 * Safe approach used here:
 *   - On delete, we call Cloudinary's "invalidate" via a signed URL — but
 *     since we have no server, we instead mark the file deleted in Firestore
 *     and remove the Firestore record. The Cloudinary asset remains on their
 *     CDN but is no longer referenced anywhere in the app.
 *   - For a production app, a Firebase Cloud Function would handle actual
 *     Cloudinary deletion. For dev/free tier this is acceptable.
 *   - The storagePath (public_id) is preserved in Firestore until deletion
 *     so a future server-side cleanup job can remove orphaned assets.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COLLECTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * users/{uid}/folders/{folderId}
 *   id, label, parentId, createdAt, updatedAt
 *
 * users/{uid}/files/{fileId}
 *   id, name, type, folderId, content, mimeType,
 *   storageUrl, storagePath (Cloudinary public_id), size,
 *   createdAt, updatedAt
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../firebase"

// ─────────────────────────────────────────────────────────────────────────────
// Collection references
// ─────────────────────────────────────────────────────────────────────────────

export const foldersRef = (uid) => collection(db, "users", uid, "folders")
export const filesRef   = (uid) => collection(db, "users", uid, "files")

// ─────────────────────────────────────────────────────────────────────────────
// ROOT NOTE
// ─────────────────────────────────────────────────────────────────────────────

export const ROOT_NOTE_ID = "root-note"

export async function bootstrapRootNote(uid) {
  const noteDocRef = doc(db, "users", uid, "files", ROOT_NOTE_ID)
  const noteSnap   = await getDoc(noteDocRef)

  if (noteSnap.exists()) return noteSnap.data().content ?? ""

  let migratedContent = ""
  try {
    const legacySnap = await getDoc(doc(db, "notes", uid))
    if (legacySnap.exists()) migratedContent = legacySnap.data().content ?? ""
  } catch (err) {
    console.warn("CloudNova [bootstrapRootNote] legacy read skipped:", err.code)
  }

  await setDoc(noteDocRef, {
    name: "Notes", type: "note", folderId: null,
    content: migratedContent, mimeType: null,
    storageUrl: null, storagePath: null, size: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  }, { merge: true })

  return migratedContent
}

export async function saveRootNote(uid, content) {
  await updateDoc(doc(db, "users", uid, "files", ROOT_NOTE_ID), {
    content,
    updatedAt: serverTimestamp(),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// FOLDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function createFolder(uid, label, parentId = null) {
  const ref = await addDoc(foldersRef(uid), {
    label, parentId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getFolders(uid, parentId = null) {
  const q    = query(foldersRef(uid), where("parentId", "==", parentId), orderBy("createdAt", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function renameFolder(uid, folderId, newLabel) {
  await updateDoc(doc(foldersRef(uid), folderId), {
    label: newLabel, updatedAt: serverTimestamp(),
  })
}

export async function deleteFolder(uid, folderId) {
  // Delete all files inside (Firestore only — Cloudinary assets are orphaned,
  // acceptable for free tier; a Cloud Function would clean Cloudinary)
  const q    = query(filesRef(uid), where("folderId", "==", folderId))
  const snap = await getDocs(q)
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(foldersRef(uid), folderId))
}

// ─────────────────────────────────────────────────────────────────────────────
// FILES
// ─────────────────────────────────────────────────────────────────────────────

export async function createFile(uid, {
  name,
  type        = "note",
  folderId    = null,
  content     = "",
  mimeType    = null,
  storageUrl  = null,
  storagePath = null,   // Cloudinary public_id for uploaded files
  size        = null,
}) {
  const ref = await addDoc(filesRef(uid), {
    name, type, folderId, content, mimeType,
    storageUrl, storagePath, size,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getFileById(uid, fileId) {
  const snap = await getDoc(doc(filesRef(uid), fileId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getFiles(uid, folderId = null) {
  const q    = query(filesRef(uid), where("folderId", "==", folderId), orderBy("createdAt", "asc"))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateFileContent(uid, fileId, content) {
  await updateDoc(doc(filesRef(uid), fileId), {
    content, updatedAt: serverTimestamp(),
  })
}

export async function renameFile(uid, fileId, newName) {
  await updateDoc(doc(filesRef(uid), fileId), {
    name: newName, updatedAt: serverTimestamp(),
  })
}

/**
 * Delete a file from Firestore.
 * storagePath (Cloudinary public_id) is accepted for API compatibility
 * but Cloudinary deletion requires a server-side signed request.
 * The Firestore record is always deleted immediately.
 */
export async function deleteFile(uid, fileId, storagePath = null) {
  // NOTE: Cloudinary deletion from the client is not possible without
  // exposing your API secret. The asset remains on Cloudinary's CDN
  // but is dereferenced from your app immediately.
  // To fully delete from Cloudinary, add a Firebase Cloud Function that
  // calls cloudinary.uploader.destroy(storagePath) server-side.
  if (storagePath) {
    console.info(
      "CloudNova [deleteFile] Cloudinary asset will be orphaned (client-side deletion not supported):",
      storagePath
    )
  }
  await deleteDoc(doc(filesRef(uid), fileId))
}

export async function moveFile(uid, fileId, newFolderId) {
  await updateDoc(doc(filesRef(uid), fileId), {
    folderId: newFolderId, updatedAt: serverTimestamp(),
  })
}

export async function moveFolder(uid, folderId, newParentId) {
  await updateDoc(doc(foldersRef(uid), folderId), {
    parentId: newParentId, updatedAt: serverTimestamp(),
  })
}