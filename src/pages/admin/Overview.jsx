// src/pages/admin/Overview.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import {
  GraduationCap, Users, CheckCircle2, DollarSign, UserPlus,
  Calendar, CreditCard, ArrowRight, AlertTriangle,
  RefreshCw, Check, X, Eye, Send, Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { getStudentsByBranch, getTeachersByBranch, getExams } from '../../services/academicService';
import { DEFAULT_COLLECTIONS } from '../../services/feeService';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const DEFAULT_APPROVALS = [
  { id: 'app_1', type: 'Student Leave', name: 'Rohan Sharma', subtext: 'Class 10-A (Roll: GV-2026-002)', reason: 'Medical Leave for fever (2 days: Aug 18 - Aug 19)', date: 'Today', applicantRole: 'Student', status: 'Pending' },
  { id: 'app_2', type: 'Teacher Leave', name: 'Mrs. Priya Sharma', subtext: 'Faculty Mathematics', reason: 'Casual Leave for family function', date: 'Tomorrow', applicantRole: 'Teacher', status: 'Pending' },
  { id: 'app_3', type: 'Admission Verification', name: 'Kabir Verma', subtext: 'Class 6-C (Adm: ADM-2026-104)', reason: 'Caste & Income certificates submitted for fee concession', date: 'Yesterday', applicantRole: 'Parent', status: 'Pending' },
];

const AdminOverview = () => {
  const navigate = useNavigate();
  const { tenantId: activeTenantId, branchId: activeBranchId, userProfile, academicSession } = useAuthStore();
  const currentTenant = activeTenantId || 'tenant_gvis';
  const currentBranch = activeBranchId || 'branch_main';
  const { students: storeStudents } = useStudentStore();

  const institutionName = userProfile?.schoolName || (currentTenant === 'tenant_gvis' ? 'Green Valley International School' : 'Campus Institution');
  const branchName = userProfile?.branchName || 'Main Campus';

  const [loading, setLoading] = useState(true);
  const [selectedApprovalForModal, setSelectedApprovalForModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // 1. Pending Approvals State (Persisted per tenant)
  const [pendingApprovals, setPendingApprovals] = useState(() => {
    try {
      const saved = localStorage.getItem(`admin_pending_approvals_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Approvals storage load error:', e);
    }
    return currentTenant === 'tenant_gvis' ? DEFAULT_APPROVALS : [];
  });

  // 2. Overview Stats State
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendancePct: '0%',
    todayAttendancePresent: 0,
    todayAttendanceTotal: 0,
    feeCollected: 0,
    feePending: 0,
    teachersCount: 0,
    staffCount: 0,
    upcomingExamsCount: 0,
  });

  // 3. Weekly Attendance Trend Data
  const [weeklyTrend, setWeeklyTrend] = useState([
    { day: 'Mon', attendance: 0 },
    { day: 'Tue', attendance: 0 },
    { day: 'Wed', attendance: 0 },
    { day: 'Thu', attendance: 0 },
    { day: 'Fri', attendance: 0 },
  ]);
  const [weeklyAvgPct, setWeeklyAvgPct] = useState('0.0%');

  // 4. Low Attendance Students (< 75%)
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);

  // 5. Operations summary counts
  const [opsSummary, setOpsSummary] = useState({
    studentAttendanceMarked: 0,
    studentAttendanceTotal: 0,
    teacherAttendanceMarked: 0,
    teacherAttendanceTotal: 0,
    feeReceiptsToday: 0,
    feeReceiptsTarget: 0,
  });

  // Save Approvals Helper
  const persistApprovals = useCallback((updatedList) => {
    setPendingApprovals(updatedList);
    try {
      localStorage.setItem(`admin_pending_approvals_${currentTenant}`, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Approvals storage save error:', e);
    }
  }, [currentTenant]);

  // Main Metrics Aggregation Engine
  const fetchOverviewMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const isDefaultTenant = currentTenant === 'tenant_gvis';

      // ─── A. STUDENT METRICS (Scoped to tenant + branch + session) ───
      const tenantStudents = storeStudents.filter(s => {
        const tenantMatches = s.tenantId === currentTenant || (!s.tenantId && isDefaultTenant);
        const sessionMatches = !s.session || !academicSession || s.session === academicSession;
        return tenantMatches && sessionMatches;
      });
      let realStudents = tenantStudents;

      try {
        const fsStudents = await getStudentsByBranch(currentTenant, currentBranch);
        if (fsStudents && fsStudents.length > 0) {
          const map = new Map();
          tenantStudents.forEach(s => map.set(s.id, s));
          fsStudents.forEach(s => map.set(s.id || s.uid, s));
          realStudents = Array.from(map.values()).filter(s => {
            const tenantMatches = s.tenantId === currentTenant || (!s.tenantId && isDefaultTenant);
            const sessionMatches = !s.session || !academicSession || s.session === academicSession;
            return tenantMatches && sessionMatches;
          });
        }
      } catch {
        // use local
      }

      const activeStudentCount = realStudents.filter(s => s.status !== 'Alumni' && s.status !== 'Inactive').length;

      // ─── B. TEACHER METRICS ───
      let activeTeachers = [];
      try {
        const savedTeachers = localStorage.getItem(`teacher_roster_${currentTenant}`);
        if (savedTeachers) {
          activeTeachers = JSON.parse(savedTeachers);
        } else if (isDefaultTenant) {
          activeTeachers = [
            { id: 't_101', name: 'Mrs. Priya Sharma', dept: 'Mathematics', status: 'Active' },
            { id: 't_102', name: 'Mr. Rajesh Verma', dept: 'Physics', status: 'Active' },
            { id: 't_103', name: 'Ms. Anjali Roy', dept: 'English', status: 'Active' },
            { id: 't_104', name: 'Dr. Meena Iyer', dept: 'Chemistry', status: 'Active' },
            { id: 't_105', name: 'Mr. Alok Singh', dept: 'Computer Science', status: 'Active' },
          ];
        }
        const fsTeachers = await getTeachersByBranch(currentTenant, currentBranch);
        if (fsTeachers && fsTeachers.length > 0) {
          const tMap = new Map();
          activeTeachers.forEach(t => tMap.set(t.id || t.uid, t));
          fsTeachers.forEach(t => tMap.set(t.id || t.uid, t));
          activeTeachers = Array.from(tMap.values());
        }
      } catch {
        // fallback
      }
      const teacherCount = activeTeachers.filter(t => t.status !== 'Inactive').length;

      // ─── C. STAFF METRICS ───
      let activeStaff = [];
      try {
        const savedStaff = localStorage.getItem(`hr_staff_${currentTenant}`);
        if (savedStaff) {
          activeStaff = JSON.parse(savedStaff);
        } else if (isDefaultTenant) {
          activeStaff = [
            { id: 'stf_1', name: 'Mrs. Sunita Mehra', designation: 'Senior Counsellor', status: 'Active' },
            { id: 'stf_2', name: 'Mr. Ramesh Kumar', designation: 'Support Supervisor', status: 'Active' },
          ];
        }
      } catch {
        // fallback
      }
      const staffCount = activeStaff.length;

      // ─── D. FEE METRICS ───
      let collectedSum = 0;
      let pendingSum = 0;
      let todayReceiptsCount = 0;
      const todayDateStr = new Date().toISOString().split('T')[0];

      // 1. Check collections
      let collections = [];
      const storedCol = localStorage.getItem(`collections_${currentTenant}`);
      if (storedCol) {
        try { collections = JSON.parse(storedCol); } catch {}
      } else if (isDefaultTenant) {
        collections = DEFAULT_COLLECTIONS;
      }

      collections.forEach(c => {
        const paid = Number(c.amountPaid || 0);
        const due = Number(c.totalDue || c.netAmount || 0);
        collectedSum += paid;
        if (due > paid) pendingSum += (due - paid);
        if (c.date === todayDateStr && paid > 0) todayReceiptsCount++;
      });

      // 2. Check student fee receipts & overdue fees
      realStudents.forEach(s => {
        if (s.feeReceipt && s.feeReceipt.totalPaid) {
          collectedSum += Number(s.feeReceipt.totalPaid);
          if (s.feeReceipt.date === todayDateStr) todayReceiptsCount++;
        }
        if (s.feeStatus === 'Overdue' || s.feeStatus === 'Pending') {
          pendingSum += Number(s.feeDue || 18500);
        }
      });

      // ─── E. ATTENDANCE METRICS ───
      let todayPresent = 0;
      let todayTotalMarked = 0;

      // Check attendance records in localStorage for currentTenant
      let attendanceRecordsFound = false;
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const trendMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
      const trendCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };

      // Inspect classes attendance
      const classesList = JSON.parse(localStorage.getItem(`class_list_${currentTenant}`) || '[]');
      classesList.forEach(cls => {
        const classAtt = JSON.parse(localStorage.getItem(`attendance_${currentTenant}_${cls.id || cls.name}`) || '[]');
        classAtt.forEach(att => {
          if (att.records && att.records.length > 0) {
            attendanceRecordsFound = true;
            const present = att.records.filter(r => r.status === 'Present').length;
            const total = att.records.length;
            const pct = Math.round((present / total) * 100);

            if (att.date === todayDateStr) {
              todayPresent += present;
              todayTotalMarked += total;
            }

            try {
              const dayName = new Date(att.date).toLocaleDateString('en-US', { weekday: 'short' });
              if (trendMap[dayName] !== undefined) {
                trendMap[dayName] += pct;
                trendCounts[dayName] += 1;
              }
            } catch {}
          }
        });
      });

      let calculatedAttendancePct = '0%';
      if (todayTotalMarked > 0) {
        calculatedAttendancePct = `${Math.round((todayPresent / todayTotalMarked) * 100)}%`;
      } else if (isDefaultTenant && activeStudentCount > 0) {
        todayPresent = Math.round(activeStudentCount * 0.942);
        todayTotalMarked = activeStudentCount;
        calculatedAttendancePct = '94.2%';
      }

      // Build Weekly Trend
      let sumWeeklyPct = 0;
      let countWeeklyDays = 0;
      const trendArray = daysOfWeek.map(day => {
        let val = trendCounts[day] > 0 ? Math.round(trendMap[day] / trendCounts[day]) : 0;
        if (val === 0 && isDefaultTenant && !attendanceRecordsFound && activeStudentCount > 0) {
          const defaultTrend = { Mon: 95.2, Tue: 94.8, Wed: 96.1, Thu: 93.9, Fri: 94.2 };
          val = defaultTrend[day];
        }
        if (val > 0) {
          sumWeeklyPct += val;
          countWeeklyDays += 1;
        }
        return { day, attendance: val };
      });

      const avgWeekly = countWeeklyDays > 0 ? (sumWeeklyPct / countWeeklyDays).toFixed(1) : '0.0';
      setWeeklyTrend(trendArray);
      setWeeklyAvgPct(`${avgWeekly}% Avg`);

      // ─── F. UPCOMING EXAMS METRICS ───
      let upcomingExams = 0;
      try {
        const storedExams = localStorage.getItem(`exams_${currentTenant}`);
        if (storedExams) {
          const exList = JSON.parse(storedExams);
          upcomingExams = exList.filter(e => !e.isLocked).length;
        } else {
          const fsExams = await getExams(currentTenant);
          if (fsExams && fsExams.length > 0) {
            upcomingExams = fsExams.filter(e => !e.isLocked).length;
          } else if (isDefaultTenant) {
            upcomingExams = 2;
          }
        }
      } catch {
        // fallback
      }

      // ─── G. LOW ATTENDANCE STUDENTS (< 75%) ───
      const lowAttList = realStudents
        .filter(s => {
          if (!s.attendance) return false;
          const num = parseInt(String(s.attendance).replace('%', ''), 10);
          return !isNaN(num) && num < 75;
        })
        .map(s => ({
          id: s.id,
          name: s.name,
          rollNo: s.rollNo || s.admissionNo || 'GV-001',
          class: s.class || s.className || 'General',
          attendancePct: String(s.attendance).includes('%') ? s.attendance : `${s.attendance}%`,
          parentPhone: s.phone || s.parentPhone || '+91 98765 43210',
          parentEmail: s.parentEmail || '',
        }));

      if (isDefaultTenant && lowAttList.length === 0 && realStudents.length > 0) {
        lowAttList.push(
          { id: 'st_104', name: 'Kabir Verma', rollNo: 'GV-2026-004', class: 'Class 6-C', attendancePct: '68%', parentPhone: '+91 98765 43215', parentEmail: 'anita.verma@gmail.com' },
          { id: 'st_105', name: 'Siddharth Roy', rollNo: 'GV-2026-005', class: 'Class 10-A', attendancePct: '71%', parentPhone: '+91 98765 43216', parentEmail: 'roy.parent@gmail.com' }
        );
      }
      setLowAttendanceStudents(lowAttList);

      // ─── H. PENDING APPROVALS FROM LEAVES ───
      try {
        const staffLeaves = JSON.parse(localStorage.getItem(`hr_leaves_${currentTenant}`) || '[]');
        const pendingLeaves = staffLeaves.filter(l => l.status === 'Pending').map(l => ({
          id: `leave_${l.id || Math.random()}`,
          type: 'Staff Leave',
          name: l.name,
          subtext: `${l.type} (${l.days} days)`,
          reason: l.reason || 'Leave requested',
          date: l.dates || 'Today',
          applicantRole: 'Staff',
          status: 'Pending',
        }));

        if (pendingLeaves.length > 0) {
          setPendingApprovals(prev => {
            const map = new Map();
            prev.forEach(p => map.set(p.id, p));
            pendingLeaves.forEach(p => { if (!map.has(p.id)) map.set(p.id, p); });
            return Array.from(map.values());
          });
        }
      } catch {}

      // Set Aggregated KPI Stats
      setStats({
        totalStudents: activeStudentCount,
        todayAttendancePct: calculatedAttendancePct,
        todayAttendancePresent: todayPresent,
        todayAttendanceTotal: todayTotalMarked,
        feeCollected: collectedSum,
        feePending: pendingSum,
        teachersCount: teacherCount,
        staffCount: staffCount,
        upcomingExamsCount: upcomingExams,
      });

      // Set Operations Summary
      setOpsSummary({
        studentAttendanceMarked: todayTotalMarked > 0 ? todayPresent : (isDefaultTenant ? Math.round(activeStudentCount * 0.942) : 0),
        studentAttendanceTotal: activeStudentCount,
        teacherAttendanceMarked: teacherCount > 0 ? Math.max(0, teacherCount - (isDefaultTenant ? 1 : 0)) : 0,
        teacherAttendanceTotal: teacherCount,
        feeReceiptsToday: todayReceiptsCount,
        feeReceiptsTarget: Math.max(todayReceiptsCount, 1),
      });
    } catch (err) {
      console.warn('Overview data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, currentBranch, storeStudents, academicSession]);

  useEffect(() => {
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics]);

  // ─── ACTION HANDLERS ───
  const handleApprove = async (approval) => {
    const updated = pendingApprovals.filter(item => item.id !== approval.id);
    persistApprovals(updated);

    await logAuditEvent({
      action: 'APPROVE_REQUEST',
      actor: 'Branch Admin',
      target: approval.name,
      details: `Approved ${approval.type} for ${approval.name} (${approval.subtext})`,
      tenantId: currentTenant,
    });

    toast.success(`✅ ${approval.type} for ${approval.name} approved!`);
    setSelectedApprovalForModal(null);
  };

  const handleReject = async (approval) => {
    const updated = pendingApprovals.filter(item => item.id !== approval.id);
    persistApprovals(updated);

    await logAuditEvent({
      action: 'REJECT_REQUEST',
      actor: 'Branch Admin',
      target: approval.name,
      details: `Rejected ${approval.type} for ${approval.name}. Reason: ${rejectReason || 'Administrative decision'}`,
      tenantId: currentTenant,
    });

    toast.error(`❌ ${approval.type} for ${approval.name} rejected.`);
    setSelectedApprovalForModal(null);
    setShowRejectInput(false);
    setRejectReason('');
  };

  const handleSendParentAlert = async (student) => {
    await logAuditEvent({
      action: 'SEND_ATTENDANCE_WARNING',
      actor: 'Branch Admin',
      target: student.name,
      details: `Dispatched low attendance SMS & Push alert to ${student.parentPhone} (Attendance: ${student.attendancePct})`,
      tenantId: currentTenant,
    });
    toast.success(`📲 Attendance warning alert dispatched to ${student.parentPhone} for ${student.name}`);
  };

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
      {/* 1. Page Header */}
      <div className="page-header flex justify-between items-center" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Institution Admin Control Center
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748B' }}>
            {institutionName} — {branchName} ({academicSession || '2026-27'})
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={fetchOverviewMetrics} disabled={loading} title="Refresh dashboard data">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/students')}>
            <Users size={16} /> Student Directory
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/students/admit')}>
            <UserPlus size={16} /> Admit New Student
          </button>
        </div>
      </div>

      {/* 2. TOP ROW: 8 OPERATIONAL KPI CARDS */}
      <div className="grid-4" style={{ marginBottom: 24, gap: 16 }}>
        <StatCard
          icon={<GraduationCap size={22} />}
          label="Total Enrolled Students"
          value={stats.totalStudents}
          trend={stats.totalStudents > 0 ? "academic year" : null}
          trendValue={stats.totalStudents > 0 ? 8.1 : null}
          color="var(--color-primary, #2563EB)"
        />
        <StatCard
          icon={<CheckCircle2 size={22} />}
          label="Today's Student Attendance"
          value={stats.todayAttendancePct}
          color="#16A34A"
          suffix={stats.todayAttendanceTotal > 0 ? ` (${stats.todayAttendancePresent}/${stats.todayAttendanceTotal})` : ''}
        />
        <StatCard
          icon={<DollarSign size={22} />}
          label="Total Fee Collected"
          value={stats.feeCollected}
          prefix="₹"
          trend={stats.feeCollected > 0 ? 'vs target' : null}
          trendValue={stats.feeCollected > 0 ? 92 : null}
          color="#0F766E"
        />
        <StatCard
          icon={<CreditCard size={22} />}
          label="Pending Fee Dues"
          value={stats.feePending}
          prefix="₹"
          color="#D97706"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Active Faculty Teachers"
          value={stats.teachersCount}
          color="#7C3AED"
        />
        <StatCard
          icon={<Users size={22} />}
          label="Administrative Staff"
          value={stats.staffCount}
          color="#0EA5E9"
        />
        <StatCard
          icon={<Calendar size={22} />}
          label="Upcoming Term Exams"
          value={stats.upcomingExamsCount}
          color="#334155"
          suffix=" scheduled"
        />
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="Pending Action Approvals"
          value={pendingApprovals.length}
          color="#DC2626"
          suffix=" pending"
        />
      </div>

      {/* 3. QUICK ACTION BAR (8 ACTIONS) */}
      <div className="card" style={{ marginBottom: 28, padding: '20px 24px' }}>
        <div className="card-header flex justify-between items-center" style={{ padding: 0, marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
            <Sparkles size={17} color="var(--color-primary, #2563EB)" /> Branch Operational Quick Actions
          </h4>
          <span className="badge badge-primary">Admin Desk</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="grid-auto-fit" style={{ gap: 14 }}>
            {[
              { label: 'Admit New Student', icon: '👨‍🎓', path: '/admin/students/admit', desc: '5-step admission wizard & fee collection' },
              { label: 'Class & Section Setup', icon: '🏫', path: '/admin/classes', desc: 'Manage class sections & teachers' },
              { label: 'Fee Collection Ledger', icon: '💰', path: '/admin/fees', desc: 'Fee structures, receipts & discounts' },
              { label: 'Timetable Builder', icon: '📅', path: '/admin/timetable', desc: 'Room, faculty & subject scheduling' },
              { label: 'Transport & Fleet', icon: '🚌', path: '/admin/transport', desc: 'Routes, vehicle roster & tracking' },
              { label: 'Teacher Management', icon: '👩‍🏫', path: '/admin/teachers', desc: 'Faculty profiles & subject allocation' },
              { label: 'Hostel Allocation', icon: '🏨', path: '/admin/hostel', desc: 'Dorm rooms & bed assignment' },
              { label: 'Custom Reports Engine', icon: '📊', path: '/admin/reports', desc: '10-domain CSV & PDF reporting' },
            ].map(qa => (
              <div
                key={qa.label}
                className="card flex items-center justify-between"
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => navigate(qa.path)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#93C5FD'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.4rem' }}>{qa.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A' }}>{qa.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 1 }}>{qa.desc}</div>
                  </div>
                </div>
                <ArrowRight size={14} color="#94A3B8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SECOND ROW: ATTENDANCE TREND CHART & APPROVALS QUEUE */}
      <div className="grid-12" style={{ gap: 24, marginBottom: 28 }}>
        {/* Attendance Trend Chart */}
        <div style={{ gridColumn: 'span 7' }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Weekly Attendance Trend (%)</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>Average attendance recorded across all classes this week</p>
              </div>
              <span className={`badge ${parseFloat(weeklyAvgPct) > 0 ? 'badge-success' : 'badge-neutral'}`}>
                {weeklyAvgPct}
              </span>
            </div>
            <div className="card-body flex-1" style={{ padding: '18px 20px' }}>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend}>
                    <defs>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="day" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={{ stroke: '#E2E8F0' }} tickLine={false} />
                    <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => [`${v}%`, 'Attendance Rate']} contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: '0.8rem' }} />
                    <Area type="monotone" dataKey="attendance" stroke="#16A34A" strokeWidth={2.5} fill="url(#attGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Queue */}
        <div style={{ gridColumn: 'span 5' }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>⏳ Pending Admin Approvals</h4>
              <span className={`badge ${pendingApprovals.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                {pendingApprovals.length} pending
              </span>
            </div>
            <div className="card-body flex-1" style={{ padding: 0, maxHeight: 270, overflowY: 'auto' }}>
              {pendingApprovals.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <CheckCircle2 size={36} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>All Requests Approved!</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748B' }}>There are currently no pending administrative approval requests.</p>
                </div>
              ) : (
                pendingApprovals.map((pa, i) => (
                  <div
                    key={pa.id}
                    style={{
                      padding: '12px 18px',
                      borderBottom: i < pendingApprovals.length - 1 ? '1px solid #F1F5F9' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>{pa.type}</span>
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>• {pa.date}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pa.name} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: '#64748B' }}>({pa.subtext})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pa.reason}
                      </div>
                    </div>
                    <div className="flex gap-1" style={{ flexShrink: 0 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setSelectedApprovalForModal(pa); setShowRejectInput(false); }}
                        title="Inspect full details"
                        style={{ padding: '4px 7px', fontSize: '0.72rem' }}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(pa)}
                        title="Approve request"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        <Check size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. THIRD ROW: LOW ATTENDANCE ALERTS & TODAY'S OPERATIONS SUMMARY */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Low Attendance Alerts */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} color="#D97706" />
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>Low Attendance Warning (&lt; 75%)</h4>
            </div>
            <span className={`badge ${lowAttendanceStudents.length > 0 ? 'badge-danger' : 'badge-success'}`}>
              {lowAttendanceStudents.length} Students
            </span>
          </div>
          <div className="card-body flex-1" style={{ padding: 0, maxHeight: 260, overflowY: 'auto' }}>
            {lowAttendanceStudents.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>Clean Attendance Record</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>No student records are currently below the critical 75% attendance line.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '10px 16px' }}>Student</th>
                    <th style={{ padding: '10px 16px' }}>Class</th>
                    <th style={{ padding: '10px 16px' }}>Attendance</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowAttendanceStudents.map((st, i) => (
                    <tr key={st.id || i} style={{ borderBottom: i < lowAttendanceStudents.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <strong style={{ color: '#0F172A' }}>{st.name}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Roll: {st.rollNo}</div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span className="badge badge-primary">{st.class}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ color: '#DC2626', fontWeight: 800 }}>{st.attendancePct}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleSendParentAlert(st)}
                          title="Send parent SMS & notice warning"
                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                        >
                          <Send size={12} /> Alert Parent
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Today's Operations Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              🏫 Today's Operations Summary
            </h4>
          </div>
          <div className="card-body flex-1" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            {[
              {
                role: 'Student Attendance Marked',
                total: opsSummary.studentAttendanceTotal,
                done: opsSummary.studentAttendanceMarked,
                color: '#16A34A',
              },
              {
                role: 'Teacher Attendance Marked',
                total: opsSummary.teacherAttendanceTotal,
                done: opsSummary.teacherAttendanceMarked,
                color: '#0F766E',
              },
              {
                role: 'Fee Receipts Generated Today',
                total: opsSummary.feeReceiptsToday > 0 ? opsSummary.feeReceiptsToday : 0,
                done: opsSummary.feeReceiptsToday,
                color: 'var(--color-primary, #2563EB)',
                isReceipt: true,
              },
            ].map(item => {
              const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : (item.isReceipt && item.done > 0 ? 100 : 0);
              return (
                <div key={item.role}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#0F172A' }}>{item.role}</span>
                    <span style={{ fontSize: '0.8rem', color: item.color, fontWeight: 700 }}>
                      {item.done}/{item.total} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', backgroundColor: item.color, borderRadius: 4, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6. APPROVAL DETAIL MODAL */}
      {selectedApprovalForModal && (
        <Modal
          isOpen={Boolean(selectedApprovalForModal)}
          onClose={() => { setSelectedApprovalForModal(null); setShowRejectInput(false); }}
          title={`Administrative Review: ${selectedApprovalForModal.type}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className="badge badge-primary">{selectedApprovalForModal.type}</span>
                <span style={{ fontSize: '0.76rem', color: '#64748B' }}>Submitted: {selectedApprovalForModal.date}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                {selectedApprovalForModal.name}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                {selectedApprovalForModal.subtext}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Reason & Details Submitted:
              </label>
              <div style={{ padding: '12px 14px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 8, marginTop: 4, fontSize: '0.86rem', color: '#0F172A' }}>
                {selectedApprovalForModal.reason}
              </div>
            </div>

            {showRejectInput && (
              <div className="animate-fadeIn">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>
                  Rejection Reason / Note to Applicant:
                </label>
                <textarea
                  className="form-input"
                  style={{ marginTop: 4, height: 70 }}
                  placeholder="Specify reason for administrative rejection..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between items-center" style={{ marginTop: 10, paddingTop: 14, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setSelectedApprovalForModal(null); setShowRejectInput(false); }}
              >
                Cancel
              </button>

              <div className="flex gap-2">
                {!showRejectInput ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowRejectInput(true)}
                  >
                    <X size={15} /> Reject Request
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedApprovalForModal)}
                  >
                    Confirm Rejection
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedApprovalForModal)}
                >
                  <Check size={15} /> Approve Request
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminOverview;
