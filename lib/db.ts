import { collection, doc, setDoc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
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
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    // New user: Set all defaults!
    await setDoc(userRef, {
      email,
      lastLogin: serverTimestamp(),
      tankCapacity: 3000,
      waterRemaining: 3000,
      baseHeightMeters: 0.5,
      netWaterHeightMeters: 1.65,
      pipeLengthMeters: 20,
      irrigationType: 'drip',
      dripperCount: 300,
      dripperFlowRateLph: 8.0,
      valveSize: 'DN20',
      isScheduleActive: false,
      nextSchedule: "05:30",
      nextScheduleDay: "Belirtilmedi"
    });
  } else {
    // Existing user: Update lastLogin and set settings defaults ONLY if they are missing
    const data = userSnap.data();
    const updates: Record<string, any> = {
      lastLogin: serverTimestamp()
    };
    if (data.tankCapacity === undefined) updates.tankCapacity = 3000;
    if (data.waterRemaining === undefined) updates.waterRemaining = 3000;
    if (data.baseHeightMeters === undefined) updates.baseHeightMeters = 0.5;
    if (data.netWaterHeightMeters === undefined) updates.netWaterHeightMeters = 1.65;
    if (data.pipeLengthMeters === undefined) updates.pipeLengthMeters = 20;
    if (data.irrigationType === undefined) updates.irrigationType = 'drip';
    if (data.dripperCount === undefined) updates.dripperCount = 300;
    if (data.dripperFlowRateLph === undefined) updates.dripperFlowRateLph = 8.0;
    if (data.valveSize === undefined) updates.valveSize = 'DN20';
    if (data.isScheduleActive === undefined) updates.isScheduleActive = false;
    if (data.nextSchedule === undefined) updates.nextSchedule = "05:30";
    if (data.nextScheduleDay === undefined) updates.nextScheduleDay = "Belirtilmedi";
    
    await updateDoc(userRef, updates);
  }
};

export const subscribeToUserSettings = (email: string, callback: (settings: any) => void) => {
  const userId = email.replaceAll('.', '_').replaceAll('@', '_');
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error fetching user settings:", error);
  });
};

export const updateUserSettings = async (email: string, updates: Record<string, any>) => {
  const userId = email.replaceAll('.', '_').replaceAll('@', '_');
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
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
