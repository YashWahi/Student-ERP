// src/pages/admin/ClassManagement.jsx
import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { createClass } from '../../services/academicService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_CLASSES = [
  { id: 'c1', name: 'Class 10', section: 'A', classTeacher: 'Mrs. Priya Sharma', studentsCount: 42, subjects: ['Maths', 'Science', 'English', 'Social Science', 'Hindi'] },
  { id: 'c2', name: 'Class 10', section: 'B', classTeacher: 'Mr. Rajesh Verma', studentsCount: 40, subjects: ['Maths', 'Science', 'English', 'Social Science', 'Hindi'] },
  { id: 'c3', name: 'Class 9', section: 'A', classTeacher: 'Dr. Sunita Rao', studentsCount: 45, subjects: ['Maths', 'Science', 'English', 'Social Science', 'Computer'] },
  { id: 'c4', name: 'Class 8', section: 'A', classTeacher: 'Mr. Alok Singh', studentsCount: 38, subjects: ['Maths', 'Science', 'English', 'Social Science', 'Sanskrit'] },
];

const ClassManagement = () => {
  const { userProfile, tenantId: activeTenantId, branchId: activeBranchId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [classes, setClasses] = useState(() => {
    const saved = localStorage.getItem(`class_list_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_CLASSES;
  });

  const [availableTeachers, setAvailableTeachers] = useState(() => {
    try {
      const savedTeachers = localStorage.getItem(`teacher_roster_${currentTenant}`);
      if (savedTeachers) {
        return JSON.parse(savedTeachers);
      }
    } catch (e) {
      console.warn('Teacher fetch error:', e);
    }
    return isCustomCollege ? [] : [
      { id: 't1', name: 'Mrs. Priya Sharma', dept: 'Maths' },
      { id: 't2', name: 'Mr. Rajesh Verma', dept: 'Science' },
      { id: 't3', name: 'Dr. Sunita Rao', dept: 'English' }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form States
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');
  const [teacher, setTeacher] = useState('');

  const updateClassesState = (newClasses) => {
    setClasses(newClasses);
    localStorage.setItem(`class_list_${currentTenant}`, JSON.stringify(newClasses));
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!className) return;
    const currentBranch = activeBranchId || 'branch_main';

    const newCls = {
      id: `c_${Date.now()}`,
      tenantId: currentTenant,
      branchId: currentBranch,
      name: className,
      section,
      classTeacher: teacher || 'Unassigned',
      studentsCount: 0,
      subjects: ['Maths', 'Science', 'English'],
    };

    try {
      await createClass(newCls);
    } catch {
      // Fallback
    }

    updateClassesState([...classes, newCls]);
    toast.success(`Class ${className}-${section} created successfully!`);
    setShowAddModal(false);
    setClassName('');
    setTeacher('');
  };

  const handleUpdateClass = (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const updated = classes.map(c => c.id === selectedClass.id ? {
      ...c,
      name: className,
      section,
      classTeacher: teacher || 'Unassigned',
    } : c);

    updateClassesState(updated);
    toast.success(`Updated ${className}-${section} assignment!`);
    setShowEditModal(false);
    setSelectedClass(null);
  };

  const handleOpenEdit = (cls) => {
    setSelectedClass(cls);
    setClassName(cls.name);
    setSection(cls.section);
    setTeacher(cls.classTeacher === 'Unassigned' ? '' : cls.classTeacher);
    setShowEditModal(true);
  };

  const columns = [
    {
      key: 'name', label: 'Class & Section',
      render: (_, r) => (
        <div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{r.name}-{r.section}</span>
        </div>
      )
    },
    { key: 'classTeacher', label: 'Class Teacher', render: (v) => <span className="badge badge-primary">{v}</span> },
    { key: 'studentsCount', label: 'Students', render: (v) => <span style={{ fontWeight: 600 }}>{v} enrolled</span> },
    {
      key: 'subjects', label: 'Subjects Taught',
      render: (subs) => (
        <div className="flex gap-2 flex-wrap">
          {subs.map(s => <span key={s} className="badge badge-secondary">{s}</span>)}
        </div>
      )
    },
    {
      key: 'id', label: 'Actions', sortable: false,
      render: (id, row) => (
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm btn-icon" title="Edit Class" onClick={() => handleOpenEdit(row)}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => {
            updateClassesState(classes.filter(c => c.id !== id));
            toast.success('Class removed');
          }}><Trash2 size={14} /></button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Classes & Sections</h1>
          <p className="page-subtitle">Configure academic classes, sections, and class teacher assignments</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setClassName(''); setTeacher(''); setShowAddModal(true); }}>
          <Plus size={16} /> Add New Class
        </button>
      </div>

      <DataTable
        columns={columns}
        data={classes}
        title="Active Classes"
        searchPlaceholder="Search by class name or teacher..."
      />

      {/* CREATE CLASS MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Class & Section">
        <form onSubmit={handleCreateClass}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <input className="form-input" placeholder="e.g. Class 11" value={className} onChange={e => setClassName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Section *</label>
              <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
                {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Class Teacher</label>
            <select className="form-select" value={teacher} onChange={e => setTeacher(e.target.value)}>
              <option value="">Select Teacher (Optional)</option>
              {availableTeachers.length > 0 ? (
                availableTeachers.map(tName => <option key={tName} value={tName}>{tName}</option>)
              ) : (
                <option value="" disabled>No teachers registered yet (Add teacher in Teachers tab)</option>
              )}
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Class</button>
          </div>
        </form>
      </Modal>

      {/* EDIT CLASS MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Class — ${selectedClass?.name || ''}-${selectedClass?.section || ''}`}>
        <form onSubmit={handleUpdateClass}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Class Name *</label>
              <input className="form-input" value={className} onChange={e => setClassName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Section *</label>
              <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
                {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned Class Teacher</label>
            <select className="form-select" value={teacher} onChange={e => setTeacher(e.target.value)}>
              <option value="">Unassigned</option>
              {availableTeachers.map(t => <option key={t.id || t.name} value={t.name}>{t.name} ({t.dept})</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
