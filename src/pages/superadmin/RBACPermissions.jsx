// src/pages/superadmin/RBACPermissions.jsx
import { useState, useEffect } from 'react';
import { Shield, Key, Check, X, Save, Lock, RefreshCw, AlertCircle } from 'lucide-react';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const DEFAULT_RBAC_RULES = {
  superadmin: {
    name: 'Super Admin Owner',
    description: 'Root system access, multi-tenant provisioning, billing, and global settings',
    permissions: {
      'tenants.manage': true,
      'billing.manage': true,
      'rbac.manage': true,
      'modules.toggle': true,
      'theme.publish': true,
      'students.full': true,
      'teachers.full': true,
      'fees.full': true,
      'audit.read': true,
    }
  },
  subadmin: {
    name: 'Sub-Admin Manager',
    description: 'Multi-campus branch provisioning, institutional group analytics and oversight',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': true,
      'teachers.full': true,
      'fees.full': true,
      'audit.read': true,
    }
  },
  admin: {
    name: 'Branch / School Admin',
    description: 'School branch administration, admissions, faculty allocation, and fee management',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': true,
      'teachers.full': true,
      'fees.full': true,
      'audit.read': false,
    }
  },
  teacher: {
    name: 'Teacher / Faculty',
    description: 'Attendance marking, digital homework grading, timetable, and term exam marks',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': false,
      'teachers.full': false,
      'fees.full': false,
      'audit.read': false,
    }
  },
  student: {
    name: 'Student Portal',
    description: 'Personal homework submission, attendance review, fee payment, and published marks',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': false,
      'teachers.full': false,
      'fees.full': false,
      'audit.read': false,
    }
  },
  parent: {
    name: 'Parent Portal',
    description: 'Ward performance, attendance tracking, fee receipts, and teacher communications',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': false,
      'teachers.full': false,
      'fees.full': false,
      'audit.read': false,
    }
  },
  staff: {
    name: 'Non-Teaching Staff',
    description: 'Daily biometrics, task schedules, leave applications, and monthly salary slips',
    permissions: {
      'tenants.manage': false,
      'billing.manage': false,
      'rbac.manage': false,
      'modules.toggle': false,
      'theme.publish': false,
      'students.full': false,
      'teachers.full': false,
      'fees.full': false,
      'audit.read': false,
    }
  }
};

const PERMISSION_DEFINITIONS = [
  { key: 'tenants.manage', label: 'Multi-Tenant Provisioning & Suspension', scope: 'Platform' },
  { key: 'billing.manage', label: 'SaaS Subscriptions & Invoice Ledger', scope: 'Platform' },
  { key: 'rbac.manage', label: 'Security Policies & Role Customization', scope: 'Platform' },
  { key: 'modules.toggle', label: 'Module Matrix Entitlement Matrix', scope: 'Platform' },
  { key: 'theme.publish', label: 'Theme Studio Publishing & CSS Tokens', scope: 'Platform' },
  { key: 'students.full', label: 'Student Admissions, Roster & KYC Management', scope: 'Branch' },
  { key: 'teachers.full', label: 'Faculty Management & Subject Allocation', scope: 'Branch' },
  { key: 'fees.full', label: 'Fee Collection, Structures & Online Gateway', scope: 'Branch' },
  { key: 'audit.read', label: 'Immutable Security Audit Trail Access', scope: 'Platform' },
];

const RBACPermissions = () => {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [rbacState, setRbacState] = useState(() => {
    try {
      const saved = localStorage.getItem('platform_rbac_rules');
      return saved ? JSON.parse(saved) : DEFAULT_RBAC_RULES;
    } catch {
      return DEFAULT_RBAC_RULES;
    }
  });
  const [saving, setSaving] = useState(false);

  const togglePermission = (permKey) => {
    if (selectedRole === 'superadmin') {
      toast.error('SuperAdmin root permissions are permanent and cannot be revoked.');
      return;
    }
    setRbacState(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        permissions: {
          ...prev[selectedRole].permissions,
          [permKey]: !prev[selectedRole].permissions[permKey],
        }
      }
    }));
  };

  const handleSaveRBAC = async () => {
    setSaving(true);
    try {
      localStorage.setItem('platform_rbac_rules', JSON.stringify(rbacState));
      await logAuditEvent({
        action: 'UPDATE_RBAC_POLICIES',
        actor: 'Super Admin',
        target: rbacState[selectedRole]?.name || selectedRole,
        details: `Updated granular RBAC permissions for role: ${selectedRole.toUpperCase()}`,
      });
      toast.success(`🔐 RBAC Security Policies saved for ${selectedRole.toUpperCase()}!`);
    } catch (err) {
      toast.error('Failed to save security policies');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setRbacState(DEFAULT_RBAC_RULES);
    localStorage.setItem('platform_rbac_rules', JSON.stringify(DEFAULT_RBAC_RULES));
    toast.success('Security policies reset to enterprise defaults');
  };

  const currentRoleConfig = rbacState[selectedRole] || DEFAULT_RBAC_RULES.admin;

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header flex justify-between items-center" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">Role-Based Access Control (RBAC) & Governance</h1>
          <p className="page-subtitle">Configure granular resource permissions, security scopes, and administrative authorization policies</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={handleResetDefaults}>
            <RefreshCw size={15} /> Reset Defaults
          </button>
          <button className="btn btn-primary" onClick={handleSaveRBAC} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving Policies...' : 'Save RBAC Policy Matrix'}
          </button>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="card" style={{ marginBottom: 24, padding: '14px 20px', backgroundColor: '#F8FAFC' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Configure Role:</span>
          {Object.keys(rbacState).map(roleKey => (
            <button
              key={roleKey}
              className={`btn btn-sm ${selectedRole === roleKey ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedRole(roleKey)}
            >
              {rbacState[roleKey].name}
            </button>
          ))}
        </div>
      </div>

      {/* Role Info Banner */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={18} color="#2563EB" />
            {currentRoleConfig.name} Policy Matrix
          </h3>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            {currentRoleConfig.description}
          </p>
        </div>
        <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontWeight: 800 }}>
          {selectedRole}
        </span>
      </div>

      {/* Permissions Matrix Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
        }}
      >
        {PERMISSION_DEFINITIONS.map(p => {
          const isAllowed = currentRoleConfig.permissions?.[p.key] === true;
          return (
            <div
              key={p.key}
              className="card"
              style={{
                padding: '18px 20px',
                border: `1.5px solid ${isAllowed ? '#BFDBFE' : '#E2E8F0'}`,
                backgroundColor: isAllowed ? '#F0F7FF' : '#FFFFFF',
                transition: 'all 0.15s ease',
              }}
            >
              <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>
                  {p.label}
                </div>
                <span className={`badge ${p.scope === 'Platform' ? 'badge-primary' : 'badge-neutral'}`}>
                  {p.scope} Scoped
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B', marginBottom: 14 }}>
                Key: {p.key}
              </div>

              <button
                type="button"
                className={`btn btn-sm w-full ${isAllowed ? 'btn-danger' : 'btn-primary'}`}
                style={{ justifyContent: 'center' }}
                onClick={() => togglePermission(p.key)}
                disabled={selectedRole === 'superadmin'}
              >
                {isAllowed ? <X size={14} /> : <Check size={14} />}
                {isAllowed ? 'Revoke Permission' : 'Grant Permission'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RBACPermissions;
