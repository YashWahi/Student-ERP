# Firestore Collection Audit — EduERP Pro

| Collection | Read Services | Write Services | Tenant Scoped Filter | Status |
| :--- | :--- | :--- | :--- | :--- |
| `tenants` | `tenantService.getTenants` | `tenantService.provisionNewCollegeTenant` | N/A (Platform level) | VERIFIED_WORKING |
| `users` | `authService.getUserProfile` | `authService.loginUser`, `tenantService` | Filtered by `uid` / `tenantId` | VERIFIED_WORKING |
| `students` | `studentService.fetchStudents` | `studentService.addStudent` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `teachers` | `teacherService.getTeachers` | `teacherService.addTeacher` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `classes` | `academicService.getClasses` | `academicService.createClass` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `exams` | `academicService.getExams` | `academicService.createExamTerm` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `marks` | `academicService.getStudentMarks` | `academicService.saveStudentMarksTransaction` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `fees` | `feeService.getStudentFeeLedger` | `feeService.recordFeePayment` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `leads` | `crmStore` | `crmStore.addLead` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
| `subscriptions` | `tenantService` | `tenantService` | `where("tenantId", "==", tenantId)` | VERIFIED_WORKING |
