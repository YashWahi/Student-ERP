// src/components/common/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Search, Bell, LogOut, User, Settings, ChevronDown,
  Moon, Sun, HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { logoutUser } from '../../services/authService';
import toast from 'react-hot-toast';

const Navbar = ({ collapsed, onToggle }) => {
  const navigate = useNavigate();
  const { userProfile, role, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const userMenuRef = useRef(null);

  const notifications = [
    { id: 1, icon: '⚠️', text: '3 subscriptions expiring in 7 days', time: '2m ago', type: 'warning' },
    { id: 2, icon: '🏫', text: 'New college "Green Valley" created', time: '1h ago', type: 'info' },
    { id: 3, icon: '💰', text: 'Payment received from City College', time: '3h ago', type: 'success' },
    { id: 4, icon: '🔔', text: 'System maintenance scheduled', time: '1d ago', type: 'info' },
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

  const roleColors = {
    superadmin: '#6C63FF', subadmin: '#F59E0B', admin: '#00D4AA',
    teacher: '#10B981', student: '#3B82F6', parent: '#F59E0B', staff: '#94A3B8',
  };

  return (
    <header className={`navbar ${collapsed ? 'collapsed' : ''}`}>
      <div className="navbar-left">
        <button className="hamburger-btn" onClick={onToggle} title="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div className="navbar-search">
          <Search size={15} />
          <input placeholder="Search students, teachers, reports..." />
        </div>
      </div>

      <div className="navbar-right">
        {/* Dark mode toggle */}
        <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Help */}
        <button className="icon-btn" title="Help & Support">
          <HelpCircle size={16} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="icon-btn" onClick={() => { setShowNotif(!showNotif); setShowUserMenu(false); }}>
            <Bell size={16} />
            <span className="notif-dot" />
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                className="notif-panel"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className="card-header" style={{ padding: '16px 20px' }}>
                  <h5 style={{ margin: 0 }}>Notifications</h5>
                  <span className="badge badge-primary">{notifications.length}</span>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.map((n) => (
                    <div key={n.id} className="activity-item" style={{ padding: '12px 20px', cursor: 'pointer' }}>
                      <div className="activity-icon" style={{
                        background: n.type === 'warning' ? 'var(--color-warning-bg)' :
                          n.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-info-bg)'
                      }}>
                        {n.icon}
                      </div>
                      <div className="activity-body">
                        <div className="activity-title">{n.text}</div>
                        <div className="activity-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="card-footer" style={{ textAlign: 'center', padding: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', cursor: 'pointer' }}>
                    View all notifications
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 10, padding: '6px 10px',
              cursor: 'pointer', transition: 'var(--transition)',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `linear-gradient(135deg, ${roleColors[role] || '#6C63FF'}, #00D4AA)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'white',
            }}>
              {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {userProfile?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {role}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12, width: 200,
                  boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 300,
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{userProfile?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userProfile?.email}</div>
                </div>
                {[
                  { icon: <User size={15} />, label: 'My Profile', action: () => navigate(`/${role}/profile`) },
                  { icon: <Settings size={15} />, label: 'Settings', action: () => navigate(`/${role}/settings`) },
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', cursor: 'pointer',
                      color: 'var(--text-secondary)', fontSize: '0.875rem',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {item.icon} {item.label}
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  <div
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', cursor: 'pointer',
                      color: 'var(--color-error)', fontSize: '0.875rem',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-error-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={15} /> Logout
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
