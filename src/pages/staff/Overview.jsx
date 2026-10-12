// src/pages/staff/Overview.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import { CheckSquare, Clock, DollarSign, Calendar, FileText, Plus, Download, CheckCircle2, Search, AlertCircle, Shield, FileCheck } from 'lucide-react';
import { generateStaffPayslipPDF } from '../../services/pdfService';
import { applyStaffLeave, fetchStaffDuties, updateStaffDutyStatus, fetchStaffLeaveRequests } from '../../services/teacherService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const pathToTabMap = {
  '/staff': 'overview',
  '/staff/attendance': 'attendance',
  '/staff/leave': 'leave',
  '/staff/salary': 'salary',
  '/staff/hr-docs': 'hr-docs',
};

const tabToPathMap = {
  overview: '/staff',
  attendance: '/staff/attendance',
  leave: '/staff/leave',
  salary: '/staff/salary',
  'hr-docs': '/staff/hr-docs',
};

const HR_DOCUMENTS_DATA = [
  { id: 'hr_1', title: 'Staff Code of Conduct & Ethics Policy 2026', category: 'Policy', format: 'PDF', size: '1.2 MB', updated: 'Jan 2026', desc: 'Official guidelines on professional conduct, workplace ethics, and duties.' },
  { id: 'hr_2', title: 'Campus Safety & Emergency Response Protocol', category: 'Safety', format: 'PDF', size: '2.4 MB', updated: 'Feb 2026', desc: 'Emergency evacuation procedures, fire safety drills, and first-aid contacts.' },
  { id: 'hr_3', title: 'Staff Leave & Attendance Regulations', category: 'Policy', format: 'PDF', size: '850 KB', updated: 'Jan 2026', desc: 'Detailed leave entitlement rules, casual/sick leave quotas, and approval workflows.' },
  { id: 'hr_4', title: 'Group Health Insurance Claim Guide & Hospital List', category: 'Benefits', format: 'PDF', size: '3.1 MB', updated: 'Mar 2026', desc: 'Coverage details for staff health insurance, cashless hospital network, and claims.' },
  { id: 'hr_5', title: 'Non-Disclosure Agreement (NDA) & Data Security Rules', category: 'Compliance', format: 'PDF', size: '950 KB', updated: 'Jan 2026', desc: 'Student data privacy policies, confidential records safety, and IT guidelines.' },
  { id: 'hr_6', title: 'Staff Transport & Campus Movement Rules', category: 'Logistics', format: 'PDF', size: '600 KB', updated: 'Apr 2026', desc: 'Rules governing official vehicle usage, parking permits, and gate entry passes.' },
];

const StaffOverview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantId, branchId, user, userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState(pathToTabMap[location.pathname] || 'overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tab = pathToTabMap[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState('08:30 AM');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Leave Form State
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveHandover, setLeaveHandover] = useState('');

  // Downloaded Salary Slips tracker
  const [downloadedSlips, setDownloadedSlips] = useState({});

  // HR Documents Search & Category Filter State
  const [hrSearchQuery, setHrSearchQuery] = useState('');
  const [hrCategoryFilter, setHrCategoryFilter] = useState('All');

  // REACTIVE STATE FOR DUTIES
  const [duties, setDuties] = useState([
    { id: 1, title: 'Morning Main Gate Security & Entry Duty', time: '08:00 AM - 09:00 AM', location: 'Gate A Main Entrance', status: 'Done' },
    { id: 2, title: 'Library Stock & Accession Verification', time: '11:00 AM - 01:00 PM', location: 'Central Library', status: 'In Progress' },
    { id: 3, title: 'Cafeteria & Lunch Hall Supervision', time: '01:15 PM - 02:00 PM', location: 'Main Dining Hall', status: 'Pending' },
    { id: 4, title: 'Evening Transport Gate Exit Supervision', time: '03:30 PM - 04:30 PM', location: 'Bus Bay 2', status: 'Pending' },
  ]);

  // REACTIVE STATE FOR LEAVE APPLICATIONS
  const [leaveApplications, setLeaveApplications] = useState([
    { id: 'leave_1', leaveType: 'Casual Leave', fromDate: '2026-07-10', toDate: '2026-07-11', days: 2, reason: 'Personal domestic work', status: 'Approved', appliedOn: '2026-07-05' },
    { id: 'leave_2', leaveType: 'Sick Leave', fromDate: '2026-06-02', toDate: '2026-06-03', days: 2, reason: 'Viral fever & medical rest', status: 'Approved', appliedOn: '2026-06-01' },
    { id: 'leave_3', leaveType: 'Casual Leave', fromDate: '2026-08-20', toDate: '2026-08-21', days: 2, reason: 'Family event attendance', status: 'Pending Approval', appliedOn: '2026-08-12' },
  ]);

  // FETCH REAL FIRESTORE DATA FOR STAFF OPERATIONS
  useEffect(() => {
    let isMounted = true;
    const loadStaffData = async () => {
      setLoading(true);
      try {
        const staffIdentifier = user?.uid || 'staff_001';
        const tId = tenantId || 'tenant_gvis';

        const [dutiesRes, leaveRes] = await Promise.allSettled([
          fetchStaffDuties({ tenantId: tId, staffId: staffIdentifier }),
          fetchStaffLeaveRequests({ tenantId: tId, staffId: staffIdentifier })
        ]);

        if (!isMounted) return;

        if (dutiesRes.status === 'fulfilled' && dutiesRes.value?.length) {
          setDuties(prev => {
            const map = new Map();
            dutiesRes.value.forEach(item => map.set(item.id || item.title, item));
            prev.forEach(item => { if (!map.has(item.id || item.title)) map.set(item.id || item.title, item); });
            return Array.from(map.values());
          });
        }

        if (leaveRes.status === 'fulfilled' && leaveRes.value?.length) {
          setLeaveApplications(prev => {
            const map = new Map();
            leaveRes.value.forEach(item => map.set(item.id || item.reason, item));
            prev.forEach(item => { if (!map.has(item.id || item.reason)) map.set(item.id || item.reason, item); });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Error loading staff overview data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadStaffData();
    return () => { isMounted = false; };
  }, [tenantId, user]);

  // SALARY SLIPS DATA
  const salarySlips = [
    { label: 'Salary Slip — July 2026', month: 'July 2026', basic: 22000, allowances: 6000, deductions: 2200, net: '₹25,800', status: 'Disbursed' },
    { label: 'Salary Slip — June 2026', month: 'June 2026', basic: 22000, allowances: 6000, deductions: 2200, net: '₹25,800', status: 'Disbursed' },
    { label: 'Salary Slip — May 2026', month: 'May 2026', basic: 22000, allowances: 6000, deductions: 2200, net: '₹25,800', status: 'Disbursed' },
    { label: 'Salary Slip — April 2026', month: 'April 2026', basic: 22000, allowances: 6000, deductions: 2200, net: '₹25,800', status: 'Disbursed' },
  ];

  const handleDownloadSlip = (s) => {
    const staffName = userProfile?.name || (user?.email ? user.email.split('@')[0] : 'Staff Member');
    const staffEmpId = userProfile?.empId || user?.uid || 'EMP-2024-011';
    generateStaffPayslipPDF({
      empId: staffEmpId,
      employeeName: staffName,
      designation: userProfile?.designation || 'Administrative Support Staff',
      department: userProfile?.dept || 'Administration & Operations',
      month: s.month,
      basicSalary: s.basic,
      allowances: s.allowances,
      deductions: s.deductions,
      netPay: 25800,
    });
    setDownloadedSlips(prev => ({ ...prev, [s.month]: true }));
    toast.success(`📄 Downloading ${s.month} Payslip PDF for ${staffName}...`);
  };

  const handleToggleDutyStatus = async (id) => {
    let nextStatus = 'Pending';
    setDuties(prev => prev.map(d => {
      if (d.id === id) {
        nextStatus = d.status === 'Done' ? 'Pending' : d.status === 'Pending' ? 'In Progress' : 'Done';
        return { ...d, status: nextStatus };
      }
      return d;
    }));
    await updateStaffDutyStatus({ dutyId: id, status: nextStatus });
    toast.success('Duty status updated & synced to Firestore');
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo || !leaveReason.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    const d1 = new Date(leaveFrom);
    const d2 = new Date(leaveTo);
    const timeDiff = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    try {
      await applyStaffLeave({
        staffId: user?.uid || 'staff_001',
        staffName: 'Ramesh Kumar',
        tenantId: tenantId || 'tenant_gvis',
        branchId: branchId || 'branch_main',
        leaveType,
        fromDate: leaveFrom,
        toDate: leaveTo,
        days,
        reason: leaveReason,
      });
    } catch { /* fallback */ }

    const newLeave = {
      id: `leave_${Date.now()}`,
      leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo,
      days,
      reason: leaveReason,
      status: 'Pending Approval',
      appliedOn: new Date().toISOString().split('T')[0],
    };
    setLeaveApplications(prev => [newLeave, ...prev]);
    toast.success(`🎉 Leave application submitted! (${leaveType}: ${days} ${days === 1 ? 'day' : 'days'})`);
    setShowLeaveModal(false);
    setLeaveReason('');
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveHandover('');
  };

  const handleWithdrawLeave = (id) => {
    setLeaveApplications(prev => prev.map(l => l.id === id ? { ...l, status: 'Withdrawn' } : l));
    toast.success('Leave application withdrawn');
  };

  const handleDownloadHRDoc = (doc) => {
    toast.success(`📄 Downloading HR Document "${doc.title}.pdf"...`);
  };

  const completedDutiesCount = duties.filter(d => d.status === 'Done').length;
  const inProgressDutiesCount = duties.filter(d => d.status === 'In Progress').length;
  const dutyProgressPct = Math.round((completedDutiesCount / (duties.length || 1)) * 100);

  const filteredHRDocs = HR_DOCUMENTS_DATA.filter(doc => {
    const matchesCategory = hrCategoryFilter === 'All' || doc.category === hrCategoryFilter;
    const matchesSearch = doc.title.toLowerCase().includes(hrSearchQuery.toLowerCase()) || doc.desc.toLowerCase().includes(hrSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fadeIn">
      {/* PAGE HEADER */}
      <div className="page-header flex justify-between items-center flex-wrap" style={{ gap: 16 }}>
        <div>
          <h1 className="page-title">Staff Portal & Daily Operations</h1>
          <p className="page-subtitle">Welcome back, Ramesh Kumar 👋 | Administrative Support Staff</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary flex items-center gap-1" onClick={() => setShowLeaveModal(true)}>
            <Calendar size={16} /> Apply Leave
          </button>
          <button
            className={`btn ${checkedIn ? 'btn-success' : 'btn-primary'} flex items-center gap-1`}
            onClick={() => {
              setCheckedIn(!checkedIn);
              if (!checkedIn) {
                setCheckInTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                toast.success(`Checked in for today at ${checkInTime}!`);
              } else {
                toast.success('Checked out for the day');
              }
            }}
          >
            <Clock size={16} /> {checkedIn ? `Checked In (${checkInTime})` : 'Mark Daily Check-in'}
          </button>
        </div>
      </div>

      {/* NAVIGATION TAB CONTROL BAR */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Daily Roster & Duties', icon: <Clock size={16} /> },
          { id: 'attendance', label: 'Duty Status & Attendance', icon: <CheckSquare size={16} /> },
          { id: 'leave', label: 'Leave Applications', icon: <Calendar size={16} /> },
          { id: 'salary', label: 'Salary Slips', icon: <DollarSign size={16} /> },
          { id: 'hr-docs', label: 'HR Documents & Policies', icon: <FileText size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}
            onClick={() => {
              setActiveTab(tab.id);
              if (tabToPathMap[tab.id]) navigate(tabToPathMap[tab.id]);
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* METRIC STAT CARDS */}
      <div className="grid-4" style={{ gap: 20, marginBottom: 28 }}>
        <StatCard icon={<CheckSquare size={22} />} label="Monthly Attendance" value="98%" color="#16A34A" />
        <StatCard icon={<Clock size={22} />} label="Today's Duties" value={`${completedDutiesCount}/${duties.length} Done (${dutyProgressPct}%)`} color="var(--color-primary, #2563EB)" />
        <StatCard icon={<Calendar size={22} />} label="Leave Requests" value={`${leaveApplications.length} Submitted`} color="#0F766E" />
        <StatCard icon={<DollarSign size={22} />} label="Last Salary Payout" value="₹25,800" color="#7C3AED" />
      </div>

      {/* OVERVIEW & DUTIES SECTION */}
      {(activeTab === 'overview' || activeTab === 'attendance') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header flex justify-between items-center flex-wrap" style={{ gap: 12 }}>
            <div>
              <h4 style={{ margin: 0 }}>📋 Assigned Staff Duties Today</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Progress: <strong>{completedDutiesCount} Completed</strong> · <strong>{inProgressDutiesCount} In Progress</strong> · <strong>{duties.length - completedDutiesCount - inProgressDutiesCount} Pending</strong>
              </p>
            </div>
            <span className="badge badge-primary">{dutyProgressPct}% Completed</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Clock className="animate-spin" size={24} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--color-primary)' }} />
                Loading assigned staff duties from Firestore...
              </div>
            ) : duties.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, margin: 16 }}>
                <CheckSquare size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: 'var(--color-text-primary)' }}>No Assigned Duties Today</h4>
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No operational or security duties assigned for today.</p>
              </div>
            ) : (
              duties.map((d, i) => (
                <div
                  key={d.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: i < duties.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    backgroundColor: d.status === 'In Progress' ? 'var(--color-primary-light)' : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{d.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 3 }}>
                      Time Slot: <strong>{d.time}</strong> · Location: <strong>{d.location}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${d.status === 'Done' ? 'badge-success' : d.status === 'In Progress' ? 'badge-primary' : 'badge-warning'}`}>
                      {d.status}
                    </span>
                    <button
                      className={`btn btn-sm ${d.status === 'Done' ? 'btn-ghost' : d.status === 'In Progress' ? 'btn-success' : 'btn-primary'}`}
                      onClick={() => handleToggleDutyStatus(d.id)}
                    >
                      {d.status === 'Done' ? 'Mark Pending' : d.status === 'In Progress' ? '✓ Mark Done' : '▶ Start Duty'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LEAVE APPLICATIONS SECTION */}
      {(activeTab === 'overview' || activeTab === 'leave') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header flex justify-between items-center">
            <div>
              <h4 style={{ margin: 0 }}>📅 Staff Leave Application & Approval Tracker</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Available Balances: Casual Leave (8) | Sick Leave (10) | Earned Leave (12)
              </p>
            </div>
            <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setShowLeaveModal(true)}>
              <Plus size={14} /> Apply New Leave
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Clock className="animate-spin" size={24} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--color-primary)' }} />
                Loading staff leave applications...
              </div>
            ) : leaveApplications.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', backgroundColor: 'var(--color-bg-primary)', borderRadius: 8 }}>
                <Calendar size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: '0 0 12px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No leave applications submitted yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowLeaveModal(true)}>
                  <Plus size={14} /> Apply Leave
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {leaveApplications.map(leave => (
                  <div key={leave.id} style={{ padding: '14px 18px', border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.92rem' }}>{leave.leaveType} ({leave.days || 1} {leave.days === 1 ? 'Day' : 'Days'})</strong>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${leave.status === 'Approved' ? 'badge-success' : leave.status === 'Pending Approval' ? 'badge-warning' : 'badge-neutral'}`}>
                          {leave.status}
                        </span>
                        {leave.status === 'Pending Approval' && (
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleWithdrawLeave(leave.id)}>
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      Dates: <strong>{leave.fromDate}</strong> to <strong>{leave.toDate}</strong> {leave.appliedOn && `| Applied On: ${leave.appliedOn}`}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Reason: {leave.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SALARY SLIPS SECTION */}
      {(activeTab === 'overview' || activeTab === 'salary') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h4 style={{ margin: 0 }}>📄 Staff Salary Slips & Monthly Payout PDF Downloads</h4>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {salarySlips.map(s => (
                <div key={s.label} style={{
                  padding: '14px 18px', borderRadius: 8, border: '1px solid var(--color-border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                }}>
                  <div className="flex items-center gap-3">
                    <FileText size={20} color="var(--color-primary)" />
                    <div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{s.label}</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Net Payout: <strong>{s.net}</strong> · Status: <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{s.status}</span>
                      </div>
                    </div>
                    {downloadedSlips[s.month] && (
                      <span className="badge badge-success" style={{ marginLeft: 8 }}>Downloaded ✓</span>
                    )}
                  </div>
                  <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => handleDownloadSlip(s)}>
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HR DOCUMENTS & POLICIES TAB */}
      {(activeTab === 'hr-docs' || activeTab === 'overview') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header flex justify-between items-center flex-wrap" style={{ gap: 12 }}>
            <div>
              <h4 style={{ margin: 0 }}>🛡️ Official HR Documents & Campus Compliance Policies</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Access verified institutional policy handbooks, emergency guidelines, and benefits documentation
              </p>
            </div>
            {/* Filter Pills */}
            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              {['All', 'Policy', 'Safety', 'Benefits', 'Compliance', 'Logistics'].map(cat => (
                <button
                  key={cat}
                  className={`btn btn-sm ${hrCategoryFilter === cat ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setHrCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {/* Search Input */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2" style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  placeholder="Search HR documents by title or topic..."
                  value={hrSearchQuery}
                  onChange={e => setHrSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filteredHRDocs.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No HR documents found matching your search.
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 16 }}>
                {filteredHRDocs.map(doc => (
                  <div key={doc.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)' }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.95rem' }}>{doc.title}</strong>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{doc.category}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '4px 0 10px' }}>
                      {doc.desc}
                    </p>
                    <div className="flex justify-between items-center" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>Format: <strong>{doc.format}</strong> ({doc.size}) · Updated: {doc.updated}</span>
                      <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => handleDownloadHRDoc(doc)}>
                        <Download size={14} /> Download Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEAVE APPLICATION MODAL */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Apply for Staff Leave">
        <form onSubmit={handleApplyLeave}>
          <div className="form-group">
            <label className="form-label">Leave Type *</label>
            <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Earned Leave</option>
              <option>Half-Day Leave</option>
              <option>Emergency Leave</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">From Date *</label>
              <input className="form-input" type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">To Date *</label>
              <input className="form-input" type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Substitute Staff / Handover Person (Optional)</label>
            <input className="form-input" placeholder="e.g. Suresh Patel (Sub Administrator)" value={leaveHandover} onChange={e => setLeaveHandover(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" rows={3} placeholder="Detailed reason for leave..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Leave Application</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffOverview;
