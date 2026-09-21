// src/pages/student/StudentPortal.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap, Clock, CheckCircle2, BookOpen, Award, CreditCard,
  MessageSquare, Download, Upload, Edit3, Send, Sparkles, User,
  Trash2, RefreshCw, Bookmark, Video, CalendarDays
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import { initiateFeePayout } from '../../services/razorpayService';
import { generateFeeReceiptPDF, generateStudentIDCardPDF } from '../../services/pdfService';
import {
  fetchStudentPortalData,
  submitHomeworkFile,
  saveStudentNotebookNote,
  deleteStudentNotebookNote,
  submitOnlineQuiz,
  sendTeacherMessage,
  DEFAULT_STUDENT_PROFILE,
  DEFAULT_TIMETABLE,
  DEFAULT_EXAMS
} from '../../services/studentService';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import toast from 'react-hot-toast';

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'What is the discriminant formula for a quadratic equation ax² + bx + c = 0?',
    options: ['b² - 4ac', 'b² + 4ac', '2a / (-b)', 'a² + b²'],
    correctIndex: 0,
    explanation: 'The discriminant D = b² - 4ac determines the nature of the roots of a quadratic equation.'
  },
  {
    id: 2,
    question: 'If the discriminant D > 0 and a perfect square, the roots of the quadratic equation are:',
    options: ['Real, Rational, and Unequal', 'Real and Equal', 'Imaginary / Complex', 'Zero'],
    correctIndex: 0,
    explanation: 'When D > 0 and is a perfect square, the square root √D is rational, yielding two distinct rational roots.'
  },
  {
    id: 3,
    question: 'What is the sum of the roots (α + β) of the quadratic equation ax² + bx + c = 0?',
    options: ['-b / a', 'c / a', 'b / a', '-c / a'],
    correctIndex: 0,
    explanation: 'According to Vieta\'s formulas, α + β = -b/a and α · β = c/a.'
  },
  {
    id: 4,
    question: 'What is the product of the roots (α · β) of the quadratic equation ax² + bx + c = 0?',
    options: ['c / a', '-b / a', 'b / a', 'a / c'],
    correctIndex: 0,
    explanation: 'According to Vieta\'s formulas, the product of roots α · β = c/a.'
  }
];

const pathToTabMap = {
  '/student': 'home',
  '/student/timetable': 'timetable',
  '/student/attendance': 'attendance',
  '/student/homework': 'homework',
  '/student/exams': 'exams',
  '/student/results': 'results',
  '/student/quiz': 'quiz',
  '/student/vault': 'vault',
  '/student/notebook': 'notebook',
  '/student/fees': 'fees',
  '/student/messages': 'messages',
  '/student/profile': 'profile',
};

const tabToPathMap = {
  home: '/student',
  timetable: '/student/timetable',
  attendance: '/student/attendance',
  homework: '/student/homework',
  exams: '/student/exams',
  results: '/student/results',
  quiz: '/student/quiz',
  vault: '/student/vault',
  notebook: '/student/notebook',
  fees: '/student/fees',
  messages: '/student/messages',
  profile: '/student/profile',
};

const StudentPortal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(pathToTabMap[location.pathname] || 'home');

  useEffect(() => {
    const tab = pathToTabMap[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  const [loading, setLoading] = useState(true);

  // Authentication Context
  const { user, userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const { students: storeStudents } = useStudentStore();

  // Dynamic Student Matching
  const matchedStoreStudent = useMemo(() => {
    if (!storeStudents || storeStudents.length === 0) return null;
    return storeStudents.find(s => 
      s.id === user?.uid || 
      s.parentEmail === user?.email || 
      s.email === user?.email ||
      s.name?.toLowerCase() === userProfile?.name?.toLowerCase()
    ) || storeStudents[0];
  }, [storeStudents, user, userProfile]);

  // Main Interactive Data States
  const [profile, setProfile] = useState(DEFAULT_STUDENT_PROFILE);
  const [timetableList, setTimetableList] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [notesList, setNotesList] = useState([]);
  const [studyVault, setStudyVault] = useState([]);
  const [feeList, setFeeList] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [resultsList, setResultsList] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [bookmarkedVaultIds, setBookmarkedVaultIds] = useState([]);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Homework Form State
  const [selectedHw, setSelectedHw] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadFileName, setUploadFileName] = useState('Assignment_Solution.pdf');

  // Notebook Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('Mathematics');
  const [noteContent, setNoteContent] = useState('');
  const [noteSearch, setNoteSearch] = useState('');

  // Vault Search & Filter
  const [vaultSubject, setVaultSubject] = useState('All');
  const [vaultSearch, setVaultSearch] = useState('');

  // Homework Filter State
  const [hwFilter, setHwFilter] = useState('All');

  // Chat State
  const [chatMsg, setChatMsg] = useState('');

  // Leave Request Form State
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Profile Form State
  const [editProfile, setEditProfile] = useState({ ...DEFAULT_STUDENT_PROFILE });

  // Online Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Fetch Firestore Data on Mount
  const loadPortalData = useCallback(async () => {
    setLoading(true);
    const studentId = user?.uid || matchedStoreStudent?.id || 'std_101';
    const studentClass = matchedStoreStudent?.class || userProfile?.class || 'Class 10-A';
    const data = await fetchStudentPortalData(studentId, currentTenant, studentClass);
    
    const studentDisplayName = userProfile?.name || matchedStoreStudent?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Arjun Verma');
    const institutionName = userProfile?.schoolName || (currentTenant === 'tenant_gvis' ? 'Green Valley International School' : 'Campus Institution');
    
    const resolvedProfile = {
      name: studentDisplayName,
      rollNo: matchedStoreStudent?.rollNo || matchedStoreStudent?.admissionNo || 'GV-2026-001',
      class: matchedStoreStudent?.class ? `Class ${matchedStoreStudent.class.replace('Class ', '')}` : 'Class 10-A',
      school: institutionName,
      parentName: matchedStoreStudent?.parentName || 'Mr. Suresh Verma',
      parentPhone: matchedStoreStudent?.phone || '+91 98765 43212',
      parentEmail: matchedStoreStudent?.parentEmail || 'parent@test.com',
      bloodGroup: matchedStoreStudent?.bloodGroup || 'B+',
      dob: matchedStoreStudent?.dob || '2011-05-14',
      address: matchedStoreStudent?.address || 'H-142, Sector 62, Noida, Uttar Pradesh',
      emergencyContact: matchedStoreStudent?.phone || '+91 98765 43210',
    };

    setProfile(resolvedProfile);
    setEditProfile(resolvedProfile);
    setTimetableList(data.timetable || DEFAULT_TIMETABLE);
    setHomeworkList(data.homework || []);
    setNotesList(data.notes || []);
    setStudyVault(data.studyVault || []);
    setFeeList(data.fees || []);
    setChatMessages(data.messages || []);
    setAttendanceLogs(data.attendance || []);
    setResultsList(data.results || []);
    setUpcomingExams(data.exams || DEFAULT_EXAMS);
    setLoading(false);
  }, [user, userProfile, currentTenant, matchedStoreStudent]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Computed Values
  const pendingHomework = useMemo(() => homeworkList.filter(h => h.status === 'Pending'), [homeworkList]);
  const pendingFees = useMemo(() => feeList.filter(f => f.status === 'Pending'), [feeList]);
  const totalPendingFeeAmount = useMemo(() => pendingFees.reduce((acc, f) => acc + Number(f.amount || 0), 0), [pendingFees]);

  // Computed Dynamic Attendance %
  const monthlyAttendancePct = useMemo(() => {
    if (attendanceLogs.length > 0) {
      const present = attendanceLogs.filter(l => l.status === 'Present').length;
      return `${Math.round((present / attendanceLogs.length) * 100)}%`;
    }
    if (matchedStoreStudent?.attendance) {
      return String(matchedStoreStudent.attendance).includes('%') ? matchedStoreStudent.attendance : `${matchedStoreStudent.attendance}%`;
    }
    return '96%';
  }, [attendanceLogs, matchedStoreStudent]);

  // Computed Dynamic Latest GPA
  const latestGPA = useMemo(() => {
    if (resultsList.length > 0) {
      const totalMarks = resultsList.reduce((acc, r) => acc + Number(r.marks || 0), 0);
      const totalMax = resultsList.reduce((acc, r) => acc + Number(r.max || 100), 0);
      const pct = totalMax > 0 ? (totalMarks / totalMax) * 100 : 92;
      const gpa = (pct / 10).toFixed(1);
      const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : 'B';
      return `${gpa} (${grade})`;
    }
    return '9.6 (A+)';
  }, [resultsList]);

  // Dynamic Greeting based on current hour
  const greetingTime = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const filteredNotes = useMemo(() => {
    if (!noteSearch.trim()) return notesList;
    const queryStr = noteSearch.toLowerCase();
    return notesList.filter(n => n.title.toLowerCase().includes(queryStr) || n.content.toLowerCase().includes(queryStr) || (n.subject && n.subject.toLowerCase().includes(queryStr)));
  }, [notesList, noteSearch]);

  const filteredHomework = useMemo(() => {
    if (hwFilter === 'Pending') return homeworkList.filter(h => h.status === 'Pending');
    if (hwFilter === 'Submitted') return homeworkList.filter(h => h.status === 'Submitted');
    return homeworkList;
  }, [homeworkList, hwFilter]);

  const filteredVault = useMemo(() => {
    return studyVault.filter(item => {
      const matchSubject = vaultSubject === 'All' || item.subject === vaultSubject;
      const matchQuery = !vaultSearch.trim() || item.title.toLowerCase().includes(vaultSearch.toLowerCase()) || item.category.toLowerCase().includes(vaultSearch.toLowerCase());
      return matchSubject && matchQuery;
    });
  }, [studyVault, vaultSubject, vaultSearch]);

  // Handlers
  const handlePayFee = async (targetFeeItem) => {
    const feeToPay = targetFeeItem || pendingFees[0] || feeList[0];
    if (!feeToPay) return;
    await initiateFeePayout({
      studentId: profile.rollNo || user?.uid || 'std_101',
      studentName: profile.name,
      feeId: feeToPay.id,
      amount: feeToPay.amount,
      feeType: feeToPay.name,
      parentEmail: profile.parentEmail || 'parent@school.edu',
      parentPhone: profile.parentPhone || '+91 98765 43210',
      onSuccess: (res) => {
        setFeeList(prev => prev.map(f => f.id === feeToPay.id ? { ...f, status: 'Paid', paidOn: new Date().toLocaleDateString('en-IN'), receiptNo: res.paymentId } : f));
        toast.success(`🎉 Payment of ₹${feeToPay.amount.toLocaleString()} Successful! Receipt ID: ${res.paymentId}`);
        generateFeeReceiptPDF({
          receiptNo: res.paymentId,
          studentName: profile.name,
          rollNo: profile.rollNo,
          className: profile.class,
          feeType: feeToPay.name,
          amount: feeToPay.amount,
        });
      },
      onFailure: () => toast.error('Payment process cancelled'),
    });
  };

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHw) return;

    const res = await submitHomeworkFile({
      tenantId: currentTenant,
      studentId: user?.uid || profile.rollNo || 'std_101',
      studentName: profile.name,
      homeworkId: selectedHw.id,
      homeworkTitle: selectedHw.title,
      notes: submissionText,
      fileName: uploadFileName,
    });

    setHomeworkList(prev => prev.map(hw => hw.id === selectedHw.id ? {
      ...hw,
      status: 'Submitted',
      submittedAt: res.submittedAt || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      notes: submissionText || 'Assignment uploaded',
      fileName: uploadFileName || 'Assignment_Submission.pdf',
    } : hw));

    toast.success(`📤 Homework "${selectedHw.title}" submitted successfully!`);
    setShowUploadModal(false);
    setSubmissionText('');
    setSelectedHw(null);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      toast.error('Please enter a note title and content!');
      return;
    }

    const createdNote = await saveStudentNotebookNote({
      tenantId: currentTenant,
      studentId: user?.uid || profile.rollNo || 'std_101',
      title: noteTitle,
      subject: noteSubject,
      content: noteContent,
      date: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    });

    setNotesList(prev => [createdNote, ...prev]);
    toast.success(`📝 Note "${noteTitle}" saved to Digital Notebook!`);
    setShowNoteModal(false);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleDeleteNote = async (id, title) => {
    await deleteStudentNotebookNote(id, currentTenant, user?.uid || profile.rollNo || 'std_101');
    setNotesList(prev => prev.filter(n => n.id !== id));
    toast.success(`Deleted note "${title}"`);
  };

  const handleToggleBookmark = (id, title) => {
    setBookmarkedVaultIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        toast.success(`Removed "${title}" from bookmarks`);
        return prev.filter(bId => bId !== id);
      } else {
        toast.success(`⭐ Bookmarked "${title}"`);
        return [...prev, id];
      }
    });
  };

  const handleDownloadVaultItem = (item) => {
    toast.success(`📥 Downloading resource "${item.title}" (${item.size})...`);
  };

  const handleQuizSubmit = async () => {
    if (Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length) {
      toast.error('Please answer all quiz questions before submitting!');
      return;
    }

    let correctCount = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    setQuizScore(calculatedScore);
    setQuizSubmitted(true);

    await submitOnlineQuiz({
      tenantId: currentTenant,
      studentId: user?.uid || profile.rollNo || 'std_101',
      studentName: profile.name,
      quizTitle: 'Mathematics Discriminant & Quadratic Assessment',
      score: calculatedScore,
      correctCount,
      totalQuestions: QUIZ_QUESTIONS.length,
    });

    toast.success(`🎉 Assessment Submitted! Score: ${calculatedScore}% (${correctCount}/${QUIZ_QUESTIONS.length} Correct)`);
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;

    const messageText = chatMsg.trim();
    setChatMsg('');

    const res = await sendTeacherMessage({
      tenantId: currentTenant,
      studentId: user?.uid || profile.rollNo || 'std_101',
      studentName: profile.name,
      recipientRole: 'teacher',
      text: messageText,
    });

    const newMsg = {
      id: res.id || Date.now(),
      sender: profile.name,
      role: 'student',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    toast.success('💬 Message sent to Class Teacher!');
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    if (!leaveFrom || !leaveReason.trim()) {
      toast.error('Please specify start date and leave reason!');
      return;
    }

    const newLog = {
      id: Date.now(),
      date: `${leaveFrom}${leaveTo ? ' to ' + leaveTo : ''}`,
      status: 'Absent',
      checkIn: '-',
      remarks: `Leave Requested: ${leaveReason}`,
    };

    setAttendanceLogs(prev => [newLog, ...prev]);
    toast.success('📝 Leave application submitted to Class Teacher!');
    setShowLeaveModal(false);
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveReason('');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile({ ...editProfile });
    toast.success('👤 Profile details updated successfully!');
    setShowProfileModal(false);
  };

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
    <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
      {/* 1. Hero Greeting Banner */}
      <div className="card" style={{ padding: '24px 28px', marginBottom: 24, background: 'linear-gradient(135deg, var(--color-primary-light, #EFF6FF), #FFFFFF)', border: '1px solid var(--color-primary-border, #BFDBFE)' }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              STUDENT LEARNING PLATFORM
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', marginTop: 2, margin: '2px 0 0' }}>
              {greetingTime}, {profile.name} 👋
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: 3, margin: '3px 0 0' }}>
              {profile.class} · Roll No: {profile.rollNo} · {profile.school}
            </p>
          </div>

          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => generateStudentIDCardPDF({
                studentName: profile.name,
                rollNo: profile.rollNo,
                className: profile.class,
                bloodGroup: profile.bloodGroup,
                parentPhone: profile.parentPhone
              })}
            >
              <CreditCard size={16} /> Download ID Card PDF
            </button>
            <button className="btn btn-primary" onClick={() => handlePayFee()}>
              <CreditCard size={16} /> {pendingFees.length > 0 ? `Pay Fee (₹${totalPendingFeeAmount.toLocaleString('en-IN')})` : 'Fee Ledger'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: '#FFFFFF', overflowX: 'auto', border: '1px solid #E2E8F0' }}>
        {[
          { id: 'home', label: 'Home', icon: <GraduationCap size={16} /> },
          { id: 'timetable', label: 'Timetable Timeline', icon: <Clock size={16} /> },
          { id: 'attendance', label: 'Attendance %', icon: <CheckCircle2 size={16} /> },
          { id: 'homework', label: 'Homework', icon: <BookOpen size={16} />, badge: pendingHomework.length },
          { id: 'exams', label: 'Upcoming Exams', icon: <CalendarDays size={16} />, badge: upcomingExams.length },
          { id: 'results', label: 'Report Card', icon: <Award size={16} /> },
          { id: 'quiz', label: 'Online Quiz', icon: <Sparkles size={16} /> },
          { id: 'vault', label: 'Study Vault', icon: <Bookmark size={16} /> },
          { id: 'notebook', label: 'Digital Notebook', icon: <Edit3 size={16} /> },
          { id: 'fees', label: 'Fee Payment', icon: <CreditCard size={16} />, badge: pendingFees.length ? 'Due' : null },
          { id: 'messages', label: 'Teacher Chat', icon: <MessageSquare size={16} /> },
          { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
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
            {t.badge ? (
              <span className="badge badge-warning" style={{ marginLeft: 6, padding: '2px 6px', fontSize: '0.7rem' }}>{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 3. HOME TAB */}
      {activeTab === 'home' && (
        <div>
          <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
            <StatCard icon={<CheckCircle2 size={22} />} label="Monthly Attendance %" value={monthlyAttendancePct} color="#16A34A" />
            <StatCard icon={<BookOpen size={22} />} label="Pending Homework" value={`${pendingHomework.length} tasks`} color={pendingHomework.length ? "#D97706" : "#16A34A"} />
            <StatCard icon={<Award size={22} />} label="Latest Exam GPA" value={latestGPA} color="var(--color-primary, #2563EB)" />
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            {/* Active Homework Tasks */}
            <div className="card">
              <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid #E2E8F0', padding: '16px 20px' }}>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📚 Active Homework Tasks</h4>
                <span className={`badge ${pendingHomework.length > 0 ? 'badge-warning' : 'badge-success'}`}>
                  {pendingHomework.length > 0 ? `${pendingHomework.length} Pending` : 'All Completed ✓'}
                </span>
              </div>
              <div className="card-body" style={{ padding: '16px 20px' }}>
                {homeworkList.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                    <CheckCircle2 size={32} style={{ marginBottom: 6, color: '#16A34A' }} />
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>No homework assigned. You are all caught up!</p>
                  </div>
                ) : (
                  homeworkList.slice(0, 3).map((hw, idx) => (
                    <div key={hw.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: idx < 2 ? '1px solid #F1F5F9' : 'none', gap: 12 }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{hw.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{hw.subject} · Due: {hw.due}</div>
                        {hw.status === 'Submitted' && (
                          <div style={{ fontSize: '0.72rem', color: '#16A34A', marginTop: 2 }}>Submitted: {hw.submittedAt}</div>
                        )}
                      </div>
                      <div>
                        {hw.status === 'Submitted' ? (
                          <span className="badge badge-success">Submitted ✓</span>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedHw(hw); setShowUploadModal(true); }}>
                            <Upload size={14} /> Submit
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Timetable Timeline Teaser & Fee Reminder */}
            <div className="flex flex-col gap-4">
              <div className="card">
                <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📅 Today's Schedule Timeline</h4>
                  <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('timetable')}>Full Schedule →</button>
                </div>
                <div className="card-body" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {timetableList.length === 0 ? (
                      <p style={{ color: '#64748B', fontSize: '0.85rem' }}>No classes scheduled for today.</p>
                    ) : (
                      timetableList.slice(0, 3).map((slot, sIdx) => (
                        <div key={slot.p || sIdx} style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                          <div className="flex items-center gap-3">
                            <span className="badge badge-primary">P{slot.p}</span>
                            <div>
                              <strong style={{ fontSize: '0.88rem', color: '#0F172A' }}>{slot.subject}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{slot.teacher} · {slot.room}</div>
                            </div>
                          </div>
                          <span className={`badge ${slot.status === 'Ongoing' ? 'badge-success' : slot.status === 'Completed' ? 'badge-ghost' : 'badge-primary'}`}>
                            {slot.time}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {pendingFees.length > 0 && (
                <div className="card" style={{ padding: 18, borderLeft: '4px solid #D97706', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <div className="flex justify-between items-center flex-wrap" style={{ gap: 12 }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>Fee Payment Reminder</strong>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                        {pendingFees[0].name} — ₹{pendingFees[0].amount.toLocaleString('en-IN')} due on {pendingFees[0].dueDate}
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => handlePayFee(pendingFees[0])}>
                      Pay Online
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. TIMETABLE TIMELINE TAB */}
      {activeTab === 'timetable' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📅 Daily Schedule Timeline — {profile.class}</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Period timetable and room assignments</p>
            </div>
            <span className="badge badge-primary">Active Term Schedule</span>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            {timetableList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <Clock size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No timetable schedule available for today.</p>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--color-primary-border, #BFDBFE)', display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                  {timetableList.map((t, idx) => (
                    <div key={t.p || idx} style={{ position: 'relative' }}>
                      <div style={{
                        position: 'absolute',
                        left: -31,
                        top: 4,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: t.status === 'Ongoing' ? '#16A34A' : t.status === 'Completed' ? 'var(--color-primary, #2563EB)' : '#94A3B8',
                        border: '2px solid white'
                      }} />

                      <div style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 10, backgroundColor: t.status === 'Ongoing' ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF' }}>
                        <div className="flex justify-between items-center flex-wrap" style={{ gap: 8 }}>
                          <div className="flex items-center gap-3">
                            <span className="badge badge-primary">Period {t.p}</span>
                            <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{t.subject}</strong>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-ghost"><Clock size={12} style={{ marginRight: 4 }} />{t.time}</span>
                            <span className={`badge ${t.status === 'Ongoing' ? 'badge-success' : t.status === 'Completed' ? 'badge-ghost' : 'badge-warning'}`}>{t.status}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 8 }} className="flex gap-4 flex-wrap">
                          <span>Faculty: <strong>{t.teacher}</strong></span>
                          <span>Classroom: <strong>{t.room}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>📋 Full Weekly Schedule Grid</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                        <th style={{ padding: '10px 14px' }}>Period</th>
                        <th style={{ padding: '10px 14px' }}>Time Slot</th>
                        <th style={{ padding: '10px 14px' }}>Subject</th>
                        <th style={{ padding: '10px 14px' }}>Faculty Teacher</th>
                        <th style={{ padding: '10px 14px' }}>Classroom / Lab</th>
                        <th style={{ padding: '10px 14px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timetableList.map((t, idx) => (
                        <tr key={t.p || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 14px' }}><strong>Period {t.p}</strong></td>
                          <td style={{ padding: '10px 14px' }}><span className="badge badge-primary">{t.time}</span></td>
                          <td style={{ padding: '10px 14px' }}><strong style={{ color: '#0F172A' }}>{t.subject}</strong></td>
                          <td style={{ padding: '10px 14px' }}>{t.teacher}</td>
                          <td style={{ padding: '10px 14px' }}>{t.room}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span className={`badge ${t.status === 'Ongoing' ? 'badge-success' : t.status === 'Completed' ? 'badge-ghost' : 'badge-warning'}`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 5. UPCOMING EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📝 Examination Date Sheets</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Published term examination timetable</p>
            </div>
            <span className="badge badge-primary">{upcomingExams.length} Exams Scheduled</span>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            {upcomingExams.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <CalendarDays size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No upcoming examination schedule announced yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {upcomingExams.map(ex => (
                  <div key={ex.id} style={{ padding: 20, border: '1px solid #E2E8F0', borderRadius: 10, backgroundColor: '#F8FAFC' }}>
                    <div className="flex justify-between items-center flex-wrap" style={{ gap: 12, marginBottom: 8 }}>
                      <div>
                        <span className="badge badge-primary" style={{ marginRight: 8 }}>{ex.subject}</span>
                        <strong style={{ fontSize: '1.05rem', color: '#0F172A' }}>{ex.title}</strong>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                        <CalendarDays size={14} style={{ marginRight: 4 }} /> {ex.date}
                      </span>
                    </div>

                    <div className="grid-3" style={{ gap: 12, marginTop: 12, fontSize: '0.85rem' }}>
                      <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>TIMING & DURATION</span>
                        <strong>{ex.time}</strong>
                      </div>
                      <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>EXAMINATION ROOM</span>
                        <strong>{ex.room}</strong>
                      </div>
                      <div style={{ padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block' }}>MAXIMUM MARKS</span>
                        <strong>{ex.maxMarks || 100} Marks</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, fontSize: '0.82rem', color: '#475569', padding: '10px 14px', backgroundColor: '#FFFFFF', borderRadius: 6, border: '1px dashed #CBD5E1' }}>
                      <strong style={{ color: 'var(--color-primary, #2563EB)' }}>Syllabus Coverage:</strong> {ex.syllabus}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. HOMEWORK TAB */}
      {activeTab === 'homework' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📚 Assignments & Homework LMS</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Upload homework solutions directly for teacher evaluation</p>
            </div>

            <div className="flex gap-2">
              {['All', 'Pending', 'Submitted'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${hwFilter === f ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setHwFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredHomework.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                  <BookOpen size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p>No homework assignments found for filter "{hwFilter}".</p>
                </div>
              ) : (
                filteredHomework.map(hw => (
                  <div key={hw.id} style={{ padding: 18, border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, backgroundColor: '#FFFFFF' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div className="flex items-center gap-2">
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{hw.title}</strong>
                        <span className={`badge ${hw.status === 'Submitted' ? 'badge-success' : 'badge-warning'}`}>{hw.status}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>Subject: {hw.subject} · Assigned by {hw.teacher}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Due Date: {hw.due}</div>
                      {hw.status === 'Submitted' && (
                        <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: 6, fontSize: '0.78rem' }}>
                          <div style={{ fontWeight: 600, color: '#16A34A' }}>Submitted on {hw.submittedAt}</div>
                          {hw.fileName && <div>Attached file: 📄 {hw.fileName}</div>}
                          {hw.notes && <div style={{ color: '#475569' }}>Note: "{hw.notes}"</div>}
                        </div>
                      )}
                    </div>
                    <div>
                      {hw.status === 'Submitted' ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedHw(hw); setShowUploadModal(true); }}>
                          <Upload size={14} /> Re-upload Solution
                        </button>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedHw(hw); setShowUploadModal(true); }}>
                          <Upload size={14} /> Upload Assignment
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. REPORT CARD / RESULTS TAB */}
      {activeTab === 'results' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📜 Term Examination Report Card</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Overall GPA: {latestGPA} | Active Academic Session</p>
            </div>
            {resultsList.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                import('jspdf').then(({ default: jsPDF }) => {
                  const doc = new jsPDF();
                  doc.setFontSize(18); doc.text(profile.school, 20, 20);
                  doc.setFontSize(14); doc.text('Official Term Report Card (2026-2027)', 20, 30);
                  doc.setFontSize(11);
                  doc.text(`Student Name: ${profile.name}`, 20, 42);
                  doc.text(`Roll Number: ${profile.rollNo} | Class: ${profile.class}`, 20, 50);
                  doc.text(`Parent Name: ${profile.parentName}`, 20, 58);
                  doc.line(20, 64, 190, 64);

                  let y = 74;
                  doc.setFontSize(11);
                  doc.text('Subject', 20, y);
                  doc.text('Marks', 95, y);
                  doc.text('Max', 125, y);
                  doc.text('Grade', 155, y);
                  y += 8;
                  doc.line(20, y, 190, y);
                  y += 8;

                  resultsList.forEach(r => {
                    doc.text(r.subject, 20, y);
                    doc.text(String(r.marks), 95, y);
                    doc.text(String(r.max), 125, y);
                    doc.text(r.grade, 155, y);
                    y += 8;
                  });

                  doc.line(20, y, 190, y);
                  y += 12;
                  doc.text(`Grade Standing: ${latestGPA}`, 20, y);

                  doc.save(`${profile.rollNo}_ReportCard.pdf`);
                });
                toast.success('📜 Official Report Card PDF downloaded!');
              }}>
                <Download size={14} /> Download Report Card PDF
              </button>
            )}
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {resultsList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <Award size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No published term examination marks available.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px' }}>Subject Name</th>
                    <th style={{ padding: '12px 18px' }}>Marks Obtained</th>
                    <th style={{ padding: '12px 18px' }}>Maximum Marks</th>
                    <th style={{ padding: '12px 18px' }}>Grade</th>
                    <th style={{ padding: '12px 18px' }}>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsList.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 18px' }}><strong>{r.subject}</strong></td>
                      <td style={{ padding: '12px 18px' }}><strong style={{ color: 'var(--color-primary, #2563EB)' }}>{r.marks}</strong></td>
                      <td style={{ padding: '12px 18px' }}>{r.max}</td>
                      <td style={{ padding: '12px 18px' }}><span className="badge badge-success">{r.grade}</span></td>
                      <td style={{ padding: '12px 18px', fontSize: '0.82rem', color: '#64748B' }}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 8. STUDY VAULT TAB */}
      {activeTab === 'vault' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📚 Study Vault & Learning Resources</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Formula sheets, chapter notes, question banks, and video lectures</p>
            </div>
            <span className="badge badge-primary">{filteredVault.length} Resources Available</span>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="flex gap-3 flex-wrap" style={{ marginBottom: 20 }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <input
                  className="form-input"
                  placeholder="🔍 Search resources by title, category or keyword..."
                  value={vaultSearch}
                  onChange={e => setVaultSearch(e.target.value)}
                />
              </div>

              <div style={{ width: 180 }}>
                <select className="form-select" value={vaultSubject} onChange={e => setVaultSubject(e.target.value)}>
                  <option value="All">All Subjects</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="English">English</option>
                  <option value="Chemistry">Chemistry</option>
                </select>
              </div>
            </div>

            {filteredVault.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <Bookmark size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No study vault resources found matching search criteria.</p>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 16 }}>
                {filteredVault.map(item => {
                  const isBookmarked = bookmarkedVaultIds.includes(item.id);
                  return (
                    <div key={item.id} style={{ padding: 18, border: '1px solid #E2E8F0', borderRadius: 10, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div className="flex justify-between items-start" style={{ gap: 8, marginBottom: 8 }}>
                          <div>
                            <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>{item.subject}</span>
                            <span className="badge badge-ghost" style={{ fontSize: '0.72rem', marginLeft: 6 }}>{item.category}</span>
                          </div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: 4, color: isBookmarked ? '#EAB308' : '#94A3B8' }}
                            onClick={() => handleToggleBookmark(item.id, item.title)}
                            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Resource'}
                          >
                            <Bookmark size={16} fill={isBookmarked ? '#EAB308' : 'none'} />
                          </button>
                        </div>

                        <strong style={{ fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>{item.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>
                          Author: {item.author} · Added: {item.date}
                        </div>
                      </div>

                      <div className="flex justify-between items-center" style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
                          {item.type} ({item.size})
                        </span>

                        {item.type.includes('Video') ? (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadVaultItem(item)}>
                            <Video size={14} /> Watch Video
                          </button>
                        ) : (
                          <button className="btn btn-primary btn-sm" onClick={() => handleDownloadVaultItem(item)}>
                            <Download size={14} /> Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. DIGITAL NOTEBOOK TAB */}
      {activeTab === 'notebook' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📝 My Digital Notebook Notes</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Save quick formulae, class notes, and study summaries</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowNoteModal(true)}>
              <Edit3 size={16} /> New Class Note
            </button>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ marginBottom: 20 }}>
              <input
                className="form-input"
                placeholder="🔍 Search notes by title, subject or content..."
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
              />
            </div>

            {filteredNotes.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <Edit3 size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No notebook notes found. Click "New Class Note" to add one!</p>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 16 }}>
                {filteredNotes.map(n => (
                  <div key={n.id} style={{ padding: 18, border: '1px solid #E2E8F0', borderRadius: 10, backgroundColor: '#F8FAFC' }}>
                    <div className="flex justify-between items-start" style={{ marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{n.title}</strong>
                        {n.subject && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-primary, #2563EB)', fontWeight: 700, marginTop: 2 }}>{n.subject}</div>
                        )}
                      </div>
                      <button className="btn btn-ghost btn-sm text-danger" title="Delete Note" onClick={() => handleDeleteNote(n.id, n.title)}>
                        <Trash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#475569', whiteSpace: 'pre-line', margin: 0 }}>{n.content}</p>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 12, textAlign: 'right' }}>Saved: {n.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. ONLINE QUIZ EXAM TAB */}
      {activeTab === 'quiz' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>⚡ Diagnostic Assessment Quiz</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Instant auto-graded diagnostic assessment</p>
            </div>
            {quizSubmitted && (
              <button className="btn btn-secondary btn-sm" onClick={handleRetakeQuiz}>
                <RefreshCw size={14} /> Retake Quiz
              </button>
            )}
          </div>

          {quizSubmitted ? (
            <div style={{ padding: 24, borderRadius: 10, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <span className={`badge ${quizScore >= 70 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '1.1rem', padding: '8px 16px' }}>
                  Final Score: {quizScore}% {quizScore >= 70 ? '🎉 Passed' : '⚠️ Keep Practicing'}
                </span>
                <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: 8 }}>
                  Your answers have been recorded and graded!
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {QUIZ_QUESTIONS.map((q, qIdx) => {
                  const userAns = quizAnswers[q.id];
                  const isCorrect = userAns === q.correctIndex;
                  return (
                    <div key={q.id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, color: '#0F172A' }}>Q{qIdx + 1}. {q.question}</p>
                      <div style={{ fontSize: '0.82rem', color: isCorrect ? '#15803D' : '#B91C1C' }}>
                        Your Choice: <strong>{q.options[userAns]}</strong> {isCorrect ? '✓ Correct' : '❌ Incorrect'}
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: '0.82rem', color: '#15803D', marginTop: 4 }}>
                          Correct Answer: <strong>{q.options[q.correctIndex]}</strong>
                        </div>
                      )}
                      <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 6, fontStyle: 'italic' }}>
                        Explanation: {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button className="btn btn-primary" onClick={handleRetakeQuiz}>Retake Assessment</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                {QUIZ_QUESTIONS.map((q, qIdx) => (
                  <div key={q.id} style={{ padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: '#0F172A' }}>Q{qIdx + 1}. {q.question}</p>
                    {q.options.map((opt, idx) => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 6, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', marginBottom: 8, cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`quiz_q_${q.id}`}
                          checked={quizAnswers[q.id] === idx}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: idx }))}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#0F172A' }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              <button className="btn btn-primary btn-lg" onClick={handleQuizSubmit}>Submit Quiz Answers</button>
            </div>
          )}
        </div>
      )}

      {/* 11. TEACHER CHAT TAB */}
      {activeTab === 'messages' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>💬 Direct Message to Class Faculty</h4>
            <span className="badge badge-success">Online Desk</span>
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div style={{ height: 320, padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, marginBottom: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, border: '1px solid #E2E8F0' }}>
              {chatMessages.length === 0 ? (
                <div style={{ color: '#64748B', textAlign: 'center', margin: 'auto' }}>
                  No previous chat messages. Send a message to start conversation!
                </div>
              ) : (
                chatMessages.map(m => (
                  <div key={m.id} style={{ alignSelf: m.role === 'student' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: 2, textAlign: m.role === 'student' ? 'right' : 'left' }}>
                      {m.sender} · {m.time}
                    </div>
                    <div style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      fontSize: '0.875rem',
                      backgroundColor: m.role === 'student' ? 'var(--color-primary, #2563EB)' : '#FFFFFF',
                      color: m.role === 'student' ? '#FFFFFF' : '#0F172A',
                      border: m.role === 'student' ? 'none' : '1px solid #E2E8F0',
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                className="form-input"
                placeholder="Type your message to Class Teacher..."
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 12. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>✅ Attendance Record — {profile.name}</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>{profile.class} Daily Attendance Ledger</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLeaveModal(true)}>
                Apply for Leave
              </button>
              <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>{monthlyAttendancePct} Overall Attendance</span>
            </div>
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="grid-3" style={{ gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>TOTAL WORKING DAYS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)' }}>120 Days</div>
              </div>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PRESENT DAYS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16A34A' }}>115 Days</div>
              </div>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ABSENT DAYS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>5 Days</div>
              </div>
            </div>

            {attendanceLogs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <CheckCircle2 size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No attendance logs recorded.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px' }}>Date</th>
                    <th style={{ padding: '10px 14px' }}>Attendance Status</th>
                    <th style={{ padding: '10px 14px' }}>Check-In Time</th>
                    <th style={{ padding: '10px 14px' }}>Remarks / Leave Note</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px' }}><strong>{log.date}</strong></td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge ${log.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>{log.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>{log.checkIn}</td>
                      <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: '#64748B' }}>{log.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 13. FEES TAB */}
      {activeTab === 'fees' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>💰 Fee Ledger & Razorpay Online Payments</h4>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>Instant online payment with automated receipt generation</p>
            </div>
            {pendingFees.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => handlePayFee()}>
                <CreditCard size={14} /> Pay Outstanding Dues (₹{totalPendingFeeAmount.toLocaleString('en-IN')})
              </button>
            )}
          </div>

          <div className="card-body" style={{ padding: '20px' }}>
            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
              <div style={{ padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>TOTAL OUTSTANDING DUES</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: pendingFees.length ? '#DC2626' : '#16A34A', marginTop: 4 }}>
                  ₹{totalPendingFeeAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>PAID TERM FEES</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16A34A', marginTop: 4 }}>
                  ₹{feeList.filter(f => f.status === 'Paid').reduce((acc, f) => acc + Number(f.amount || 0), 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {feeList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
                <CreditCard size={36} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p>No fee dues or transactions recorded.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {feeList.map(fee => (
                  <div key={fee.id} style={{ padding: 18, border: '1px solid #E2E8F0', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, backgroundColor: '#FFFFFF' }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{fee.name}</strong>
                        <span className={`badge ${fee.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {fee.status === 'Paid' ? 'Paid ✓' : `Due: ₹${Number(fee.amount).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 2px' }}>{fee.breakdown}</p>
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        {fee.status === 'Paid' ? `Paid On: ${fee.paidOn} · Receipt ID: ${fee.receiptNo}` : `Due Date: ${fee.dueDate}`}
                      </div>
                    </div>

                    <div>
                      {fee.status === 'Paid' ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => generateFeeReceiptPDF({
                          receiptNo: fee.receiptNo || 'PAY-2026-001',
                          studentName: profile.name,
                          rollNo: profile.rollNo,
                          className: profile.class,
                          feeType: fee.name,
                          amount: fee.amount,
                        })}>
                          <Download size={14} /> Download Receipt PDF
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={() => handlePayFee(fee)}>
                          Pay ₹{Number(fee.amount).toLocaleString('en-IN')} via Razorpay
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 14. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="card" style={{ padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>👤 Student Profile Details</h4>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditProfile({ ...profile }); setShowProfileModal(true); }}>
              <Edit3 size={14} /> Edit Profile Info
            </button>
          </div>

          <div className="grid-2" style={{ gap: 20 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>FULL NAME</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{profile.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>ROLL NUMBER</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary, #2563EB)' }}>{profile.rollNo}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>CLASS & SECTION</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.class}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>INSTITUTION NAME</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.school}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PARENT NAME</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.parentName}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>PARENT PHONE</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.parentPhone}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>BLOOD GROUP</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.bloodGroup}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>DATE OF BIRTH</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.dob}</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>RESIDENTIAL ADDRESS</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{profile.address}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Homework Submission Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title={`Submit Assignment: ${selectedHw?.title || ''}`}>
        <form onSubmit={handleHomeworkSubmit}>
          <div className="form-group">
            <label className="form-label">Submission Notes / Comments</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Add notes for teacher regarding your solution..."
              value={submissionText}
              onChange={e => setSubmissionText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attached Document / File Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Solution PDF file name"
              value={uploadFileName}
              onChange={e => setUploadFileName(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4, display: 'block' }}>
              Selected file: {uploadFileName} (PDF/Image)
            </span>
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowUploadModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Upload & Submit Assignment</button>
          </div>
        </form>
      </Modal>

      {/* 2. Digital Note Modal */}
      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Create Digital Class Note">
        <form onSubmit={handleSaveNote}>
          <div className="form-group">
            <label className="form-label">Note Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Physics Chapter 4 Formulae Summary"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <select className="form-select" value={noteSubject} onChange={e => setNoteSubject(e.target.value)}>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="English">English</option>
              <option value="Computer Science">Computer Science</option>
              <option value="General Knowledge">General Knowledge</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Note Content *</label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Type your notes, equations, definitions or reminder points..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowNoteModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Note</button>
          </div>
        </form>
      </Modal>

      {/* 3. Leave Application Modal */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Apply for Student Leave">
        <form onSubmit={handleApplyLeave}>
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
              placeholder="Specify medical or personal reason for absence..."
              value={leaveReason}
              onChange={e => setLeaveReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Leave Application</button>
          </div>
        </form>
      </Modal>

      {/* 4. Edit Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Edit Student Profile Details">
        <form onSubmit={handleSaveProfile}>
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={editProfile.name} onChange={e => setEditProfile({ ...editProfile, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Name</label>
              <input className="form-input" value={editProfile.parentName} onChange={e => setEditProfile({ ...editProfile, parentName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Parent Phone</label>
              <input className="form-input" value={editProfile.parentPhone} onChange={e => setEditProfile({ ...editProfile, parentPhone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <input className="form-input" value={editProfile.bloodGroup} onChange={e => setEditProfile({ ...editProfile, bloodGroup: e.target.value })} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={editProfile.address} onChange={e => setEditProfile({ ...editProfile, address: e.target.value })} required />
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowProfileModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudentPortal;
