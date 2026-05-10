import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Land, IrrigationSession } from '../types';

// Helper to get collection path
const getLandsCollectionPath = (email: string) => {
  const userId = email.replaceAll('.', '_').replaceAll('@', '_');
  return `users/${userId}/lands`;
};

const getHistoryCollectionPath = (email: string) => {
  const userId = email.replaceAll('.', '_').replaceAll('@', '_');
  return `users/${userId}/history`;
};

export const updateUserDocument = async (email: string) => {
  const userId = email.replaceAll('.', '_').replaceAll('@', '_');
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email,
    lastLogin: serverTimestamp()
  }, { merge: true });
};

export const addLand = async (email: string, land: Omit<Land, 'id'>) => {
  const path = getLandsCollectionPath(email);
  const docRef = await addDoc(collection(db, path), {
    ...land,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateLand = async (email: string, landId: string, updates: Partial<Land>) => {
  const path = getLandsCollectionPath(email);
  const landRef = doc(db, path, landId);
  await updateDoc(landRef, updates as any);
};

export const deleteLand = async (email: string, landId: string) => {
  const path = getLandsCollectionPath(email);
  const landRef = doc(db, path, landId);
  await deleteDoc(landRef);
};

export const subscribeToLands = (email: string, callback: (lands: Land[]) => void) => {
  const path = getLandsCollectionPath(email);
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const lands = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Land[];
    callback(lands);
  }, (error) => {
    console.error("Error fetching lands:", error);
  });
};

export const addHistorySession = async (email: string, session: Omit<IrrigationSession, 'id'>) => {
  const path = getHistoryCollectionPath(email);
  const docRef = await addDoc(collection(db, path), {
    ...session,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const subscribeToHistory = (email: string, callback: (sessions: IrrigationSession[]) => void) => {
  const path = getHistoryCollectionPath(email);
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IrrigationSession[];
    callback(sessions);
  }, (error) => {
    console.error("Error fetching history:", error);
  });
};
