// src/tests/teacherWorkspaceWorkflows.test.js
import assert from 'assert';

console.log('🧪 Running Teacher Workspace Workflows & Logic Suite...\n');

// 1. Attendance Metrics Calculation & NaN-Safety
function calculateAttendanceMetrics(roster) {
  if (!roster || roster.length === 0) {
    return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
  }
  const present = roster.filter(s => s.status === 'Present').length;
  const absent = roster.filter(s => s.status === 'Absent').length;
  const late = roster.filter(s => s.status === 'Late').length;
  const total = roster.length;
  const percentage = Math.round((present / (total || 1)) * 100);
  return { present, absent, late, total, percentage };
}

const mockRoster = [
  { id: '1', name: 'Arjun', status: 'Present' },
  { id: '2', name: 'Rohan', status: 'Present' },
  { id: '3', name: 'Ananya', status: 'Present' },
  { id: '4', name: 'Kabir', status: 'Absent' },
  { id: '5', name: 'Priya', status: 'Late' },
];

const attMetrics = calculateAttendanceMetrics(mockRoster);
assert.strictEqual(attMetrics.present, 3, '3 students should be present');
assert.strictEqual(attMetrics.absent, 1, '1 student should be absent');
assert.strictEqual(attMetrics.late, 1, '1 student should be late');
assert.strictEqual(attMetrics.percentage, 60, '3/5 present should calculate 60%');

const emptyMetrics = calculateAttendanceMetrics([]);
assert.strictEqual(emptyMetrics.percentage, 0, 'Empty roster should return 0% without NaN');
console.log('  ✅ Quick Tap attendance ratio and NaN-safety verified');

// 2. Bulk Excel / CSV Marks Parser Validation
function parseExcelMarks(csvText) {
  if (!csvText || !csvText.trim()) return [];
  const lines = csvText.trim().split('\n');
  return lines.map((line, idx) => {
    const parts = line.split(',').map(p => p.trim());
    const marks = Number(parts[2]) || 0;
    const boundedMarks = Math.max(0, Math.min(100, marks));
    const grade = parts[3] || (boundedMarks >= 90 ? 'A+' : boundedMarks >= 80 ? 'A' : boundedMarks >= 70 ? 'B+' : 'B');
    return {
      id: `parsed_${idx}`,
      rollNo: parts[0] || `GV-2026-00${idx + 1}`,
      studentName: parts[1] || `Student ${idx + 1}`,
      marks: boundedMarks,
      grade
    };
  });
}

const sampleCSV = `GV-2026-001, Arjun Verma, 95, A+
GV-2026-002, Rohan Sharma, 88, A
GV-2026-003, Ananya Gupta, 74, B+
GV-2026-004, Kabir Verma, 62, B`;

const parsedRows = parseExcelMarks(sampleCSV);
assert.strictEqual(parsedRows.length, 4, 'Should parse 4 student rows');
assert.strictEqual(parsedRows[0].studentName, 'Arjun Verma', 'First student should be Arjun Verma');
assert.strictEqual(parsedRows[0].marks, 95, 'Marks should be 95');
assert.strictEqual(parsedRows[0].grade, 'A+', 'Grade should be A+');
assert.strictEqual(parsedRows[3].grade, 'B', 'Kabir Verma grade should be B');

// Test auto-grade assignment when grade column is missing
const missingGradeCSV = `GV-2026-005, Siddharth Roy, 92`;
const parsedNoGrade = parseExcelMarks(missingGradeCSV);
assert.strictEqual(parsedNoGrade[0].grade, 'A+', '92 marks should auto-assign A+');
console.log('  ✅ Bulk Excel CSV parser and grade auto-calculation verified');

// 3. Attendance Correction Payload Structure
function buildAttendanceCorrection(student, newStatus, reason, teacherName) {
  return {
    studentId: student.id,
    studentName: student.name,
    rollNo: student.rollNo,
    oldStatus: student.status,
    newStatus,
    reason,
    teacherName,
    status: 'Pending Admin Review',
    timestamp: new Date().toISOString()
  };
}

const mockCorrection = buildAttendanceCorrection(
  { id: 'std_4', name: 'Kabir Verma', rollNo: 'GV-2026-004', status: 'Absent' },
  'Present',
  'Student arrived with gate pass',
  'Mrs. Priya Sharma'
);
assert.strictEqual(mockCorrection.oldStatus, 'Absent');
assert.strictEqual(mockCorrection.newStatus, 'Present');
assert.strictEqual(mockCorrection.status, 'Pending Admin Review');
assert.strictEqual(mockCorrection.teacherName, 'Mrs. Priya Sharma');
console.log('  ✅ Attendance correction request data pipeline verified');

// 4. Homework Class Scoping & Status Lifecycle
function filterHomeworkByClass(homeworkList, targetClass) {
  if (!targetClass) return homeworkList;
  const cleanTarget = targetClass.replace('Class ', '').trim();
  return homeworkList.filter(h => {
    const cleanClass = (h.class || h.classId || '').replace('Class ', '').trim();
    return cleanClass === cleanTarget || h.class === targetClass;
  });
}

const mockHwList = [
  { id: 'hw_1', title: 'Quadratic Equations', class: 'Class 10-A', status: 'Active' },
  { id: 'hw_2', title: 'Trigonometry Worksheet', class: 'Class 10-A', status: 'Active' },
  { id: 'hw_3', title: 'Polynomials', class: 'Class 10-B', status: 'Active' },
  { id: 'hw_4', title: 'Geometry Proofs', class: 'Class 9-A', status: 'Completed' },
];

assert.strictEqual(filterHomeworkByClass(mockHwList, 'Class 10-A').length, 2, 'Class 10-A should have 2 assignments');
assert.strictEqual(filterHomeworkByClass(mockHwList, 'Class 10-B').length, 1, 'Class 10-B should have 1 assignment');
assert.strictEqual(filterHomeworkByClass(mockHwList, 'Class 9-A').length, 1, 'Class 9-A should have 1 assignment');
console.log('  ✅ Homework class scoping and lifecycle verified');

// 5. Teaching Diary & Lesson Plan Integration
function formatTeachingDiaryEntry(classId, topic, notes, homework, teacherName) {
  return {
    classId,
    topic,
    notes,
    homework: homework || 'None',
    teacherName,
    date: 'Today',
    complianceStatus: 'Logged'
  };
}

const diaryEntry = formatTeachingDiaryEntry(
  'Class 10-A',
  'Quadratic Equations Ex 4.2',
  'Covered factorization and nature of roots with discriminant analysis',
  'Ex 4.2 Q6-Q15',
  'Mrs. Priya Sharma'
);
assert.strictEqual(diaryEntry.topic, 'Quadratic Equations Ex 4.2');
assert.strictEqual(diaryEntry.homework, 'Ex 4.2 Q6-Q15');
assert.strictEqual(diaryEntry.complianceStatus, 'Logged');
console.log('  ✅ Teaching diary entry formatting and compliance verified');

console.log('\n✨ ALL TEACHER WORKSPACE WORKFLOW TESTS PASSED WITH 100% SUCCESS!\n');
