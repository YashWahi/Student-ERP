# Authentication Audit — EduERP Pro

## Auth Flow Verification
1. **User Login (`authService.js` -> `loginUser`)**:
   - Accepts email & password.
   - Searches Firestore `users` collection, custom user profiles in LocalStorage (`custom_users`), and student roster (`students-roster-storage`).
   - Maps user email to role (`superadmin`, `subadmin`, `admin`, `teacher`, `student`, `parent`, `staff`).
2. **Session Persistence (`authStore.js` & `useAuth.js`)**:
   - `authStore` persists `user` and `userProfile` in `auth-storage` (`localStorage`).
   - Page refresh (`F5`) retains active session without forcing unnecessary logout.
3. **Logout Flow**:
   - `logoutUser()` resets Zustand state and clears session tokens.
