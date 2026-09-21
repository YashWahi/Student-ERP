# Button & Action Handler Audit — EduERP Pro

| Dashboard | Page | Component | Button Text | Handler / Target | Service Called | DB Operation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | `CreateCollege` | `CreateCollege.jsx` | `Provision College` | `handleSubmit` | `tenantService` | `setDoc(tenants)` | WORKING |
| **SuperAdmin** | `ThemeStudio` | `ThemeStudio.jsx` | `Save Theme` | `handleSaveTheme` | `tenantService` | `updateDoc(tenants)` | WORKING |
| **Admin** | `StudentAdmission` | `StudentAdmission.jsx` | `Confirm & Admit` | `handleFinalSubmit` | `studentStore` | `addStudent(tenantId)` | WORKING |
| **Admin** | `StudentList` | `StudentList.jsx` | `Quick Add Student` | `handleQuickAddStudent` | `studentStore` | `addStudent(tenantId)` | WORKING |
| **Admin** | `StudentList` | `StudentList.jsx` | `Export CSV` | `exportToCSV` | `exportService` | CSV File Download | WORKING |
| **Admin** | `AdmissionsCRM` | `AdmissionsCRM.jsx` | `Add New Lead` | `handleCreateLead` | `crmStore` | `addLead(tenantId)` | WORKING |
| **Admin** | `ClassManagement` | `ClassManagement.jsx` | `Create Class` | `handleCreateClass` | `academicService` | `setDoc(classes)` | WORKING |
| **Admin** | `ExamsAndResults` | `ExamsAndResults.jsx` | `Save Marks` | `handleSaveMarks` | `academicService` | `setDoc(marks)` | WORKING |
| **Admin** | `Transport` | `TransportManagement.jsx` | `Clear Routes` | `handleClearRoutes` | `operationsService` | LocalStorage Reset | WORKING |
| **Student** | `StudentPortal` | `StudentPortal.jsx` | `Pay Fee (₹18,500)` | `handlePayFee` | `razorpayService` | Razorpay Checkout SDK | WORKING |
| **Student** | `StudentPortal` | `StudentPortal.jsx` | `Submit Homework` | `handleHomeworkSubmit` | `studentService` | `setDoc(homework)` | WORKING |
| **Student** | `StudentPortal` | `StudentPortal.jsx` | `Download ID Card` | `generateStudentIDCardPDF` | `pdfService` | PDF Document Render | WORKING |
| **Teacher** | `TeacherWorkspace` | `TeacherWorkspace.jsx` | `Save Attendance` | `handleSaveAttendance` | `teacherService` | `setDoc(attendance)` | WORKING |
| **Parent** | `ParentPortal` | `ParentPortal.jsx` | `Pay Child Fees` | `handlePayFee` | `razorpayService` | Razorpay Checkout SDK | WORKING |
