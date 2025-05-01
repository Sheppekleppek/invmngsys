import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For demo purposes, we're using placeholders - replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCJZpPr-Fs2_C5H9SLfmNXwzv9bFcdfh1w",
  authDomain: "sheppek-leppek.firebaseapp.com",
  projectId: "sheppek-leppek",
  storageBucket: "sheppek-leppek.appspot.com",
  messagingSenderId: "798183567580",
  appId: "1:798183567580:web:e1f7b3a4cec02beb2b8419"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { app, firestore, auth };