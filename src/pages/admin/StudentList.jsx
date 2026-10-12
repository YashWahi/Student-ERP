// src/pages/admin/StudentList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import {
  UserPlus, Eye, Edit2, Download, Upload, FileText, Check,
  Filter, Trash2, IdCard, Search, CheckCircle, Clock, AlertCircle, Plus
} from 'lucide-react';
import { generateStudentIDCardPDF } from '../../services/pdfService';
import { exportToCSV } from '../../services/exportService';
import { useStudentStore } from '../../store/studentStore';
import { parseExcelOrCSV, normalizeStudents } from '../../utils/excelParser';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { createUserAccount } from '../../services/authService';

const StudentList = () => {
  const navigate = useNavigate();
  const { userProfile, tenantId: storeTenantId } = useAuthStore();
  const activeTenantId = userProfile?.tenantId || storeTenantId || 'tenant_gvis';
  const isCustomCollege = activeTenantId && activeTenantId !== 'tenant_gvis';

  const {
    students, addStudent, updateStudent, toggleStudentStatus,
    setStudentStatus, uploadStudentDocument, bulkImportStudents, deleteStudent
  } = useStudentStore();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Filter students for active college tenant
  const activeCollegeStudents = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];
    if (isCustomCollege) {
      return students.filter(s => s.tenantId === activeTenantId || s.tenantId === userProfile?.tenantId);
    }
    return students;
  }, [students, activeTenantId, userProfile?.tenantId, isCustomCollege]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Quick Add State
  const [addStudentName, setAddStudentName] = useState('');
  const [addRollNo, setAddRollNo] = useState('');
  const [addAdmissionNo, setAddAdmissionNo] = useState('');
  const [addClassName, setAddClassName] = useState('10-A');
  const [addParentName, setAddParentName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addParentEmail, setAddParentEmail] = useState('');
  const [addStudentEmail, setAddStudentEmail] = useState('');
  const [addStudentPassword, setAddStudentPassword] = useState('');
  const [addCategory, setAddCategory] = useState('GEN');
  const [addGender, setAddGender] = useState('Male');

  // Edit State
  const [editForm, setEditForm] = useState({
    name: '', class: '', parentName: '', phone: '', category: '', status: ''
  });

  // New Document Upload State
  const [newDocName, setNewDocName] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocStatus, setNewDocStatus] = useState('Verified');

  // Extract unique classes for filter dropdown
  const availableClasses = useMemo(() => {
    const set = new Set(activeCollegeStudents.map(s => s.class || s.className).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [activeCollegeStudents]);

  // Quota breakdown stats
  const quotaStats = useMemo(() => {
    const total = activeCollegeStudents.length;
    const gen = activeCollegeStudents.filter(s => (s.category || 'GEN') === 'GEN').length;
    const obc = activeCollegeStudents.filter(s => s.category === 'OBC').length;
    const sc = activeCollegeStudents.filter(s => s.category === 'SC').length;
    const st = activeCollegeStudents.filter(s => s.category === 'ST').length;
    const active = activeCollegeStudents.filter(s => (s.status || 'Active') === 'Active').length;
    const inactive = activeCollegeStudents.filter(s => s.status === 'Inactive').length;
    const alumni = activeCollegeStudents.filter(s => s.status === 'Alumni').length;
    return { total, gen, obc, sc, st, active, inactive, alumni };
  }, [activeCollegeStudents]);

  // Filtered Students (Search-as-you-type & multi-filter)
  const filteredStudents = useMemo(() => {
    return activeCollegeStudents.filter(s => {
      const studentClass = s.class || s.className || '';
      const studentCategory = s.category || 'GEN';
      const studentStatus = s.status || 'Active';

      if (classFilter !== 'All' && studentClass !== classFilter) return false;
      if (categoryFilter !== 'All' && studentCategory !== categoryFilter) return false;
      if (statusFilter !== 'All' && studentStatus !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchRoll = (s.rollNo || '').toLowerCase().includes(q);
        const matchAdm = (s.admissionNo || '').toLowerCase().includes(q);
        const matchClass = studentClass.toLowerCase().includes(q);
        const matchParent = (s.parentName || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchCategory = studentCategory.toLowerCase().includes(q);
        return matchName || matchRoll || matchAdm || matchClass || matchParent || matchPhone || matchCategory;
      }
      return true;
    });
  }, [activeCollegeStudents, classFilter, categoryFilter, statusFilter, searchQuery]);

  // Handlers
  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    if (!addStudentName.trim() || !addStudentEmail.trim()) {
      toast.error('Student name and a valid login email are required.');
      return;
    }

    try {
      const account = await createUserAccount({
        email: addStudentEmail.trim().toLowerCase(),
        password: addStudentPassword || undefined,
        name: addStudentName.trim(),
        role: 'student',
        tenantId: activeTenantId,
        branchId: userProfile?.branchId || null,
        phone: addPhone,
      });
      const created = addStudent({
        uid: account.user.uid,
        tenantId: activeTenantId,
        name: addStudentName.trim(),
        rollNo: addRollNo,
        admissionNo: addAdmissionNo,
        class: addClassName,
        parentName: addParentName,
        phone: addPhone,
        parentEmail: addParentEmail,
        studentEmail: account.profile.email,
        category: addCategory,
        gender: addGender,
      });

      toast.success(`${created.name} added. Use Forgot Password if no password was provided.`);
      setShowAddStudentModal(false);
      setAddStudentName(''); setAddRollNo(''); setAddAdmissionNo(''); setAddParentName(''); setAddPhone(''); setAddParentEmail(''); setAddStudentEmail(''); setAddStudentPassword('');
    } catch (error) {
      console.error('Unable to provision student account:', error);
      toast.error(error.message || 'Unable to provision student account.');
    }
  };

  const handleEditStudent = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    updateStudent(selectedStudent.id, editForm);
    toast.success(`Profile for ${editForm.name} updated successfully!`);
    setShowEditModal(false);
  };

  const handleToggleStatus = (st) => {
    toggleStudentStatus(st.id);
    const nextStatus = st.status === 'Active' ? 'Inactive' : st.status === 'Inactive' ? 'Alumni' : 'Active';
    toast.success(`Status for ${st.name} updated to "${nextStatus}"`);
  };

  const handleDownloadIDCard = (st) => {
    generateStudentIDCardPDF({
      studentName: st.name,
      rollNo: st.rollNo,
      className: st.class,
      dob: st.dob || '2012-05-15',
      bloodGroup: st.bloodGroup || 'O+',
      parentPhone: st.phone,
      collegeName: userProfile?.schoolName || 'EduERP Academy',
    });
    toast.success(`🪪 ID Card PDF generated for ${st.name}!`);
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Parsing Excel student records...', { id: 'st_import' });
      const rawRows = await parseExcelOrCSV(file);
      const normalized = normalizeStudents(rawRows);
      if (normalized.length === 0) {
        toast.error('No valid student records found in file', { id: 'st_import' });
        return;
      }
      bulkImportStudents(normalized);
      toast.success(`📥 Bulk import complete! ${normalized.length} new student records created.`, { id: 'st_import' });
      e.target.value = '';
    } catch (err) {
      toast.error(`Import failed: ${err.message}`, { id: 'st_import' });
    }
  };

  const handleUploadDocument = (e) => {
    e.preventDefault();
    if (!selectedStudent || !newDocName) return;
    uploadStudentDocument(selectedStudent.id, {
      name: newDocName,
      fileName: newDocFileName || `${newDocName.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      status: newDocStatus
    });

    // Refresh selected student ref
    const updated = students.find(s => s.id === selectedStudent.id);
    setSelectedStudent(updated || selectedStudent);

    toast.success(`📄 Document "${newDocName}" added to vault!`);
    setNewDocName(''); setNewDocFileName(''); setNewDocStatus('Verified');
  };

  const columns = [
    {
      key: 'name',
      label: 'Student Name & Roll',
      render: (v, r) => (
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/students/${r.id}`)}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary, #2563EB), #0F766E)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'
          }}>
            {v.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-primary, #2563EB)', textDecoration: 'underline' }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              Roll: {r.rollNo} · Adm: {r.admissionNo}
            </div>
          </div>
        </div>
      )
    },
    { key: 'class', label: 'Class & Section', render: (v) => <span className="badge badge-primary">{v}</span> },
    {
      key: 'parentName',
      label: 'Parent & Contact',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-primary, #2563EB)', fontFamily: 'monospace' }}>{r.phone}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Quota Category',
      render: (v) => {
        const badgeColors = {
          GEN: { bg: 'var(--color-primary-light, #EFF6FF)', text: 'var(--color-primary-hover, #1D4ED8)', border: 'var(--color-primary-border, #BFDBFE)' },
          OBC: { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
          SC: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
          ST: { bg: '#FDF2F8', text: '#DB2777', border: '#FBCFE8' }
        };
        const style = badgeColors[v] || badgeColors.GEN;
        return (
          <span className="badge" style={{ backgroundColor: style.bg, color: style.text, border: `1px solid ${style.border}`, fontWeight: 800 }}>
            {v}
          </span>
        );
      }
    },
    { key: 'attendance', label: 'Attendance', render: (v) => <span style={{ color: '#16A34A', fontWeight: 700 }}>{v}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (v, r) => (
        <select
          className="form-select"
          value={v}
          onChange={(e) => {
            setStudentStatus(r.id, e.target.value);
            toast.success(`Status set to ${e.target.value}`);
          }}
          style={{ padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700 }}
        >
          <option value="Active">🟢 Active</option>
          <option value="Inactive">🟡 Inactive</option>
          <option value="Alumni">🎓 Alumni</option>
        </select>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (_, r) => (
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm btn-icon" title="View Profile 360°" onClick={() => { setSelectedStudent(r); setShowProfileModal(true); }}>
            <Eye size={14} />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" title="Edit Student Profile" onClick={() => { setSelectedStudent(r); setEditForm(r); setShowEditModal(true); }}>
            <Edit2 size={14} />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" title="Download ID Card PDF" onClick={() => handleDownloadIDCard(r)}>
            <IdCard size={14} />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" title="Document Vault" onClick={() => { setSelectedStudent(r); setShowDocsModal(true); }}>
            <FileText size={14} />
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            style={{ color: '#DC2626' }}
            title="Delete Record"
            onClick={() => {
              if (window.confirm(`Delete student record for ${r.name}?`)) {
                deleteStudent(r.id);
                toast.success('Student record deleted');
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="page-title">Student Roster & Directory</h1>
          <p className="page-subtitle">Manage student enrollment records, category quotas, legal document vaults & ID card generation</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="btn btn-secondary btn-md cursor-pointer flex items-center gap-2">
            <Upload size={16} /> Bulk Excel Import
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} style={{ display: 'none' }} />
          </label>

          <button className="btn btn-secondary" onClick={() => exportToCSV('Student_Directory', filteredStudents, columns)}>
            <Download size={16} /> Export CSV
          </button>

          <button className="btn btn-secondary" onClick={() => setShowAddStudentModal(true)}>
            <UserPlus size={16} /> Quick Add Student
          </button>

          <button className="btn btn-primary" onClick={() => navigate('/admin/students/admit')}>
            <UserPlus size={16} /> Full Admission Wizard
          </button>
        </div>
      </div>

      {/* CATEGORY & STATUS QUOTA SUMMARY CARDS */}
      {loading ? (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ height: 12, width: '50%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 24, width: '30%', backgroundColor: '#CBD5E1', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>GEN QUOTA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-hover, #1D4ED8)', marginTop: 4 }}>
              {quotaStats.gen} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>({quotaStats.total > 0 ? ((quotaStats.gen / quotaStats.total) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>OBC QUOTA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0D9488', marginTop: 4 }}>
              {quotaStats.obc} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>({quotaStats.total > 0 ? ((quotaStats.obc / quotaStats.total) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>SC QUOTA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>
              {quotaStats.sc} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>({quotaStats.total > 0 ? ((quotaStats.sc / quotaStats.total) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>ST QUOTA</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DB2777', marginTop: 4 }}>
              {quotaStats.st} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B' }}>({quotaStats.total > 0 ? ((quotaStats.st / quotaStats.total) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="card flex justify-between items-center flex-wrap gap-3" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Instant Search input */}
          <div className="data-table-search" style={{ width: 260 }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search by student name, roll, parent, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.825rem', color: '#64748B' }}>
            <Filter size={14} /> <strong>Class:</strong>
            <select className="form-select" value={classFilter} onChange={e => setClassFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.825rem', color: '#64748B' }}>
            <strong>Quota Category:</strong>
            <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <option value="All">All Categories</option>
              <option value="GEN">GEN (General)</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.825rem', color: '#64748B' }}>
            <strong>Status:</strong>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <option value="All">All Statuses</option>
              <option value="Active">🟢 Active</option>
              <option value="Inactive">🟡 Inactive</option>
              <option value="Alumni">🎓 Alumni</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredStudents.length} of {students.length} Registered Students
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="card">
        <DataTable
          columns={columns}
          data={filteredStudents}
          title="Registered Students Directory"
          searchable={false}
          emptyText="No student records match your search query and filters."
        />
      </div>

      {/* STUDENT PROFILE 360° MODAL */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title={`Student Profile 360° — ${selectedStudent?.name || ''}`}>
        <div style={{ padding: 12 }}>
          <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary, #2563EB), #0F766E)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.5rem'
            }}>
              {selectedStudent?.name?.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedStudent?.name}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Roll No: <strong>{selectedStudent?.rollNo}</strong> · Adm No: <strong>{selectedStudent?.admissionNo}</strong> · Class: <strong>{selectedStudent?.class}</strong>
              </div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 14 }}>
            <div style={{ padding: 12, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>PARENT / GUARDIAN</div>
              <strong style={{ fontSize: '0.92rem' }}>{selectedStudent?.parentName}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary, #2563EB)' }}>{selectedStudent?.parentEmail || 'N/A'}</div>
            </div>

            <div style={{ padding: 12, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>CONTACT PHONE</div>
              <strong style={{ fontSize: '0.92rem', color: 'var(--color-primary, #2563EB)' }}>{selectedStudent?.phone}</strong>
            </div>

            <div style={{ padding: 12, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>CATEGORY QUOTA</div>
              <strong style={{ fontSize: '0.92rem' }}>{selectedStudent?.category}</strong>
            </div>

            <div style={{ padding: 12, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>ATTENDANCE & STATUS</div>
              <strong style={{ fontSize: '0.92rem', color: '#16A34A' }}>{selectedStudent?.attendance}</strong> · Status: {selectedStudent?.status}
            </div>

            <div style={{ padding: 12, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>RESIDENTIAL ADDRESS</div>
              <div style={{ fontSize: '0.85rem' }}>{selectedStudent?.address || 'Address details on file'}</div>
            </div>
          </div>

          <div className="flex justify-between items-center" style={{ marginTop: 24 }}>
            <button className="btn btn-secondary" onClick={() => handleDownloadIDCard(selectedStudent)}>
              <IdCard size={16} /> Download ID Card PDF
            </button>
            <button className="btn btn-primary" onClick={() => setShowProfileModal(false)}>Close Profile</button>
          </div>
        </div>
      </Modal>

      {/* DOCUMENT VAULT MODAL */}
      <Modal isOpen={showDocsModal} onClose={() => setShowDocsModal(false)} title={`Document Vault — ${selectedStudent?.name || ''}`}>
        <div style={{ padding: 8 }}>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 16 }}>
            Manage legal documents & verification status (Aadhaar, Birth Certificate, Transfer Certificate, Caste Cert).
          </p>

          {/* Upload New Document Form */}
          <form onSubmit={handleUploadDocument} style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10, color: '#0F172A' }}>
              ➕ Add New Legal Document to Vault
            </div>
            <div className="grid-3" style={{ gap: 10 }}>
              <input
                className="form-input"
                placeholder="Document Title (e.g. Income Cert)"
                required
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
              <input
                className="form-input"
                placeholder="File Name (e.g. income_scan.pdf)"
                value={newDocFileName}
                onChange={e => setNewDocFileName(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
              <select className="form-select" value={newDocStatus} onChange={e => setNewDocStatus(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="Verified">Verified</option>
                <option value="Pending Verification">Pending</option>
                <option value="Action Required">Action Required</option>
              </select>
            </div>
            <div className="flex justify-end" style={{ marginTop: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm">
                <Plus size={14} /> Attach Document
              </button>
            </div>
          </form>

          {/* List of Attached Documents */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {selectedStudent?.documents && selectedStudent.documents.length > 0 ? (
              selectedStudent.documents.map((d, i) => (
                <div key={d.id || i} className="flex justify-between items-center" style={{ padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div className="flex items-center gap-3">
                    <FileText size={20} color="var(--color-primary, #2563EB)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        File: <code>{d.fileName}</code> · Uploaded: {d.date}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${d.status === 'Verified' ? 'badge-success' : d.status === 'Pending Verification' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {d.status}
                    </span>
                    <button className="btn btn-ghost btn-sm" onClick={() => toast.success(`Viewing document: ${d.name}`)}>
                      Preview
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>No documents attached yet.</div>
            )}
          </div>

          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => setShowDocsModal(false)}>Close Vault</button>
          </div>
        </div>
      </Modal>

      {/* QUICK ADD STUDENT MODAL */}
      <Modal isOpen={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} title="Quick Add New Student">
        <form onSubmit={handleQuickAddStudent}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student Full Name *</label>
              <input className="form-input" placeholder="e.g. Arjun Sharma" value={addStudentName} onChange={e => setAddStudentName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input className="form-input" placeholder="Auto-generated if empty" value={addRollNo} onChange={e => setAddRollNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Admission Number</label>
              <input className="form-input" placeholder="Auto-generated if empty" value={addAdmissionNo} onChange={e => setAddAdmissionNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Class & Section *</label>
              <select className="form-select" value={addClassName} onChange={e => setAddClassName(e.target.value)}>
                <option>10-A</option>
                <option>10-B</option>
                <option>9-A</option>
                <option>8-B</option>
                <option>6-C</option>
                <option>5-A</option>
                <option>1-B</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category Quota *</label>
              <select className="form-select" value={addCategory} onChange={e => setAddCategory(e.target.value)}>
                <option value="GEN">GEN (General)</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={addGender} onChange={e => setAddGender(e.target.value)}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Parent / Guardian Name *</label>
              <input className="form-input" placeholder="Parent Name" value={addParentName} onChange={e => setAddParentName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Contact Phone *</label>
              <input className="form-input" placeholder="+91 98765 43210" value={addPhone} onChange={e => setAddPhone(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Student Login Email ID *</label>
              <input className="form-input" type="email" placeholder="e.g. student@gmail.com" value={addStudentEmail} onChange={e => setAddStudentEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password (Optional)</label>
              <input className="form-input" type="password" autoComplete="new-password" value={addStudentPassword} onChange={e => setAddStudentPassword(e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
            If empty, a random password is generated. The student can use Forgot Password to set their own.
          </p>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Student</button>
          </div>
        </form>
      </Modal>

      {/* EDIT STUDENT PROFILE MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit Profile — ${selectedStudent?.name || ''}`}>
        <form onSubmit={handleEditStudent}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student Name *</label>
              <input className="form-input" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Class & Section *</label>
              <input className="form-input" value={editForm.class || ''} onChange={e => setEditForm({ ...editForm, class: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Name *</label>
              <input className="form-input" value={editForm.parentName || ''} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input className="form-input" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category Quota *</label>
              <select className="form-select" value={editForm.category || 'GEN'} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="GEN">GEN</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={editForm.status || 'Active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
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

export default StudentList;
