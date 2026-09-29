const AUTHORIZED_ROLES = new Set([
  'superadmin',
  'subadmin',
  'admin',
  'teacher',
  'student',
  'parent',
  'staff',
]);

export const isAuthorizedUserProfile = (uid, profile) => Boolean(
  uid &&
  profile &&
  (!profile.uid || profile.uid === uid) &&
  profile.isActive !== false &&
  profile.status !== 'Suspended' &&
  AUTHORIZED_ROLES.has(profile.role)
);

export const matchesFirebaseSession = (firebaseUid, user, profile) => Boolean(
  firebaseUid &&
  user?.uid === firebaseUid &&
  profile?.uid === firebaseUid
);

export const hasAuthorizedRole = (authorizedRole, allowedRoles) => (
  allowedRoles.includes(authorizedRole)
);
