import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCJZpPr-Fs2_C5H9SLfmNXwzv9bFcdfh1w",
  authDomain: "sheppek-leppek.firebaseapp.com",
  projectId: "sheppek-leppek",
  storageBucket: "sheppek-leppek.firebasestorage.app",
  messagingSenderId: "798183567580",
  appId: "1:798183567580:web:f8ec262795c10b4b2b8419",
  measurementId: "G-GB3PQ26P6B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;