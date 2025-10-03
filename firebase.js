import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsBDzY-dq8ZTr3l2MoGr-PfZkc-Ep5Hkg",
  authDomain: "filipinoemigrantsdb-e367f.firebaseapp.com",
  projectId: "filipinoemigrantsdb-e367f",
  storageBucket: "filipinoemigrantsdb-e367f.firebasestorage.app",
  messagingSenderId: "424132154479",
  appId: "1:424132154479:web:f80cd8e0583e421782e99a",
  measurementId: "G-27LY2HR9M9"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
