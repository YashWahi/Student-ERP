// src/services/authService.js
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, functions } from '../config/firebase.js';
import { isAuthorizedUserProfile } from './authProfile.js';

const createErpUser = httpsCallable(functions, 'createErpUser');

const profileNotFoundError = () => {
  const error = new Error('No active, valid ERP user profile is assigned to this Firebase account.');
  error.code = 'auth/profile-not-found';
  return error;
};

const getAuthenticatedProfile = async (user) => {
  try {
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      throw profileNotFoundError();
    }
    return profile;
  } catch (error) {
    try {
      await signOut(auth);
    } catch (signOutError) {
      console.error('Unable to clear Firebase session after profile resolution failed:', signOutError);
    }
    throw error;
  }
};

export const loginUser = async (email, password) => {
  const cleanEmail = (email || '').toLowerCase().trim();
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  const profile = await getAuthenticatedProfile(cred.user);
  return { user: cred.user, profile };
};

const loginWithProvider = async (provider) => {
  const cred = await signInWithPopup(auth, provider);
  const profile = await getAuthenticatedProfile(cred.user);
  return { user: cred.user, profile };
};

export const loginWithGoogle = () => loginWithProvider(new GoogleAuthProvider());

export const loginWithMicrosoft = () => loginWithProvider(new OAuthProvider('microsoft.com'));

export const logoutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();
  if (!isAuthorizedUserProfile(uid, data)) {
    return null;
  }

  return { id: snap.id, ...data, uid };
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
  subject = '',
  qualification = '',
  schoolName = '',
  enabledModules = null,
}) => {
  const result = await createErpUser({
    email,
    name,
    password,
    role,
    tenantId,
    branchId,
    phone,
    avatar,
    subject,
    qualification,
    schoolName,
    enabledModules,
  });

  const account = result.data;
  if (!account?.user?.uid || account.profile?.uid !== account.user.uid) {
    throw new Error('User provisioning returned an invalid account profile.');
  }
  return account;
};
