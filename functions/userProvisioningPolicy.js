'use strict';

const ROLES_BY_PROVISIONER = {
  superadmin: new Set(['superadmin', 'subadmin', 'admin', 'teacher', 'student', 'parent', 'staff']),
  subadmin: new Set(['admin', 'teacher', 'student', 'parent', 'staff']),
  admin: new Set(['teacher', 'student', 'parent', 'staff']),
};

exports.authorizeUserRoleAssignment = ({ callerProfile, role, tenantId }) => {
  const callerRole = String(callerProfile?.role || '').toLowerCase();
  const requestedRole = String(role || '').toLowerCase();
  const allowedRoles = ROLES_BY_PROVISIONER[callerRole];

  if (callerProfile?.isActive === false || callerProfile?.status === 'Suspended') {
    return { ok: false, code: 'permission-denied', message: 'Inactive accounts cannot provision users.' };
  }

  if (!allowedRoles || !allowedRoles.has(requestedRole)) {
    return { ok: false, code: 'permission-denied', message: 'Your role cannot provision this user role.' };
  }

  if (requestedRole === 'superadmin') {
    return tenantId
      ? { ok: false, code: 'invalid-argument', message: 'A superadmin profile cannot belong to a tenant.' }
      : { ok: true, role: requestedRole, tenantId: null };
  }

  if (!tenantId) {
    return { ok: false, code: 'invalid-argument', message: 'A tenant is required for this user role.' };
  }

  if (callerRole !== 'superadmin' && callerProfile.tenantId !== tenantId) {
    return { ok: false, code: 'permission-denied', message: 'Users can only be provisioned in your tenant.' };
  }

  return { ok: true, role: requestedRole, tenantId };
};
