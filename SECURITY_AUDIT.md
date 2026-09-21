# 🔒 SCHOOL/COLLEGE ERP SAAS — SECURITY & ISOLATION AUDIT REPORT

**Document Version**: 1.8  
**Audit Target**: Cloud Firestore, Authentication, Authorization & Storage Security Rules

---

## 1. TENANT ISOLATION ASSESSMENT

### Current Model
The SaaS platform enforces multi-tenant data isolation by embedding a `tenantId` property on all tenant-specific documents (`users`, `students`, `classes`, `fees`, `attendance`, `timetables`).

### Risks Identified
1. **Firestore Open Security Rules**: `firestore.rules` is currently set to `allow read, write: if true;` for rapid prototyping.
2. **Client-Side Impersonation**: Admin impersonation in `Colleges.jsx` updates client state (`setRole('admin')`). While useful for demo purposes, backend calls must check authorization bounds before executing sensitive database writes.

### Remediation Blueprint (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isSuperAdmin() {
      return isAuthenticated() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }

    function getTenantId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenantId;
    }

    // Tenant Isolation Guard
    match /students/{studentId} {
      allow read, write: if isSuperAdmin() || (isAuthenticated() && resource.data.tenantId == getTenantId());
    }

    match /fees/{feeId} {
      allow read, write: if isSuperAdmin() || (isAuthenticated() && resource.data.tenantId == getTenantId());
    }
  }
}
```

---

## 2. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX

Permissions are evaluated using `usePermissions.js`:
- `students.read` / `students.create` / `students.delete`
- `fees.read` / `fees.collect`
- `attendance.mark`
- `reports.export`
- `theme.edit` (SuperAdmin scope only)

Disabled tenant modules in `tenants/{tenantId}/enabledModules` automatically revoke client access and filter sidebar routes.
