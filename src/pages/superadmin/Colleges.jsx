// src/pages/superadmin/Colleges.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Palette, Layers, Download, LogIn, AlertTriangle, Power, Globe } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { exportToCSV } from '../../services/exportService';
import { getColleges, deleteCollegeTenant } from '../../services/tenantService';
import toast from 'react-hot-toast';

const Colleges = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('All');
  const [suspendTarget, setSuspendTarget] = useState(null);

  useEffect(() => {
    const fetchRealTenants = async () => {
      setLoading(true);
      try {
        const realData = await getColleges();
        setColleges(realData.map(d => {
          const plan = d.plan || d.planTier || 'Standard';
          const planMrr = plan === 'Enterprise' ? 120000 : plan === 'Premium' ? 48000 : plan === 'Standard' ? 24000 : 12000;
          return {
            id: d.tenantId || d.id,
            name: d.name || d.collegeName || 'Institution',
            code: d.code || d.collegeCode || 'COL',
            plan,
            status: d.status || 'Active',
            students: Number(d.studentsCount || d.students || 0),
            mrr: d.status === 'Suspended' ? 0 : planMrr,
            location: d.address || d.location || (d.city ? `${d.city}, ${d.state}` : 'India'),
            email: d.email || d.adminEmail || 'admin@college.edu',
          };
        }));
      } catch (err) {
        console.warn('Error fetching colleges from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRealTenants();
  }, []);

  const handleOpenTenantLogin = (college) => {
    navigate(`/login?tenant=${encodeURIComponent(college.id)}`);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    await deleteCollegeTenant(suspendTarget.id, suspendTarget.name);
    setColleges(colleges.map(c => c.id === suspendTarget.id ? { ...c, status: 'Suspended' } : c));
    toast.success(`⚠️ Tenant ${suspendTarget.name} has been suspended.`);
    setSuspendTarget(null);
  };

  const filteredColleges = colleges.filter(c => {
    if (selectedPlanFilter !== 'All' && c.plan !== selectedPlanFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'name', label: 'College / Institution Name',
      render: (v, r) => (
        <div>
          <strong style={{ fontSize: '0.9rem' }}>{v}</strong>
          <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{r.code}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{r.location} · {r.email}</div>
        </div>
      )
    },
    { key: 'plan', label: 'Plan Tier', render: (v) => <span className="badge badge-primary">{v} Plan</span> },
    { key: 'students', label: 'Enrolled Capacity', render: (v) => <span>{v ? v.toLocaleString('en-IN') : '0'} students</span> },
    { key: 'mrr', label: 'Monthly MRR', render: (v) => <strong style={{ color: 'var(--color-success)' }}>₹{(v || 24000).toLocaleString('en-IN')}</strong> },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span className={`badge ${v === 'Active' ? 'badge-success' : v === 'Expiring' ? 'badge-warning' : 'badge-danger'}`}>
          {v}
        </span>
      )
    },
    {
      key: 'id', label: 'Actions & Shortcuts', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" title="Launch Theme Studio" onClick={() => navigate('/superadmin/theme-studio')}>
            <Palette size={14} /> Theme
          </button>
          <button className="btn btn-secondary btn-sm" title="Manage Public Website" onClick={() => navigate('/superadmin/website-builder')}>
            <Globe size={14} /> Website
          </button>
          <button className="btn btn-secondary btn-sm" title="Configure Feature Modules" onClick={() => navigate('/superadmin/modules')}>
            <Layers size={14} /> Modules
          </button>
          <button className="btn btn-primary btn-sm" title="Open tenant login" onClick={() => handleOpenTenantLogin(row)}>
            <LogIn size={14} /> Tenant Login
          </button>
          {row.status !== 'Suspended' && (
            <button className="btn btn-danger btn-sm" title="Suspend Tenant Access" onClick={() => setSuspendTarget(row)}>
              <Power size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">College & Institution Tenants</h1>
          <p className="page-subtitle">Manage multi-tenant institution onboarding, plan tiers, theme customization & impersonation</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('College_Tenants', filteredColleges, columns)}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/superadmin/colleges/create')}>
            <Plus size={16} /> Provision New College
          </button>
        </div>
      </div>

      {/* Plan Filter Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '12px 20px', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Filter by Subscription Plan:</span>
          {['All', 'Basic', 'Standard', 'Premium', 'Enterprise'].map(plan => (
            <button
              key={plan}
              className={`btn btn-sm ${selectedPlanFilter === plan ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedPlanFilter(plan)}
            >
              {plan} {plan !== 'All' && 'Tier'}
            </button>
          ))}
        </div>
      </div>

      {/* Tenants Table */}
      <DataTable
        columns={columns}
        data={filteredColleges}
        title="Active SaaS Institution Directory"
        searchPlaceholder="Search by college name, code, email, location..."
        loading={loading}
        emptyText="No institution tenants found in Firestore ('tenants' / 'schools')"
      />

      {/* Suspend Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={handleConfirmSuspend}
        title="Suspend Institution Tenant Access"
        message={`Are you sure you want to suspend access for ${suspendTarget?.name}? All college admins, teachers, students, and parents will be temporarily locked out of the portal.`}
        affectedRecords={`${suspendTarget?.students} enrolled students and faculty members.`}
        confirmLabel="Confirm Tenant Suspension"
        variant="danger"
      />
    </div>
  );
};

export default Colleges;
