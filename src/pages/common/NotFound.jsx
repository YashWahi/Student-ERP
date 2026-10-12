// src/pages/common/NotFound.jsx
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const { role } = useAuthStore();

  const getDashboardPath = () => {
    const ROLE_REDIRECT = {
      superadmin: '/superadmin',
      subadmin: '/subadmin',
      admin: '/admin',
      teacher: '/teacher',
      student: '/student',
      parent: '/parent',
      staff: '/staff',
    };
    return ROLE_REDIRECT[role] || '/login';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg-primary, #F8FAFC)',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        boxShadow: '0 20px 40px -15px rgba(15,23,42,0.08)',
        padding: 40,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--color-primary, #2563EB)', lineHeight: 1, marginBottom: 12 }}>
          404
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 28 }}>
          The page or module resource you are looking for doesn't exist, has been moved, or is under maintenance.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-primary w-full flex items-center justify-center gap-2"
            style={{ height: 44 }}
            onClick={() => navigate(getDashboardPath())}
          >
            <Home size={18} />
            <span>Return to Dashboard</span>
          </button>
          <button
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
            style={{ height: 44 }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            <span>Go Back Previous Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
