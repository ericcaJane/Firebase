// src/services/educationService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

const collectionName = "educationData";

// ✅ Add
export async function addEducationRecord(record) {
  return await addDoc(collection(db, collectionName), record);
}

// ✅ Get all
export async function getEducationRecords() {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// ✅ Update
export async function updateEducationRecord(id, record) {
  const ref = doc(db, collectionName, id);
  return await updateDoc(ref, record);
}

// ✅ Delete single
export async function deleteEducationRecord(id) {
  const ref = doc(db, collectionName, id);
  return await deleteDoc(ref);
}

// ✅ Delete ALL
export async function deleteAllEducationRecords() {
  const snapshot = await getDocs(collection(db, collectionName));
  const batch = snapshot.docs.map((docSnap) =>
    deleteDoc(doc(db, collectionName, docSnap.id))
  );
  return Promise.all(batch);
}
