// src/tests/permissionsAndIsolation.test.js
import { hasPermission, validateTenantIsolation } from '../hooks/usePermissions.js';

// Unit Test 1: Permission Engine Evaluation
console.log('🧪 Running Test 1: Permission Engine Evaluation...');

const mockSuperAdminProfile = { role: 'superadmin', tenantId: 'platform' };
const mockTeacherProfile = { role: 'teacher', tenantId: 'tenant_01' };

const superAdminCanDelete = hasPermission(mockSuperAdminProfile, 'students.delete');
if (superAdminCanDelete !== true) {
  throw new Error('FAILED: SuperAdmin should have full platform permission students.delete');
}
console.log('  ✅ SuperAdmin permission check passed');

const teacherCanMarkAttendance = hasPermission(mockTeacherProfile, 'attendance.mark');
if (teacherCanMarkAttendance !== true) {
  throw new Error('FAILED: Teacher should have attendance.mark permission');
}
console.log('  ✅ Teacher permission check passed');

const teacherCanDeleteStudent = hasPermission(mockTeacherProfile, 'students.delete');
if (teacherCanDeleteStudent !== false) {
  throw new Error('FAILED: Teacher should NOT have students.delete permission');
}
console.log('  ✅ Teacher restriction check passed');


// Unit Test 2: Multi-Tenant Data Isolation Guard
console.log('\n🧪 Running Test 2: Multi-Tenant Isolation Guard...');

const userContext = { tenantId: 'tenant_A', role: 'admin' };
const tenantADocument = { tenantId: 'tenant_A', name: 'Arjun Verma' };
const tenantBDocument = { tenantId: 'tenant_B', name: 'Kabir Roy' };

const sameTenantAccess = validateTenantIsolation(userContext, tenantADocument);
if (sameTenantAccess !== true) {
  throw new Error('FAILED: User from Tenant A should access Tenant A document');
}
console.log('  ✅ Intra-tenant access allowed passed');

const crossTenantAccess = validateTenantIsolation(userContext, tenantBDocument);
if (crossTenantAccess !== false) {
  throw new Error('FAILED: User from Tenant A MUST NOT access Tenant B document!');
}
console.log('  ✅ Cross-tenant isolation violation blocked passed');

console.log('\n✨ ALL UNIT TESTS PASSED SUCCESSFULLY! 100% Isolation & Permission Compliance.');
