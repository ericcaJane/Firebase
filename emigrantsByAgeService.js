import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";

const emigrantsByAgeCollection = collection(db, "emigrantsByAge");

// CREATE (single)
export const addEmigrantByAge = async (data) => {
  const docRef = await addDoc(emigrantsByAgeCollection, data);
  return { id: docRef.id, ...data };  // ✅ now we return with ID
};


// CREATE MANY (batch, up to 500 at a time)
export const addManyEmigrantsByAge = async (rows) => {
  const chunks = [];
  for (let i = 0; i < rows.length; i += 500) {
    chunks.push(rows.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((row) => {
      const newDocRef = doc(emigrantsByAgeCollection); // ✅ generates auto-ID
      batch.set(newDocRef, row);
    });
    await batch.commit();
  }
};

// READ
export const getEmigrantsByAge = async () => {
  const snapshot = await getDocs(emigrantsByAgeCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateEmigrantByAge = async (id, data) => {
  const docRef = doc(db, "emigrantsByAge", id);
  await updateDoc(docRef, data);
};

// DELETE single
export const deleteEmigrantByAge = async (id) => {
  const docRef = doc(db, "emigrantsByAge", id);
  await deleteDoc(docRef);
};

// DELETE all
export const deleteAllEmigrantsByAge = async () => {
  const snapshot = await getDocs(emigrantsByAgeCollection);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
};
