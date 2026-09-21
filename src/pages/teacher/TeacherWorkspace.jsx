// src/pages/teacher/TeacherWorkspace.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckSquare, Award, MessageSquare, Plus, FileText, Download,
  Calendar, Layers, CheckCircle2, Send, Bookmark, DollarSign, Trash2, Check,
  X, FileSpreadsheet, Paperclip
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import {
  markClassAttendance, fetchClassAttendance, submitAttendanceCorrection,
  createHomework, fetchHomeworkList,
  enterStudentMarks, fetchStudentMarks,
  publishStudyMaterial, fetchStudyMaterials,
  logTeachingDiaryEntry, fetchTeachingDiaryEntries,
  sendParentMessage, fetchParentMessages,
  applyStaffLeave, fetchStaffLeaveRequests
} from '../../services/teacherService';
import { generateStaffPayslipPDF } from '../../services/pdfService';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import toast from 'react-hot-toast';

const ASSIGNED_CLASSES = [
  { classId: '10-A', className: 'Class 10-A', subject: 'Mathematics', room: 'Room 201', role: 'Class Teacher' },
  { classId: '10-B', className: 'Class 10-B', subject: 'Mathematics', room: 'Room 202', role: 'Subject Teacher' },
  { classId: '9-A', className: 'Class 9-A', subject: 'Mathematics', room: 'Room 105', role: 'Subject Teacher' },
];

const INITIAL_SCHEDULE = [
  { id: 'sch_1', period: 'Period 1', time: '09:00 AM - 09:45 AM', class: 'Class 10-A', subject: 'Mathematics', room: 'Room 201', topic: 'Quadratic Equations Ex 4.2', status: 'Completed' },
  { id: 'sch_2', period: 'Period 2', time: '10:00 AM - 10:45 AM', class: 'Class 10-B', subject: 'Mathematics', room: 'Room 202', topic: 'Trigonometric Ratios & Identities', status: 'In Progress' },
  { id: 'sch_3', period: 'Period 4', time: '11:30 AM - 12:15 PM', class: 'Class 9-A', subject: 'Mathematics', room: 'Room 105', topic: 'Polynomial Division & Remainder Theorem', status: 'Upcoming' },
  { id: 'sch_4', period: 'Period 6', time: '02:00 PM - 02:45 PM', class: 'Class 10-A', subject: 'Mathematics Remedial', room: 'Math Lab', topic: 'Problem Solving & Doubts', status: 'Upcoming' },
];

const pathToTabMap = {
  '/teacher': 'overview',
  '/teacher/attendance': 'attendance',
  '/teacher/homework': 'homework',
  '/teacher/results': 'grading',
  '/teacher/compliance': 'diary',
  '/teacher/materials': 'materials',
  '/teacher/messages': 'messages',
  '/teacher/leave': 'leave',
  '/teacher/salary': 'salary',
};

const tabToPathMap = {
  overview: '/teacher',
  attendance: '/teacher/attendance',
  homework: '/teacher/homework',
  grading: '/teacher/results',
  diary: '/teacher/compliance',
  materials: '/teacher/materials',
  messages: '/teacher/messages',
  leave: '/teacher/leave',
  salary: '/teacher/salary',
};

const TeacherWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication Context
  const { user, userProfile, tenantId: activeTenantId, branchId: activeBranchId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const currentBranch = userProfile?.branchId || activeBranchId || 'branch_main';
  const currentTeacherId = userProfile?.id || user?.uid || 'teacher_active';
  const teacherDisplayName = userProfile?.name || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Mrs. Priya Sharma');
  const teacherDepartment = userProfile?.department || 'Mathematics';

  const [activeTab, setActiveTab] = useState(pathToTabMap[location.pathname] || 'overview');
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tab = pathToTabMap[location.pathname];
    if (tab) setActiveTab(tab);
  }, [location.pathname]);

  // Modals Visibility
  const [showHwModal, setShowHwModal] = useState(false);
  const [showExcelMarksModal, setShowExcelMarksModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAttCorrectionModal, setShowAttCorrectionModal] = useState(false);

  // Homework Form State
  const [hwTitle, setHwTitle] = useState('');
  const [hwDueDate, setHwDueDate] = useState('2026-08-18');
  const [hwSubject, setHwSubject] = useState('Mathematics');
  const [hwDescription, setHwDescription] = useState('');
  const [hwAttachmentName, setHwAttachmentName] = useState('');
  const [hwAttachmentUrl, setHwAttachmentUrl] = useState('');

  // Excel Marks Import State
  const [excelRawText, setExcelRawText] = useState(
    "GV-2026-001, Arjun Verma, 92, A+\nGV-2026-002, Rohan Sharma, 85, A\nGV-2026-003, Ananya Gupta, 78, B+\nGV-2026-004, Kabir Verma, 64, B\nGV-2026-005, Siddharth Roy, 95, A+"
  );
  const [excelExamName, setExcelExamName] = useState('Mid-Term Mathematics Assessment');
  const [parsedExcelRows, setParsedExcelRows] = useState([]);

  // Teaching Diary Form State
  const [diaryTopic, setDiaryTopic] = useState('');
  const [diaryNotes, setDiaryNotes] = useState('');
  const [diaryHomeworkAssigned, setDiaryHomeworkAssigned] = useState('');

  // Lesson Plan Form State
  const [lpChapter, setLpChapter] = useState('Chapter 4: Quadratic Equations');
  const [lpObjective, setLpObjective] = useState('Students will understand and apply the discriminant formula D = b² - 4ac.');
  const [lpActivity, setLpActivity] = useState('Interactive board problem solving & peer review of exercise 4.2.');
  const [lpResources, setLpResources] = useState('NCERT Mathematics Textbook, Chapter 4 Formula Worksheet');

  // Study Vault Form State
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matType, setMatType] = useState('PDF Document');

  // Leave Form State
  const [leaveDays, setLeaveDays] = useState(2);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveType, setLeaveType] = useState('Casual Leave');

  // Attendance Correction State
  const [selectedStudentForCorrection, setSelectedStudentForCorrection] = useState(null);
  const [correctionNewStatus, setCorrectionNewStatus] = useState('Present');
  const [correctionReason, setCorrectionReason] = useState('');

  // Parent Chat State
  const [selectedChatParent, setSelectedChatParent] = useState('parent_1');
  const [chatMessageText, setChatMessageText] = useState('');

  // Grading Form State
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingScore, setGradingScore] = useState(92);
  const [gradingLetter, setGradingLetter] = useState('A+');
  const [gradingFeedback, setGradingFeedback] = useState('Excellent performance! Demonstrated clear steps.');

  // Data Store Lists
  const [scheduleList, setScheduleList] = useState(INITIAL_SCHEDULE);
  const [homeworkList, setHomeworkList] = useState([
    {
      id: 'hw_1',
      title: 'Quadratic Equations Ex 4.2',
      subject: 'Mathematics',
      class: 'Class 10-A',
      dueDate: '18 Aug 2026',
      status: 'Active',
      description: 'Solve questions 1 to 15 from Chapter 4 Exercise 4.2 in homework notebook.',
      attachment: { name: 'Ex_4.2_Worksheet.pdf', url: '#' }
    },
    {
      id: 'hw_2',
      title: 'Trigonometry Practice Sheet',
      subject: 'Mathematics',
      class: 'Class 10-A',
      dueDate: '20 Aug 2026',
      status: 'Active',
      description: 'Complete questions on trigonometric identities and proof problems.',
      attachment: { name: 'Trig_Identities_Formulae.pdf', url: '#' }
    },
    {
      id: 'hw_3',
      title: 'Polynomial Theorems & Proofs',
      subject: 'Mathematics',
      class: 'Class 10-B',
      dueDate: '22 Aug 2026',
      status: 'Active',
      description: 'Practice polynomial long division step-by-step.',
      attachment: null
    },
  ]);

  const [diaryList, setDiaryList] = useState([
    { id: 'd_1', classId: 'Class 10-A', topic: 'Quadratic Equations (Ex 4.2)', notes: 'Covered factorization method and solved questions 1 to 5 with step analysis.', homework: 'Ex 4.2 Q6-Q15', date: 'Today, 09:45 AM' },
    { id: 'd_2', classId: 'Class 10-B', topic: 'Trigonometric Ratios', notes: 'Introduced sin, cos, tan concepts with right-triangle examples and geometric proofs.', homework: 'Read Chapter 8 pages 112-118', date: 'Yesterday' },
  ]);

  const [materialsList, setMaterialsList] = useState([
    { id: 'm_1', title: 'Class 10 Math Formula Cheat Sheet', type: 'PDF Document', date: '2026-08-01', url: '#' },
    { id: 'm_2', title: 'Quadratic Equations Step-by-Step Guide', type: 'Study Note', date: '2026-08-05', url: '#' },
  ]);

  const [leaveList, setLeaveList] = useState([
    { id: 'l_1', type: 'Casual Leave', days: 2, reason: 'Family event', status: 'Pending Approval', date: '2026-08-10' },
    { id: 'l_2', type: 'Medical Leave', days: 1, reason: 'Dental checkup', status: 'Approved', date: '2026-07-20' },
  ]);

  const [attRoster, setAttRoster] = useState([
    { id: 'std_1', rollNo: 'GV-2026-001', name: 'Arjun Verma', status: 'Present' },
    { id: 'std_2', rollNo: 'GV-2026-002', name: 'Rohan Sharma', status: 'Present' },
    { id: 'std_3', rollNo: 'GV-2026-003', name: 'Ananya Gupta', status: 'Present' },
    { id: 'std_4', rollNo: 'GV-2026-004', name: 'Kabir Verma', status: 'Absent' },
    { id: 'std_5', rollNo: 'GV-2026-005', name: 'Siddharth Roy', status: 'Present' },
    { id: 'std_6', rollNo: 'GV-2026-006', name: 'Priya Nair', status: 'Late' },
    { id: 'std_7', rollNo: 'GV-2026-007', name: 'Devansh Mehta', status: 'Present' },
  ]);

  const [submissionsList, setSubmissionsList] = useState([
    { id: 'sub_1', studentName: 'Arjun Verma', rollNo: 'GV-2026-001', class: 'Class 10-A', assignment: 'Quadratic Equations Ex 4.2', submittedAt: 'Today, 08:30 AM', status: 'Graded', marks: 95, grade: 'A+', feedback: 'Flawless calculations and methodology.' },
    { id: 'sub_2', studentName: 'Rohan Sharma', rollNo: 'GV-2026-002', class: 'Class 10-A', assignment: 'Quadratic Equations Ex 4.2', submittedAt: 'Yesterday, 04:15 PM', status: 'Graded', marks: 88, grade: 'A', feedback: 'Good presentation, double check step 3 calculation.' },
    { id: 'sub_3', studentName: 'Ananya Gupta', rollNo: 'GV-2026-003', class: 'Class 10-A', assignment: 'Quadratic Equations Ex 4.2', submittedAt: 'Yesterday, 06:40 PM', status: 'Pending Grade', marks: null, grade: '-', feedback: '' },
    { id: 'sub_4', studentName: 'Kabir Verma', rollNo: 'GV-2026-004', class: 'Class 10-A', assignment: 'Quadratic Equations Ex 4.2', submittedAt: 'Today, 09:15 AM', status: 'Submitted', marks: null, grade: '-', feedback: '' },
  ]);

  const [parentChats, setParentChats] = useState({
    parent_1: {
      parentId: 'parent_1',
      parentName: 'Sanjeev Sharma',
      relation: 'Father of Rohan Sharma',
      studentName: 'Rohan Sharma',
      class: 'Class 10-A',
      messages: [
        { id: 'm1', sender: 'parent', text: 'Hello Ma’am, regarding Rohan’s performance in the recent Mathematics quiz...', time: 'Yesterday, 06:30 PM' },
        { id: 'm2', sender: 'teacher', text: 'Hello Mr. Sharma! Rohan has performed well, scoring 88%. He just needs to review formula application in word problems.', time: 'Yesterday, 07:15 PM' },
        { id: 'm3', sender: 'parent', text: 'Thank you for the guidance! I will help him revise Chapter 4 at home.', time: 'Today, 08:10 AM' }
      ]
    },
    parent_2: {
      parentId: 'parent_2',
      parentName: 'Meenakshi Sundaram',
      relation: 'Mother of Arjun Verma',
      studentName: 'Arjun Verma',
      class: 'Class 10-A',
      messages: [
        { id: 'm1', sender: 'parent', text: 'Respected Ma’am, Arjun will be attending the Inter-School Math Olympiad tomorrow.', time: 'Yesterday, 02:00 PM' },
        { id: 'm2', sender: 'teacher', text: 'Best wishes to Arjun! The attendance for Olympiad duty will be recorded as Special Duty Present.', time: 'Yesterday, 03:30 PM' }
      ]
    },
    parent_3: {
      parentId: 'parent_3',
      parentName: 'Vikram Malhotra',
      relation: 'Father of Kabir Verma',
      studentName: 'Kabir Verma',
      class: 'Class 10-A',
      messages: [
        { id: 'm1', sender: 'parent', text: 'Good morning Ma’am. Kabir was absent today due to mild fever. Requesting leave approval.', time: 'Today, 08:00 AM' }
      ]
    }
  });

  const { students: storeStudents } = useStudentStore();

  // Dynamic Class Student Counts
  const classStudentCounts = useMemo(() => {
    const counts = {};
    ASSIGNED_CLASSES.forEach(c => {
      const clean = c.classId.replace('Class ', '').trim();
      const matched = (storeStudents || []).filter(s => (s.class || '').replace('Class ', '').trim() === clean);
      counts[c.className] = matched.length > 0 ? matched.length : (c.className === 'Class 10-A' ? 42 : c.className === 'Class 10-B' ? 38 : 40);
    });
    return counts;
  }, [storeStudents]);

  // Load Real Data on Class / Tenant Change
  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [attRes, hwRes, marksRes, diaryRes, matRes, msgRes, leaveRes] = await Promise.allSettled([
        fetchClassAttendance({ tenantId: currentTenant, classId: selectedClass, date: todayStr }),
        fetchHomeworkList({ tenantId: currentTenant, classId: selectedClass }),
        fetchStudentMarks({ tenantId: currentTenant, classId: selectedClass }),
        fetchTeachingDiaryEntries({ tenantId: currentTenant, classId: selectedClass }),
        fetchStudyMaterials({ tenantId: currentTenant, classId: selectedClass }),
        fetchParentMessages({ tenantId: currentTenant, teacherId: currentTeacherId }),
        fetchStaffLeaveRequests({ tenantId: currentTenant, teacherId: currentTeacherId }),
      ]);

      if (attRes.status === 'fulfilled' && attRes.value?.records?.length) {
        setAttRoster(attRes.value.records);
      } else {
        const cleanClass = selectedClass.replace('Class ', '').trim();
        const matched = (storeStudents || []).filter(s => (s.class || '').replace('Class ', '').trim() === cleanClass);
        if (matched.length > 0) {
          setAttRoster(matched.map(s => ({
            id: s.id,
            rollNo: s.rollNo || s.admissionNo,
            name: s.name,
            status: s.status === 'Absent' ? 'Absent' : s.status === 'Late' ? 'Late' : 'Present'
          })));
        }
      }

      if (hwRes.status === 'fulfilled' && hwRes.value?.length) {
        setHomeworkList(prev => {
          const map = new Map();
          hwRes.value.forEach(item => map.set(item.id || item.title, item));
          prev.forEach(item => { if (!map.has(item.id || item.title)) map.set(item.id || item.title, item); });
          return Array.from(map.values());
        });
      }

      if (marksRes.status === 'fulfilled' && marksRes.value?.length) {
        setSubmissionsList(prev => {
          const map = new Map();
          marksRes.value.forEach(item => map.set(item.id || (item.studentName + item.assignmentTitle), item));
          prev.forEach(item => { if (!map.has(item.id || (item.studentName + item.assignmentTitle))) map.set(item.id || item.studentName, item); });
          return Array.from(map.values());
        });
      }

      if (diaryRes.status === 'fulfilled' && diaryRes.value?.length) {
        setDiaryList(prev => {
          const map = new Map();
          diaryRes.value.forEach(item => map.set(item.id || item.topic, item));
          prev.forEach(item => { if (!map.has(item.id || item.topic)) map.set(item.id || item.topic, item); });
          return Array.from(map.values());
        });
      }

      if (matRes.status === 'fulfilled' && matRes.value?.length) {
        setMaterialsList(prev => {
          const map = new Map();
          matRes.value.forEach(item => map.set(item.id || item.title, item));
          prev.forEach(item => { if (!map.has(item.id || item.title)) map.set(item.id || item.title, item); });
          return Array.from(map.values());
        });
      }

      if (msgRes.status === 'fulfilled' && msgRes.value?.length) {
        setParentChats(prev => {
          const updated = { ...prev };
          msgRes.value.forEach(msg => {
            const pId = msg.parentId || 'parent_1';
            if (updated[pId]) {
              const exists = updated[pId].messages.some(m => m.id === msg.id || m.text === msg.message);
              if (!exists) {
                updated[pId].messages.push({
                  id: msg.id || 'msg_' + Date.now(),
                  sender: msg.sender || 'teacher',
                  text: msg.message || msg.text,
                  time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                });
              }
            }
          });
          return updated;
        });
      }

      if (leaveRes.status === 'fulfilled' && leaveRes.value?.length) {
        setLeaveList(prev => {
          const map = new Map();
          leaveRes.value.forEach(item => map.set(item.id || item.reason, item));
          prev.forEach(item => { if (!map.has(item.id || item.reason)) map.set(item.id || item.reason, item); });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Error loading workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTenant, selectedClass, currentTeacherId, storeStudents]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Timetable Status Toggle
  const handleToggleScheduleStatus = (id) => {
    setScheduleList(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Completed' ? 'In Progress' : item.status === 'In Progress' ? 'Upcoming' : 'Completed';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
    toast.success('Timetable period status updated');
  };

  // Attendance Handlers
  const handleToggleAttendance = (id, newStatus) => {
    setAttRoster(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    setLastAutoSaveTime(new Date().toLocaleTimeString());
  };

  const handleMarkAllAttendance = (status) => {
    setAttRoster(prev => prev.map(s => ({ ...s, status })));
    setLastAutoSaveTime(new Date().toLocaleTimeString());
    toast.success(`Marked all students as ${status}`);
  };

  const handleSaveAttendance = async () => {
    await markClassAttendance({
      tenantId: currentTenant,
      branchId: currentBranch,
      classId: selectedClass,
      date: new Date().toISOString().split('T')[0],
      teacherId: currentTeacherId,
      records: attRoster,
    });
    setLastAutoSaveTime(new Date().toLocaleTimeString());
    toast.success(`🎉 Attendance for ${selectedClass} saved & synced to Firebase!`);
  };

  const handleOpenAttendanceCorrection = (student) => {
    setSelectedStudentForCorrection(student);
    setCorrectionNewStatus(student.status === 'Present' ? 'Absent' : 'Present');
    setCorrectionReason('');
    setShowAttCorrectionModal(true);
  };

  const handleSubmitAttendanceCorrection = async (e) => {
    e.preventDefault();
    if (!selectedStudentForCorrection || !correctionReason.trim()) {
      toast.error('Please specify a correction reason');
      return;
    }

    await submitAttendanceCorrection({
      tenantId: currentTenant,
      classId: selectedClass,
      studentId: selectedStudentForCorrection.id,
      studentName: selectedStudentForCorrection.name,
      rollNo: selectedStudentForCorrection.rollNo,
      oldStatus: selectedStudentForCorrection.status,
      newStatus: correctionNewStatus,
      reason: correctionReason,
      teacherName: teacherDisplayName,
      date: new Date().toISOString().split('T')[0],
    });

    setAttRoster(prev => prev.map(s => s.id === selectedStudentForCorrection.id ? { ...s, status: correctionNewStatus } : s));
    toast.success(`📝 Correction for ${selectedStudentForCorrection.name} submitted & audited!`);
    setShowAttCorrectionModal(false);
    setSelectedStudentForCorrection(null);
  };

  // Homework Handlers
  const handleCreateHomework = async (e) => {
    e.preventDefault();
    if (!hwTitle.trim()) { toast.error('Please enter homework title'); return; }

    const newHw = {
      id: 'hw_' + Date.now(),
      title: hwTitle,
      subject: hwSubject || 'Mathematics',
      class: selectedClass,
      dueDate: hwDueDate || '2026-08-18',
      status: 'Active',
      description: hwDescription || 'Complete assignment as instructed in class.',
      attachment: hwAttachmentName ? { name: hwAttachmentName, url: hwAttachmentUrl || '#' } : null
    };

    setHomeworkList(prev => [newHw, ...prev]);

    await createHomework({
      tenantId: currentTenant,
      classId: selectedClass,
      title: hwTitle,
      dueDate: hwDueDate,
      subject: hwSubject,
      description: hwDescription,
      teacherId: currentTeacherId,
      teacherName: teacherDisplayName,
    });

    toast.success(`📚 Homework "${hwTitle}" assigned to ${selectedClass}!`);
    setShowHwModal(false);
    setHwTitle('');
    setHwDescription('');
    setHwAttachmentName('');
    setHwAttachmentUrl('');
  };

  const handleToggleHomeworkStatus = (id) => {
    setHomeworkList(prev => prev.map(h => h.id === id ? { ...h, status: h.status === 'Active' ? 'Completed' : 'Active' } : h));
    toast.success('Homework status updated');
  };

  const handleDeleteHomework = (id) => {
    setHomeworkList(prev => prev.filter(h => h.id !== id));
    toast.success('Homework assignment removed');
  };

  // Bulk Excel Marks Entry Handlers
  const handleParseExcelText = () => {
    if (!excelRawText.trim()) {
      toast.error('Please paste CSV or Excel formatted data');
      return;
    }
    const lines = excelRawText.trim().split('\n');
    const parsed = lines.map((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      const marks = Number(parts[2]) || 0;
      return {
        id: `parsed_${idx}`,
        rollNo: parts[0] || `GV-2026-00${idx + 1}`,
        studentName: parts[1] || `Student ${idx + 1}`,
        marks,
        grade: parts[3] || (marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : 'B')
      };
    });
    setParsedExcelRows(parsed);
    toast.success(`Parsed ${parsed.length} student rows for preview!`);
  };

  const handleApplyBulkExcelMarks = async () => {
    if (parsedExcelRows.length === 0) {
      toast.error('No parsed rows to import. Click "Parse Data Preview" first.');
      return;
    }

    const newSubmissions = [...submissionsList];
    for (const row of parsedExcelRows) {
      const existingIdx = newSubmissions.findIndex(s => s.rollNo === row.rollNo || s.studentName === row.studentName);
      if (existingIdx >= 0) {
        newSubmissions[existingIdx] = {
          ...newSubmissions[existingIdx],
          marks: row.marks,
          grade: row.grade,
          status: 'Graded',
          assignment: excelExamName,
        };
      } else {
        newSubmissions.push({
          id: `sub_${Date.now()}_${row.rollNo}`,
          studentName: row.studentName,
          rollNo: row.rollNo,
          class: selectedClass,
          assignment: excelExamName,
          submittedAt: 'Imported via Excel',
          status: 'Graded',
          marks: row.marks,
          grade: row.grade,
          feedback: 'Bulk Excel Marks Import',
        });
      }

      await enterStudentMarks({
        tenantId: currentTenant,
        classId: selectedClass,
        studentId: row.rollNo,
        rollNo: row.rollNo,
        studentName: row.studentName,
        assignmentTitle: excelExamName,
        marks: row.marks,
        grade: row.grade,
      });
    }

    setSubmissionsList(newSubmissions);
    toast.success(`📊 Bulk imported marks for ${parsedExcelRows.length} students successfully!`);
    setShowExcelMarksModal(false);
  };

  const handleDownloadSampleExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,RollNo,StudentName,MarksObtained,Grade\nGV-2026-001,Arjun Verma,92,A+\nGV-2026-002,Rohan Sharma,85,A\nGV-2026-003,Ananya Gupta,78,B+\nGV-2026-004,Kabir Verma,64,B\nGV-2026-005,Siddharth Roy,95,A+";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Marks_Entry_Template_${selectedClass}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded Sample Excel / CSV Marks Template!');
  };

  // Teaching Diary & Lesson Plan Handlers
  const handleLogDiary = async (e) => {
    e.preventDefault();
    if (!diaryTopic.trim()) { toast.error('Please enter lecture topic'); return; }

    const newDiary = {
      id: 'd_' + Date.now(),
      classId: selectedClass,
      topic: diaryTopic,
      notes: diaryNotes || 'Lecture completed as per daily syllabus planner.',
      homework: diaryHomeworkAssigned || 'None',
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setDiaryList(prev => [newDiary, ...prev]);

    await logTeachingDiaryEntry({
      tenantId: currentTenant,
      classId: selectedClass,
      topic: diaryTopic,
      notes: diaryNotes,
      homework: diaryHomeworkAssigned,
      date: new Date().toISOString().split('T')[0],
      teacherId: currentTeacherId,
      teacherName: teacherDisplayName,
    });

    toast.success(`📖 Teaching Diary entry saved for ${selectedClass}!`);
    setShowDiaryModal(false);
    setDiaryTopic('');
    setDiaryNotes('');
    setDiaryHomeworkAssigned('');
  };

  const handleSaveLessonPlan = (e) => {
    e.preventDefault();
    toast.success(`📐 Lesson Plan for "${lpChapter}" saved & linked to Teaching Diary!`);
    setShowLessonPlanModal(false);
  };

  const handleDeleteDiaryEntry = (id) => {
    setDiaryList(prev => prev.filter(d => d.id !== id));
    toast.success('Diary entry removed');
  };

  // Study Vault Handlers
  const handlePublishMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle.trim()) { toast.error('Please enter resource title'); return; }

    const newMat = {
      id: 'm_' + Date.now(),
      title: matTitle,
      type: matType || 'PDF Document',
      date: 'Today',
      url: matUrl || '#',
    };

    setMaterialsList(prev => [newMat, ...prev]);

    await publishStudyMaterial({
      tenantId: currentTenant,
      classId: selectedClass,
      title: matTitle,
      url: matUrl,
      type: matType,
      subject: 'Mathematics',
      teacherId: currentTeacherId,
      teacherName: teacherDisplayName,
    });

    toast.success(`📂 Study Material published to ${selectedClass}!`);
    setShowMaterialModal(false);
    setMatTitle('');
    setMatUrl('');
  };

  const handleDeleteMaterial = (id) => {
    setMaterialsList(prev => prev.filter(m => m.id !== id));
    toast.success('Study resource deleted');
  };

  // Leave Handlers
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveReason.trim()) { toast.error('Please enter leave reason'); return; }

    const newLeave = {
      id: 'l_' + Date.now(),
      type: leaveType || 'Casual Leave',
      days: Number(leaveDays),
      reason: leaveReason,
      status: 'Pending Approval',
      date: new Date().toISOString().split('T')[0],
    };

    setLeaveList(prev => [newLeave, ...prev]);

    await applyStaffLeave({
      tenantId: currentTenant,
      teacherId: currentTeacherId,
      teacherName: teacherDisplayName,
      type: leaveType,
      days: leaveDays,
      reason: leaveReason,
    });

    toast.success(`🌴 Leave request submitted for approval!`);
    setShowLeaveModal(false);
    setLeaveReason('');
  };

  const handleWithdrawLeave = (id) => {
    setLeaveList(prev => prev.map(l => l.id === id ? { ...l, status: 'Withdrawn' } : l));
    toast.success('Leave application withdrawn');
  };

  // Grading Handlers
  const handleOpenGradeModal = (submission) => {
    setSelectedSubmission(submission);
    setGradingScore(submission.marks || 90);
    setGradingLetter(submission.grade !== '-' ? submission.grade : 'A+');
    setGradingFeedback(submission.feedback || 'Great submission!');
    setShowGradeModal(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    await enterStudentMarks({
      tenantId: currentTenant,
      classId: selectedClass,
      studentId: selectedSubmission.id,
      rollNo: selectedSubmission.rollNo,
      studentName: selectedSubmission.studentName,
      assignmentTitle: selectedSubmission.assignment,
      marks: gradingScore,
      grade: gradingLetter,
      feedback: gradingFeedback,
    });

    setSubmissionsList(prev => prev.map(s =>
      s.id === selectedSubmission.id
        ? { ...s, marks: gradingScore, grade: gradingLetter, feedback: gradingFeedback, status: 'Graded' }
        : s
    ));

    toast.success(`✅ Marks (${gradingScore}/100 - ${gradingLetter}) saved for ${selectedSubmission.studentName}!`);
    setShowGradeModal(false);
    setSelectedSubmission(null);
  };

  // Parent Chat Handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) { toast.error('Please enter a message'); return; }

    const activeChat = parentChats[selectedChatParent];
    if (!activeChat) return;

    const newMsg = {
      id: 'msg_' + Date.now(),
      sender: 'teacher',
      text: chatMessageText,
      time: 'Just now'
    };

    setParentChats(prev => ({
      ...prev,
      [selectedChatParent]: {
        ...prev[selectedChatParent],
        messages: [...prev[selectedChatParent].messages, newMsg]
      }
    }));

    await sendParentMessage({
      tenantId: currentTenant,
      teacherId: currentTeacherId,
      teacherName: teacherDisplayName,
      parentName: activeChat.parentName,
      studentName: activeChat.studentName,
      message: chatMessageText,
      timestamp: new Date().toISOString(),
    });

    toast.success(`💬 Message sent to ${activeChat.parentName}!`);
    setChatMessageText('');
  };

  const presentCount = attRoster.filter(s => s.status === 'Present').length;
  const absentCount = attRoster.filter(s => s.status === 'Absent').length;
  const lateCount = attRoster.filter(s => s.status === 'Late').length;
  const attPercentage = Math.round((presentCount / (attRoster.length || 1)) * 100);

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
      {/* 1. Main Header */}
      <div className="page-header flex justify-between items-center flex-wrap" style={{ gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A' }}>Faculty Operational Workspace</h1>
          <p className="page-subtitle" style={{ fontSize: '0.88rem', color: '#64748B', marginTop: 3 }}>
            Welcome back, {teacherDisplayName} 👋 | Senior Faculty Workspace
          </p>
        </div>

        {/* Active Class Selector Dropdown */}
        <div className="card flex items-center gap-3" style={{ padding: '10px 18px', backgroundColor: 'var(--color-primary-light, #EFF6FF)', border: '1px solid var(--color-primary-border, #BFDBFE)', borderRadius: 10 }}>
          <BookOpen size={18} color="var(--color-primary, #2563EB)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary, #2563EB)' }}>Active Class:</span>
          <select
            className="form-select"
            style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 800, fontSize: '0.95rem', width: 140, color: 'var(--color-primary, #2563EB)', cursor: 'pointer' }}
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
          >
            {ASSIGNED_CLASSES.map(c => <option key={c.classId} value={c.className}>{c.className}</option>)}
          </select>
        </div>
      </div>

      {/* 2. Top Navigation Tabs */}
      <div className="card flex justify-between items-center" style={{ padding: '10px 16px', marginBottom: 24, backgroundColor: '#FFFFFF', overflowX: 'auto', border: '1px solid #E2E8F0' }}>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview & Timetable', icon: <Layers size={16} /> },
            { id: 'attendance', label: 'Quick Tap Attendance', icon: <CheckSquare size={16} /> },
            { id: 'homework', label: 'Homework & Tasks', icon: <BookOpen size={16} /> },
            { id: 'grading', label: 'Submissions & Bulk Excel', icon: <Award size={16} /> },
            { id: 'diary', label: 'Teaching Diary Log', icon: <Bookmark size={16} /> },
            { id: 'materials', label: 'Study Vault', icon: <FileText size={16} /> },
            { id: 'messages', label: 'Parent 1:1 Chat', icon: <MessageSquare size={16} /> },
            { id: 'leave', label: 'Leave Requests', icon: <Calendar size={16} /> },
            { id: 'salary', label: 'Salary Slips', icon: <DollarSign size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tabToPathMap[tab.id]) navigate(tabToPathMap[tab.id]);
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {/* ASSIGNED CLASS CARDS */}
          <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
            {ASSIGNED_CLASSES.map(c => (
              <div
                key={c.classId}
                className="card"
                style={{
                  padding: 20,
                  borderLeft: selectedClass === c.className ? '5px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  backgroundColor: selectedClass === c.className ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF',
                  borderRadius: 10,
                  transition: 'all 0.2s ease',
                  border: '1px solid #E2E8F0'
                }}
                onClick={() => setSelectedClass(c.className)}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <strong style={{ fontSize: '1.1rem', color: '#0F172A' }}>{c.className}</strong>
                  <span className="badge badge-primary">{c.role}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Subject: {c.subject} · {c.room}</div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: 8 }}>{classStudentCounts[c.className] || 40} Enrolled Students</div>
              </div>
            ))}
          </div>

          {/* TIMETABLE SCHEDULE & QUICK ACTION QUEUE */}
          <div className="grid-12" style={{ gap: 24 }}>
            <div style={{ gridColumn: 'span 7' }}>
              <div className="card">
                <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📅 Today's Teaching Timetable</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                      Date: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className="badge badge-success">{scheduleList.length} Periods Scheduled Today</span>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {scheduleList.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '16px 20px',
                        borderBottom: i < scheduleList.length - 1 ? '1px solid #F1F5F9' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: s.status === 'In Progress' ? 'var(--color-primary-light, #EFF6FF)' : 'transparent',
                        flexWrap: 'wrap',
                        gap: 12
                      }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-neutral" style={{ fontWeight: 700 }}>{s.period}</span>
                          <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{s.subject} ({s.class})</strong>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                          <strong>Topic:</strong> {s.topic} · <span style={{ color: '#94A3B8' }}>{s.room}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${s.status === 'Completed' ? 'badge-success' : s.status === 'In Progress' ? 'badge-primary' : 'badge-neutral'}`}>
                          {s.time}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Toggle Period Status"
                          onClick={() => handleToggleScheduleStatus(s.id)}
                        >
                          {s.status === 'Completed' ? '✓ Done' : s.status === 'In Progress' ? '▶ Active' : '⏱ Next'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ gridColumn: 'span 5' }}>
              <div className="card">
                <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>⚡ Faculty Quick Launchpad</h4>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
                  <button className="btn btn-primary flex items-center gap-2" onClick={() => { setActiveTab('attendance'); navigate('/teacher/attendance'); }}>
                    <CheckSquare size={16} /> Quick Tap Attendance ({selectedClass})
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowExcelMarksModal(true)}>
                    <FileSpreadsheet size={16} color="#16A34A" /> Bulk Excel Marks Entry
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowHwModal(true)}>
                    <BookOpen size={16} /> Post Homework Assignment
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowDiaryModal(true)}>
                    <Bookmark size={16} /> Log Teaching Diary Entry
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2" onClick={() => setShowMaterialModal(true)}>
                    <FileText size={16} /> Publish Study Material
                  </button>
                  <button className="btn btn-secondary flex items-center gap-2" onClick={() => { setActiveTab('messages'); navigate('/teacher/messages'); }}>
                    <MessageSquare size={16} /> Parent 1:1 Chat Timeline
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div className="card-header flex justify-between items-center flex-wrap" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: 12 }}>
            <div>
              <div className="flex items-center gap-2">
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>⚡ Quick Tap Attendance Roster — {selectedClass}</h4>
                <span className="badge badge-success">{attPercentage}% Attendance</span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Date: {new Date().toLocaleDateString('en-IN')} | Present: <strong>{presentCount}</strong> · Absent: <strong>{absentCount}</strong> · Late: <strong>{lateCount}</strong> | <span style={{ color: '#16A34A', fontWeight: 600 }}>Auto-saved at {lastAutoSaveTime}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-ghost btn-sm flex items-center gap-1" onClick={() => handleMarkAllAttendance('Present')}>
                <Check size={14} /> Mark All Present
              </button>
              <button className="btn btn-ghost btn-sm flex items-center gap-1 text-danger" onClick={() => handleMarkAllAttendance('Absent')}>
                <X size={14} /> Mark All Absent
              </button>
              <button className="btn btn-primary flex items-center gap-1" onClick={handleSaveAttendance}>
                <CheckCircle2 size={16} /> Save Attendance to Firestore
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {attRoster.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, margin: 16 }}>
                <CheckSquare size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Students Enrolled</h4>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>No student roster records found for {selectedClass}.</p>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px' }}>Roll Number</th>
                    <th style={{ padding: '12px 18px' }}>Student Name</th>
                    <th style={{ padding: '12px 18px' }}>Attendance Quick Tap</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attRoster.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 18px' }}><strong>{s.rollNo}</strong></td>
                      <td style={{ padding: '12px 18px' }}>{s.name}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <div className="flex gap-2">
                          {[
                            { key: 'Present', label: 'Present', btnClass: 'btn-success' },
                            { key: 'Absent', label: 'Absent', btnClass: 'btn-danger' },
                            { key: 'Late', label: 'Late', btnClass: 'btn-warning' },
                          ].map(st => (
                            <button
                              key={st.key}
                              className={`btn btn-sm ${s.status === st.key ? st.btnClass : 'btn-ghost'}`}
                              onClick={() => handleToggleAttendance(s.id, st.key)}
                              style={{ minWidth: 70 }}
                            >
                              {st.key === 'Present' ? '✓ Present' : st.key === 'Absent' ? '✕ Absent' : '⏱ Late'}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpenAttendanceCorrection(s)}>
                          Correction Request
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 5. HOMEWORK TAB */}
      {activeTab === 'homework' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📚 Homework Assignments & Worksheets</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>Class: {selectedClass}</p>
            </div>
            <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowHwModal(true)}>
              <Plus size={16} /> Post Homework Assignment
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {homeworkList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, margin: 16 }}>
                <BookOpen size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Homework Assignments</h4>
                <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '0.85rem' }}>No active homework created for {selectedClass}.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowHwModal(true)}>
                  <Plus size={14} /> Post Homework Assignment
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px' }}>Assignment Title & Instructions</th>
                    <th style={{ padding: '12px 18px' }}>Subject</th>
                    <th style={{ padding: '12px 18px' }}>Target Class</th>
                    <th style={{ padding: '12px 18px' }}>Attachment</th>
                    <th style={{ padding: '12px 18px' }}>Due Date</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {homeworkList.map(hw => (
                    <tr key={hw.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 18px' }}>
                        <strong>{hw.title}</strong>
                        {hw.description && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
                            {hw.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px' }}>{hw.subject}</td>
                      <td style={{ padding: '12px 18px' }}><span className="badge badge-neutral">{hw.class || selectedClass}</span></td>
                      <td style={{ padding: '12px 18px' }}>
                        {hw.attachment ? (
                          <a
                            href={hw.attachment.url}
                            onClick={(e) => { e.preventDefault(); toast.success(`Downloading ${hw.attachment.name}...`); }}
                            className="badge badge-primary flex items-center gap-1"
                            style={{ textDecoration: 'none', width: 'fit-content' }}
                          >
                            <Paperclip size={12} /> {hw.attachment.name}
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No attachment</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px' }}>{hw.dueDate}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className={`badge ${hw.status === 'Active' ? 'badge-primary' : 'badge-success'}`}>
                          {hw.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <div className="flex justify-end gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => handleToggleHomeworkStatus(hw.id)}>
                            {hw.status === 'Active' ? 'Mark Completed' : 'Reopen'}
                          </button>
                          <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteHomework(hw.id)}>
                            <Trash2 size={14} color="#DC2626" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 6. SUBMISSIONS & GRADING TAB */}
      {activeTab === 'grading' && (
        <div className="card">
          <div className="card-header flex justify-between items-center flex-wrap" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>💯 Student Submissions & Bulk Excel Marks Entry</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Graded: {submissionsList.filter(s => s.status === 'Graded').length} / {submissionsList.length} submissions
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-secondary flex items-center gap-1" onClick={handleDownloadSampleExcel}>
                <Download size={14} /> Download Sample Template
              </button>
              <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowExcelMarksModal(true)}>
                <FileSpreadsheet size={16} /> Bulk Excel Marks Entry
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {submissionsList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, margin: 16 }}>
                <Award size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Submissions Found</h4>
                <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '0.85rem' }}>Import marks via Bulk Excel or record grades for student tasks.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowExcelMarksModal(true)}>
                  <FileSpreadsheet size={14} /> Bulk Excel Marks Entry
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
                    <th style={{ padding: '12px 18px' }}>Student Name</th>
                    <th style={{ padding: '12px 18px' }}>Roll No</th>
                    <th style={{ padding: '12px 18px' }}>Assignment Task</th>
                    <th style={{ padding: '12px 18px' }}>Submitted At</th>
                    <th style={{ padding: '12px 18px' }}>Marks / 100</th>
                    <th style={{ padding: '12px 18px' }}>Grade</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissionsList.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 18px' }}><strong>{r.studentName}</strong></td>
                      <td style={{ padding: '12px 18px' }}><span style={{ fontSize: '0.8rem', color: '#64748B' }}>{r.rollNo}</span></td>
                      <td style={{ padding: '12px 18px' }}>{r.assignment}</td>
                      <td style={{ padding: '12px 18px' }}>{r.submittedAt}</td>
                      <td style={{ padding: '12px 18px' }}><strong>{r.marks !== null && r.marks !== undefined ? `${r.marks}/100` : '-'}</strong></td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className={`badge ${r.grade === 'A+' || r.grade === 'A' ? 'badge-success' : r.grade === '-' ? 'badge-neutral' : 'badge-primary'}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span className={`badge ${r.status === 'Graded' ? 'badge-success' : 'badge-warning'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => handleOpenGradeModal(r)}>
                          <Award size={14} /> Grade / Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 7. TEACHING DIARY TAB */}
      {activeTab === 'diary' && (
        <div className="card">
          <div className="card-header flex justify-between items-center flex-wrap" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📖 Faculty Daily Teaching Diary & Lesson Planning</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                Log covered topics, learning outcomes, and assigned homework per lecture
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-secondary flex items-center gap-1" onClick={() => setShowLessonPlanModal(true)}>
                <Layers size={16} /> Lesson Planner
              </button>
              <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowDiaryModal(true)}>
                <Plus size={16} /> Log Today's Lecture
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 20 }}>
            {diaryList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                <Bookmark size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Teaching Diary Entries</h4>
                <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '0.85rem' }}>Log lecture topics, notes, and homework assigned for compliance tracking.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowDiaryModal(true)}>
                  <Plus size={14} /> Log Today's Lecture
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {diaryList.map(d => (
                  <div key={d.id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--color-primary, #2563EB)' }}>
                        {d.classId || selectedClass} — Topic: {d.topic}
                      </strong>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-neutral">{d.date}</span>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteDiaryEntry(d.id)}>
                          <Trash2 size={14} color="#DC2626" />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#475569', margin: '4px 0 8px' }}>
                      <strong>Lecture Notes & Reflections:</strong> {d.notes}
                    </p>
                    {d.homework && (
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        <strong>Homework Assigned:</strong> {d.homework}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. STUDY VAULT TAB */}
      {activeTab === 'materials' && (
        <div className="card">
          <div className="card-header flex justify-between items-center flex-wrap" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>📚 Study Vault & Course Material Repository</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>Upload and share cheat sheets, lab guides, and reference material</p>
            </div>
            <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowMaterialModal(true)}>
              <Plus size={16} /> Publish Study Material
            </button>
          </div>
          <div className="card-body" style={{ padding: 20 }}>
            {materialsList.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                <FileText size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block' }} />
                <h4 style={{ margin: '0 0 6px', color: '#0F172A' }}>No Study Resources Published</h4>
                <p style={{ margin: '0 0 16px', color: '#64748B', fontSize: '0.85rem' }}>Publish lab guides, notes, formula sheets, and study materials for students.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowMaterialModal(true)}>
                  <Plus size={14} /> Publish Study Material
                </button>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: 16 }}>
                {materialsList.map(m => (
                  <div key={m.id} style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC' }}>
                    <div className="flex justify-between items-start">
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>{m.title}</div>
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteMaterial(m.id)}>
                        <Trash2 size={14} color="#DC2626" />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', margin: '6px 0 12px' }}>
                      Type: <span className="badge badge-neutral">{m.type}</span> · Published: {m.date}
                    </div>
                    <a
                      href={m.url}
                      onClick={(e) => { e.preventDefault(); toast.success(`Opening resource "${m.title}"...`); }}
                      className="btn btn-ghost btn-sm flex items-center gap-1"
                    >
                      <FileText size={14} /> Download / View Resource
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. PARENT CHAT TAB */}
      {activeTab === 'messages' && (
        <div className="card">
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>💬 Parent-Teacher Direct 1:1 Timeline</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="grid-12" style={{ minHeight: 400 }}>
              {/* Left Side: Parent Selector */}
              <div style={{ gridColumn: 'span 4', borderRight: '1px solid #E2E8F0', padding: 16 }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748B' }}>Parent Conversations</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.values(parentChats).map(chat => (
                    <div
                      key={chat.parentId}
                      onClick={() => setSelectedChatParent(chat.parentId)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        cursor: 'pointer',
                        backgroundColor: selectedChatParent === chat.parentId ? 'var(--color-primary-light, #EFF6FF)' : '#F8FAFC',
                        border: selectedChatParent === chat.parentId ? '1px solid var(--color-primary-border, #BFDBFE)' : '1px solid #E2E8F0',
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{chat.parentName}</strong>
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{chat.class}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{chat.relation}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {chat.messages[chat.messages.length - 1]?.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Timeline Conversation View */}
              <div style={{ gridColumn: 'span 8', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {parentChats[selectedChatParent] ? (
                  <>
                    <div>
                      {/* Chat Header */}
                      <div style={{ paddingBottom: 12, marginBottom: 16, borderBottom: '1px solid #E2E8F0' }} className="flex justify-between items-center">
                        <div>
                          <strong style={{ fontSize: '1rem', color: '#0F172A' }}>{parentChats[selectedChatParent].parentName}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Parent of <strong>{parentChats[selectedChatParent].studentName}</strong> ({parentChats[selectedChatParent].class})
                          </div>
                        </div>
                        <span className="badge badge-success">Active 1:1 Channel</span>
                      </div>

                      {/* Messages Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350, overflowY: 'auto', paddingRight: 8 }}>
                        {parentChats[selectedChatParent].messages.map(msg => (
                          <div
                            key={msg.id}
                            style={{
                              padding: 14,
                              borderRadius: 8,
                              maxWidth: '80%',
                              alignSelf: msg.sender === 'teacher' ? 'flex-end' : 'flex-start',
                              backgroundColor: msg.sender === 'teacher' ? 'var(--color-primary, #2563EB)' : '#FFFFFF',
                              color: msg.sender === 'teacher' ? '#FFFFFF' : '#0F172A',
                              border: msg.sender === 'teacher' ? 'none' : '1px solid #E2E8F0',
                            }}
                          >
                            <div className="flex justify-between items-center" style={{ gap: 12, marginBottom: 4 }}>
                              <strong style={{ fontSize: '0.8rem', color: msg.sender === 'teacher' ? 'var(--color-primary-light, #EFF6FF)' : 'var(--color-primary, #2563EB)' }}>
                                {msg.sender === 'teacher' ? `${teacherDisplayName} (Faculty)` : parentChats[selectedChatParent].parentName}
                              </strong>
                              <span style={{ fontSize: '0.7rem', color: msg.sender === 'teacher' ? 'var(--color-primary-border, #BFDBFE)' : '#94A3B8' }}>{msg.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Inline Reply Box */}
                    <form onSubmit={handleSendMessage} style={{ marginTop: 20, borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
                      <div className="flex gap-2">
                        <input
                          className="form-input"
                          placeholder={`Message ${parentChats[selectedChatParent].parentName}...`}
                          value={chatMessageText}
                          onChange={e => setChatMessageText(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary flex items-center gap-1">
                          <Send size={16} /> Send Message
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 50, color: '#64748B' }}>
                    Select a parent conversation from the left sidebar to start messaging.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. LEAVE TAB */}
      {activeTab === 'leave' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>🌴 Staff Leave Requests & Balances</h4>
            <button className="btn btn-primary flex items-center gap-1" onClick={() => setShowLeaveModal(true)}>
              <Plus size={16} /> Apply Leave
            </button>
          </div>
          <div className="card-body" style={{ padding: 20 }}>
            <div className="grid-2" style={{ gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>CASUAL LEAVE BALANCE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', marginTop: 4 }}>8 Days Available</div>
              </div>
              <div style={{ padding: 16, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>MEDICAL LEAVE BALANCE</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16A34A', marginTop: 4 }}>10 Days Available</div>
              </div>
            </div>

            <h5 style={{ margin: '16px 0 10px', fontSize: '0.92rem', fontWeight: 700, color: '#0F172A' }}>📋 Submitted Leave Applications</h5>
            {leaveList.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                <Calendar size={32} color="#94A3B8" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: '0 0 12px', color: '#64748B', fontSize: '0.85rem' }}>No leave applications submitted yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowLeaveModal(true)}>
                  <Plus size={14} /> Apply Leave
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leaveList.map(l => (
                  <div key={l.id} style={{ padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{l.type} ({l.days} {l.days === 1 ? 'day' : 'days'})</strong>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>Reason: {l.reason} · Applied: {l.date}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Pending Approval' ? 'badge-warning' : 'badge-neutral'}`}>{l.status}</span>
                      {l.status === 'Pending Approval' && (
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleWithdrawLeave(l.id)}>
                          Withdraw
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

      {/* 11. SALARY SLIPS TAB */}
      {activeTab === 'salary' && (
        <div className="card">
          <div className="card-header flex justify-between items-center" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#0F172A' }}>💵 Monthly Salary Slips & Payout Records</h4>
          </div>
          <div className="card-body" style={{ padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { month: 'July 2026', basic: 45000, allowances: 6000, deductions: 2000, net: '₹49,000', status: 'Disbursed' },
                { month: 'June 2026', basic: 45000, allowances: 6000, deductions: 2000, net: '₹49,000', status: 'Disbursed' },
                { month: 'May 2026', basic: 45000, allowances: 6000, deductions: 2000, net: '₹49,000', status: 'Disbursed' },
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center" style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 8, backgroundColor: '#FFFFFF' }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{s.month} Payslip</strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>Net Salary Payout: {s.net} · Status: {s.status}</div>
                  </div>
                  <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => {
                    generateStaffPayslipPDF({
                      employeeName: teacherDisplayName,
                      empId: currentTeacherId || 'EMP-101',
                      department: teacherDepartment,
                      designation: 'Senior Faculty',
                      month: s.month,
                      basicSalary: s.basic,
                      allowances: s.allowances,
                      deductions: s.deductions,
                      netPay: 49000
                    });
                    toast.success(`📄 Downloaded ${s.month} Payslip PDF!`);
                  }}>
                    <DollarSign size={14} /> Download Payslip PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Homework Modal */}
      <Modal isOpen={showHwModal} onClose={() => setShowHwModal(false)} title={`Assign Homework to ${selectedClass}`}>
        <form onSubmit={handleCreateHomework}>
          <div className="form-group">
            <label className="form-label">Homework Title *</label>
            <input className="form-input" placeholder="e.g. Quadratic Equations Ex 4.2" value={hwTitle} onChange={e => setHwTitle(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" value={hwSubject} onChange={e => setHwSubject(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input className="form-input" type="date" value={hwDueDate} onChange={e => setHwDueDate(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Detailed Instructions / Description</label>
            <textarea className="form-textarea" rows={3} placeholder="Specific problem numbers or guidelines..." value={hwDescription} onChange={e => setHwDescription(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Worksheet / Attachment Name (Optional)</label>
            <input className="form-input" placeholder="e.g. Exercise_4.2_Worksheet.pdf" value={hwAttachmentName} onChange={e => setHwAttachmentName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowHwModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Homework</button>
          </div>
        </form>
      </Modal>

      {/* 2. Bulk Excel Marks Entry Modal */}
      <Modal isOpen={showExcelMarksModal} onClose={() => setShowExcelMarksModal(false)} title="📊 Bulk Excel / CSV Marks Entry">
        <div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 12 }}>
            Paste CSV or spreadsheet columns directly from Excel in format: <code>RollNo, StudentName, Marks, Grade</code> or use the sample template.
          </p>
          <div className="form-group">
            <label className="form-label">Assessment / Exam Title</label>
            <input className="form-input" value={excelExamName} onChange={e => setExcelExamName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Paste Excel CSV Data *</label>
            <textarea
              className="form-textarea"
              rows={5}
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
              value={excelRawText}
              onChange={e => setExcelRawText(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleDownloadSampleExcel}>
              <Download size={14} /> Download Sample Template
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleParseExcelText}>
              Parse Data Preview
            </button>
          </div>

          {parsedExcelRows.length > 0 && (
            <div style={{ marginBottom: 16, border: '1px solid #E2E8F0', borderRadius: 6, maxHeight: 180, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: 6 }}>Roll No</th>
                    <th style={{ padding: 6 }}>Student Name</th>
                    <th style={{ padding: 6 }}>Marks</th>
                    <th style={{ padding: 6 }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedExcelRows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 6 }}>{r.rollNo}</td>
                      <td style={{ padding: 6 }}>{r.studentName}</td>
                      <td style={{ padding: 6 }}><strong>{r.marks}</strong></td>
                      <td style={{ padding: 6 }}><span className="badge badge-success">{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowExcelMarksModal(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleApplyBulkExcelMarks}>
              Import & Save All Marks
            </button>
          </div>
        </div>
      </Modal>

      {/* 3. Teaching Diary Modal */}
      <Modal isOpen={showDiaryModal} onClose={() => setShowDiaryModal(false)} title={`Log Teaching Diary Entry — ${selectedClass}`}>
        <form onSubmit={handleLogDiary}>
          <div className="form-group">
            <label className="form-label">Topic Covered *</label>
            <input className="form-input" placeholder="e.g. Quadratic Equations Ex 4.2 Factorization" value={diaryTopic} onChange={e => setDiaryTopic(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Lecture Notes & Reflections</label>
            <textarea className="form-textarea" rows={3} placeholder="Notes on student understanding and key concepts covered..." value={diaryNotes} onChange={e => setDiaryNotes(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Homework Assigned</label>
            <input className="form-input" placeholder="e.g. Solve Ex 4.2 Q1 to Q10" value={diaryHomeworkAssigned} onChange={e => setDiaryHomeworkAssigned(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowDiaryModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Entry</button>
          </div>
        </form>
      </Modal>

      {/* 4. Lesson Plan Modal */}
      <Modal isOpen={showLessonPlanModal} onClose={() => setShowLessonPlanModal(false)} title={`Structured Lesson Plan — ${selectedClass}`}>
        <form onSubmit={handleSaveLessonPlan}>
          <div className="form-group">
            <label className="form-label">Chapter / Unit *</label>
            <input className="form-input" value={lpChapter} onChange={e => setLpChapter(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Learning Objective *</label>
            <textarea className="form-textarea" rows={2} value={lpObjective} onChange={e => setLpObjective(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Classroom Activities & Pedagogy</label>
            <textarea className="form-textarea" rows={2} value={lpActivity} onChange={e => setLpActivity(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Teaching Resources & Reference Materials</label>
            <input className="form-input" value={lpResources} onChange={e => setLpResources(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowLessonPlanModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Lesson Plan</button>
          </div>
        </form>
      </Modal>

      {/* 5. Study Material Modal */}
      <Modal isOpen={showMaterialModal} onClose={() => setShowMaterialModal(false)} title="Publish Study Material">
        <form onSubmit={handlePublishMaterial}>
          <div className="form-group">
            <label className="form-label">Notes Title *</label>
            <input className="form-input" placeholder="e.g. Chapter 4 Formula Sheet" value={matTitle} onChange={e => setMatTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Material Type</label>
            <select className="form-select" value={matType} onChange={e => setMatType(e.target.value)}>
              <option>PDF Document</option>
              <option>Lab Guide</option>
              <option>Video Lecture</option>
              <option>Presentation</option>
              <option>Study Note</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Resource URL / File Link *</label>
            <input className="form-input" placeholder="https://drive.google.com/..." value={matUrl} onChange={e => setMatUrl(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowMaterialModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish Notes</button>
          </div>
        </form>
      </Modal>

      {/* 6. Leave Modal */}
      <Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Apply Staff Leave">
        <form onSubmit={handleApplyLeave}>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select className="form-select" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
              <option>Casual Leave</option>
              <option>Medical Leave</option>
              <option>Earned Leave</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Number of Days *</label>
            <input className="form-input" type="number" min="1" value={leaveDays} onChange={e => setLeaveDays(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" rows={3} placeholder="Reason for leave request..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowLeaveModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Application</button>
          </div>
        </form>
      </Modal>

      {/* 7. Grading Modal */}
      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title={`Grade Submission: ${selectedSubmission?.studentName || ''}`}>
        {selectedSubmission && (
          <form onSubmit={handleSaveGrade}>
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <div><strong>Student:</strong> {selectedSubmission.studentName} ({selectedSubmission.rollNo})</div>
              <div><strong>Assignment:</strong> {selectedSubmission.assignment}</div>
              <div><strong>Submitted At:</strong> {selectedSubmission.submittedAt}</div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Marks Obtained (out of 100) *</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="100"
                  value={gradingScore}
                  onChange={e => {
                    const score = Number(e.target.value);
                    setGradingScore(score);
                    setGradingLetter(score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 60 ? 'B' : 'C');
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Grade Category</label>
                <select className="form-select" value={gradingLetter} onChange={e => setGradingLetter(e.target.value)}>
                  <option value="A+">A+ (Outstanding)</option>
                  <option value="A">A (Excellent)</option>
                  <option value="B+">B+ (Very Good)</option>
                  <option value="B">B (Good)</option>
                  <option value="C">C (Satisfactory)</option>
                  <option value="F">Needs Improvement</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Teacher Feedback Notes</label>
              <textarea className="form-textarea" rows={3} value={gradingFeedback} onChange={e => setGradingFeedback(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowGradeModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Grade & Sync</button>
            </div>
          </form>
        )}
      </Modal>

      {/* 8. Attendance Correction Modal */}
      <Modal isOpen={showAttCorrectionModal} onClose={() => setShowAttCorrectionModal(false)} title={`Attendance Correction: ${selectedStudentForCorrection?.name || ''}`}>
        {selectedStudentForCorrection && (
          <form onSubmit={handleSubmitAttendanceCorrection}>
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0' }}>
              <div><strong>Student:</strong> {selectedStudentForCorrection.name} ({selectedStudentForCorrection.rollNo})</div>
              <div><strong>Current Recorded Status:</strong> <span className="badge badge-neutral">{selectedStudentForCorrection.status}</span></div>
            </div>
            <div className="form-group">
              <label className="form-label">Corrected Status *</label>
              <select className="form-select" value={correctionNewStatus} onChange={e => setCorrectionNewStatus(e.target.value)}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Special Duty">Special Duty / Approved Leave</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason for Correction *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Explain the reason for discrepancy (e.g. Student arrived late with pass / On-duty at event)..."
                value={correctionReason}
                onChange={e => setCorrectionReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAttCorrectionModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Correction & Audit</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default TeacherWorkspace;
