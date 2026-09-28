// src/services/authService.js
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

// Establish the real Firebase Auth identity needed by callable Cloud Functions.
// loginUser() may resolve an application profile from LocalStorage or Firestore,
// but that application object is not Firebase Authentication and cannot supply
// request.auth. This helper is a side effect only: it signs the existing Auth
// account in when possible and returns control to the unchanged profile logic.
// A failure preserves the existing login behavior; Cloud Functions must still
// reject payment calls because request.auth remains mandatory server-side.
const ensureFirebaseCallableIdentity = async (cleanEmail, password) => {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );
    return credential.user;
  } catch (error) {
    console.warn(
      'Firebase callable identity unavailable:',
      error?.code || error?.message
    );
    return null;
  }
};

export const loginUser = async (email, password) => {
  const cleanEmail = (email || '').toLowerCase().trim();

  // 1. Authenticate with Firebase strictly. No bypasses.
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  // 2. Retrieve user profile based on the authenticated UID
  let profile = await getUserProfile(cred.user.uid);

  // 3. If no profile in 'users', check if they are a tenant admin in 'tenants'
  if (!profile) {
    const tenantsRef = collection(db, 'tenants');
    const snap = await getDocs(tenantsRef);
    const matchedTenantDoc = snap.docs.find(d => {
      const data = d.data();
      return (data.email || '').toLowerCase().trim() === cleanEmail || (data.adminEmail || '').toLowerCase().trim() === cleanEmail;
    });

    if (matchedTenantDoc) {
      const tenantData = matchedTenantDoc.data();
      profile = {
        uid: cred.user.uid,
        email: cleanEmail,
        name: tenantData.name || 'College Admin',
        role: 'admin',
        tenantId: tenantData.tenantId || matchedTenantDoc.id,
        branchId: 'branch_main',
        status: 'Active',
        schoolName: tenantData.name,
      };
    } else {
      // Do NOT infer roles or grant access without an explicit profile
      throw new Error('auth/user-not-found');
    }
  }

  return { user: cred.user, profile };
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    profile = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: cred.user.displayName || 'Google User',
      role: 'admin',
      tenantId: 'tenant_gvis',
      branchId: 'branch_main',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  }
  return { user: cred.user, profile };
};

export const loginWithMicrosoft = async () => {
  const provider = new OAuthProvider('microsoft.com');
  const cred = await signInWithPopup(auth, provider);
  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    profile = {
      uid: cred.user.uid,
      email: cred.user.email,
      name: cred.user.displayName || 'Microsoft User',
      role: 'admin',
      tenantId: 'tenant_gvis',
      branchId: 'branch_main',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  }
  return { user: cred.user, profile };
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const createUserAccount = async ({
  email,
  password,
  name,
  role,
  tenantId = null,
  branchId = null,
  phone = '',
  avatar = '',
}) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const profileData = {
    uid: cred.user.uid,
    email,
    name,
    role,
    tenantId,
    branchId,
    phone,
    avatar,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', cred.user.uid), profileData);
  return { user: cred.user, profile: profileData };
};
