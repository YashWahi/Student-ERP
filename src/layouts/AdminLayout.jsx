// src/layouts/AdminLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Building, Users, GraduationCap,
  BookOpen, Calendar, CreditCard, Clock, Truck, FileText, Settings, Award, Users2, ShieldCheck, Home, Phone, MessageSquare
} from 'lucide-react';

const adminNav = [
  {
    title: 'Dashboard',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Branch Overview', path: '/admin' },
    ],
  },
  {
    title: 'Admissions & SIS',
    items: [
      { icon: <Phone size={18} />, label: 'Admissions CRM', path: '/admin/admissions-crm', moduleId: 'students' },
      {
        icon: <GraduationCap size={18} />, label: 'Student SIS', moduleId: 'students',
        children: [
          { icon: <span>📋</span>, label: 'Student Directory', path: '/admin/students' },
          { icon: <span>➕</span>, label: 'Admit New Student', path: '/admin/students/admit' },
        ],
      },
      { icon: <Users size={18} />, label: 'Teachers & Faculty', path: '/admin/teachers', moduleId: 'teachers' },
      { icon: <Users2 size={18} />, label: 'Staff & HR Payroll', path: '/admin/hr-payroll', moduleId: 'payroll' },
    ],
  },
  {
    title: 'Academics & Exams',
    items: [
      { icon: <Building size={18} />, label: 'Classes & Sections', path: '/admin/classes' },
      { icon: <Award size={18} />, label: 'Exams & Results', path: '/admin/exams-results', moduleId: 'exams' },
      { icon: <Clock size={18} />, label: 'Timetable Builder', path: '/admin/timetable', moduleId: 'timetable' },
    ],
  },
  {
    title: 'Communication & Operations',
    items: [
      { icon: <MessageSquare size={18} />, label: 'Communication Hub', path: '/admin/communication', moduleId: 'communication' },
      { icon: <ShieldCheck size={18} />, label: 'Operations Command', path: '/admin/operations' },
      { icon: <CreditCard size={18} />, label: 'Fee Management', path: '/admin/fees', moduleId: 'fees' },
      { icon: <Truck size={18} />, label: 'Transport & Fleet', path: '/admin/transport', moduleId: 'transport' },
      { icon: <BookOpen size={18} />, label: 'Digital Library', path: '/admin/library', moduleId: 'library' },
      { icon: <Home size={18} />, label: 'Hostel & Dorms', path: '/admin/hostel', moduleId: 'hostel' },
    ],
  },
  {
    title: 'Analytics & Settings',
    items: [
      { icon: <FileText size={18} />, label: 'Custom Reports', path: '/admin/reports', moduleId: 'reports' },
      { icon: <Settings size={18} />, label: 'Branch Settings', path: '/admin/settings' },
    ],
  },
];

const AdminLayout = () => {
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
        navItems={adminNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || 'Branch Admin'}
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

export default AdminLayout;
