import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Building2, UserCheck, BarChart2,
  Bell, Settings, Megaphone
} from 'lucide-react';

const subAdminNav = [
  {
    title: 'Multi-Branch Management',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/subadmin' },
      { icon: <Building2 size={18} />, label: 'My Branches', path: '/subadmin/branches' },
      { icon: <UserCheck size={18} />, label: 'Branch Admins', path: '/subadmin/admins' },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { icon: <BarChart2 size={18} />, label: 'Cross-Branch Stats', path: '/subadmin/analytics' },
      { icon: <Megaphone size={18} />, label: 'Announcements', path: '/subadmin/announcements' },
      { icon: <Bell size={18} />, label: 'Notifications', path: '/subadmin/notifications' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { icon: <Settings size={18} />, label: 'College Settings', path: '/subadmin/settings' },
    ],
  },
];

const SubAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { userProfile, role } = useAuthStore();

  const handleToggle = () => {
    if (window.innerWidth <= 1024) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        navItems={subAdminNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || 'Sub-Admin Manager'}
      />
      <Navbar collapsed={collapsed} onToggle={handleToggle} />
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SubAdminLayout;
