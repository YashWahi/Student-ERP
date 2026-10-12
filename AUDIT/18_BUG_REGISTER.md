# Bug Register & Resolution Matrix — EduERP Pro

| Bug ID | Severity | File / Component | Problem Description | Root Cause | Fix Summary | Retest Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | P0 | `StudentList.jsx` | `ReferenceError: selectedLead is not defined` crash | Variable name mismatch (`selectedLead` instead of `selectedStudent`) | Replaced all references with `selectedStudent` | VERIFIED_RESOLVED |
| **BUG-002** | P0 | `AdmissionsCRM.jsx` | `ReferenceError: useEffect is not defined` crash | Missing `useEffect` React import | Added `useEffect` to line 2 imports | VERIFIED_RESOLVED |
| **BUG-003** | P1 | `Login.jsx` | Access Restricted redirect loop on login | `fromPath` redirected admin users to `/superadmin` | Added role-safe path validation | VERIFIED_RESOLVED |
| **BUG-004** | P1 | `authStore.js` / `useAuth.js` | Session logout on page refresh (F5) | `partialize` omitted `user` & `userProfile` from localStorage | Persisted `user` & `userProfile` in `authStore` | VERIFIED_RESOLVED |
| **BUG-005** | P1 | `StudentAdmission.jsx` | `₹50,012,002,000` net payable string concatenation bug | HTML inputs evaluated string addition (`'500' + 1200`) | Added `parseInt()` wrappers on all fee inputs | VERIFIED_RESOLVED |
| **BUG-006** | P1 | `authService.js` | Student email `man@gmail.com` logging in as Branch Admin | Default fallback role was set to `'admin'` | Added student roster lookup & student role mapping | VERIFIED_RESOLVED |
| **BUG-007** | P1 | `App.jsx` | `/student/exams` & `/student/vault` returned 404 Page Not Found | Sub-routes omitted under `/student` in `App.jsx` | Added `<Route path="exams">` & `<Route path="vault">` | VERIFIED_RESOLVED |
| **BUG-008** | P1 | `razorpayService.js` | Razorpay popup "Payment Failed" error | Passing dummy `order_id` in Test Mode without backend API | Omitted dummy `order_id` for test mode checkout | VERIFIED_RESOLVED |
| **BUG-009** | P2 | `ClassManagement.jsx` | Demo teachers showing in custom college dropdowns | Hardcoded teacher option tags in modal select | Dynamically map teachers from tenant roster | VERIFIED_RESOLVED |
| **BUG-010** | P2 | `ExamsAndResults.jsx` | Demo students showing in custom college dropdowns | Hardcoded student option tags in modal select | Dynamically map students from tenant roster | VERIFIED_RESOLVED |
| **BUG-011** | P2 | `globals.css` / `Sidebar.jsx` | Grid cards overflow & squished sidebar on laptop/tablet screens | `grid-2` forced 2 columns on 1200px width screens | Raised responsive threshold to 1400px & added flex-wrap | VERIFIED_RESOLVED |
