// src/pages/admin/ExamsAndResults.jsx
import { useState, useEffect } from 'react';
import {
  Award, Lock, Unlock, FileText, CheckCircle, Download, Plus, Eye,
  Calendar, Layers, ShieldCheck, Sparkles, UserCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import {
  lockExamResult, saveStudentMarksTransaction,
  getExams, createExamTerm, getQuestions, addQuestionToBank
} from '../../services/academicService';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import { exportToCSV } from '../../services/exportService';
import { generateAdmitCardPDF, generateReportCardPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const MOCK_EXAMS = [
  { id: 'ex_101', name: 'Mid-Term Examination 2026', type: 'Term Exam', class: 'Class 10-A', academicYear: '2026-2027', startDate: '2026-09-10', isLocked: false, isPublished: true },
  { id: 'ex_102', name: 'Annual Examination 2025', type: 'Annual Exam', class: 'Class 9-A', academicYear: '2025-2026', startDate: '2026-03-01', isLocked: true, isPublished: true },
  { id: 'ex_103', name: 'Unit Test 1 — Mathematics', type: 'Unit Test', class: 'Class 10-B', academicYear: '2026-2027', startDate: '2026-08-01', isLocked: false, isPublished: false },
];

const MOCK_MARKS_ROSTER = [
  { id: 'm1', rollNo: 'GV-2026-001', studentName: 'Arjun Verma', class: 'Class 10-A', math: 95, physics: 92, english: 88, cs: 96, total: 371, max: 400, pct: 92.75, gpa: 9.6, rank: 1 },
  { id: 'm2', rollNo: 'GV-2026-002', studentName: 'Rohan Sharma', class: 'Class 10-A', math: 85, physics: 80, english: 82, cs: 88, total: 335, max: 400, pct: 83.75, gpa: 8.4, rank: 2 },
  { id: 'm3', rollNo: 'GV-2026-003', studentName: 'Ananya Gupta', class: 'Class 10-A', math: 78, physics: 75, english: 80, cs: 82, total: 315, max: 400, pct: 78.75, gpa: 7.8, rank: 3 },
];

const MOCK_QUESTIONS = [
  { q: 'Derive quadratic formula ax² + bx + c = 0', sub: 'Mathematics', diff: 'Medium', marks: 5 },
  { q: 'State Newton’s Second Law of Motion with SI units', sub: 'Physics', diff: 'Easy', marks: 3 },
];

const ExamsAndResults = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const { students } = useStudentStore();
  const collegeStudents = (students || []).filter(s => isCustomCollege ? (s.tenantId === currentTenant) : true);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams'); // exams | marks | questionbank | admitcards

  const [exams, setExams] = useState(() => {
    const saved = localStorage.getItem(`exams_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_EXAMS;
  });

  const [roster, setRoster] = useState(() => {
    const saved = localStorage.getItem(`exam_roster_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_MARKS_ROSTER;
  });

  const [questionBank, setQuestionBank] = useState(MOCK_QUESTIONS);

  // Modals
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // New Exam Form
  const [examName, setExamName] = useState('');
  const [examType, setExamType] = useState('Term Exam');
  const [selectedClass, setSelectedClass] = useState('Class 10-A');

  // Marks Entry Form
  const [entryStudentName, setEntryStudentName] = useState('Rohan Sharma');
  const [entryMath, setEntryMath] = useState(85);
  const [entryPhysics, setEntryPhysics] = useState(80);
  const [entryEnglish, setEntryEnglish] = useState(82);
  const [entryCS, setEntryCS] = useState(88);

  // Question Form
  const [qSnippet, setQSnippet] = useState('');
  const [qSub, setQSub] = useState('Mathematics');
  const [qDiff, setQDiff] = useState('Medium');
  const [qMarks, setQMarks] = useState(5);

  useEffect(() => {
    const loadAcademicData = async () => {
      setLoading(true);
      try {
        const fetchedExams = await getExams(currentTenant);
        if (fetchedExams && fetchedExams.length > 0) {
          setExams(fetchedExams);
        }

        const fetchedQuestions = await getQuestions(currentTenant);
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestionBank(fetchedQuestions);
        }
      } catch (err) {
        console.warn('Academic data load notice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAcademicData();
  }, [currentTenant]);

  // Lock Exam Results Handler (Security Enforcement)
  const handleLockResult = async (exam) => {
    await lockExamResult(exam.id, exam.name, currentTenant);
    setExams(exams.map(e => e.id === exam.id ? { ...e, isLocked: true } : e));
    toast.success(`🔒 Results locked for "${exam.name}"! Modifications are now blocked.`);
  };

  // Toggle Publication
  const handleTogglePublish = (exam) => {
    const updated = !exam.isPublished;
    setExams(exams.map(e => e.id === exam.id ? { ...e, isPublished: updated } : e));
    toast.success(updated ? `📢 Published results for ${exam.name}!` : `🙈 Unpublished results for ${exam.name}`);
  };

  // Schedule New Exam
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examName) return;
    const newExamPayload = {
      name: examName,
      type: examType,
      class: selectedClass,
      academicYear: '2026-2027',
      startDate: new Date().toISOString().split('T')[0],
      isLocked: false,
      isPublished: false,
    };
    const created = await createExamTerm({ tenantId: currentTenant, ...newExamPayload });
    setExams([created, ...exams]);
    toast.success(`🎉 Exam "${examName}" scheduled!`);
    setShowCreateExamModal(false);
    setExamName('');
  };

  // Save Marks Entry
  const handleSaveMarks = async (e) => {
    e.preventDefault();
    const total = Number(entryMath) + Number(entryPhysics) + Number(entryEnglish) + Number(entryCS);
    const pct = Number((total / 4).toFixed(2));
    const gpa = Number((pct / 10).toFixed(1));

    await saveStudentMarksTransaction(selectedExam?.id || 'ex_101', {
      studentName: entryStudentName,
      marks: { math: Number(entryMath), physics: Number(entryPhysics), english: Number(entryEnglish), cs: Number(entryCS) },
      total, pct, gpa
    }, 'admin');

    setRoster(roster.map(r => r.studentName === entryStudentName ? {
      ...r, math: Number(entryMath), physics: Number(entryPhysics), english: Number(entryEnglish), cs: Number(entryCS), total, pct, gpa
    } : r));

    toast.success(`📝 Marks updated for ${entryStudentName}!`);
    setShowEntryModal(false);
  };

  // Add Question to Question Bank
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!qSnippet) return;
    const newQ = await addQuestionToBank({
      tenantId: currentTenant,
      q: qSnippet,
      sub: qSub,
      diff: qDiff,
      marks: Number(qMarks)
    });
    setQuestionBank([newQ, ...questionBank]);
    toast.success(`📖 Question added to bank!`);
    setShowQuestionModal(false);
    setQSnippet('');
  };

  // Download PDF Admit Cards
  const handleGenerateAdmitCards = async () => {
    await generateAdmitCardPDF({
      studentName: 'Arjun Verma',
      rollNo: 'GV-2026-001',
      className: 'Class 10-A',
      examName: 'Mid-Term Examination 2026',
      examCenter: 'Main Campus Auditorium Hall B',
      seatNo: 'Seat A-12',
    });
    toast.success('📥 Downloaded Official Exam Admit Card PDF with datesheet & QR code!');
  };

  const columns = [
    { key: 'name', label: 'Examination Title', render: (row) => <strong>{row.name}</strong> },
    { key: 'type', label: 'Type', render: (row) => <span className="badge badge-primary">{row.type}</span> },
    { key: 'class', label: 'Target Class' },
    { key: 'startDate', label: 'Start Date' },
    {
      key: 'status', label: 'Lock Status', render: (row) => (
        <span className={`badge ${row?.isLocked ? 'badge-danger' : 'badge-success'}`}>
          {row?.isLocked ? '🔒 Locked' : '🟢 Editable'}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions', render: (row) => (
        <div className="flex gap-2">
          {!row?.isLocked ? (
            <>
              <button className="btn btn-warning btn-sm" onClick={() => handleLockResult(row)} title="Lock Exam Results">
                <Lock size={14} /> Lock
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { setSelectedExam(row); setShowEntryModal(true); }}>
                Marks Entry
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Locked by Admin</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => handleTogglePublish(row)}>
            {row?.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Exams & Result Engine</h1>
          <p className="page-subtitle">Schedule examinations, process term marks, GPA calculations, and enforce result locking</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateExamModal(true)}>
          <Plus size={16} /> Schedule New Exam
        </button>
      </div>

      {/* TABS */}
      <div className="tab-bar">
        <button className={`tab-item ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>
          📝 Exam Schedules ({exams.length})
        </button>
        <button className={`tab-item ${activeTab === 'marks' ? 'active' : ''}`} onClick={() => setActiveTab('marks')}>
          🏆 Marks Roster & GPA
        </button>
        <button className={`tab-item ${activeTab === 'questionbank' ? 'active' : ''}`} onClick={() => setActiveTab('questionbank')}>
          📖 Question Bank ({questionBank.length})
        </button>
        <button className={`tab-item ${activeTab === 'admitcards' ? 'active' : ''}`} onClick={() => setActiveTab('admitcards')}>
          🎫 Hall Tickets / Admit Cards
        </button>
      </div>

      {/* EXAMS TAB */}
      {activeTab === 'exams' && (
        <div className="card">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading examination schedules...</div>
            </div>
          ) : (
            <DataTable data={exams} columns={columns} searchPlaceholder="Search examinations..." emptyText="No scheduled examinations found." />
          )}
        </div>
      )}

      {/* MARKS ROSTER TAB */}
      {activeTab === 'marks' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>Class 10-A Mid-Term Performance Ledger</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV('Class_10A_Marks_Roster', roster, [
              { key: 'rank', label: 'Rank' },
              { key: 'rollNo', label: 'Roll No' },
              { key: 'studentName', label: 'Student Name' },
              { key: 'math', label: 'Math' },
              { key: 'physics', label: 'Physics' },
              { key: 'english', label: 'English' },
              { key: 'cs', label: 'CS' },
              { key: 'total', label: 'Total' },
              { key: 'pct', label: 'Percentage' },
              { key: 'gpa', label: 'GPA' },
            ])}>
              <Download size={14} /> Export Roster CSV
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {roster.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No student marks recorded for this term exam yet.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Math (100)</th>
                    <th>Physics (100)</th>
                    <th>English (100)</th>
                    <th>CS (100)</th>
                    <th>Total</th>
                    <th>Pct %</th>
                    <th>GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span className={`badge ${r.rank === 1 ? 'badge-warning' : 'badge-ghost'}`}>
                          Rank #{r.rank}
                        </span>
                      </td>
                      <td><strong>{r.rollNo}</strong></td>
                      <td>{r.studentName}</td>
                      <td>{r.math}</td>
                      <td>{r.physics}</td>
                      <td>{r.english}</td>
                      <td>{r.cs}</td>
                      <td><strong>{r.total}/400</strong></td>
                      <td><strong className="text-primary">{r.pct}%</strong></td>
                      <td><span className="badge badge-success">{r.gpa}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {activeTab === 'questionbank' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>📖 Master Subject Question Bank Repository</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
              <Plus size={14} /> Add Question
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {questionBank.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No questions added to the question bank yet.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Question Snippet</th>
                    <th>Subject</th>
                    <th>Difficulty</th>
                    <th>Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {questionBank.map((q, idx) => (
                    <tr key={idx}>
                      <td><strong>{q.q}</strong></td>
                      <td><span className="badge badge-primary">{q.sub}</span></td>
                      <td><span className="badge badge-warning">{q.diff}</span></td>
                      <td>{q.marks} Marks</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ADMIT CARDS TAB */}
      {activeTab === 'admitcards' && (
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>🎫 Exam Hall Tickets / Admit Cards Generator</h4>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              Generate official exam admit cards containing student roll number, exam schedule date sheet, room number, and invigilator guidelines.
            </p>
            <button className="btn btn-primary" onClick={handleGenerateAdmitCards}>
              <Download size={16} /> Generate Class 10-A Admit Cards (PDF)
            </button>
          </div>
        </div>
      )}

      {/* MARKS ENTRY MODAL */}
      <Modal isOpen={showEntryModal} onClose={() => setShowEntryModal(false)} title={`Enter Marks — ${selectedExam?.name || 'Exam'}`}>
        <form onSubmit={handleSaveMarks}>
          <div className="form-group">
            <label className="form-label">Student *</label>
            <select className="form-select" value={entryStudentName} onChange={e => setEntryStudentName(e.target.value)}>
              <option value="">Select Student</option>
              {collegeStudents.length > 0 ? (
                collegeStudents.map(st => <option key={st.id} value={st.name}>{st.name} ({st.rollNo || st.class || 'Student'})</option>)
              ) : (
                <option value="" disabled>No students registered yet in roster</option>
              )}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Mathematics Marks (Max 100) *</label>
              <input type="number" className="form-input" value={entryMath} onChange={e => setEntryMath(e.target.value)} required max="100" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Physics Marks (Max 100) *</label>
              <input type="number" className="form-input" value={entryPhysics} onChange={e => setEntryPhysics(e.target.value)} required max="100" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">English Marks (Max 100) *</label>
              <input type="number" className="form-input" value={entryEnglish} onChange={e => setEntryEnglish(e.target.value)} required max="100" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Computer Science Marks (Max 100) *</label>
              <input type="number" className="form-input" value={entryCS} onChange={e => setEntryCS(e.target.value)} required max="100" min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowEntryModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Marks</button>
          </div>
        </form>
      </Modal>

      {/* QUESTION MODAL */}
      <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title="Add Question to Question Bank">
        <form onSubmit={handleAddQuestion}>
          <div className="form-group">
            <label className="form-label">Question Text *</label>
            <input className="form-input" placeholder="e.g. What is the derivative of sin(x)?" value={qSnippet} onChange={e => setQSnippet(e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={qSub} onChange={e => setQSub(e.target.value)}>
                <option>Mathematics</option>
                <option>Physics</option>
                <option>English</option>
                <option>Computer Science</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <select className="form-select" value={qDiff} onChange={e => setQDiff(e.target.value)}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Marks Weightage</label>
            <input type="number" className="form-input" value={qMarks} onChange={e => setQMarks(e.target.value)} min="1" max="20" required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowQuestionModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Question</button>
          </div>
        </form>
      </Modal>

      {/* CREATE EXAM MODAL */}
      <Modal isOpen={showCreateExamModal} onClose={() => setShowCreateExamModal(false)} title="Schedule New Exam Term">
        <form onSubmit={handleCreateExam}>
          <div className="form-group">
            <label className="form-label">Exam Name *</label>
            <input className="form-input" placeholder="e.g. Mid-Term Examination 2026" value={examName} onChange={e => setExamName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Exam Type *</label>
            <select className="form-select" value={examType} onChange={e => setExamType(e.target.value)}>
              <option>Term Exam</option>
              <option>Annual Exam</option>
              <option>Unit Test</option>
              <option>Practical / Viva</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Target Class *</label>
            <select className="form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option>Class 10-A</option>
              <option>Class 10-B</option>
              <option>Class 9-A</option>
              <option>Class 8-B</option>
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreateExamModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Exam</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamsAndResults;
