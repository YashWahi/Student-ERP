// src/components/common/Sidebar.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

const NavItem = ({ item, collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    : false;

  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) { setOpen(!open); return; }
    if (item.path) navigate(item.path);
  };

  return (
    <div>
      <div
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={handleClick}
        title={collapsed ? item.label : ''}
      >
        <span className="nav-icon">{item.icon}</span>
        {!collapsed && (
          <>
            <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
            {hasChildren && (
              <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            )}
          </>
        )}
      </div>

      {hasChildren && !collapsed && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', paddingLeft: 16 }}
            >
              {item.children.map((child) => (
                <NavItem key={child.path} item={child} collapsed={false} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const Sidebar = ({ navItems, collapsed, role, userName, userEmail, userAvatar }) => {
  const roleColors = {
    superadmin: 'linear-gradient(135deg, #6C63FF, #FF6584)',
    subadmin: 'linear-gradient(135deg, #F59E0B, #EF4444)',
    admin: 'linear-gradient(135deg, #00D4AA, #3B82F6)',
    teacher: 'linear-gradient(135deg, #10B981, #6C63FF)',
    student: 'linear-gradient(135deg, #3B82F6, #00D4AA)',
    parent: 'linear-gradient(135deg, #F59E0B, #10B981)',
    staff: 'linear-gradient(135deg, #94A3B8, #475569)',
  };

  const roleLabel = {
    superadmin: 'Super Admin',
    subadmin: 'Sub Admin',
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    staff: 'Staff',
  };

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🎓</div>
        {!collapsed && <span className="logo-text">EduERP Pro</span>}
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            background: roleColors[role] || 'var(--bg-glass)',
            borderRadius: 8, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0
            }}>
              {userName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', truncate: true }}
                className="truncate">{userName}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {roleLabel[role] || role}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section, si) => (
          <div key={si} className="nav-section">
            {!collapsed && section.title && (
              <div className="nav-section-title">{section.title}</div>
            )}
            {section.items.map((item) => (
              <NavItem key={item.path || item.label} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
