import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCcOE1DkZSXb6rRmgjdSgqSsyVUXMLbDos",
  authDomain: "toptech-717ee.firebaseapp.com",
  projectId: "toptech-717ee",
  storageBucket: "toptech-717ee.firebasestorage.app",
  messagingSenderId: "227663480799",
  appId: "1:227663480799:web:1f57f590e2a522ef09a66a",
  measurementId: "G-C6096TE961"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
