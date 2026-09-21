// src/layouts/ParentLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, CheckCircle2, Award, CreditCard,
  MessageSquare, Calendar, AlertCircle, Truck
} from 'lucide-react';

const parentNav = [
  {
    title: 'Parent Portal',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Parent Portal', path: '/parent' },
      { icon: <CheckCircle2 size={18} />, label: 'Attendance', path: '/parent/attendance', moduleId: 'attendance' },
      { icon: <Award size={18} />, label: 'Report Cards', path: '/parent/results', moduleId: 'exams' },
      { icon: <CreditCard size={18} />, label: 'Fee Payments', path: '/parent/fees', moduleId: 'fees' },
      { icon: <MessageSquare size={18} />, label: 'Teacher Chat', path: '/parent/messages', moduleId: 'communication' },
      { icon: <Calendar size={18} />, label: 'PTM Booking', path: '/parent/ptm' },
      { icon: <Truck size={18} />, label: 'Transport Bus', path: '/parent/transport', moduleId: 'transport' },
      { icon: <AlertCircle size={18} />, label: 'Helpdesk Tickets', path: '/parent/complaints', moduleId: 'complaints' },
    ],
  },
];

const ParentLayout = () => {
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
        navItems={parentNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Parent')}
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

export default ParentLayout;
