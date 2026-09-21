# Permission Audit — EduERP Pro

## Role & Module Scoping
- **`ProtectedRoute` (`App.jsx`)**: Validates `allowedRoles` for every top-level layout route (`/superadmin`, `/subadmin`, `/admin`, `/teacher`, `/student`, `/parent`, `/staff`).
- **`usePermissions` Hook**: Validates module status against `tenantProfile.enabledModules`. If a module is disabled for a tenant (e.g. `transport`), sidebar navigation items and page views are hidden.
