// src/components/common/CommandSearch.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, GraduationCap, Users, Building, CreditCard, Bell, ArrowRight,
  X, Palette, Layers, ShieldCheck, FileText, Settings, Key, UserCheck, ShieldAlert
} from 'lucide-react';
import { useStudentStore } from '../../store/studentStore';
import { getColleges, getSubscriptions } from '../../services/tenantService';
import { getAuditLogs } from '../../services/auditService';

const STATIC_ROUTES = [
  { id: 'r1', title: 'SuperAdmin Multi-Tenant Control Center', type: 'SuperAdmin', info: 'Platform metrics, SaaS health, global governance', path: '/superadmin', icon: <Building size={16} /> },
  { id: 'r2', title: 'Manage Colleges & Schools Directory', type: 'Tenants', info: 'Inspect all onboarded institutions & campuses', path: '/superadmin/colleges', icon: <Building size={16} /> },
  { id: 'r3', title: 'Provision New Institution Tenant', type: 'Tenants', info: 'Onboarding wizard for colleges and schools', path: '/superadmin/colleges/create', icon: <Building size={16} /> },
  { id: 'r4', title: 'Theme Studio & Branding Customizer', type: 'Design', info: 'Customize logos, typography, color palettes', path: '/superadmin/theme-studio', icon: <Palette size={16} /> },
  { id: 'r5', title: 'Feature Module Control Matrix', type: 'Governance', info: 'Toggle ERP modules per college plan tier', path: '/superadmin/modules', icon: <Layers size={16} /> },
  { id: 'r6', title: 'Subscriptions & SaaS Billing Ledger', type: 'Billing', info: 'Contracts, plans, annual renewals & invoices', path: '/superadmin/subscriptions', icon: <CreditCard size={16} /> },
  { id: 'r7', title: 'Security Audit Logs & Compliance Trail', type: 'Security', info: 'Immutable audit trail & platform access logs', path: '/superadmin/audit', icon: <ShieldCheck size={16} /> },
  { id: 'r8', title: 'Platform Analytics & Growth Trajectories', type: 'Analytics', info: 'Examine revenue trends and student enrollments', path: '/superadmin/analytics', icon: <FileText size={16} /> },
  { id: 'r9', title: 'Cross-Tenant User Directory', type: 'Users', info: 'Inspect faculty, students, staff and administrators', path: '/superadmin/users', icon: <Users size={16} /> },
  { id: 'r10', title: 'Permissions & RBAC Governance', type: 'Security', info: 'Role permissions matrix and security policies', path: '/superadmin/rbac', icon: <Key size={16} /> },
  { id: 'r11', title: 'Platform Global Settings', type: 'Settings', info: 'Root security, SMS gateway, timeouts, and storage', path: '/superadmin/settings', icon: <Settings size={16} /> },
  { id: 'r12', title: 'Student Admission & Roster', type: 'Admin', info: 'Admissions, student profiles & KYC docs', path: '/admin/students', icon: <GraduationCap size={16} /> },
  { id: 'r13', title: 'Faculty & Teacher Management', type: 'Admin', info: 'Teacher assignments, subjects, timetables', path: '/admin/teachers', icon: <Users size={16} /> },
  { id: 'r14', title: 'Fee Structure & Collection Ledger', type: 'Admin', info: 'Fee heads, installment plans, online receipts', path: '/admin/fees', icon: <CreditCard size={16} /> },
];

const CommandSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [colleges, setColleges] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const { students } = useStudentStore();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      getColleges().then(data => setColleges(data || [])).catch(() => {});
      getSubscriptions().then(data => setSubscriptions(data || [])).catch(() => {});
      getAuditLogs().then(data => setAuditLogs(data || [])).catch(() => {});
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const allSearchItems = useMemo(() => {
    const collegeItems = colleges.map(c => ({
      id: `col_${c.id || c.tenantId}`,
      title: c.name || c.collegeName || 'Institution',
      type: 'Institution',
      info: `Code: ${c.code || c.collegeCode || 'COL'} · Plan: ${c.plan || c.planTier || 'Standard'} · Status: ${c.status || 'Active'}`,
      path: '/superadmin/colleges',
      icon: <Building size={16} />
    }));

    const subscriptionItems = subscriptions.map(s => ({
      id: `sub_${s.id || s.subId}`,
      title: `${s.college || s.collegeName} (${s.plan || 'Standard'} Tier)`,
      type: 'Subscription',
      info: `Amount: ₹${(s.amount || 24000).toLocaleString('en-IN')}/yr · Renewal: ${s.expiryDate || 'Active'}`,
      path: '/superadmin/subscriptions',
      icon: <CreditCard size={16} />
    }));

    const auditItems = (auditLogs || []).slice(0, 10).map(a => ({
      id: `audit_${a.id || Math.random()}`,
      title: `${a.action}: ${a.target || 'Platform'}`,
      type: 'Audit Log',
      info: `Actor: ${a.actor || 'Super Admin'} · ${a.details || a.time || 'Security Log'}`,
      path: '/superadmin/audit',
      icon: <ShieldCheck size={16} />
    }));

    const studentItems = (students || []).slice(0, 15).map(s => ({
      id: `st_${s.id}`,
      title: s.name,
      type: 'Student',
      info: `Class: ${s.class || s.className} · Roll: ${s.rollNo} · Adm: ${s.admissionNo}`,
      path: `/admin/students/${s.id}`,
      icon: <GraduationCap size={16} />
    }));

    // Registered users from localStorage
    let userItems = [];
    try {
      const localUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      userItems = localUsers.map(u => ({
        id: `user_${u.uid || u.email}`,
        title: `${u.name} (${u.role.toUpperCase()})`,
        type: 'User',
        info: `Email: ${u.email} · School: ${u.schoolName || u.tenantId}`,
        path: '/superadmin/users',
        icon: <UserCheck size={16} />
      }));
    } catch {
      userItems = [];
    }

    return [...STATIC_ROUTES, ...collegeItems, ...userItems, ...subscriptionItems, ...studentItems, ...auditItems];
  }, [colleges, subscriptions, auditLogs, students]);

  const filtered = query.trim()
    ? allSearchItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.type.toLowerCase().includes(query.toLowerCase()) ||
        item.info.toLowerCase().includes(query.toLowerCase())
      )
    : allSearchItems.slice(0, 8);

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          style={{ zIndex: 300 }}
        >
          <motion.div
            className="modal"
            style={{ maxWidth: 640, borderRadius: 16, overflow: 'hidden' }}
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
          >
            {/* Search Input Box */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-surface)'
            }}>
              <Search size={20} color="var(--color-text-muted)" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to search students, teachers, classes, fees, notices..."
                style={{
                  width: '100%', border: 'none', outline: 'none', background: 'transparent',
                  fontSize: '1rem', color: 'var(--color-text-primary)'
                }}
              />
              <button onClick={onClose} className="btn btn-ghost btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Results List */}
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 12px' }}>
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                      borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
                      transition: 'var(--transition-fast)', color: 'var(--color-text-primary)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8,
                      backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{item.type}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.info}</div>
                    </div>
                    <ArrowRight size={14} color="var(--color-text-muted)" />
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No search results found for "{query}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '10px 20px', borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)', fontSize: '0.75rem', color: 'var(--color-text-muted)',
              display: 'flex', justifyContent: 'space-between'
            }}>
              <span>Use <kbd style={{ background: 'white', padding: '1px 5px', borderRadius: 4, border: '1px solid #CBD5E1' }}>↑</kbd> <kbd style={{ background: 'white', padding: '1px 5px', borderRadius: 4, border: '1px solid #CBD5E1' }}>↓</kbd> to navigate</span>
              <span>Press <kbd style={{ background: 'white', padding: '1px 5px', borderRadius: 4, border: '1px solid #CBD5E1' }}>ESC</kbd> to exit</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandSearch;
