import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, DepartmentKey } from '../types';
import { sanitizeForFirestore } from './firestoreUtil';

/**
 * FIX (security): the original LoginScreen had a hardcoded email/password
 * ("sithikorn247@gmail.com" / "korn30062544") baked directly into the
 * client-side bundle that granted instant Super Admin access to anyone who
 * typed it — visible to anyone who opens browser dev tools, and doubly
 * exposed since this project's source is in a public GitHub repo. There
 * was also a fully fake "forgot password" flow that displayed the OTP code
 * on screen instead of sending anything. Both are gone. Authentication is
 * now handled entirely by Firebase Auth (real accounts, real passwords,
 * real password-reset emails). If "korn30062544" was ever a real password
 * for this or any other account, it should be treated as compromised.
 */

export function subscribeToAuthChanges(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

async function isFirstUserEver(): Promise<boolean> {
  const snap = await getCountFromServer(collection(db, 'users'));
  return snap.data().count === 0;
}

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  licenseNumber: string;
  departmentName: string;
  departmentKey: DepartmentKey;
  position: string;
}

/**
 * Creates a real Firebase Auth account plus a matching Firestore profile
 * document. The very first person to ever sign up becomes Super Admin
 * automatically (there is no other admin yet to promote them) and is also
 * added to the `admins` collection that firestore.rules checks for
 * privileged writes. Everyone after that starts as a regular user — an
 * existing admin must promote them from the User Management screen.
 */
export async function registerUser(params: RegisterParams): Promise<User> {
  const firstUser = await isFirstUserEver();
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(cred.user, { displayName: params.fullName });

  const nameParts = params.fullName.trim().split(' ');
  const initials =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : params.fullName.slice(0, 2).toUpperCase();

  const profile: User = {
    id: cred.user.uid,
    name: params.fullName.trim(),
    role: firstUser ? 'Super Admin (เจ้าของระบบสูงสุด)' : params.position.trim(),
    roleType: firstUser ? 'Super Admin' : 'Medical Technologist',
    tier: firstUser ? 'super_admin' : 'user',
    department: params.departmentName,
    departmentKey: params.departmentKey,
    status: 'Active',
    lastActive: 'เพิ่งสมัคร',
    email: params.email.trim().toLowerCase(),
    employeeId: firstUser ? 'OWNER-0001' : `MT-${Math.floor(1000 + Math.random() * 9000)}`,
    licenseNumber: params.licenseNumber,
    position: params.position.trim(),
    avatarText: initials,
    avatarBg: firstUser ? '#f59e0b' : '#0ea5e9',
    uploadedFilesCount: 0,
  };
  // NOTE: password is intentionally NOT stored on the profile document —
  // Firebase Auth owns credentials now, unlike the old mock User records
  // which kept a plaintext `password` field in app state.

  await setDoc(doc(db, 'users', cred.user.uid), sanitizeForFirestore(profile));
  if (firstUser) {
    await setDoc(doc(db, 'admins', cred.user.uid), { id: cred.user.uid, email: profile.email, role: 'super_admin' });
  }
  return profile;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await fetchUserProfile(cred.user.uid);
  if (!profile) {
    await signOut(auth);
    throw new Error('ไม่พบข้อมูลโปรไฟล์ผู้ใช้งานนี้ในระบบ กรุณาติดต่อผู้ดูแลระบบ');
  }
  if (profile.status === 'Pending Approval') {
    await signOut(auth);
    throw new Error('บัญชีนี้อยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Pending Approval)');
  }
  if (profile.status === 'Inactive') {
    await signOut(auth);
    throw new Error('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }
  return profile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/** Real password-reset email via Firebase Auth (replaces the old fake OTP UI). */
export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}
