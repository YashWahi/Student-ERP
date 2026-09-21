# Route Audit — EduERP Pro

| Route Path | Component | Guard / Allowed Roles | Tenant Context | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `Login.jsx` | Public | N/A | WORKING |
| `/setup` | `Setup.jsx` | Public | N/A | WORKING |
| `/superadmin` | `SuperAdminLayout` + `Overview` | `ProtectedRoute (superadmin)` | Platform (`tenant_platform`) | WORKING |
| `/superadmin/colleges` | `Colleges.jsx` | `ProtectedRoute (superadmin)` | Platform (`tenant_platform`) | WORKING |
| `/superadmin/colleges/create` | `CreateCollege.jsx` | `ProtectedRoute (superadmin)` | Platform (`tenant_platform`) | WORKING |
| `/superadmin/theme-studio` | `ThemeStudio.jsx` | `ProtectedRoute (superadmin)` | Target Tenant | WORKING |
| `/superadmin/subscriptions` | `Subscriptions.jsx` | `ProtectedRoute (superadmin)` | Platform (`tenant_platform`) | WORKING |
| `/admin` | `AdminLayout` + `Overview` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/students` | `StudentList.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/students/admit` | `StudentAdmission.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/admissions-crm` | `AdmissionsCRM.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/fees` | `FeeStructure.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/teachers` | `TeacherManagement.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/hr-payroll` | `HRPayroll.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/classes` | `ClassManagement.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/exams-results` | `ExamsAndResults.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/timetable` | `TimetableBuilder.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/transport` | `TransportManagement.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/admin/communication` | `CommunicationCenter.jsx` | `ProtectedRoute (admin)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/student` | `StudentLayout` + `StudentPortal` | `ProtectedRoute (student)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/student/exams` | `StudentPortal.jsx` | `ProtectedRoute (student)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/student/vault` | `StudentPortal.jsx` | `ProtectedRoute (student)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/teacher` | `TeacherLayout` + `TeacherWorkspace` | `ProtectedRoute (teacher)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/parent` | `ParentLayout` + `ParentPortal` | `ProtectedRoute (parent)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `/staff` | `StaffLayout` + `Overview` | `ProtectedRoute (staff)` | Active Tenant (`userProfile.tenantId`) | WORKING |
| `*` | `NotFound.jsx` | Public | N/A | WORKING |
