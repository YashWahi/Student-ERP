// src/App.jsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './components/theme/ThemeProvider';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/globals.css';
import './styles/themes.css';

// Robust Lazy Loading Wrapper to handle dynamic asset hash updates on new deployments
const lazyRetry = (importFn) =>
  lazy(() =>
    importFn().catch((err) => {
      console.warn('Dynamic import failed, reloading to fetch latest assets...', err);
      // Automatically reload to fetch latest index.html and newly hashed production chunks
      window.location.reload();
      return new Promise(() => {});
    })
  );

// Lazy imports for performance
const Login = lazyRetry(() => import('./pages/auth/Login'));
const Setup = lazyRetry(() => import('./pages/auth/Setup'));
const NotFound = lazyRetry(() => import('./pages/common/NotFound'));

// SuperAdmin
const SuperAdminLayout = lazyRetry(() => import('./layouts/SuperAdminLayout'));
const SuperOverview = lazyRetry(() => import('./pages/superadmin/Overview'));
const Colleges = lazyRetry(() => import('./pages/superadmin/Colleges'));
const CreateCollege = lazyRetry(() => import('./pages/superadmin/CreateCollege'));
const Subscriptions = lazyRetry(() => import('./pages/superadmin/Subscriptions'));
const AuditLog = lazyRetry(() => import('./pages/superadmin/AuditLog'));
const ThemeStudio = lazyRetry(() => import('./pages/superadmin/ThemeStudio'));
const WebsiteBuilder = lazyRetry(() => import('./pages/superadmin/WebsiteBuilder'));
const ModuleControl = lazyRetry(() => import('./pages/superadmin/ModuleControl'));
const PlatformAnalytics = lazyRetry(() => import('./pages/superadmin/PlatformAnalytics'));
const UserDirectory = lazyRetry(() => import('./pages/superadmin/UserDirectory'));
const RBACPermissions = lazyRetry(() => import('./pages/superadmin/RBACPermissions'));
const CollegeLandingPage = lazyRetry(() => import('./pages/public/CollegeLandingPage'));

// SubAdmin
const SubAdminLayout = lazyRetry(() => import('./layouts/SubAdminLayout'));
const SubAdminOverview = lazyRetry(() => import('./pages/subadmin/Overview'));

// Admin
const AdminLayout = lazyRetry(() => import('./layouts/AdminLayout'));
const AdminOverview = lazyRetry(() => import('./pages/admin/Overview'));
const ClassManagement = lazyRetry(() => import('./pages/admin/ClassManagement'));
const StudentAdmission = lazyRetry(() => import('./pages/admin/StudentAdmission'));
const StudentList = lazyRetry(() => import('./pages/admin/StudentList'));
const StudentProfile = lazyRetry(() => import('./pages/admin/StudentProfile'));
const TeacherManagement = lazyRetry(() => import('./pages/admin/TeacherManagement'));
const AdminSettings = lazyRetry(() => import('./pages/admin/AdminSettings'));
const FeeStructure = lazyRetry(() => import('./pages/admin/FeeStructure'));
const AdmissionsCRM = lazyRetry(() => import('./pages/admin/AdmissionsCRM'));
const ExamsAndResults = lazyRetry(() => import('./pages/admin/ExamsAndResults'));
const HRPayroll = lazyRetry(() => import('./pages/admin/HRPayroll'));
const TimetableBuilder = lazyRetry(() => import('./pages/admin/TimetableBuilder'));
const TransportManagement = lazyRetry(() => import('./pages/admin/TransportManagement'));
const LibraryManagement = lazyRetry(() => import('./pages/admin/LibraryManagement'));
const HostelManagement = lazyRetry(() => import('./pages/admin/HostelManagement'));
const OperationsHub = lazyRetry(() => import('./pages/admin/OperationsHub'));
const CommunicationCenter = lazyRetry(() => import('./pages/admin/CommunicationCenter'));
const ReportsEngine = lazyRetry(() => import('./pages/admin/ReportsEngine'));

// Teacher
const TeacherLayout = lazyRetry(() => import('./layouts/TeacherLayout'));
const TeacherWorkspace = lazyRetry(() => import('./pages/teacher/TeacherWorkspace'));

// Student
const StudentLayout = lazyRetry(() => import('./layouts/StudentLayout'));
const StudentPortal = lazyRetry(() => import('./pages/student/StudentPortal'));

// Parent
const ParentLayout = lazyRetry(() => import('./layouts/ParentLayout'));
const ParentPortal = lazyRetry(() => import('./pages/parent/ParentPortal'));

// Staff
const StaffLayout = lazyRetry(() => import('./layouts/StaffLayout'));
const StaffOverview = lazyRetry(() => import('./pages/staff/Overview'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userProfile, role, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ marginTop: 16, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading Enterprise ERP...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const ROLE_REDIRECT = {
      superadmin: '/superadmin',
      subadmin: '/subadmin',
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      staff: '/staff',
    };
    if (userProfile?.isImpersonating && role && ROLE_REDIRECT[role]) {
      return <Navigate to={ROLE_REDIRECT[role]} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 32, height: 32, border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  </div>
);

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { role, user, logout, setUser, setUserProfile } = useAuthStore();

  const handleQuickSwitch = (targetRole, email) => {
    const roleNames = {
      superadmin: 'Super Admin Owner',
      subadmin: 'Sub-Admin Manager',
      admin: 'Dr. Rajesh Kumar',
      teacher: 'Mrs. Priya Sharma',
      student: 'Arjun Verma',
      parent: 'Mr. Suresh Verma',
      staff: 'Ramesh Singh'
    };
    const ROLE_REDIRECT = {
      superadmin: '/superadmin',
      subadmin: '/subadmin',
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      staff: '/staff',
    };
    const newUser = { uid: `uid_${targetRole}`, email };
    const newProfile = {
      uid: `uid_${targetRole}`,
      email,
      name: roleNames[targetRole] || 'Authorized User',
      role: targetRole,
      tenantId: 'tenant_gvis',
      branchId: 'branch_main',
    };
    setUser(newUser);
    setUserProfile(newProfile);
    toast.success(`🎉 Switched session to ${roleNames[targetRole]} (${targetRole.toUpperCase()})`);
    navigate(ROLE_REDIRECT[targetRole], { replace: true });
  };

  const handleReturnToDashboard = () => {
    const ROLE_REDIRECT = {
      superadmin: '/superadmin',
      subadmin: '/subadmin',
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      staff: '/staff',
    };
    navigate(ROLE_REDIRECT[role] || '/login');
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 500, width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -15px rgba(15,23,42,0.06)', padding: 36, textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
          {user ? `Your current session role (${role ? role.toUpperCase() : 'Guest'}) does not have permission to access this page.` : 'You are not logged in. Please sign in with an authorized account.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <button className="btn btn-primary w-full" style={{ height: 44 }} onClick={handleReturnToDashboard}>
            Return to My Authorized Workspace ({role ? role.toUpperCase() : 'SIGN IN'})
          </button>
          <button className="btn btn-secondary w-full" style={{ height: 44 }} onClick={handleSignOut}>
            Sign In with Different Account
          </button>
        </div>

        {/* QUICK 1-CLICK ROLE ACCESS BUTTONS */}
        <div style={{ paddingTop: 20, borderTop: '1px solid #F1F5F9', textAlign: 'left' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 10, textAlign: 'center' }}>
            QUICK ACCESS PERSONAS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: 'Super Admin', roleKey: 'superadmin', email: 'superadmin@gmail.com', icon: '🛡️' },
              { label: 'Branch Admin', roleKey: 'admin', email: 'admin@greenvalley.com', icon: '🏫' },
              { label: 'Teacher', roleKey: 'teacher', email: 'teacher@greenvalley.com', icon: '👩‍🏫' },
              { label: 'Student', roleKey: 'student', email: 'student@greenvalley.com', icon: '👨‍🎓' },
              { label: 'Parent', roleKey: 'parent', email: 'parent@test.com', icon: '👨‍👩‍👧' },
              { label: 'Staff', roleKey: 'staff', email: 'staff@greenvalley.com', icon: '👤' },
            ].map(p => (
              <button
                key={p.roleKey}
                type="button"
                className="btn btn-ghost btn-sm flex items-center gap-2"
                style={{
                  justifyContent: 'flex-start', padding: '8px 10px', fontSize: '0.78rem',
                  border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC',
                  color: '#334155', fontWeight: 600
                }}
                onClick={() => handleQuickSwitch(p.roleKey, p.email)}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<Login initialView="forgot" />} />
        <Route path="/reset-password" element={<Login initialView="reset" />} />
        <Route path="/invitation" element={<Login initialView="invitation" />} />
        <Route path="/onboarding" element={<Login initialView="onboarding" />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* SuperAdmin */}
        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperOverview />} />
          <Route path="colleges" element={<Colleges />} />
          <Route path="colleges/create" element={<CreateCollege />} />
          <Route path="theme-studio" element={<ThemeStudio />} />
          <Route path="website-builder" element={<WebsiteBuilder />} />
          <Route path="modules" element={<ModuleControl />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscriptions/expiring" element={<Subscriptions />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="analytics" element={<PlatformAnalytics />} />
          <Route path="users" element={<UserDirectory />} />
          <Route path="rbac" element={<RBACPermissions />} />
          <Route path="settings" element={<SuperOverview />} />
        </Route>

        {/* SubAdmin */}
        <Route path="/subadmin" element={<ProtectedRoute allowedRoles={['subadmin']}><SubAdminLayout /></ProtectedRoute>}>
          <Route index element={<SubAdminOverview />} />
          <Route path="branches" element={<SubAdminOverview />} />
          <Route path="branches/create" element={<CreateCollege />} />
          <Route path="admins" element={<SubAdminOverview />} />
          <Route path="analytics" element={<SubAdminOverview />} />
          <Route path="announcements" element={<SubAdminOverview />} />
          <Route path="notifications" element={<SubAdminOverview />} />
          <Route path="settings" element={<SubAdminOverview />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="admissions-crm" element={<AdmissionsCRM />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/admit" element={<StudentAdmission />} />
          <Route path="students/:id" element={<StudentProfile />} />
          <Route path="teachers" element={<TeacherManagement />} />
          <Route path="hr-payroll" element={<HRPayroll />} />
          <Route path="exams-results" element={<ExamsAndResults />} />
          <Route path="fees" element={<FeeStructure />} />
          <Route path="timetable" element={<TimetableBuilder />} />
          <Route path="transport" element={<TransportManagement />} />
          <Route path="library" element={<LibraryManagement />} />
          <Route path="hostel" element={<HostelManagement />} />
          <Route path="operations" element={<OperationsHub />} />
          <Route path="communication" element={<CommunicationCenter />} />
          <Route path="reports" element={<ReportsEngine />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherLayout /></ProtectedRoute>}>
          <Route index element={<TeacherWorkspace />} />
          <Route path="attendance" element={<TeacherWorkspace />} />
          <Route path="homework" element={<TeacherWorkspace />} />
          <Route path="results" element={<TeacherWorkspace />} />
          <Route path="compliance" element={<TeacherWorkspace />} />
          <Route path="materials" element={<TeacherWorkspace />} />
          <Route path="messages" element={<TeacherWorkspace />} />
          <Route path="leave" element={<TeacherWorkspace />} />
          <Route path="salary" element={<TeacherWorkspace />} />
        </Route>

        {/* Student */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentLayout /></ProtectedRoute>}>
          <Route index element={<StudentPortal />} />
          <Route path="timetable" element={<StudentPortal />} />
          <Route path="attendance" element={<StudentPortal />} />
          <Route path="homework" element={<StudentPortal />} />
          <Route path="exams" element={<StudentPortal />} />
          <Route path="results" element={<StudentPortal />} />
          <Route path="vault" element={<StudentPortal />} />
          <Route path="fees" element={<StudentPortal />} />
          <Route path="notebook" element={<StudentPortal />} />
          <Route path="quiz" element={<StudentPortal />} />
          <Route path="messages" element={<StudentPortal />} />
          <Route path="profile" element={<StudentPortal />} />
        </Route>

        {/* Parent */}
        <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentLayout /></ProtectedRoute>}>
          <Route index element={<ParentPortal />} />
          <Route path="attendance" element={<ParentPortal />} />
          <Route path="results" element={<ParentPortal />} />
          <Route path="fees" element={<ParentPortal />} />
          <Route path="messages" element={<ParentPortal />} />
          <Route path="ptm" element={<ParentPortal />} />
          <Route path="transport" element={<ParentPortal />} />
          <Route path="complaints" element={<ParentPortal />} />
        </Route>

        {/* Staff */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffLayout /></ProtectedRoute>}>
          <Route index element={<StaffOverview />} />
          <Route path="attendance" element={<StaffOverview />} />
          <Route path="leave" element={<StaffOverview />} />
          <Route path="salary" element={<StaffOverview />} />
          <Route path="hr-docs" element={<StaffOverview />} />
        </Route>

        {/* Public College Landing Pages */}
        <Route path="/college/:slug" element={<CollegeLandingPage />} />
        <Route path="/landing/:slug" element={<CollegeLandingPage />} />
        <Route path="/website/:slug" element={<CollegeLandingPage />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                fontSize: '0.875rem',
                fontWeight: 600,
              },
              success: { iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' } },
              error: { iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' } },
              duration: 4000,
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
