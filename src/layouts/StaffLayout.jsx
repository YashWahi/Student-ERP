// src/layouts/StaffLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, CheckSquare, Calendar, DollarSign,
  FileText, Bell, MessageSquare
} from 'lucide-react';

const staffNav = [
  {
    title: 'Staff Portal',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Daily Roster', path: '/staff' },
      { icon: <CheckSquare size={18} />, label: 'My Attendance', path: '/staff/attendance' },
      { icon: <Calendar size={18} />, label: 'Leave Applications', path: '/staff/leave' },
      { icon: <DollarSign size={18} />, label: 'Salary Slips', path: '/staff/salary' },
    ],
  },
];

const StaffLayout = () => {
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
        navItems={staffNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || 'Staff Member'}
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

export default StaffLayout;
