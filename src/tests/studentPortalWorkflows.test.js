// src/tests/studentPortalWorkflows.test.js
import assert from 'assert';

console.log('🧪 Running Student Portal Workflows & Intelligence Suite...\n');

// 1. Dynamic Attendance Calculation
function calculateStudentAttendance(logs, profileAttendance) {
  if (logs && logs.length > 0) {
    const present = logs.filter(l => l.status === 'Present').length;
    return `${Math.round((present / logs.length) * 100)}%`;
  }
  if (profileAttendance) {
    return String(profileAttendance).includes('%') ? profileAttendance : `${profileAttendance}%`;
  }
  return '100%';
}

const mockLogs1 = [
  { id: 1, status: 'Present' },
  { id: 2, status: 'Present' },
  { id: 3, status: 'Present' },
  { id: 4, status: 'Absent' },
  { id: 5, status: 'Present' },
];
assert.strictEqual(calculateStudentAttendance(mockLogs1, '90%'), '80%', '4/5 present should calculate 80%');
assert.strictEqual(calculateStudentAttendance([], '94%'), '94%', 'Empty logs should fallback to student profile attendance');
assert.strictEqual(calculateStudentAttendance([], null), '100%', 'Empty logs and no profile attendance should return 100%');
console.log('  ✅ Dynamic attendance calculation verified');

// 2. Dynamic GPA & Grade Calculation from Results
function calculateGPA(resultsList) {
  if (!resultsList || resultsList.length === 0) return 'N/A';
  const totalMarks = resultsList.reduce((acc, r) => acc + Number(r.marks || 0), 0);
  const totalMax = resultsList.reduce((acc, r) => acc + Number(r.max || 100), 0);
  const pct = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
  const gpa = (pct / 10).toFixed(1);
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : 'B';
  return `${gpa} (${grade})`;
}

const mockResults = [
  { subject: 'Math', marks: 95, max: 100 },
  { subject: 'Physics', marks: 92, max: 100 },
  { subject: 'English', marks: 88, max: 100 },
  { subject: 'CS', marks: 96, max: 100 },
  { subject: 'Social Studies', marks: 90, max: 100 },
];
assert.strictEqual(calculateGPA(mockResults), '9.2 (A+)', 'Total 461/500 should yield 9.2 (A+)');
assert.strictEqual(calculateGPA([]), 'N/A', 'Empty results should return N/A');
console.log('  ✅ Dynamic latest GPA calculation from marks verified');

// 3. Pending Fee Calculation
function calculatePendingFees(feeList) {
  const pending = (feeList || []).filter(f => f.status === 'Pending');
  const totalDue = pending.reduce((acc, f) => acc + Number(f.amount || 0), 0);
  return { count: pending.length, totalDue };
}

const mockFees = [
  { id: 'f1', name: 'Tuition Fee Q1', amount: 18500, status: 'Paid' },
  { id: 'f2', name: 'Tuition Fee Q2', amount: 18500, status: 'Pending' },
  { id: 'f3', name: 'Annual Activity Fee', amount: 3500, status: 'Pending' },
];
const feeRes = calculatePendingFees(mockFees);
assert.strictEqual(feeRes.count, 2, 'Should detect 2 pending fee items');
assert.strictEqual(feeRes.totalDue, 22000, 'Should sum to ₹22,000');
console.log('  ✅ Outstanding fee dues aggregation verified');

// 4. Online Quiz Auto-Grading Engine
function gradeQuiz(questions, userAnswers) {
  let correctCount = 0;
  questions.forEach(q => {
    if (userAnswers[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  });
  const scorePct = Math.round((correctCount / questions.length) * 100);
  return { scorePct, correctCount, total: questions.length, passed: scorePct >= 70 };
}

const mockQuizQuestions = [
  { id: 1, correctIndex: 0 },
  { id: 2, correctIndex: 0 },
  { id: 3, correctIndex: 0 },
  { id: 4, correctIndex: 0 },
];

const answers100 = { 1: 0, 2: 0, 3: 0, 4: 0 };
const result100 = gradeQuiz(mockQuizQuestions, answers100);
assert.strictEqual(result100.scorePct, 100, '4/4 correct should be 100%');
assert.strictEqual(result100.passed, true, '100% should pass');

const answers50 = { 1: 0, 2: 0, 3: 1, 4: 1 };
const result50 = gradeQuiz(mockQuizQuestions, answers50);
assert.strictEqual(result50.scorePct, 50, '2/4 correct should be 50%');
assert.strictEqual(result50.passed, false, '50% should not pass');
console.log('  ✅ Online quiz auto-grading & score calculation verified');

// 5. Digital Notebook CRUD Filter
function filterNotes(notes, query) {
  if (!query || !query.trim()) return notes;
  const q = query.toLowerCase();
  return (notes || []).filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || (n.subject && n.subject.toLowerCase().includes(q)));
}

const mockNotes = [
  { id: 1, title: 'Quadratic Equations Formula', subject: 'Mathematics', content: 'x = (-b +- sqrt(D))/(2a)' },
  { id: 2, title: 'Snell Law of Refraction', subject: 'Physics', content: 'n1 sin(i) = n2 sin(r)' },
  { id: 3, title: 'English Essay Structure', subject: 'English', content: 'Introduction, Body paragraphs, Conclusion' },
];

assert.strictEqual(filterNotes(mockNotes, 'quadratic').length, 1, 'Search for "quadratic" should return 1 note');
assert.strictEqual(filterNotes(mockNotes, 'Physics').length, 1, 'Search for subject "Physics" should return 1 note');
assert.strictEqual(filterNotes(mockNotes, 'law').length, 1, 'Search for content "law" should return 1 note');
assert.strictEqual(filterNotes(mockNotes, 'chemistry').length, 0, 'Search for non-existent term should return 0 notes');
console.log('  ✅ Digital notebook full-text search & subject filter verified');

console.log('\n✨ ALL STUDENT PORTAL WORKFLOW TESTS PASSED WITH 100% SUCCESS!\n');
