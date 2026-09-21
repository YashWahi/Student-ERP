// src/pages/admin/TeacherManagement.jsx
import { useState } from 'react';
import { Users, Plus, Award, Mail, Phone, BookOpen, CheckCircle, Search, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';

const MOCK_TEACHERS = [
  { id: 't_101', empId: 'FAC-101', name: 'Mrs. Priya Sharma', dept: 'Mathematics', qualification: 'M.Sc. Mathematics, B.Ed', subjects: ['Mathematics', 'Statistics'], assignedClass: 'Class 10-A', phone: '+91 98765 43210', email: 'priya.sharma@greenvalley.edu', password: 'password123', status: 'Active' },
  { id: 't_102', empId: 'FAC-102', name: 'Mr. Rajesh Verma', dept: 'Science (Physics)', qualification: 'Ph.D. Physics', subjects: ['Physics', 'Science'], assignedClass: 'Class 10-B', phone: '+91 98765 43211', email: 'rajesh.verma@greenvalley.edu', password: 'password123', status: 'Active' },
  { id: 't_103', empId: 'FAC-103', name: 'Ms. Anjali Roy', dept: 'English & Literature', qualification: 'M.A. English, B.Ed', subjects: ['English Literature', 'Grammar'], assignedClass: 'Class 9-A', phone: '+91 98765 43212', email: 'anjali.roy@greenvalley.edu', password: 'password123', status: 'Active' },
  { id: 't_104', empId: 'FAC-104', name: 'Dr. Meena Iyer', dept: 'Chemistry', qualification: 'Ph.D. Chemistry', subjects: ['Chemistry'], assignedClass: 'Class 11-A', phone: '+91 98765 43213', email: 'meena.iyer@greenvalley.edu', password: 'password123', status: 'Active' },
  { id: 't_105', empId: 'FAC-105', name: 'Mr. Alok Singh', dept: 'Computer Science', qualification: 'M.Tech CSE', subjects: ['Computer Science', 'Python'], assignedClass: 'Class 8-A', phone: '+91 98765 43214', email: 'alok.singh@greenvalley.edu', password: 'password123', status: 'Active' },
];

const TeacherManagement = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [teachers, setTeachers] = useState(() => {
    try {
      const saved = localStorage.getItem(`teacher_roster_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Teacher roster load error:', e);
    }
    return isCustomCollege ? [] : MOCK_TEACHERS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [dept, setDept] = useState('Mathematics');
  const [qualification, setQualification] = useState('M.Sc., B.Ed');
  const [assignedClass, setAssignedClass] = useState('Class 10-A');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('teacher123');

  const updateTeachersState = (newList) => {
    setTeachers(newList);
    try {
      localStorage.setItem(`teacher_roster_${currentTenant}`, JSON.stringify(newList));
    } catch (e) {
      console.warn('Teacher roster save error:', e);
    }
  };

  const handleAddTeacher = (e) => {
    e.preventDefault();
    if (!name) return;
    const tEmail = (email || `${name.toLowerCase().replace(/\s+/g, '.')}@${currentTenant.toLowerCase()}.edu`).toLowerCase();
    const tPassword = password || 'teacher123';

    const newTeacher = {
      id: `t_${Date.now()}`,
      empId: `FAC-${Math.floor(100 + Math.random() * 900)}`,
      tenantId: currentTenant,
      name,
      dept,
      qualification,
      subjects: [dept],
      assignedClass,
      phone: phone || '+91 98765 00000',
      email: tEmail,
      password: tPassword,
      status: 'Active',
    };

    const updatedList = [newTeacher, ...teachers];
    updateTeachersState(updatedList);

    // Save to custom_users so teacher can log in immediately
    try {
      const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      customUsers.unshift({
        uid: newTeacher.id,
        email: tEmail,
        password: tPassword,
        name: name,
        role: 'teacher',
        tenantId: currentTenant,
        branchId: 'branch_main',
        status: 'Active',
        schoolName: 'Teacher Workspace'
      });
      localStorage.setItem('custom_users', JSON.stringify(customUsers));
    } catch (e) {
      console.warn('LocalStorage custom_users save error:', e);
    }

    toast.success(`👩‍🏫 ${name} added to Faculty Directory! Login: ${tEmail}`);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateTeacher = (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    const tEmail = (email || selectedTeacher.email).toLowerCase();
    const tPassword = password || selectedTeacher.password || 'teacher123';

    const updatedList = teachers.map(t => t.id === selectedTeacher.id ? {
      ...t,
      name,
      dept,
      qualification,
      assignedClass,
      phone,
      email: tEmail,
      password: tPassword,
    } : t);

    updateTeachersState(updatedList);
    toast.success(`Updated ${name}'s profile successfully!`);
    setShowEditModal(false);
    setSelectedTeacher(null);
    resetForm();
  };

  const resetForm = () => {
    setName(''); setDept('Mathematics'); setQualification('M.Sc., B.Ed');
    setAssignedClass('Class 10-A'); setPhone(''); setEmail(''); setPassword('teacher123');
  };

  const handleOpenEdit = (t) => {
    setSelectedTeacher(t);
    setName(t.name);
    setDept(t.dept);
    setQualification(t.qualification);
    setAssignedClass(t.assignedClass);
    setPhone(t.phone);
    setEmail(t.email || '');
    setPassword(t.password || 'teacher123');
    setShowEditModal(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Faculty Member',
      render: (v, r) => (
        <div>
          <strong style={{ color: '#0F172A' }}>{v}</strong>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.empId} · {r.qualification}</div>
        </div>
      )
    },
    { key: 'dept', label: 'Department' },
    {
      key: 'assignedClass',
      label: 'Class Teacher Of',
      render: (v) => <span className="badge badge-primary">{v}</span>
    },
    {
      key: 'email',
      label: 'Contact Information',
      render: (v, r) => (
        <div style={{ fontSize: '0.8rem' }}>
          <div>📧 {v}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>📞 {r.phone}</div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => <span className="badge badge-success">{v}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(r)} title="Edit Faculty">
            <Edit2 size={15} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Faculty & Teacher Management</h1>
          <p className="page-subtitle">Manage teaching staff rosters, department assignments, class teachers & contact profiles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add New Faculty Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Faculty" value={teachers.length} icon={<Users size={20} />} trend="+2 this term" trendType="up" />
        <StatCard title="Departments" value="8 Active" icon={<BookOpen size={20} />} />
        <StatCard title="Class Teachers Assigned" value={teachers.filter(t => t.assignedClass).length} icon={<Award size={20} />} />
        <StatCard title="Faculty Attendance Today" value="98.2%" icon={<CheckCircle size={20} />} trend="On schedule" trendType="up" />
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        title="Faculty Roster & Class Allocations"
        searchPlaceholder="Search teacher name, department, class..."
      />

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Faculty Member">
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Sunita Rao" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Department *</label>
              <select className="form-select" value={dept} onChange={e => setDept(e.target.value)}>
                <option>Mathematics</option>
                <option>Physics / Science</option>
                <option>Chemistry</option>
                <option>English & Literature</option>
                <option>Computer Science</option>
                <option>Social Studies</option>
                <option>Hindi & Vernacular</option>
              </select>
            </div>
            <div>
              <label className="form-label">Qualification</label>
              <input className="form-input" value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. M.Sc, Ph.D, B.Ed" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class Teacher Allocation</label>
              <input className="form-input" value={assignedClass} onChange={e => setAssignedClass(e.target.value)} placeholder="e.g. Class 10-A" />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Login Email ID *</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. teacher@school.edu" />
            </div>
            <div>
              <label className="form-label">Login Password *</label>
              <input className="form-input" type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. teacher123" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Faculty Profile</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Faculty Profile">
        <form onSubmit={handleUpdateTeacher} className="space-y-4">
          <div>
            <label className="form-label">Full Name *</label>
            <input className="form-input" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Department *</label>
              <input className="form-input" value={dept} onChange={e => setDept(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Qualification</label>
              <input className="form-input" value={qualification} onChange={e => setQualification(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class Teacher Allocation</label>
              <input className="form-input" value={assignedClass} onChange={e => setAssignedClass(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Login Email ID *</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Login Password *</label>
              <input className="form-input" type="text" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherManagement;
