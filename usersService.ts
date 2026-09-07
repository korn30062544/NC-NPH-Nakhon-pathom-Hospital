import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { sanitizeForFirestore } from './firestoreUtil';

const COLLECTION = 'users';

export async function loadAllUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as User);
}

export async function updateUserProfile(id: string, patch: Partial<User>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), sanitizeForFirestore(patch));
}

/**
 * Removes the Firestore profile document only. This does NOT delete the
 * underlying Firebase Auth account — that requires the Admin SDK running
 * server-side (or a Cloud Function), which this client-only app doesn't
 * have. A "deleted" user disappears from every list here, but could still
 * technically sign in with their existing password (they just won't have a
 * profile, which loginUser() in authService.ts treats as an error and logs
 * them back out). For real access revocation, prefer setting their status
 * to 'Inactive' via updateUserProfile instead of deleting.
 */
export async function deleteUserProfile(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function addAdminRecord(id: string, email: string): Promise<void> {
  await setDoc(doc(db, 'admins', id), { id, email, role: 'admin' });
}

export async function removeAdminRecord(id: string): Promise<void> {
  await deleteDoc(doc(db, 'admins', id));
}
