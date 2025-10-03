import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch   // ✅ added
} from 'firebase/firestore';

const emigrantsBySexCollection = collection(db, "emigrantsBySex");

// CREATE
export const addEmigrantBySex = async (data) => {
  await addDoc(emigrantsBySexCollection, data);
};

// READ
export const getEmigrantsBySex = async () => {
  const snapshot = await getDocs(emigrantsBySexCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// UPDATE
export const updateEmigrantBySex = async (id, data) => {
  const docRef = doc(db, "emigrantsBySex", id);
  await updateDoc(docRef, data);
};

// DELETE single
export const deleteEmigrantBySex = async (id) => {
  const docRef = doc(db, "emigrantsBySex", id);
  await deleteDoc(docRef);
};

// DELETE ALL
export const deleteAllEmigrantsBySex = async () => {
  const snapshot = await getDocs(emigrantsBySexCollection);
  const batch = writeBatch(db);
  snapshot.forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
};
