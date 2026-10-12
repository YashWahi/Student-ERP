// src/layouts/SuperAdminLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Building2, CreditCard, Users,
  BarChart2, Settings, Bell, ClipboardList, Shield, Palette, Layers,
  Activity, Megaphone, LifeBuoy, Sliders, Globe, Lock, Mail, MessageSquare,
  Key, Database, Smartphone, HardDrive
} from 'lucide-react';

const superAdminNav = [
  {
    title: 'PLATFORM',
    items: [
      { icon: <LayoutDashboard size={18} />, label: 'Overview', path: '/superadmin' },
      { icon: <BarChart2 size={18} />, label: 'Platform Analytics', path: '/superadmin/analytics' },
      { icon: <Activity size={18} />, label: 'System Health', path: '/superadmin/settings' },
    ],
  },
  {
    title: 'TENANTS',
    items: [
      {
        icon: <Building2 size={18} />,
        label: 'Colleges & Schools',
        children: [
          { icon: <span>📋</span>, label: 'All Colleges', path: '/superadmin/colleges' },
          { icon: <span>➕</span>, label: 'Create College', path: '/superadmin/colleges/create' },
        ],
      },
      { icon: <Globe size={18} />, label: 'Branches', path: '/superadmin/colleges' },
      { icon: <Users size={18} />, label: 'Users', path: '/superadmin/users' },
      { icon: <ClipboardList size={18} />, label: 'Tenant Activity', path: '/superadmin/audit' },
    ],
  },
  {
    title: 'SUBSCRIPTIONS & BILLING',
    items: [
      {
        icon: <CreditCard size={18} />,
        label: 'Subscriptions',
        children: [
          { icon: <span>📊</span>, label: 'Plans & Pricing', path: '/superadmin/subscriptions' },
          { icon: <span>💳</span>, label: 'Active Subscriptions', path: '/superadmin/subscriptions' },
          { icon: <span>⚠️</span>, label: 'Expiring Soon', path: '/superadmin/subscriptions/expiring', badge: '3' },
          { icon: <span>🧾</span>, label: 'Payments & Invoices', path: '/superadmin/subscriptions' },
        ],
      },
    ],
  },
  {
    title: 'PLATFORM GOVERNANCE',
    items: [
      { icon: <Layers size={18} />, label: 'Module Matrix', path: '/superadmin/modules' },
      { icon: <Lock size={18} />, label: 'Permissions & RBAC', path: '/superadmin/rbac' },
      { icon: <Shield size={18} />, label: 'Audit Logs & Security', path: '/superadmin/audit' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { icon: <Megaphone size={18} />, label: 'Announcements', path: '/superadmin' },
      { icon: <Bell size={18} />, label: 'Notifications Hub', path: '/superadmin' },
      { icon: <LifeBuoy size={18} />, label: 'Support Desk', path: '/superadmin' },
    ],
  },
  {
    title: 'CUSTOMIZATION & WEBSITES',
    items: [
      { icon: <Palette size={18} />, label: 'Theme Studio', path: '/superadmin/theme-studio' },
      { icon: <Globe size={18} />, label: 'Website Builder', path: '/superadmin/website-builder' },
      { icon: <Sliders size={18} />, label: 'Branding & Login', path: '/superadmin/theme-studio' },
    ],
  },
  {
    title: 'PLATFORM SETTINGS',
    items: [
      {
        icon: <Settings size={18} />,
        label: 'Global Settings',
        children: [
          { icon: <span>⚙️</span>, label: 'General Settings', path: '/superadmin/settings' },
          { icon: <span>💳</span>, label: 'Payment Gateway', path: '/superadmin/subscriptions' },
          { icon: <span>💾</span>, label: 'Storage & Backup', path: '/superadmin/settings' },
        ],
      },
    ],
  },
];

const SuperAdminLayout = () => {
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
        navItems={superAdminNav}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        role={role}
        userName={userProfile?.name || 'Super Admin Owner'}
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

export default SuperAdminLayout;
