import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, LogOut, User, Settings, ChevronDown,
  HelpCircle, ShieldAlert, Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../theme/ThemeProvider';
import { logoutUser } from '../../services/authService';
import CommandSearch from '../common/CommandSearch';
import toast from 'react-hot-toast';

const Navbar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, role, logout, academicSession, setAcademicSession } = useAuthStore();
  const { theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);
  const userMenuRef = useRef(null);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandSearch(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const notifications = [
    { id: 1, icon: '⚠️', text: '3 college subscriptions expiring in 7 days', time: '5m ago', type: 'warning' },
    { id: 2, icon: '🏫', text: 'New admission for Rohan Sharma (Class 10-A)', time: '1h ago', type: 'info' },
    { id: 3, icon: '💳', text: 'Fee receipt generated #REC-89210', time: '3h ago', type: 'success' },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const collegeTitle = theme?.branding?.collegeName || userProfile?.schoolName || '';

  return (
    <>
      <header className={`header ${collapsed ? 'collapsed' : ''}`}>
        <div className="flex items-center gap-3 flex-1">
          <button className="btn btn-ghost btn-icon" onClick={onToggle} title="Toggle Sidebar">
            <Menu size={18} />
          </button>

          {/* Active Workspace / Role Indicator Header Badge */}
          <div className="role-badge-header" style={{
            padding: '5px 12px', fontSize: '0.78rem', fontWeight: 800,
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)', border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--border-radius-md)', display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap'
          }}>
            {role === 'superadmin' && '🛡️ Super Admin'}
            {role === 'subadmin' && '🏢 Sub Admin'}
            {role === 'admin' && (collegeTitle ? `🏫 ${collegeTitle}` : '🏫 Branch Admin')}
            {role === 'teacher' && (collegeTitle ? `👩‍🏫 ${collegeTitle}` : '👩‍🏫 Teacher Workspace')}
            {role === 'student' && (collegeTitle ? `👨‍🎓 ${collegeTitle}` : '👨‍🎓 Student Portal')}
            {role === 'parent' && (collegeTitle ? `👨‍👩‍👧 ${collegeTitle}` : '👨‍👩‍👧 Parent Portal')}
            {role === 'staff' && (collegeTitle ? `👤 ${collegeTitle}` : '👤 Staff Portal')}
            {(!role || role === 'guest') && '🎓 EduERP'}
          </div>

          {/* Academic Year Selector */}
          <div className="academic-session-box" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 600 }}>Session:</span>
            <select
              className="form-select academic-session-select"
              value={academicSession || '2026-27'}
              onChange={(e) => {
                setAcademicSession(e.target.value);
                toast.success(`📅 Academic Session switched to ${e.target.value}`);
              }}
              style={{ padding: '3px 8px', fontSize: '0.75rem', width: 95 }}
            >
              <option value="2026-27">2026-27</option>
              <option value="2025-26">2025-26</option>
              <option value="2024-25">2024-25</option>
            </select>
          </div>

          {/* Global Command Search Box */}
          <div
            className="search-erp-box"
            onClick={() => setShowCommandSearch(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '6px 12px', cursor: 'pointer',
              maxWidth: 240, width: '100%',
              color: 'var(--color-text-muted)', fontSize: '0.8rem',
              transition: 'var(--transition-fast)',
            }}
          >
            <Search size={14} />
            <span style={{ flex: 1 }}>Search ERP...</span>
            <kbd style={{
              fontSize: '0.65rem', fontWeight: 600, background: 'var(--color-bg-surface)',
              padding: '2px 5px', borderRadius: 4, border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}>
              Ctrl K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Button */}
          <div className="relative">
            <button className="btn btn-ghost btn-icon" onClick={() => { setShowNotif(!showNotif); setShowUserMenu(false); }}>
              <Bell size={18} />
              <span style={{
                position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                backgroundColor: 'var(--color-danger)', borderRadius: '50%'
              }} />
            </button>

            <AnimatePresence>
              {showNotif && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 'min(340px, calc(100vw - 24px))', backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)',
                    boxShadow: 'var(--shadow-xl)', overflow: 'hidden', zIndex: 200,
                  }}
                >
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</span>
                    <span className="badge badge-primary">{notifications.length}</span>
                  </div>
                  <div>
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: 12, cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.2rem' }}>{n.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{n.text}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{n.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--border-radius-md)', padding: '5px 10px',
                cursor: 'pointer', transition: 'var(--transition-fast)',
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: 'var(--color-primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700,
              }}>
                {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {userProfile?.name || 'User Profile'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {role}
                </div>
              </div>
              <ChevronDown size={14} color="var(--color-text-muted)" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: 'min(220px, calc(100vw - 24px))', backgroundColor: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-lg)',
                    boxShadow: 'var(--shadow-xl)', overflow: 'hidden', zIndex: 200,
                  }}
                >
                  <div style={{ padding: '14px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{userProfile?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{userProfile?.email}</div>
                  </div>

                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      const profileMap = { student: '/student/profile', teacher: '/teacher/salary', admin: '/admin/settings', parent: '/parent', staff: '/staff', superadmin: '/superadmin', subadmin: '/subadmin/settings' };
                      navigate(profileMap[role] || '/');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <User size={15} /> My Profile
                  </div>

                  <div
                    onClick={() => {
                      setShowUserMenu(false);
                      const settingsMap = { admin: '/admin/settings', subadmin: '/subadmin/settings', superadmin: '/superadmin/settings', teacher: '/teacher', student: '/student', parent: '/parent', staff: '/staff' };
                      navigate(settingsMap[role] || '/');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', cursor: 'pointer',
                      fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <Settings size={15} /> Account Settings
                  </div>

                  <div
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', cursor: 'pointer',
                      color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600,
                    }}
                  >
                    <LogOut size={15} /> Sign Out
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command Palette Search Dialog */}
      <CommandSearch isOpen={showCommandSearch} onClose={() => setShowCommandSearch(false)} />
    </>
  );
};

export default Navbar;
