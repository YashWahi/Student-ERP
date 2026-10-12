'use strict';

const assert = require('node:assert/strict');
const { authorizeUserRoleAssignment } = require('./userProvisioningPolicy');

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a' },
  role: 'teacher',
  tenantId: 'tenant-a',
}).ok, true);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a' },
  role: 'admin',
  tenantId: 'tenant-a',
}).ok, false);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a' },
  role: 'superadmin',
  tenantId: null,
}).ok, false);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a', email: 'admin@example.test' },
  role: 'admin',
  tenantId: 'tenant-a',
}).ok, false);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a', isActive: false },
  role: 'teacher',
  tenantId: 'tenant-a',
}).ok, false);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'admin', tenantId: 'tenant-a' },
  role: 'teacher',
  tenantId: 'tenant-b',
}).ok, false);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'subadmin', tenantId: 'tenant-a' },
  role: 'admin',
  tenantId: 'tenant-a',
}).ok, true);

assert.equal(authorizeUserRoleAssignment({
  callerProfile: { role: 'superadmin', tenantId: null },
  role: 'admin',
  tenantId: 'tenant-b',
}).ok, true);

console.log('Trusted user provisioning authorization tests passed.');
