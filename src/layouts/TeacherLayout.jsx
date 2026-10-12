// src/layouts/TeacherLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, CheckSquare, BookOpen, Award, FileText,
  MessageSquare, Calendar, DollarSign, Bookmark
} from 'lucide-react';

const teacherNav = [
  {
    title: 'Faculty Workspace',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Teacher Hub', path: '/teacher' },
      { icon: <CheckSquare size={18} />, label: 'Mark Attendance', path: '/teacher/attendance', moduleId: 'attendance' },
      { icon: <BookOpen size={18} />, label: 'Homework & LMS', path: '/teacher/homework', moduleId: 'homework' },
      { icon: <Award size={18} />, label: 'Submissions & Grading', path: '/teacher/results', moduleId: 'exams' },
      { icon: <Bookmark size={18} />, label: 'Teaching Diary', path: '/teacher/compliance' },
      { icon: <FileText size={18} />, label: 'Study Vault', path: '/teacher/materials', moduleId: 'library' },
      { icon: <MessageSquare size={18} />, label: 'Parent Chat', path: '/teacher/messages', moduleId: 'communication' },
      { icon: <Calendar size={18} />, label: 'Leave Applications', path: '/teacher/leave' },
      { icon: <DollarSign size={18} />, label: 'My Salary Slips', path: '/teacher/salary', moduleId: 'payroll' },
    ],
  },
];

const TeacherLayout = () => {
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
        navItems={teacherNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : 'Teacher')}
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

export default TeacherLayout;
