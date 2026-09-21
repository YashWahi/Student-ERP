// src/layouts/StudentLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Clock, CheckCircle2, BookOpen, Award,
  CreditCard, MessageSquare, Edit3, User, Sparkles
} from 'lucide-react';

const studentNav = [
  {
    title: 'Student Portal',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Student Home', path: '/student' },
      { icon: <Clock size={18} />, label: 'Timetable', path: '/student/timetable', moduleId: 'timetable' },
      { icon: <CheckCircle2 size={18} />, label: 'Attendance', path: '/student/attendance', moduleId: 'attendance' },
      { icon: <BookOpen size={18} />, label: 'Homework & LMS', path: '/student/homework', moduleId: 'homework' },
      { icon: <Award size={18} />, label: 'Results & Report Card', path: '/student/results', moduleId: 'exams' },
      { icon: <Edit3 size={18} />, label: 'Digital Notebook', path: '/student/notebook' },
      { icon: <Sparkles size={18} />, label: 'Online Exam', path: '/student/quiz', moduleId: 'exams' },
      { icon: <CreditCard size={18} />, label: 'Fee Payments', path: '/student/fees', moduleId: 'fees' },
      { icon: <MessageSquare size={18} />, label: 'Teacher Chat', path: '/student/messages', moduleId: 'communication' },
      { icon: <User size={18} />, label: 'My Profile', path: '/student/profile' },
    ],
  },
];

const StudentLayout = () => {
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
        navItems={studentNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Student')}
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

export default StudentLayout;
