// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC30qMJ7jdrhxh8QYDTr0ZohiiV_BozqBg",
  authDomain: "dodoonglist.firebaseapp.com",
  projectId: "dodoonglist",
  storageBucket: "dodoonglist.firebasestorage.app",
  messagingSenderId: "814292358551",
  appId: "1:814292358551:web:f2c856aa8dba26779ee0d2",
  measurementId: "G-NCFLDSSWCE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;