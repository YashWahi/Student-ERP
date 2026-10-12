import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { useTheme } from '../theme/ThemeProvider';
import { useAuthStore } from '../../store/authStore';

const NavItem = ({ item, collapsed, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = item.path ? location.pathname === item.path : false;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren && !collapsed) { setOpen(!open); return; }
    if (hasChildren && collapsed && item.children[0]?.path) {
      navigate(item.children[0].path);
      if (onCloseMobile) onCloseMobile();
      return;
    }
    if (item.path) {
      navigate(item.path);
      if (onCloseMobile) onCloseMobile();
    }
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
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
            {hasChildren && (
              <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>
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
              transition={{ duration: 0.15 }}
              style={{ overflow: 'hidden', paddingLeft: 16 }}
            >
              {item.children.map((child) => (
                <NavItem key={child.path} item={child} collapsed={false} onCloseMobile={onCloseMobile} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const Sidebar = ({ navItems, collapsed, mobileOpen, onCloseMobile, role, userName }) => {
  const { isModuleEnabled } = usePermissions();
  const { theme } = useTheme();
  const { userProfile } = useAuthStore();

  // Filter sections & items based on tenant's enabled modules
  const filteredNavSections = navItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => isModuleEnabled(item.moduleId)),
    }))
    .filter(section => section.items.length > 0);

  const roleLabels = {
    superadmin: 'Super Admin',
    subadmin: 'Sub-Admin Manager',
    admin: 'Branch Admin',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    staff: 'Staff',
  };

  const displayName = theme?.branding?.shortName || theme?.branding?.collegeName || userProfile?.schoolName || (role === 'superadmin' ? 'EduERP Platform' : 'Campus Portal');

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)', zIndex: 999,
          }}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          zIndex: 1000
        }}
      >
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            {theme?.branding?.logoUrl ? (
              <img src={theme.branding.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'contain' }} />
            ) : (
              '🎓'
            )}
          </div>
          {!collapsed && (
            <span className="sidebar-brand-text truncate" title={theme?.branding?.collegeName || userProfile?.schoolName || displayName}>
              {displayName}
            </span>
          )}
        </div>

        {/* Role Badge */}
        {!collapsed && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--border-radius-md)', padding: '8px 12px',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, color: 'white', flexShrink: 0
              }}>
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }} className="truncate">
                  {userName || 'User'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {roleLabels[role] || role}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {filteredNavSections.map((section, si) => (
            <div key={si} className="nav-section">
              {!collapsed && section.title && (
                <div className="nav-section-title">{section.title}</div>
              )}
              {section.items.map((item) => (
                <NavItem key={item.path || item.label} item={item} collapsed={collapsed} onCloseMobile={onCloseMobile} />
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
