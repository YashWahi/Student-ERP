// src/pages/superadmin/UserDirectory.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Download, Plus, Filter, ShieldCheck,
  UserX, UserCheck, RefreshCw, Building, Mail, Phone, Lock, Eye
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { getColleges } from '../../services/tenantService';
import { exportToCSV } from '../../services/exportService';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const UserDirectory = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'admin',
    tenantId: '',
    phone: '',
    password: '',
  });

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const realColleges = await getColleges();
      setColleges(realColleges);

      // Aggregate all users across custom_users, custom_tenants, and standard seed accounts
      const localUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      const collegeAdmins = realColleges.map((c, i) => ({
        uid: `admin_${c.id || c.tenantId}`,
        name: c.adminName || `${c.name} Admin`,
        email: c.adminEmail || c.email || `admin@${c.code.toLowerCase()}.edu`,
        role: 'admin',
        schoolName: c.name,
        tenantId: c.id || c.tenantId,
        status: c.status === 'Suspended' ? 'Suspended' : 'Active',
        lastLogin: 'Today, 09:40 AM',
      }));

      const defaultPersonas = [
        { uid: 'superadmin_1', name: 'Super Admin Owner', email: 'superadmin@gmail.com', role: 'superadmin', schoolName: 'Platform Global SaaS', tenantId: 'platform', status: 'Active', lastLogin: 'Just now' },
        { uid: 'subadmin_1', name: 'Sub-Admin Manager', email: 'subadmin@gmail.com', role: 'subadmin', schoolName: 'Enterprise Regional Group', tenantId: 'tenant_gvis', status: 'Active', lastLogin: 'Yesterday' },
        { uid: 'teacher_1', name: 'Mrs. Priya Sharma', email: 'teacher@greenvalley.com', role: 'teacher', schoolName: 'Green Valley International', tenantId: 'tenant_gvis', status: 'Active', lastLogin: '2h ago' },
        { uid: 'student_1', name: 'Arjun Verma', email: 'student@greenvalley.com', role: 'student', schoolName: 'Green Valley International', tenantId: 'tenant_gvis', status: 'Active', lastLogin: '3h ago' },
        { uid: 'parent_1', name: 'Mr. Suresh Verma', email: 'parent@test.com', role: 'parent', schoolName: 'Green Valley International', tenantId: 'tenant_gvis', status: 'Active', lastLogin: 'Yesterday' },
        { uid: 'staff_1', name: 'Ramesh Singh', email: 'staff@greenvalley.com', role: 'staff', schoolName: 'Green Valley International', tenantId: 'tenant_gvis', status: 'Active', lastLogin: '5h ago' },
      ];

      const combined = [...localUsers, ...collegeAdmins, ...defaultPersonas];
      const seen = new Set();
      const deduped = combined.filter(u => {
        const key = (u.email || u.uid || '').toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setUsers(deduped);
      if (realColleges.length > 0 && !newUser.tenantId) {
        setNewUser(prev => ({ ...prev, tenantId: realColleges[0].id }));
      }
    } catch (err) {
      console.warn('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
    const updated = users.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u);
    setUsers(updated);

    try {
      const localUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      const updatedLocal = localUsers.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u);
      localStorage.setItem('custom_users', JSON.stringify(updatedLocal));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    await logAuditEvent({
      action: newStatus === 'Suspended' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      actor: 'Super Admin',
      target: user.email,
      details: `User status changed to ${newStatus} for role ${user.role} (${user.name})`,
      tenantId: user.tenantId,
    });

    toast.success(`User ${user.name} status updated to ${newStatus}`);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Name and Email are required');
      return;
    }

    const created = {
      uid: `user_${Date.now()}`,
      name: newUser.name,
      email: newUser.email.toLowerCase().trim(),
      role: newUser.role,
      tenantId: newUser.tenantId || 'tenant_platform',
      schoolName: colleges.find(c => c.id === newUser.tenantId)?.name || 'Platform',
      phone: newUser.phone || '+91 98765 43210',
      status: 'Active',
      lastLogin: 'Never',
    };

    try {
      const existing = JSON.parse(localStorage.getItem('custom_users') || '[]');
      existing.unshift(created);
      localStorage.setItem('custom_users', JSON.stringify(existing));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    await logAuditEvent({
      action: 'CREATE_USER',
      actor: 'Super Admin',
      target: created.email,
      details: `Created new ${created.role} user: ${created.name} (${created.schoolName})`,
      tenantId: created.tenantId,
    });

    toast.success(`🎉 User ${created.name} (${created.role.toUpperCase()}) created successfully!`);
    setIsAddUserOpen(false);
    setNewUser({ name: '', email: '', role: 'admin', tenantId: colleges[0]?.id || '', phone: '', password: '' });
    loadAllUsers();
  };

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'All') return users;
    return users.filter(u => u.role === roleFilter.toLowerCase());
  }, [users, roleFilter]);

  const columns = [
    {
      key: 'name', label: 'User Name & Email',
      render: (v, r) => (
        <div>
          <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{v}</strong>
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 1 }}>{r.email}</div>
        </div>
      )
    },
    {
      key: 'role', label: 'Platform Role',
      render: (v) => (
        <span
          className="badge"
          style={{
            textTransform: 'uppercase',
            fontWeight: 700,
            fontSize: '0.7rem',
            backgroundColor: v === 'superadmin' ? '#FEE2E2' : v === 'admin' ? '#EFF6FF' : v === 'teacher' ? '#FAF5FF' : '#F0FDF4',
            color: v === 'superadmin' ? '#DC2626' : v === 'admin' ? '#2563EB' : v === 'teacher' ? '#7C3AED' : '#16A34A',
          }}
        >
          {v}
        </span>
      )
    },
    {
      key: 'schoolName', label: 'Associated Institution / Campus',
      render: (v) => <span style={{ fontWeight: 600, color: '#334155' }}>{v || 'Global Platform'}</span>
    },
    {
      key: 'status', label: 'Account Status',
      render: (v) => (
        <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-danger'}`}>
          {v}
        </span>
      )
    },
    {
      key: 'lastLogin', label: 'Last Active Session',
      render: (v) => <span style={{ fontSize: '0.76rem', color: '#64748B' }}>{v || 'Recently'}</span>
    },
    {
      key: 'uid', label: 'Actions', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSelectedUserForModal(row)}
            title="Inspect User Details"
          >
            <Eye size={14} /> View
          </button>
          {row.role !== 'superadmin' && (
            <button
              className={`btn btn-sm ${row.status === 'Active' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => handleToggleStatus(row)}
              title={row.status === 'Active' ? 'Suspend User Access' : 'Reactivate User Account'}
            >
              {row.status === 'Active' ? <UserX size={14} /> : <UserCheck size={14} />}
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
      <div className="page-header flex justify-between items-center" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Cross-Tenant User Directory</h1>
          <p className="page-subtitle">Centralized user directory across all provisioned institutions, campuses, and user roles</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Platform_Users', filteredUsers, columns)}>
            <Download size={16} /> Export Users CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddUserOpen(true)}>
            <Plus size={16} /> Provision User Account
          </button>
        </div>
      </div>

      {/* Role Filters */}
      <div className="card" style={{ marginBottom: 24, padding: '12px 20px', backgroundColor: '#F8FAFC' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Filter by User Role:</span>
          {['All', 'Superadmin', 'Admin', 'Teacher', 'Student', 'Parent', 'Staff'].map(role => (
            <button
              key={role}
              className={`btn btn-sm ${roleFilter === role ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRoleFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        title="Institutional User Registry"
        searchPlaceholder="Search by name, email, school..."
        loading={loading}
        emptyText="No users found for this filter criteria."
      />

      {/* View User Modal */}
      {selectedUserForModal && (
        <Modal
          isOpen={Boolean(selectedUserForModal)}
          onClose={() => setSelectedUserForModal(null)}
          title={`User Profile: ${selectedUserForModal.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#2563EB', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                {selectedUserForModal.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{selectedUserForModal.name}</h3>
                <span className="badge badge-primary">{selectedUserForModal.role?.toUpperCase()}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: '0.84rem' }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Login Email</span>
                <strong>{selectedUserForModal.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Institution</span>
                <strong>{selectedUserForModal.schoolName || 'Global Platform'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Tenant ID</span>
                <code style={{ fontSize: '0.78rem' }}>{selectedUserForModal.tenantId || 'platform'}</code>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Status</span>
                <span className={`badge ${selectedUserForModal.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {selectedUserForModal.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3" style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedUserForModal(null)}>
                Close
              </button>
              {selectedUserForModal.role !== 'superadmin' && (
                <button
                  type="button"
                  className={`btn ${selectedUserForModal.status === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => {
                    handleToggleStatus(selectedUserForModal);
                    setSelectedUserForModal(null);
                  }}
                >
                  {selectedUserForModal.status === 'Active' ? 'Suspend User Access' : 'Reactivate User'}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Provision New User Account"
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Prof. Arvind Gupta"
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Official Email Address *</label>
            <input
              className="form-input"
              type="email"
              placeholder="user@institution.edu"
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Platform Role</label>
              <select
                className="form-select"
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })}
              >
                <option value="admin">Branch Admin</option>
                <option value="teacher">Teacher / Faculty</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="staff">Staff</option>
                <option value="subadmin">Sub-Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Institution</label>
              <select
                className="form-select"
                value={newUser.tenantId}
                onChange={e => setNewUser({ ...newUser, tenantId: e.target.value })}
              >
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              placeholder="+91 98765 43210"
              value={newUser.phone}
              onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Provision User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserDirectory;
