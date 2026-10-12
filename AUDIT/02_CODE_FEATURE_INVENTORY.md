# Code Feature Inventory — EduERP Pro

| Feature | Route | Page Component | Service / Store | Backend Entity | Permission | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin Dashboard** | `/superadmin` | `Overview.jsx` | `tenantService` | Firestore `tenants` | `superadmin` | VERIFIED_WORKING |
| **College Provisioning** | `/superadmin/colleges/create` | `CreateCollege.jsx` | `tenantService` | Firestore `tenants`, `users` | `superadmin` | VERIFIED_WORKING |
| **Subscriptions Billing** | `/superadmin/subscriptions` | `Subscriptions.jsx` | `tenantService` | Firestore `subscriptions` | `superadmin` | VERIFIED_WORKING |
| **Theme Studio** | `/superadmin/theme-studio` | `ThemeStudio.jsx` | `tenantService` | Firestore `tenants` | `superadmin` | VERIFIED_WORKING |
| **Module Control** | `/superadmin/modules` | `ModuleControl.jsx` | `tenantService` | LocalStorage / Firestore | `superadmin` | VERIFIED_WORKING |
| **Branch Admin Overview** | `/admin` | `Overview.jsx` | `feeService`, `studentService` | Firestore `students` | `admin` | VERIFIED_WORKING |
| **Student Admission Wizard** | `/admin/students/admit` | `StudentAdmission.jsx` | `studentService`, `studentStore` | Firestore `students` | `admin` | VERIFIED_WORKING |
| **Student Directory** | `/admin/students` | `StudentList.jsx` | `studentStore` | Firestore `students` | `admin` | VERIFIED_WORKING |
| **Admissions CRM** | `/admin/admissions-crm` | `AdmissionsCRM.jsx` | `crmStore` | Firestore `leads` | `admin` | VERIFIED_WORKING |
| **Fee Structure & Billing** | `/admin/fees` | `FeeStructure.jsx` | `feeService` | Firestore `fees`, `receipts` | `admin` | VERIFIED_WORKING |
| **Teacher Management** | `/admin/teachers` | `TeacherManagement.jsx` | `teacherService` | Firestore `teachers` | `admin` | VERIFIED_WORKING |
| **HR & Payroll** | `/admin/hr-payroll` | `HRPayroll.jsx` | `operationsService` | Firestore `staff` | `admin` | VERIFIED_WORKING |
| **Classes & Sections** | `/admin/classes` | `ClassManagement.jsx` | `academicService` | Firestore `classes` | `admin` | VERIFIED_WORKING |
| **Exams & Results** | `/admin/exams-results` | `ExamsAndResults.jsx` | `academicService` | Firestore `exams`, `marks` | `admin` | VERIFIED_WORKING |
| **Timetable Builder** | `/admin/timetable` | `TimetableBuilder.jsx` | `academicService` | Firestore `timetable` | `admin` | VERIFIED_WORKING |
| **Transport Management** | `/admin/transport` | `TransportManagement.jsx` | `operationsService` | LocalStorage / Firestore | `admin` | VERIFIED_WORKING |
| **Library Management** | `/admin/library` | `LibraryManagement.jsx` | `operationsService` | LocalStorage / Firestore | `admin` | VERIFIED_WORKING |
| **Hostel Management** | `/admin/hostel` | `HostelManagement.jsx` | `operationsService` | LocalStorage / Firestore | `admin` | VERIFIED_WORKING |
| **Communication Hub** | `/admin/communication` | `CommunicationCenter.jsx` | `communicationService` | Firestore `notices` | `admin` | VERIFIED_WORKING |
| **Reports Engine** | `/admin/reports` | `ReportsEngine.jsx` | `exportService`, `pdfService` | Dynamic Calculation | `admin` | VERIFIED_WORKING |
| **Student Portal** | `/student` | `StudentPortal.jsx` | `studentService` | Firestore `students` | `student` | VERIFIED_WORKING |
| **Student Exams & Vault** | `/student/exams`, `/student/vault` | `StudentPortal.jsx` | `studentService` | Firestore `exams`, `vault` | `student` | VERIFIED_WORKING |
| **Online Fee Payment** | `/student/fees` | `StudentPortal.jsx` | `razorpayService` | Razorpay Checkout SDK | `student` | VERIFIED_WORKING |
| **Teacher Workspace** | `/teacher` | `TeacherWorkspace.jsx` | `teacherService` | Firestore `teachers` | `teacher` | VERIFIED_WORKING |
| **Parent Portal** | `/parent` | `ParentPortal.jsx` | `parentService` | Firestore `students` | `parent` | VERIFIED_WORKING |
| **Staff Overview** | `/staff` | `Overview.jsx` | `operationsService` | Firestore `staff` | `staff` | VERIFIED_WORKING |
