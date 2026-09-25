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

  await ensureFirebaseCallableIdentity(cleanEmail, password);

  // 0. FIRST check custom_users in LocalStorage (Instantly matches newly created Admin/Teacher/Student/Staff!)
  try {
    const localUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
    const matchedUser = localUsers.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
    if (matchedUser) {
      const userObj = { uid: matchedUser.uid || `user_${Date.now()}`, email: cleanEmail, displayName: matchedUser.name };
      return { user: userObj, profile: matchedUser };
    }
  } catch (e) {
    console.warn('LocalStorage user lookup error:', e);
  }

  // 0b. Check custom_tenants in LocalStorage (Instantly matches newly created College Admin!)
  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const matchedTenant = localTenants.find(t => (t.email || '').toLowerCase().trim() === cleanEmail || (t.adminEmail || '').toLowerCase().trim() === cleanEmail);
    if (matchedTenant) {
      const tenantUser = { uid: `user_${matchedTenant.id}`, email: cleanEmail, displayName: matchedTenant.adminName || matchedTenant.name };
      const tenantProfile = {
        uid: tenantUser.uid,
        email: cleanEmail,
        name: matchedTenant.adminName || matchedTenant.name,
        role: 'admin',
        tenantId: matchedTenant.tenantId || matchedTenant.id,
        branchId: 'branch_main',
        status: 'Active',
        schoolName: matchedTenant.name,
      };
      return { user: tenantUser, profile: tenantProfile };
    }
  } catch (e) {
    console.warn('LocalStorage tenant lookup error:', e);
  }

  // 1. FIRST check Firestore 'users' collection for an exact matching registered user/admin profile!
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', cleanEmail));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const userDoc = snap.docs[0].data();
      const userObj = {
        uid: userDoc.uid || snap.docs[0].id,
        email: cleanEmail,
        displayName: userDoc.name || cleanEmail.split('@')[0],
      };
      return {
        user: userObj,
        profile: {
          ...userDoc,
          uid: userObj.uid,
          email: cleanEmail,
          status: 'Active',
        }
      };
    }
  } catch (err) {
    console.warn('Firestore users lookup error:', err.message);
  }

  // 2. SECOND check Firestore 'tenants' collection for email / adminEmail match!
  try {
    const tenantsRef = collection(db, 'tenants');
    const snap = await getDocs(tenantsRef);
    const matchedTenantDoc = snap.docs.find(d => {
      const data = d.data();
      return (data.email || '').toLowerCase().trim() === cleanEmail || (data.adminEmail || '').toLowerCase().trim() === cleanEmail;
    });

    if (matchedTenantDoc) {
      const tenantData = matchedTenantDoc.data();
      const userObj = { uid: `user_${matchedTenantDoc.id}`, email: cleanEmail, displayName: tenantData.name };
      const tenantProfile = {
        uid: userObj.uid,
        email: cleanEmail,
        name: tenantData.name || 'College Admin',
        role: 'admin',
        tenantId: tenantData.tenantId || matchedTenantDoc.id,
        branchId: 'branch_main',
        status: 'Active',
        schoolName: tenantData.name,
      };
      return { user: userObj, profile: tenantProfile };
    }
  } catch (err) {
    console.warn('Firestore tenants lookup error:', err.message);
  }

  // 3. SuperAdmin reserved credentials check (only if explicitly superadmin email or contains 'superadmin')
  if (cleanEmail === 'superadmin@gmail.com' || cleanEmail === 'superadmin@eduerp.com' || cleanEmail === 'superadmin') {
    const superUser = { uid: 'superadmin_manik_001', email: cleanEmail, displayName: 'Manik Kumar (Super Admin)' };
    const superProfile = {
      uid: 'superadmin_manik_001',
      email: cleanEmail,
      name: 'Manik Kumar (Super Admin)',
      role: 'superadmin',
      tenantId: 'tenant_platform',
      branchId: 'branch_main',
      createdAt: new Date().toISOString(),
    };
    return { user: superUser, profile: superProfile };
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    let profile = await getUserProfile(cred.user.uid);
    if (!profile) {
      const isSuper = cleanEmail.includes('super');
      const assignedRole = isSuper ? 'superadmin' : cleanEmail.includes('teacher') ? 'teacher' : cleanEmail.includes('student') ? 'student' : cleanEmail.includes('parent') ? 'parent' : cleanEmail.includes('staff') ? 'staff' : 'admin';
      profile = {
        uid: cred.user.uid,
        email: cred.user.email,
        name: cred.user.displayName || email.split('@')[0],
        role: assignedRole,
        tenantId: 'tenant_gvis',
        branchId: 'branch_main',
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    }
    return { user: cred.user, profile };
  } catch (err) {
    console.warn('Firebase Auth Fallback for:', cleanEmail, err.code);

    // 1. Check custom_users in LocalStorage (Created via SuperAdmin / SubAdmin)
    try {
      const localUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      const matchedUser = localUsers.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
      if (matchedUser) {
        const userObj = { uid: matchedUser.uid || `user_${Date.now()}`, email: cleanEmail, displayName: matchedUser.name };
        return { user: userObj, profile: matchedUser };
      }
    } catch (e) {
      console.warn('LocalStorage user lookup error:', e);
    }

    // 2. Check custom_tenants in LocalStorage (Created via SuperAdmin CreateCollege)
    try {
      const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
      const matchedTenant = localTenants.find(t => (t.email || '').toLowerCase().trim() === cleanEmail || (t.adminEmail || '').toLowerCase().trim() === cleanEmail);
      if (matchedTenant) {
        const tenantUser = { uid: `user_${matchedTenant.id}`, email: cleanEmail, displayName: matchedTenant.adminName || matchedTenant.name };
        const tenantProfile = {
          uid: tenantUser.uid,
          email: cleanEmail,
          name: matchedTenant.adminName || matchedTenant.name,
          role: 'admin',
          tenantId: matchedTenant.tenantId || matchedTenant.id,
          branchId: 'branch_main',
          status: 'Active',
          schoolName: matchedTenant.name,
        };
        return { user: tenantUser, profile: tenantProfile };
      }
    } catch (e) {
      console.warn('LocalStorage tenant lookup error:', e);
    }

    // 3. Check custom_branches in LocalStorage (Created via SubAdmin)
    try {
      const localBranches = JSON.parse(localStorage.getItem('custom_branches') || '[]');
      const matchedBranch = localBranches.find(b => (b.email || '').toLowerCase().trim() === cleanEmail || (b.adminEmail || '').toLowerCase().trim() === cleanEmail);
      if (matchedBranch) {
        const branchUser = { uid: `user_${matchedBranch.id}`, email: cleanEmail, displayName: matchedBranch.admin || matchedBranch.headAdminName || 'Branch Admin' };
        const branchProfile = {
          uid: branchUser.uid,
          email: cleanEmail,
          name: matchedBranch.admin || matchedBranch.headAdminName || 'Branch Admin',
          role: 'admin',
          tenantId: matchedBranch.tenantId || 'tenant_gvis',
          branchId: matchedBranch.branchId || matchedBranch.id,
          status: 'Active',
          schoolName: matchedBranch.name,
        };
        return { user: branchUser, profile: branchProfile };
      }
    } catch (e) {
      console.warn('LocalStorage branch lookup error:', e);
    }

    // 3.5 Check students-roster-storage in LocalStorage for matching student/parent emails
    try {
      const rosterStorage = JSON.parse(localStorage.getItem('students-roster-storage') || '{}');
      const rosterList = rosterStorage.state?.students || [];
      const studentMatch = rosterList.find(s =>
        (s.studentEmail || '').toLowerCase().trim() === cleanEmail ||
        (s.email || '').toLowerCase().trim() === cleanEmail ||
        (s.parentEmail || '').toLowerCase().trim() === cleanEmail
      );

      if (studentMatch) {
        const isParentEmail = (studentMatch.parentEmail || '').toLowerCase().trim() === cleanEmail;
        const studentUser = { uid: studentMatch.id || `user_${Date.now()}`, email: cleanEmail, displayName: isParentEmail ? studentMatch.parentName : studentMatch.name };
        const studentProfile = {
          uid: studentUser.uid,
          email: cleanEmail,
          name: isParentEmail ? studentMatch.parentName : studentMatch.name,
          role: isParentEmail ? 'parent' : 'student',
          tenantId: studentMatch.tenantId || 'tenant_gvis',
          branchId: 'branch_main',
          status: 'Active',
          schoolName: 'Student Portal',
        };
        return { user: studentUser, profile: studentProfile };
      }
    } catch (e) {
      console.warn('LocalStorage student roster lookup error:', e);
    }

    // 4. Role Inference for any newly entered email
    let inferredRole = 'student';
    let inferredName = cleanEmail.split('@')[0] || 'User';

    if (cleanEmail.includes('teacher') || cleanEmail.includes('priya')) {
      inferredRole = 'teacher';
      inferredName = 'Mrs. Priya Sharma';
    } else if (cleanEmail.includes('student') || cleanEmail.includes('arjun') || cleanEmail === 'man@gmail.com' || cleanEmail.startsWith('man')) {
      inferredRole = 'student';
      inferredName = cleanEmail.split('@')[0] || 'Student User';
    } else if (cleanEmail.includes('parent') || cleanEmail.includes('suresh')) {
      inferredRole = 'parent';
      inferredName = 'Mr. Suresh Verma';
    } else if (cleanEmail.includes('staff') || cleanEmail.includes('ramesh')) {
      inferredRole = 'staff';
      inferredName = 'Ramesh Singh';
    } else if (cleanEmail.includes('subadmin')) {
      inferredRole = 'subadmin';
      inferredName = 'Sub-Admin Manager';
    } else if (cleanEmail.includes('admin') || cleanEmail.includes('rajesh') || cleanEmail.includes('college')) {
      inferredRole = 'admin';
      inferredName = 'College Admin';
    }

    const fallbackUser = {
      uid: `uid_${inferredRole}_${Date.now()}`,
      email: cleanEmail,
      displayName: inferredName,
    };
    const fallbackProfile = {
      uid: fallbackUser.uid,
      email: cleanEmail,
      name: inferredName,
      role: inferredRole,
      tenantId: inferredRole === 'superadmin' ? 'tenant_platform' : `tenant_${cleanEmail.split('@')[0]}`,
      branchId: 'branch_main',
      status: 'Active',
    };
    return { user: fallbackUser, profile: fallbackProfile };
  }
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
