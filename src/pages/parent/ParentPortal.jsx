import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User, CheckCircle2, Award, CreditCard, MessageSquare, Calendar, AlertCircle,
  Download, Plus, Truck, FileText, Send, Clock, BookOpen, ShieldCheck, HeartHandshake, Star,
  Bell, CalendarDays, Check, RefreshCw, Filter, ShieldAlert, ArrowRight, ExternalLink, MapPin
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import { initiateFeePayout } from '../../services/razorpayService';
import { generateFeeReceiptPDF, generateReportCardPDF } from '../../services/pdfService';
import {
  bookPTMSlot,
  raiseParentComplaint,
  submitParentFeedback,
  submitChildLeave,
  fetchParentPortalData,
  LINKED_CHILDREN_SEED
} from '../../services/parentService';
import { sendTeacherMessage } from '../../services/studentService';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import toast from 'react-hot-toast';

const pathToTabMap = {
  '/parent': 'overview',
  '/parent/attendance': 'attendance',
  '/parent/results': 'results',
  '/parent/fees': 'fees',
  '/parent/messages': 'chat',
  '/parent/calendar': 'calendar',
  '/parent/leave': 'leave',
  '/parent/ptm': 'ptm',
  '/parent/transport': 'transport',
  '/parent/complaints': 'complaints',
  '/parent/feedback': 'feedback',
};

const tabToPathMap = {
  overview: '/parent',
  attendance: '/parent/attendance',
  results: '/parent/results',
  fees: '/parent/fees',
  chat: '/parent/messages',
  calendar: '/parent/calendar',
  leave: '/parent/leave',
  ptm: '/parent/ptm',
  transport: '/parent/transport',
  complaints: '/parent/complaints',
  feedback: '/parent/feedback',
};

const ParentPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(pathToTabMap[location.pathname] || 'overview');

  useEffect(() => {
    const tab = pathToTabMap[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Multi-Child Switcher & Data States
  const [linkedChildren, setLinkedChildren] = useState(LINKED_CHILDREN_SEED);
  const [selectedChildId, setSelectedChildId] = useState('child_101');
  const [paidStatusMap, setPaidStatusMap] = useState({});

  // Dynamic UI State Arrays
  const [attendanceAlerts, setAttendanceAlerts] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [feeTransactions, setFeeTransactions] = useState([]);
  const [ptmBookings, setPtmBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  // Modals
  const [showPTMModal, setShowPTMModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Form states
  const [ptmDate, setPtmDate] = useState('2026-08-20');
  const [ptmTime, setPtmTime] = useState('10:00 AM - 10:30 AM');
  const [ticketCategory, setTicketCategory] = useState('Fee & Billing Query');
  const [ticketDesc, setTicketDesc] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Academic Quality');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [chatMsg, setChatMsg] = useState('');

  const { user, userProfile } = useAuthStore();
  const { students: storeStudents } = useStudentStore();
  const currentTenant = userProfile?.tenantId || 'tenant_gvis';
  const cleanEmail = (user?.email || '').toLowerCase().trim();

  // Child Leave Form State
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReasonText, setLeaveReasonText] = useState('');

  // Fetch Firestore Data on Mount
  useEffect(() => {
    let isMounted = true;
    const loadParentData = async () => {
      setLoading(true);
      
      // Match children from studentStore by parentEmail or tenant
      const matched = storeStudents.filter(s =>
        (s.parentEmail && s.parentEmail.toLowerCase().trim() === cleanEmail) ||
        (s.email && s.email.toLowerCase().trim() === cleanEmail) ||
        (s.studentEmail && s.studentEmail.toLowerCase().trim() === cleanEmail)
      );

      let childrenToSet = LINKED_CHILDREN_SEED;
      if (matched.length > 0) {
        childrenToSet = matched.map(s => ({
          id: s.id,
          name: s.name,
          class: s.class || s.className || 'Class 10-A',
          rollNo: s.rollNo || s.admissionNo || 'ST-101',
          school: s.schoolName || userProfile?.schoolName || 'Institution Campus',
          photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
          attendancePct: s.attendance || '95.2%',
          gpa: '8.8',
          rank: '3rd',
          feeDue: s.feeStatus === 'Paid' ? 0 : 12500,
          pendingHomework: 1,
          nextExam: 'Mid-Term Exam',
        }));
      } else if (currentTenant !== 'tenant_gvis') {
        // Custom college fallback
        const tenantKids = storeStudents.filter(s => s.tenantId === currentTenant);
        if (tenantKids.length > 0) {
          childrenToSet = tenantKids.map(s => ({
            id: s.id,
            name: s.name,
            class: s.class || s.className || 'Class 10-A',
            rollNo: s.rollNo || s.admissionNo || 'ST-101',
            school: userProfile?.schoolName || 'Institution Campus',
            photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
            attendancePct: s.attendance || '95.2%',
            gpa: '8.8',
            rank: '3rd',
            feeDue: s.feeStatus === 'Paid' ? 0 : 12500,
            pendingHomework: 1,
            nextExam: 'Mid-Term Exam',
          }));
        }
      }

      const data = await fetchParentPortalData(user?.uid || 'parent_001', currentTenant);
      if (isMounted) {
        setLinkedChildren(childrenToSet);
        if (childrenToSet.length > 0) {
          setSelectedChildId(childrenToSet[0].id);
        }
        setAttendanceAlerts(data.attendanceAlerts || []);
        setHomeworkList(data.homework || []);
        setExamsList(data.exams || []);
        setLeaveApplications(data.leaveApplications || []);
        setFeeTransactions(data.transactions || []);
        setPtmBookings(data.ptmBookings || []);
        setComplaints(data.complaints || []);
        setFeedbackList(data.feedbackList || []);
        setChatMessages(data.chatMessages || []);
        setLoading(false);
      }
    };
    loadParentData();
    return () => { isMounted = false; };
  }, [user, userProfile, storeStudents, cleanEmail, currentTenant]);

  const activeChild = useMemo(() => {
    return linkedChildren.find(c => c.id === selectedChildId) || linkedChildren[0] || LINKED_CHILDREN_SEED[0];
  }, [linkedChildren, selectedChildId]);

  const isPaid = paidStatusMap[activeChild.id] || false;

  const parentDisplayName = userProfile?.name || (user?.email ? user.email.split('@')[0] : 'Mr. Suresh Verma');
  const currentParentId = userProfile?.id || user?.uid || 'parent_001';

  // Handlers
  const handlePayChildFee = async () => {
    await initiateFeePayout({
      studentId: activeChild.id,
      studentName: `${activeChild.name} (${activeChild.class})`,
      feeId: `fee_${activeChild.id}_q2`,
      amount: activeChild.feeDue,
      feeType: 'Quarterly School Fee',
      parentEmail: user?.email || 'parent@school.edu',
      parentPhone: userProfile?.phone || '+91 98765 43212',
      onSuccess: (res) => {
        setPaidStatusMap(prev => ({ ...prev, [activeChild.id]: true }));
        const newTxn = {
          id: res.paymentId || `REC-${Date.now()}`,
          childId: activeChild.id,
          feeType: 'Quarterly School Fee (Q2)',
          amount: activeChild.feeDue,
          date: new Date().toISOString().split('T')[0],
          status: 'Paid',
          method: 'Online Razorpay',
        };
        setFeeTransactions(prev => [newTxn, ...prev]);
        toast.success(`🎉 Fee Paid for ${activeChild.name}! Txn: ${res.paymentId}`);
        generateFeeReceiptPDF({
          receiptNo: res.paymentId,
          studentName: activeChild.name,
          rollNo: activeChild.rollNo,
          className: activeChild.class,
          feeType: 'Quarterly School Fee (Q2)',
          amount: activeChild.feeDue,
        });
      },
      onFailure: () => toast.error('Payment cancelled'),
    });
  };

  const handleBookPTM = async (e) => {
    e.preventDefault();
    const res = await bookPTMSlot({
      tenantId: currentTenant,
      parentId: currentParentId,
      parentName: parentDisplayName,
      childId: activeChild.id,
      childName: activeChild.name,
      className: activeChild.class,
      teacherName: activeChild.teacher,
      date: ptmDate,
      timeSlot: ptmTime,
    });
    const newBooking = {
      id: res.id || `ptm_${Date.now()}`,
      childId: activeChild.id,
      teacherName: activeChild.teacher,
      date: ptmDate,
      timeSlot: ptmTime,
      room: 'Room 204',
      status: 'Confirmed',
    };
    setPtmBookings(prev => [newBooking, ...prev]);
    toast.success(`📅 PTM Meeting booked with ${activeChild.teacher} on ${ptmDate}!`);
    setShowPTMModal(false);
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    const res = await raiseParentComplaint({
      tenantId: currentTenant,
      parentId: currentParentId,
      parentName: parentDisplayName,
      childId: activeChild.id,
      childName: activeChild.name,
      category: ticketCategory,
      description: ticketDesc,
    });
    const newTicket = {
      id: res.id || `ticket_${Date.now()}`,
      childId: activeChild.id,
      category: ticketCategory,
      description: ticketDesc,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      response: 'Ticket submitted. Pending administrative review.',
    };
    setComplaints(prev => [newTicket, ...prev]);
    toast.success(`⚠️ Helpdesk Ticket submitted under ${ticketCategory}!`);
    setShowComplaintModal(false);
    setTicketDesc('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    const res = await submitParentFeedback({
      tenantId: currentTenant,
      parentId: currentParentId,
      parentName: parentDisplayName,
      childId: activeChild.id,
      childName: activeChild.name,
      category: feedbackCategory,
      rating: feedbackRating,
      comment: feedbackComment,
    });
    const newFb = {
      id: res.id || `fb_${Date.now()}`,
      childId: activeChild.id,
      category: feedbackCategory,
      rating: feedbackRating,
      comment: feedbackComment,
      date: new Date().toISOString().split('T')[0],
    };
    setFeedbackList(prev => [newFb, ...prev]);
    toast.success(`⭐ Feedback submitted successfully for ${activeChild.name}!`);
    setShowFeedbackModal(false);
    setFeedbackComment('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const res = await sendTeacherMessage({
      tenantId: currentTenant,
      senderId: currentParentId,
      senderName: `${parentDisplayName} (Parent)`,
      recipientRole: 'teacher',
      childId: activeChild.id,
      content: `[Child: ${activeChild.name}] ${chatMsg}`,
    });
    const newMsg = {
      id: res.id || `msg_${Date.now()}`,
      childId: activeChild.id,
      sender: 'Parent',
      senderName: parentDisplayName,
      text: chatMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);
    toast.success(`💬 Message sent to ${activeChild.teacher}!`);
    setChatMsg('');
  };

  const handleApplyChildLeave = async (e) => {
    e.preventDefault();
    if (!leaveFrom || !leaveReasonText.trim()) {
      toast.error('Please select start date and describe leave reason!');
      return;
    }

    const res = await submitChildLeave({
      tenantId: currentTenant,
      parentId: currentParentId,
      parentName: parentDisplayName,
      childId: activeChild.id,
      childName: activeChild.name,
      leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo || leaveFrom,
      reason: leaveReasonText,
    });

    const newLeave = {
      id: res.id || `lv_${Date.now()}`,
      childId: activeChild.id,
      leaveType,
      fromDate: leaveFrom,
      toDate: leaveTo || leaveFrom,
      reason: leaveReasonText,
      status: 'Pending',
      teacherRemark: `Submitted to Class Teacher ${activeChild.teacher} for review.`,
    };

    setLeaveApplications(prev => [newLeave, ...prev]);
    toast.success(`📝 Leave application submitted for ${activeChild.name}!`);
    setShowLeaveModal(false);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReasonText('');
  };

  const childFeeTransactions = useMemo(() => feeTransactions.filter(t => t.childId === activeChild.id), [feeTransactions, activeChild.id]);
  const childPTMBookings = useMemo(() => ptmBookings.filter(b => b.childId === activeChild.id), [ptmBookings, activeChild.id]);
  const childComplaints = useMemo(() => complaints.filter(c => c.childId === activeChild.id), [complaints, activeChild.id]);
  const childFeedbackList = useMemo(() => feedbackList.filter(f => f.childId === activeChild.id), [feedbackList, activeChild.id]);
  const childMessages = useMemo(() => chatMessages.filter(m => m.childId === activeChild.id), [chatMessages, activeChild.id]);
  const childHomework = useMemo(() => homeworkList.filter(h => h.childId === activeChild.id), [homeworkList, activeChild.id]);
  const childExams = useMemo(() => examsList.filter(e => e.childId === activeChild.id), [examsList, activeChild.id]);
  const childAttendanceAlerts = useMemo(() => attendanceAlerts.filter(a => a.childId === activeChild.id), [attendanceAlerts, activeChild.id]);
  const childLeaves = useMemo(() => leaveApplications.filter(l => l.childId === activeChild.id), [leaveApplications, activeChild.id]);

  // Render Skeleton while Loading
  if (loading) {
    return (
      <div className="animate-fadeIn" style={{ padding: 16 }}>
        <div className="card" style={{ height: 110, padding: 24, marginBottom: 24, backgroundColor: '#E2E8F0', borderRadius: 12, opacity: 0.7 }} />
        <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
          <div className="card" style={{ height: 90, backgroundColor: '#E2E8F0', borderRadius: 12, opacity: 0.7 }} />
          <div className="card" style={{ height: 90, backgroundColor: '#E2E8F0', borderRadius: 12, opacity: 0.7 }} />
          <div className="card" style={{ height: 90, backgroundColor: '#E2E8F0', borderRadius: 12, opacity: 0.7 }} />
        </div>
        <div className="card" style={{ height: 320, backgroundColor: '#E2E8F0', borderRadius: 12, opacity: 0.7 }} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Top Header & Multi-Child Switcher Dropdown */}
      <div className="page-header flex justify-between items-center flex-wrap" style={{ gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Parent Self-Service Portal</h1>
          <p className="page-subtitle">Real-time academic, attendance, fee ledger & teacher communication for your enrolled children</p>
        </div>

        {/* MULTI-CHILD SWITCHER DROPDOWN */}
        <div className="card flex items-center gap-3" style={{ padding: '12px 20px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)', borderRadius: 10 }}>
          <User size={20} color="var(--color-primary)" />
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ENROLLED SIBLING SWITCHER</div>
            <select
              className="form-select"
              style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 900, fontSize: '1rem', color: 'var(--color-primary)', cursor: 'pointer' }}
              value={selectedChildId}
              onChange={e => setSelectedChildId(e.target.value)}
            >
              {linkedChildren.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.class} ({c.rollNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* REAL-TIME ATTENDANCE GATE ALERT TICKER */}
      <div className="card flex items-center justify-between flex-wrap gap-3" style={{ padding: '14px 20px', marginBottom: 24, borderLeft: '4px solid var(--color-success)', backgroundColor: '#F0FDF4' }}>
        <div className="flex items-center gap-3">
          <Bell size={20} color="#16A34A" />
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase' }}>REAL-TIME GATE SCAN ALERT</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#14532D' }}>
              {activeChild.name} checked in at {activeChild.lastGateCheckIn} — <span style={{ color: '#16A34A' }}>{activeChild.checkInStatus}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('attendance')} style={{ color: '#15803D' }}>
          View Gate Logs →
        </button>
      </div>

      {/* TAB NAVIGATION SCROLLER */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <User size={16} /> },
          { id: 'attendance', label: 'Real-Time Attendance', icon: <CheckCircle2 size={16} /> },
          { id: 'results', label: 'Report Card', icon: <Award size={16} /> },
          { id: 'fees', label: 'Fee Payments', icon: <CreditCard size={16} /> },
          { id: 'calendar', label: 'Homework & Exams', icon: <CalendarDays size={16} /> },
          { id: 'chat', label: 'Teacher Chat', icon: <MessageSquare size={16} /> },
          { id: 'leave', label: 'Child Leave', icon: <FileText size={16} />, badge: childLeaves.length },
          { id: 'ptm', label: 'PTM Booking', icon: <Calendar size={16} /> },
          { id: 'transport', label: 'Bus Transport', icon: <Truck size={16} /> },
          { id: 'complaints', label: 'Helpdesk', icon: <AlertCircle size={16} /> },
          { id: 'feedback', label: 'Feedback', icon: <HeartHandshake size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flexShrink: 0, position: 'relative' }}
            onClick={() => {
              setActiveTab(t.id);
              if (tabToPathMap[t.id]) navigate(tabToPathMap[t.id]);
            }}
          >
            {t.icon} {t.label}
            {t.badge ? <span className="badge badge-primary" style={{ marginLeft: 6, padding: '2px 6px', fontSize: '0.7rem' }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
            <StatCard icon={<CheckCircle2 size={22} />} label="Today's Gate Status" value="Present" color="#16A34A" />
            <StatCard icon={<CheckCircle2 size={22} />} label="Monthly Attendance %" value={activeChild.attendancePct} color="#0F766E" />
            <StatCard icon={<CreditCard size={22} />} label="Pending School Fee" value={isPaid ? 0 : activeChild.feeDue} prefix="₹" color={isPaid ? '#16A34A' : '#DC2626'} />
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h4 style={{ margin: 0 }}>⚡ Quick Actions — {activeChild.name} ({activeChild.class})</h4>
              </div>
              <div className="card-body">
                <div className="grid-2" style={{ gap: 12 }}>
                  <button className="btn btn-primary" onClick={handlePayChildFee}>
                    <CreditCard size={16} /> Pay Fee Online
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowLeaveModal(true)}>
                    <FileText size={16} /> Apply Child Leave
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowPTMModal(true)}>
                    <Calendar size={16} /> Book PTM Slot
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('chat')}>
                    <MessageSquare size={16} /> Message Teacher
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowComplaintModal(true)}>
                    <AlertCircle size={16} /> Raise Helpdesk Query
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(true)}>
                    <HeartHandshake size={16} /> Submit Feedback
                  </button>
                </div>
              </div>
            </div>

            {/* Transport & Class Teacher Card */}
            <div className="flex flex-col gap-4">
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h4 style={{ margin: 0 }}>👩‍🏫 Class Teacher Details</h4>
                  <span className="badge badge-success">Class Teacher</span>
                </div>
                <div className="card-body">
                  <strong style={{ fontSize: '1rem', color: 'var(--color-text-primary)' }}>{activeChild.teacher}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    Email: {activeChild.teacherEmail}
                  </div>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={() => setActiveTab('chat')}>
                    <MessageSquare size={14} /> Send Message to Teacher
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h4 style={{ margin: 0 }}>🚌 Transport Bus Route</h4>
                  <span className="badge badge-success">Active Bus Seat</span>
                </div>
                <div className="card-body">
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{activeChild.busRoute}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Driver Phone Contact: {activeChild.driverPhone}</div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setActiveTab('transport')}>
                    <Truck size={14} /> View Live Bus Tracker →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOMEWORK & EXAM CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0 }}>📅 Homework & Upcoming Exam Calendar — {activeChild.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>Track assigned homework deadlines and term examination dates.</p>
            </div>
            <span className="badge badge-primary">{activeChild.class}</span>
          </div>

          <div className="card-body">
            <div className="grid-2" style={{ gap: 24 }}>
              {/* Homework Section */}
              <div>
                <h5 style={{ margin: '0 0 14px 0' }}>📚 Assigned Homework Tasks</h5>
                {childHomework.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                    No pending homework tasks assigned for {activeChild.name}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {childHomework.map(hw => (
                      <div key={hw.id} style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'white' }}>
                        <div className="flex justify-between items-center flex-wrap" style={{ gap: 8 }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{hw.title}</strong>
                          <span className={`badge ${hw.status === 'Submitted' ? 'badge-success' : 'badge-warning'}`}>{hw.status}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          {hw.subject} · Assigned by {hw.teacher}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Due: {hw.due}</div>
                        {hw.notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: 4, fontStyle: 'italic' }}>Note: "{hw.notes}"</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exam Schedule Section */}
              <div>
                <h5 style={{ margin: '0 0 14px 0' }}>📝 Term Examination Dates</h5>
                {childExams.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                    No upcoming exams scheduled for {activeChild.name}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {childExams.map(ex => (
                      <div key={ex.id} style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)' }}>
                        <div className="flex justify-between items-center flex-wrap" style={{ gap: 8 }}>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>{ex.title}</strong>
                          <span className="badge badge-primary">{ex.date}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          Timing: {ex.time} · Room: {ex.room}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: 4, fontWeight: 600 }}>
                          Syllabus: {ex.syllabus}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0 }}>✅ Real-Time Attendance & RFID Gate Alerts — {activeChild.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>Live gate scan check-in logs and monthly attendance summary</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLeaveModal(true)}>
                <FileText size={14} /> Apply for Child Leave
              </button>
              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{activeChild.attendancePct} Attendance</span>
            </div>
          </div>

          <div className="card-body">
            <div className="grid-3" style={{ gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>TOTAL WORKING DAYS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>120 Days</div>
              </div>
              <div style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>PRESENT DAYS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>115 Days</div>
              </div>
              <div style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>GATE CHECK-IN STATUS</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>{activeChild.checkInStatus}</div>
              </div>
            </div>

            <h5 style={{ margin: '0 0 12px 0' }}>🔔 Real-Time RFID Gate Scanner Logs</h5>
            {childAttendanceAlerts.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                No RFID gate scanner alerts logged for {activeChild.name} yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Alert Type</th>
                      <th>Status</th>
                      <th>Campus Gate Location</th>
                      <th>Log Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childAttendanceAlerts.map(al => (
                      <tr key={al.id}>
                        <td><strong>{al.date} ({al.time})</strong></td>
                        <td><span className="badge badge-primary">{al.type}</span></td>
                        <td><span className={`badge ${al.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{al.status}</span></td>
                        <td>{al.location}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{al.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHILD LEAVE APPLICATION TAB */}
      {activeTab === 'leave' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0 }}>📝 Child Leave Applications — {activeChild.name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>Submit absence leave requests directly to class teacher {activeChild.teacher}.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
              <Plus size={16} /> Apply for Child Leave
            </button>
          </div>

          <div className="card-body">
            {childLeaves.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <FileText size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No leave applications submitted yet for {activeChild.name}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {childLeaves.map(l => (
                  <div key={l.id} style={{ padding: 18, border: '1px solid var(--color-border)', borderRadius: 10, backgroundColor: 'white' }}>
                    <div className="flex justify-between items-center flex-wrap" style={{ gap: 8, marginBottom: 6 }}>
                      <div className="flex items-center gap-2">
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{l.leaveType}</strong>
                        <span className={`badge ${l.status === 'Approved' ? 'badge-success' : 'badge-warning'}`}>{l.status}</span>
                      </div>
                      <span className="badge badge-primary">{l.fromDate} {l.toDate !== l.fromDate ? `to ${l.toDate}` : ''}</span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '6px 0 8px' }}>Reason: "{l.reason}"</p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', padding: '8px 12px', backgroundColor: 'var(--color-bg-primary)', borderRadius: 6 }}>
                      Teacher Remark: {l.teacherRemark}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT CARD TAB */}
      {activeTab === 'results' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>📜 Child Academic Report Card — {activeChild.name}</h4>
            <button className="btn btn-primary btn-sm" onClick={async () => {
              await generateReportCardPDF({
                studentName: activeChild.name,
                rollNo: activeChild.rollNo,
                className: activeChild.class,
                overallPct: '94.2%',
                gpa: '9.6 / 10.0',
                rank: '1st',
                teacherRemarks: 'Outstanding academic performance and exemplary conduct in all subjects.',
              });
              toast.success(`📜 Report Card PDF generated for ${activeChild.name}!`);
            }}>
              <Download size={14} /> Download Report Card PDF
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks Obtained</th>
                  <th>Maximum Marks</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { sub: 'Mathematics', marks: 95, grade: 'A+' },
                  { sub: 'Physics / Science', marks: 92, grade: 'A+' },
                  { sub: 'English Literature', marks: 88, grade: 'A' },
                  { sub: 'Computer Science', marks: 96, grade: 'A+' },
                ].map(r => (
                  <tr key={r.sub}>
                    <td><strong>{r.sub}</strong></td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>{r.marks}</strong></td>
                    <td>100</td>
                    <td><span className="badge badge-success">{r.grade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FEES TAB */}
      {activeTab === 'fees' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>💳 Fee Ledger & Payment Status — {activeChild.name}</h4>
            {isPaid && (
              <button className="btn btn-ghost btn-sm" onClick={() => generateFeeReceiptPDF({ receiptNo: 'REC-901', studentName: activeChild.name, rollNo: activeChild.rollNo, className: activeChild.class, feeType: 'Tuition Fee Q2', amount: activeChild.feeDue })}>
                <Download size={14} /> Receipt PDF
              </button>
            )}
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '24px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 6 }}>
                {isPaid ? '₹0 Due' : `₹${activeChild.feeDue.toLocaleString('en-IN')}`}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
                {isPaid ? `Fee payment received for ${activeChild.name}. Receipt PDF generated!` : 'Quarterly School Fee (Q2) Due Date: 25th August 2026'}
              </p>

              {!isPaid ? (
                <button className="btn btn-primary btn-lg" onClick={handlePayChildFee}>
                  <CreditCard size={18} /> Pay School Fee Online via Razorpay
                </button>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>Fee Paid ✓</span>
              )}
            </div>

            <h5 style={{ margin: '0 0 12px 0' }}>📄 Fee Payment History & Receipts</h5>
            {childFeeTransactions.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 8 }}>
                No past fee transactions logged.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Txn ID</th>
                      <th>Fee Description</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childFeeTransactions.map(txn => (
                      <tr key={txn.id}>
                        <td><strong>{txn.id}</strong></td>
                        <td>{txn.feeType}</td>
                        <td>{txn.date}</td>
                        <td><strong>₹{txn.amount.toLocaleString('en-IN')}</strong></td>
                        <td>{txn.method}</td>
                        <td><span className="badge badge-success">{txn.status}</span></td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => generateFeeReceiptPDF({ receiptNo: txn.id, studentName: activeChild.name, rollNo: activeChild.rollNo, className: activeChild.class, feeType: txn.feeType, amount: txn.amount })}>
                            <Download size={14} /> PDF Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEACHER CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>💬 Direct Message to Class Teacher ({activeChild.teacher})</h4>
          </div>
          <div className="card-body">
            <div style={{ height: 280, padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, marginBottom: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {childMessages.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: 'auto' }}>No messages yet. Send a message to start conversation!</div>
              ) : (
                childMessages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === 'Parent' ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      backgroundColor: msg.sender === 'Parent' ? 'var(--color-primary-light)' : 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: 2 }}>{msg.senderName} ({msg.time})</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{msg.text}</div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input className="form-input" placeholder={`Write message to ${activeChild.teacher}...`} value={chatMsg} onChange={e => setChatMsg(e.target.value)} />
              <button type="submit" className="btn btn-primary"><Send size={16} /></button>
            </form>
          </div>
        </div>
      )}

      {/* PTM TAB */}
      {activeTab === 'ptm' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>📅 Parent-Teacher Meeting (PTM) Scheduler — {activeChild.name}</h4>
            <button className="btn btn-primary" onClick={() => setShowPTMModal(true)}>
              <Calendar size={16} /> Book PTM Slot
            </button>
          </div>
          <div className="card-body">
            {childPTMBookings.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '20px 0' }}>No PTM slots booked yet for {activeChild.name}.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {childPTMBookings.map(b => (
                  <div key={b.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                      <strong style={{ fontSize: '0.95rem' }}>Upcoming PTM — {b.teacherName}</strong>
                      <span className="badge badge-primary">{b.date}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Slot: {b.timeSlot} ({b.room || 'Room 204'}) | Status: <span className="badge badge-success">{b.status}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSPORT TAB */}
      {activeTab === 'transport' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>🚌 Live Bus Route & Transport Details — {activeChild.name}</h4>
            <span className="badge badge-success">On Route (In Transit)</span>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ASSIGNED BUS ROUTE</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{activeChild.busRoute}</div>
              </div>
              <div style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>DRIVER CONTACT</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{activeChild.driverPhone}</div>
              </div>
            </div>

            {/* LIVE LOCATION SIMULATION CARD */}
            <div style={{ padding: 20, border: '1px solid var(--color-primary-border)', borderRadius: 10, backgroundColor: 'var(--color-primary-light)' }}>
              <div className="flex justify-between items-center flex-wrap" style={{ gap: 12, marginBottom: 12 }}>
                <div className="flex items-center gap-2">
                  <MapPin size={20} color="var(--color-primary)" />
                  <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>Live GPS Location Tracker</strong>
                </div>
                <span className="badge badge-success">ETA: 12 mins to Drop Point</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Bus status: Traveling along Sector 62 Main Expressway. Current speed: 38 km/h. Next Stop: Gate A Campus Entrance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HELPDESK / COMPLAINTS TAB */}
      {activeTab === 'complaints' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>⚠️ Parent Helpdesk & Query Tickets — {activeChild.name}</h4>
            <button className="btn btn-primary" onClick={() => setShowComplaintModal(true)}>
              <AlertCircle size={16} /> Raise Helpdesk Ticket
            </button>
          </div>
          <div className="card-body">
            {childComplaints.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '20px 0' }}>No helpdesk tickets submitted yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {childComplaints.map(ticket => (
                  <div key={ticket.id} style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.95rem' }}>{ticket.category}: {ticket.description}</strong>
                      <span className={`badge ${ticket.status === 'Resolved' ? 'badge-success' : 'badge-warning'}`}>{ticket.status}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Ticket ID: {ticket.id} | Date: {ticket.date}</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Response: {ticket.response}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PARENT FEEDBACK TAB */}
      {activeTab === 'feedback' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>⭐ Parent Feedback & Suggestions — {activeChild.name}</h4>
            <button className="btn btn-primary" onClick={() => setShowFeedbackModal(true)}>
              <HeartHandshake size={16} /> Submit New Feedback
            </button>
          </div>
          <div className="card-body">
            {childFeedbackList.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', margin: '20px 0' }}>No feedback submitted yet. Your suggestions help us improve!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {childFeedbackList.map(fb => (
                  <div key={fb.id} style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.95rem' }}>{fb.category}</strong>
                      <div className="flex items-center gap-1">
                        {[...Array(fb.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="#EAB308" color="#EAB308" />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>Date: {fb.date}</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>"{fb.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. APPLY CHILD LEAVE MODAL */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={`Apply Leave for ${activeChild.name}`}>
        <form onSubmit={handleApplyChildLeave}>
          <div className="form-group">
            <label className="form-label">Leave Category *</label>
            <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              <option value="Medical Leave">Medical Leave (Sick / Consultation)</option>
              <option value="Family Function">Family Event / Function</option>
              <option value="Personal / Outstation">Personal / Outstation Travel</option>
              <option value="Other Emergency">Other Emergency</option>
            </select>
          </div>

          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input type="date" className="form-input" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Date (Optional)</label>
              <input type="date" className="form-input" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason for Absence *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Provide reason for child absence..."
              value={leaveReasonText}
              onChange={e => setLeaveReasonText(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Leave Request</button>
          </div>
        </form>
      </Modal>

      {/* 2. BOOK PTM MODAL */}
      <Modal isOpen={showPTMModal} onClose={() => setShowPTMModal(false)} title={`Book PTM Slot for ${activeChild.name}`}>
        <form onSubmit={handleBookPTM}>
          <div className="form-group">
            <label className="form-label">Meeting Date *</label>
            <input className="form-input" type="date" value={ptmDate} onChange={e => setPtmDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Time Slot *</label>
            <select className="form-select" value={ptmTime} onChange={e => setPtmTime(e.target.value)}>
              <option>10:00 AM - 10:30 AM</option>
              <option>11:00 AM - 11:30 AM</option>
              <option>02:00 PM - 02:30 PM</option>
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPTMModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Booking</button>
          </div>
        </form>
      </Modal>

      {/* 3. RAISE HELPDESK COMPLAINT MODAL */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Raise Helpdesk Query">
        <form onSubmit={handleRaiseComplaint}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={ticketCategory} onChange={e => setTicketCategory(e.target.value)}>
              <option>Fee & Billing Query</option>
              <option>Academic Issue</option>
              <option>Transport Issue</option>
              <option>Hostel / Mess Issue</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" rows={3} placeholder="Describe your query..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowComplaintModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Query</button>
          </div>
        </form>
      </Modal>

      {/* 4. SUBMIT FEEDBACK MODAL */}
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title={`Submit Parent Feedback for ${activeChild.name}`}>
        <form onSubmit={handleSubmitFeedback}>
          <div className="form-group">
            <label className="form-label">Feedback Category *</label>
            <select className="form-select" value={feedbackCategory} onChange={e => setFeedbackCategory(e.target.value)}>
              <option>Academic Quality</option>
              <option>Infrastructure & Facilities</option>
              <option>Transport & Safety</option>
              <option>Teacher Communication</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rating (1 to 5 Stars) *</label>
            <select className="form-select" value={feedbackRating} onChange={e => setFeedbackRating(Number(e.target.value))}>
              <option value={5}>5 Stars — Excellent</option>
              <option value={4}>4 Stars — Good</option>
              <option value={3}>3 Stars — Average</option>
              <option value={2}>2 Stars — Needs Improvement</option>
              <option value={1}>1 Star — Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comments / Suggestions *</label>
            <textarea className="form-textarea" rows={3} placeholder="Provide your feedback or suggestions..." value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Feedback</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParentPortal;
