// src/pages/admin/HRPayroll.jsx
import { useState } from 'react';
import {
  Users, DollarSign, FileText, CheckCircle, Download, CreditCard, Plus,
  Building, Award, UserPlus, FileCheck, Layers, Calendar, AlertTriangle, ShieldCheck
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../services/exportService';
import { generateStaffPayslipPDF } from '../../services/pdfService';
import { logAuditEvent } from '../../services/auditService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_STAFF = [
  { id: '1', empId: 'EMP-101', name: 'Mrs. Priya Sharma', role: 'Teacher', dept: 'Mathematics', designation: 'Senior Faculty', basicSalary: 45000, allowances: 8000, deductions: 2500, netPay: 50500, loanBalance: 0, status: 'Paid', joiningDate: '2022-06-15' },
  { id: '2', empId: 'EMP-102', name: 'Mr. Rajesh Verma', role: 'Teacher', dept: 'Science', designation: 'HOD Science', basicSalary: 42000, allowances: 7500, deductions: 2200, netPay: 47300, loanBalance: 15000, status: 'Paid', joiningDate: '2021-08-10' },
  { id: '3', empId: 'EMP-103', name: 'Sunita Mehra', role: 'Sub-Admin / Counsellor', dept: 'Administration', designation: 'Senior Counsellor', basicSalary: 55000, allowances: 10000, deductions: 3500, netPay: 61500, loanBalance: 0, status: 'Pending', joiningDate: '2020-03-01' },
  { id: '4', empId: 'EMP-104', name: 'Ramesh Kumar', role: 'Staff', dept: 'Maintenance', designation: 'Support Supervisor', basicSalary: 25000, allowances: 4000, deductions: 1200, netPay: 27800, loanBalance: 5000, status: 'Paid', joiningDate: '2023-01-20' },
];

const LEAVE_REQUESTS = [
  { id: 'l1', empId: 'EMP-101', name: 'Mrs. Priya Sharma', type: 'Casual Leave', days: 2, dates: '18 Aug - 19 Aug', reason: 'Personal work', status: 'Pending' },
  { id: 'l2', empId: 'EMP-104', name: 'Ramesh Kumar', type: 'Medical Leave', days: 3, dates: '10 Aug - 12 Aug', reason: 'Fever recovery', status: 'Approved' },
];

const HRPayroll = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [activeTab, setActiveTab] = useState('payroll');
  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem(`hr_staff_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_STAFF;
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem(`hr_leaves_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : LEAVE_REQUESTS;
  });

  const updateStaffState = (newList) => {
    setStaffList(newList);
    localStorage.setItem(`hr_staff_${currentTenant}`, JSON.stringify(newList));
  };

  // Onboarding Modal state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardData, setOnboardData] = useState({
    name: '', email: '', phone: '', dept: 'Mathematics', designation: 'Teacher', basicSalary: 40000, joiningDate: new Date().toISOString().split('T')[0],
  });

  const handleProcessPayroll = async (emp) => {
    const updated = staffList.map(s => s.empId === emp.empId ? { ...s, status: 'Paid' } : s);
    updateStaffState(updated);
    await logAuditEvent({
      action: 'PROCESS_SALARY',
      actor: 'Admin',
      target: emp.name,
      details: `Processed net salary payout ₹${emp.netPay.toLocaleString('en-IN')}`,
      tenantId: currentTenant,
    });
    toast.success(`✅ Salary processed & payslip generated for ${emp.name}!`);
  };

  const handleOnboardEmployee = async (e) => {
    e.preventDefault();
    const newEmp = {
      id: `emp_${Date.now()}`,
      empId: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: onboardData.name,
      role: 'Staff',
      dept: onboardData.dept,
      designation: onboardData.designation,
      basicSalary: Number(onboardData.basicSalary),
      allowances: 6000,
      deductions: 2000,
      netPay: Number(onboardData.basicSalary) + 4000,
      loanBalance: 0,
      status: 'Paid',
      joiningDate: onboardData.joiningDate,
    };
    updateStaffState([newEmp, ...staffList]);
    
    // Save to custom_users so staff member can log in immediately
    try {
      const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
      customUsers.unshift({
        uid: newEmp.id,
        email: (onboardData.email || `${onboardData.name.toLowerCase().replace(/\s+/g, '.')}@staff.edu`).toLowerCase(),
        password: onboardData.password || 'staff123',
        name: onboardData.name,
        role: 'staff',
        tenantId: activeTenantId || 'tenant_gvis',
        branchId: 'branch_main',
        status: 'Active',
        schoolName: 'Staff Operations Portal'
      });
      localStorage.setItem('custom_users', JSON.stringify(customUsers));
    } catch (e) {
      console.warn('LocalStorage custom_users save error:', e);
    }

    await logAuditEvent({
      action: 'STAFF_ONBOARDING',
      actor: 'Admin',
      target: onboardData.name,
      details: `Onboarded employee ${onboardData.name} into ${onboardData.dept}`,
      tenantId: activeTenantId || 'tenant_gvis',
    });
    toast.success(`🎉 ${onboardData.name} onboarded as ${onboardData.designation}!`);
    setShowOnboardModal(false);
    setOnboardData({
      name: '', email: '', phone: '', password: 'staff123', dept: 'Administration', designation: 'Operations Executive', basicSalary: 40000, joiningDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleApproveLeave = async (leaveId, empName) => {
    setLeaveRequests(leaveRequests.map(l => l.id === leaveId ? { ...l, status: 'Approved' } : l));
    await logAuditEvent({
      action: 'LEAVE_APPROVE',
      actor: 'Admin',
      target: empName,
      details: `Approved leave request for ${empName}`,
      tenantId: activeTenantId || 'tenant_gvis',
    });
    toast.success(`✅ Leave approved for ${empName}!`);
  };

  const columns = [
    { key: 'name', label: 'Employee Name & ID', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {r.empId} · Joined: {r.joiningDate}</span></div> },
    { key: 'dept', label: 'Department & Designation', render: (v, r) => <div><div>{v}</div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.designation}</span></div> },
    { key: 'basicSalary', label: 'Basic Salary', render: (v) => <span>₹{v.toLocaleString('en-IN')}</span> },
    { key: 'allowances', label: 'Allowances', render: (v) => <span style={{ color: 'var(--color-success)' }}>+₹{v.toLocaleString('en-IN')}</span> },
    { key: 'deductions', label: 'Deductions (PF/ESI)', render: (v) => <span style={{ color: 'var(--color-danger)' }}>-₹{v.toLocaleString('en-IN')}</span> },
    { key: 'netPay', label: 'Net Payable', render: (v) => <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>₹{v.toLocaleString('en-IN')}</strong> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Paid' ? 'badge-success' : 'badge-warning'}`}>{v}</span> },
    {
      key: 'empId', label: 'Actions & Payslip', sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status !== 'Paid' ? (
            <button className="btn btn-primary btn-sm" onClick={() => handleProcessPayroll(row)}>
              <CreditCard size={14} /> Process
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" title="Download PDF Payslip" onClick={() => generateStaffPayslipPDF({ empId: row.empId, employeeName: row.name, designation: row.designation, department: row.dept, basicSalary: row.basicSalary, allowances: row.allowances, deductions: row.deductions, netPay: row.netPay })}>
              <Download size={14} /> Payslip PDF
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Enterprise HR & Payroll Command System</h1>
          <p className="page-subtitle">Staff onboarding, attendance, leave approvals, salary structure, loan deductions & PDF payslips</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('HR_Payroll_Report', staffList, columns)}>
            <Download size={16} /> Export Payroll CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowOnboardModal(true)}>
            <UserPlus size={16} /> Onboard New Staff
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL STAFF COUNT</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>{123 + staffList.length} Employees</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL MONTHLY PAYROLL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)', marginTop: 4 }}>₹18.71 Lakh</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PENDING PAYROLL RUN</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: 4 }}>₹61,500 (1 Pending)</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ACTIVE STAFF LOANS</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-info)', marginTop: 4 }}>₹20,000 (2 Active)</div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)' }}>
        {[
          { id: 'payroll', label: 'Payroll & Payslips', icon: <DollarSign size={16} /> },
          { id: 'leave', label: 'Leave Requests Queue', icon: <Calendar size={16} /> },
          { id: 'loans', label: 'Staff Loans & Advances', icon: <CreditCard size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* PAYROLL & PAYSLIPS TAB */}
      {activeTab === 'payroll' && (
        <DataTable
          columns={columns}
          data={staffList}
          title="Master Employee Payroll Ledger"
          searchPlaceholder="Search staff by name, emp ID, department..."
        />
      )}

      {/* LEAVE APPROVALS TAB */}
      {activeTab === 'leave' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>🌴 Staff Leave Approval Queue</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{l.empId}</span></td>
                    <td><span className="badge badge-primary">{l.type}</span></td>
                    <td>{l.days} days</td>
                    <td>{l.dates}</td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{l.reason}</span></td>
                    <td><span className={`badge ${l.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>{l.status}</span></td>
                    <td>
                      {l.status !== 'Approved' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleApproveLeave(l.id, l.name)}>
                          Approve Leave
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF LOANS TAB */}
      {activeTab === 'loans' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>💳 Staff Salary Advances & Loans Ledger</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Outstanding Loan Balance</th>
                  <th>Monthly Deducted Installment</th>
                </tr>
              </thead>
              <tbody>
                {staffList.filter(s => s.loanBalance > 0).map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.empId}</span></td>
                    <td>{s.dept}</td>
                    <td><strong style={{ color: 'var(--color-danger)' }}>₹{s.loanBalance.toLocaleString('en-IN')}</strong></td>
                    <td><span className="badge badge-primary">₹2,500/mo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONBOARDING MODAL */}
      <Modal isOpen={showOnboardModal} onClose={() => setShowOnboardModal(false)} title="Onboard New Employee / Faculty">
        <form onSubmit={handleOnboardEmployee}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Employee Full Name *</label>
              <input className="form-input" placeholder="e.g. Dr. Amit Sharma" value={onboardData.name} onChange={e => setOnboardData({ ...onboardData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="amit@institution.edu" value={onboardData.email} onChange={e => setOnboardData({ ...onboardData, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={onboardData.dept} onChange={e => setOnboardData({ ...onboardData, dept: e.target.value })}>
                <option>Mathematics</option>
                <option>Science</option>
                <option>English</option>
                <option>Administration</option>
                <option>Transport</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation *</label>
              <input className="form-input" placeholder="e.g. Senior Faculty" value={onboardData.designation} onChange={e => setOnboardData({ ...onboardData, designation: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Basic Monthly Salary (₹) *</label>
              <input className="form-input" type="number" placeholder="45000" value={onboardData.basicSalary} onChange={e => setOnboardData({ ...onboardData, basicSalary: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Joining *</label>
              <input className="form-input" type="date" value={onboardData.joiningDate} onChange={e => setOnboardData({ ...onboardData, joiningDate: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowOnboardModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Complete Onboarding</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HRPayroll;
