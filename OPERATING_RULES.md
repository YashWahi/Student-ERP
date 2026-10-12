# 🛡️ NON-NEGOTIABLE OPERATING RULES & COMPLEATENESS CHECKLIST
**Multi-Tenant School/College ERP SaaS — AI Coding Agent Operating Rules**

---

## 🛑 THE 15-POINT COMPLETENESS CHECKLIST
Before declaring any feature or workflow as **"IMPLEMENTED"**, the AI agent MUST explicitly verify all 15 dimensions:

1. **Where is the UI?** → Production-grade React layout, component, or screen.
2. **Where is the route?** → Registered route in `App.jsx` with active navigation links.
3. **Where is the permission?** → Evaluated via `hasPermission()` / `isModuleEnabled()` in `usePermissions.js`.
4. **Where is the validation?** → Schema or runtime input validation (Zod / HTML5 / custom check).
5. **Where is the database schema?** → Designated Cloud Firestore collection structure.
6. **Where is the service?** → Pure async service module handling Firestore CRUD operations.
7. **Where is the mutation?** → Atomic setDoc, updateDoc, or runTransaction write logic.
8. **Where is the loading state?** → Skeleton loaders or spinner feedback during async operations.
9. **Where is the error state?** → ErrorBoundary fallback or Toast error handling.
10. **Where is the success state?** → Toast feedback & automatic UI state refresh.
11. **Where is the empty state?** → Reusable `EmptyState` component when data arrays are empty.
12. **Where is the audit log?** → `logAuditEvent()` call saving mutation details to `auditLogs`.
13. **Where is the mobile behavior?** → Responsive layout, touch targets, and mobile scroller verification.
14. **Where is the security rule?** → Cloud Firestore `firestore.rules` & `storage.rules` matching query scope.
15. **Where is the test?** → Automated unit or integration assertion verifying functionality.

> ❌ **CRITICAL DIRECTIVE**: If ANY answer is missing, the feature is NOT complete.
> - NEVER hide incomplete functionality.
> - NEVER fake success.
> - NEVER use static fake data for production dashboards when database state exists.
> - NEVER claim a feature works without testing the complete workflow.

---

## 🏛️ CORE ARCHITECTURAL STANDARDS

### 1. Composite Authorization Model
- Authorization MUST evaluate `role + tenantId + branchId + moduleId + permission`.
- UI element hiding alone is NOT security. Backend Firestore Security Rules must enforce match constraints (`resource.data.tenantId == getTenantId()`).
- Server SDK and privileged backend paths MUST be secured independently.

### 2. Database-Driven Dynamic Theme Engine
- Themes MUST be injected as CSS custom properties (`--color-primary`, etc.) onto `document.documentElement.style`.
- Theme settings belong in `tenants/{tenantId}` in Cloud Firestore.
- Tenant A's custom theme MUST NEVER affect Tenant B's theme.

### 3. Complete Operational Workspaces
- All 7 role portals (SuperAdmin, SubAdmin, Branch Admin, Teacher, Student, Parent, Staff) must operate as real, full-featured operational workspaces with real database persistence, PDF generators, CSV exporters, and audit logging.
