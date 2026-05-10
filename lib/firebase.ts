import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDk5Bf8nJYcssN6t6t4L_fM1oxlmPLkPf0",
  authDomain: "toptech-717ee.firebaseapp.com",
  projectId: "toptech-717ee",
  storageBucket: "toptech-717ee.firebasestorage.app",
  messagingSenderId: "227663480799",
  appId: "1:227663480799:web:1f57f590e2a522ef09a66a",
  measurementId: "G-C6096TE961"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
