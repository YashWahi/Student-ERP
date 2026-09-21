# Dashboard Data Audit — EduERP Pro

| Dashboard | KPI Label | Data Source | Calculation Logic | Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | Total Provisioned Colleges | Firestore `tenants` / `custom_tenants` | `tenants.length` | `Colleges.jsx` query | VERIFIED_WORKING |
| **SuperAdmin** | Active Subscriptions | Firestore `subscriptions` | `subs.filter(s => s.status === 'Active')` | `Subscriptions.jsx` query | VERIFIED_WORKING |
| **Branch Admin** | Total Registered Students | `studentStore` / Firestore `students` | `students.filter(s => s.tenantId === activeTenantId).length` | `StudentList.jsx` store | VERIFIED_WORKING |
| **Branch Admin** | Fee Collection Today | `feeService` | `sum(receipts.amountPaid where date == today)` | `Overview.jsx` calculation | VERIFIED_WORKING |
| **Student** | Monthly Attendance % | `studentService` | `presentDays / totalDays * 100` | `StudentPortal.jsx` profile | VERIFIED_WORKING |
| **Teacher** | Assigned Classes Count | `teacherService` | `classes.filter(c => c.classTeacher === teacherName)` | `TeacherWorkspace.jsx` | VERIFIED_WORKING |
