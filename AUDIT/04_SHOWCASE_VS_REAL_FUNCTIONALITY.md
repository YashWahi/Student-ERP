# Showcase vs Real Functionality Audit — EduERP Pro

## Real Production Workflows
1. **Multi-Tenant College Provisioning**:
   - `CreateCollege.jsx` -> `tenantService.provisionNewCollegeTenant()` creates real tenant record with tenantId in Firestore/LocalStorage.
2. **Student Admission & Directory Synchronization**:
   - `StudentAdmission.jsx` & `StudentList.jsx` tag new records with `tenantId: activeTenantId`. Custom colleges operate on clean slate without leaking Green Valley demo records.
3. **Session Persistence**:
   - `authStore.js` persists `user` and `userProfile` in `auth-storage` (`localStorage`). `useAuth.js` hook prevents logout on `F5` refresh.
4. **Role Resolution**:
   - `authService.js` resolves role dynamically from user records/student roster instead of defaulting everything to Admin.
5. **Fee Payment & PDF Receipt Generation**:
   - `razorpayService.js` invokes Razorpay Checkout SDK without dummy order ID failures, records payment, and calls `pdfService.js` for instant PDF download.
6. **Responsive Layout Engine**:
   - Media queries in `globals.css` adapt grid structures (`.grid-4`, `.grid-3`, `.grid-2`) and convert sidebar to mobile slide-over drawer on screens `< 1400px`.

## Isolated Mock Fallbacks (Demo Mode Only)
- Default persona options (Green Valley International School demo data) are preserved exclusively for `tenant_gvis`.
- Custom colleges automatically start with empty arrays (`[]`) and build isolated rosters upon creation.
