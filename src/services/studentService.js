// src/services/studentService.js
import { db } from '../config/firebase';
import { collection, addDoc, doc, deleteDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';

export const DEFAULT_TIMETABLE = [
  { p: 1, day: 'Monday', time: '09:00 AM - 10:00 AM', subject: 'Mathematics', teacher: 'Mrs. Priya Sharma', room: 'Room 201', status: 'Completed' },
  { p: 2, day: 'Monday', time: '10:00 AM - 11:00 AM', subject: 'Physics', teacher: 'Mr. Rajesh Verma', room: 'Physics Lab 1', status: 'Ongoing' },
  { p: 3, day: 'Monday', time: '11:15 AM - 12:15 PM', subject: 'English Literature', teacher: 'Ms. Anjali Roy', room: 'Room 201', status: 'Upcoming' },
  { p: 4, day: 'Monday', time: '12:15 PM - 01:15 PM', subject: 'Computer Science', teacher: 'Mr. Alok Singh', room: 'Comp Lab 2', status: 'Upcoming' },
  { p: 5, day: 'Monday', time: '02:00 PM - 03:00 PM', subject: 'Chemistry', teacher: 'Dr. Meena Iyer', room: 'Chemistry Lab 2', status: 'Upcoming' },
];

export const DEFAULT_EXAMS = [
  { id: 'ex_1', title: 'Mid-Term Examination: Mathematics', subject: 'Mathematics', date: '22 August 2026', time: '09:30 AM - 12:30 PM', room: 'Exam Hall 201', maxMarks: 100, syllabus: 'Ch 1 Real Numbers, Ch 2 Polynomials, Ch 4 Quadratic Equations, Ch 6 Triangles', status: 'Upcoming' },
  { id: 'ex_2', title: 'Mid-Term Examination: Physics & Chemistry', subject: 'Science', date: '25 August 2026', time: '09:30 AM - 12:30 PM', room: 'Science Lab 1 & 2', maxMarks: 100, syllabus: 'Light Reflection & Refraction, Chemical Reactions, Acids Bases & Salts', status: 'Upcoming' },
  { id: 'ex_3', title: 'Mid-Term Examination: English Literature', subject: 'English', date: '28 August 2026', time: '09:30 AM - 12:30 PM', room: 'Room 201', maxMarks: 100, syllabus: 'First Flight Prose Ch 1-5, Poems 1-4, Grammar & Formal Essay Writing', status: 'Upcoming' },
];

export const DEFAULT_HOMEWORK = [
  { id: 1, title: 'Quadratic Equations Ex 4.2 Solution Set', subject: 'Mathematics', teacher: 'Mrs. Priya Sharma', due: '14 Aug 2026, 05:00 PM', status: 'Pending', notes: '', fileName: '' },
  { id: 2, title: 'Lab Report: Acid & Bases Titration', subject: 'Physics', teacher: 'Mr. Rajesh Verma', due: '18 Aug 2026, 05:00 PM', status: 'Pending', notes: '', fileName: '' },
  { id: 3, title: 'Essay on Climate Change & Renewable Energy', subject: 'English', teacher: 'Ms. Anjali Roy', due: '12 Aug 2026', status: 'Submitted', submittedAt: '12 Aug 2026, 04:30 PM', notes: 'Uploaded complete PDF essay with references.', fileName: 'Climate_Change_Essay_Arjun.pdf' },
];

export const DEFAULT_STUDY_VAULT = [
  { id: 'v_1', title: 'Class 10 Mathematics Formulae & Mindmaps', subject: 'Mathematics', type: 'PDF Document', size: '2.4 MB', category: 'Formula Sheet', date: '01 Aug 2026', author: 'Mrs. Priya Sharma' },
  { id: 'v_2', title: 'Physics Optics & Ray Diagrams Revision Summary', subject: 'Physics', type: 'PDF Document', size: '4.2 MB', category: 'Chapter Notes', date: '04 Aug 2026', author: 'Mr. Rajesh Verma' },
  { id: 'v_3', title: 'Computer Science Python & SQL Master Question Bank', subject: 'Computer Science', type: 'PDF Document', size: '3.1 MB', category: 'Question Bank', date: '08 Aug 2026', author: 'Mr. Alok Singh' },
  { id: 'v_4', title: 'English Grammar & Formal Letter Writing Video Guide', subject: 'English', type: 'Video Tutorial', size: '45 Mins', category: 'Video Lecture', date: '10 Aug 2026', author: 'Ms. Anjali Roy' },
  { id: 'v_5', title: 'Chemistry Acid, Bases & Salts Practical Lab Manual', subject: 'Chemistry', type: 'PDF Document', size: '1.8 MB', category: 'Lab Manual', date: '11 Aug 2026', author: 'Dr. Meena Iyer' },
];

export const DEFAULT_NOTES = [
  { id: 1, title: 'Math Ch 4 — Quadratic Roots Formula', subject: 'Mathematics', content: 'x = (-b ± √(b² - 4ac)) / (2a). Remember discriminant condition b² - 4ac > 0 for real distinct roots.', date: '12 Aug 2026, 10:30 AM' },
  { id: 2, title: 'Physics — Laws of Reflection & Snell Law', subject: 'Physics', content: 'Angle of incidence equals angle of reflection (i = r). Incident ray, reflected ray and normal lie on the same plane. Snell law: n1 sin(i) = n2 sin(r).', date: '10 Aug 2026, 02:15 PM' },
];

export const DEFAULT_FEES = [
  { id: 'fee_q2', name: 'Tuition & Exam Fee (Quarter 2)', dueDate: '25 August 2026', amount: 18500, status: 'Pending', breakdown: 'Tuition: ₹15,000 | Lab: ₹2,000 | Library: ₹1,500' },
  { id: 'fee_q1', name: 'Tuition & Exam Fee (Quarter 1)', dueDate: '15 April 2026', amount: 18500, status: 'Paid', paidOn: '10 Apr 2026', receiptNo: 'PAY-2026-89231', breakdown: 'Tuition: ₹15,000 | Lab: ₹2,000 | Library: ₹1,500' },
];

export const DEFAULT_MESSAGES = [
  { id: 1, sender: 'Mrs. Priya Sharma (Class Teacher)', role: 'teacher', text: 'Good morning Arjun! Please submit your Mathematics Exercise 4.2 assignment today.', time: '08:30 AM' },
  { id: 2, sender: 'Arjun Verma', role: 'student', text: 'Good morning Ma\'am! I have completed it and will upload the PDF shortly.', time: '08:45 AM' },
  { id: 3, sender: 'Mrs. Priya Sharma (Class Teacher)', role: 'teacher', text: 'Great work! Feel free to ask if you have any questions regarding question 12.', time: '09:00 AM' },
];

export const DEFAULT_RESULTS = [
  { id: 1, subject: 'Mathematics', marks: 95, max: 100, grade: 'A+', remarks: 'Outstanding analytical & problem solving skills' },
  { id: 2, subject: 'Physics / Science', marks: 92, max: 100, grade: 'A+', remarks: 'Excellent lab practical performance' },
  { id: 3, subject: 'English Literature', marks: 88, max: 100, grade: 'A', remarks: 'Strong essay writing & vocabulary' },
  { id: 4, subject: 'Computer Science', marks: 96, max: 100, grade: 'A+', remarks: 'Top scorer in Python programming' },
  { id: 5, subject: 'Social Studies', marks: 90, max: 100, grade: 'A+', remarks: 'Very thorough map work & historical analysis' },
];

// Normalizes class identifiers so "Class 10-A" and "10-A" resolve to the same key.
const normalizeClassKey = (value) =>
  String(value || '').replace(/^class\s+/i, '').trim().replace(/\s+/g, '-').toLowerCase();

const normalizeRollNo = (value) => String(value || '').trim().toUpperCase();

// 1. Fetch Complete Student Portal Data from Firestore / Local Scoped Storage
export const fetchStudentPortalData = async (
  studentId = 'student_001',
  tenantId = 'tenant_gvis',
  studentClass = 'Class 10-A',
  userContext = {}
) => {
  const isDefault = tenantId === 'tenant_gvis';
  const userEmail = String(userContext.email || '').trim().toLowerCase();

  try {
    // 1. Digital Notebook
    let notes = [];
    try {
      const storedNotes = localStorage.getItem(`student_notes_${tenantId}_${studentId}`);
      if (storedNotes) {
        notes = JSON.parse(storedNotes);
      } else {
        const qNotes = query(collection(db, 'studentNotebooks'), where('studentId', '==', studentId));
        const snapNotes = await getDocs(qNotes);
        if (!snapNotes.empty) {
          notes = snapNotes.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (isDefault) {
          notes = DEFAULT_NOTES;
        }
      }
    } catch (e) {
      console.warn('Error fetching notebook notes:', e.message);
      notes = isDefault ? DEFAULT_NOTES : [];
    }

    // 2. Study Vault
    let vault = [];
    try {
      const storedVault = localStorage.getItem(`study_materials_${tenantId}`);
      if (storedVault) {
        vault = JSON.parse(storedVault);
      } else {
        const qVault = query(collection(db, 'studyVault'), where('tenantId', '==', tenantId));
        const snapVault = await getDocs(qVault);
        if (!snapVault.empty) {
          vault = snapVault.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (isDefault) {
          vault = DEFAULT_STUDY_VAULT;
        }
      }
    } catch (e) {
      console.warn('Error fetching study vault:', e.message);
      vault = isDefault ? DEFAULT_STUDY_VAULT : [];
    }

    // 3. Submissions
    let homeworkSubmissions = [];
    try {
      const storedSubs = localStorage.getItem(`submissions_${tenantId}`);
      if (storedSubs) {
        homeworkSubmissions = JSON.parse(storedSubs).filter(s => s.studentId === studentId);
      } else {
        const qSub = query(collection(db, 'submissions'), where('studentId', '==', studentId));
        const snapSub = await getDocs(qSub);
        if (!snapSub.empty) {
          homeworkSubmissions = snapSub.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }
    } catch (e) {
      console.warn('Error fetching submissions:', e.message);
    }

    // 4. Homework list from teacher assignments
    let hwList = [];
    try {
      const storedHw = localStorage.getItem(`homework_list_${tenantId}`);
      if (storedHw) {
        hwList = JSON.parse(storedHw);
      } else if (isDefault) {
        hwList = DEFAULT_HOMEWORK;
      }
    } catch (e) {
      hwList = isDefault ? DEFAULT_HOMEWORK : [];
    }

    // 5. Messages
    let chatMsgs = [];
    try {
      const storedMsgs = localStorage.getItem(`messages_${tenantId}_${studentId}`);
      if (storedMsgs) {
        chatMsgs = JSON.parse(storedMsgs);
      } else {
        const qMsg = query(collection(db, 'messages'), where('studentId', '==', studentId));
        const snapMsg = await getDocs(qMsg);
        if (!snapMsg.empty) {
          chatMsgs = snapMsg.docs.map(d => ({ id: d.id, ...d.data() }));
        } else if (isDefault) {
          chatMsgs = DEFAULT_MESSAGES;
        }
      }
    } catch (e) {
      console.warn('Error fetching messages:', e.message);
      chatMsgs = isDefault ? DEFAULT_MESSAGES : [];
    }

    // 6. Attendance Logs — authoritative source: Firestore `attendance` collection.
    // Identity resolves dynamically: authenticated uid/email -> tenant student record -> rollNo.
    let attLogs = [];
    try {
      let rollNo = '';
      let resolvedClass = studentClass;

      try {
        const ownRecord = await getDoc(doc(db, 'students', studentId));
        if (ownRecord.exists()) {
          const s = ownRecord.data();
          if (!s.tenantId || s.tenantId === tenantId) {
            rollNo = s.rollNo || s.admissionNo || '';
            resolvedClass = s.class || s.className || resolvedClass;
          }
        }
      } catch (e) {
        console.warn('Student record lookup by uid failed:', e.message);
      }

      if (!rollNo) {
        const qStudents = query(collection(db, 'students'), where('tenantId', '==', tenantId));
        const studentsSnap = await getDocs(qStudents);
        const match = studentsSnap.docs.find(d => {
          const s = d.data();
          const recordEmail = String(s.email || '').trim().toLowerCase();
          return d.id === studentId
            || s.uid === studentId
            || (!!userEmail && recordEmail === userEmail);
        });
        if (match) {
          const s = match.data();
          rollNo = s.rollNo || s.admissionNo || '';
          resolvedClass = s.class || s.className || resolvedClass;
        }
      }

      const targetKey = normalizeClassKey(resolvedClass) || normalizeClassKey(studentClass);
      const wantedRoll = normalizeRollNo(rollNo);

      // Firestore: tenant-wide query, then normalized class + rollNo match (no composite index needed).
      try {
        const qAtt = query(collection(db, 'attendance'), where('tenantId', '==', tenantId));
        const attSnap = await getDocs(qAtt);
        const classDocs = attSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(d => normalizeClassKey(d.classId || d.classKey) === targetKey)
          .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

        for (const attDoc of classDocs) {
          const rec = (attDoc.records || []).find(r =>
            (!!wantedRoll && normalizeRollNo(r.rollNo) === wantedRoll)
            || r.studentId === studentId
            || r.id === studentId
          );
          if (!rec || !rec.status) continue;
          attLogs.push({
            id: attDoc.id,
            date: attDoc.date || '',
            status: rec.status,
            checkIn: rec.checkIn || '-',
            remarks: rec.remarks || '-',
          });
        }
      } catch (e) {
        console.warn('Firestore attendance query failed:', e.message);
      }

      // Local fallback (same schema, written by teacherService) when Firestore has nothing yet.
      if (attLogs.length === 0) {
        const candidateKeys = [...new Set(
          [resolvedClass, studentClass,
            String(resolvedClass || '').replace(/^class\s+/i, ''),
            String(studentClass || '').replace(/^class\s+/i, '')]
            .filter(Boolean)
        )];
        const seenDates = new Set();
        for (const key of candidateKeys) {
          const local = JSON.parse(localStorage.getItem(`attendance_${tenantId}_${key}`) || '[]');
          for (const att of local) {
            if (!att || !att.date || seenDates.has(att.date)) continue;
            const rec = (att.records || []).find(r =>
              (!!wantedRoll && normalizeRollNo(r.rollNo) === wantedRoll)
              || r.studentId === studentId
              || r.id === studentId
            );
            if (!rec || !rec.status) continue;
            seenDates.add(att.date);
            attLogs.push({
              id: `${att.date}`,
              date: att.date,
              status: rec.status,
              checkIn: rec.checkIn || '-',
              remarks: rec.remarks || '-',
            });
          }
        }
        attLogs.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      }
    } catch (e) {
      console.warn('Error fetching attendance logs:', e.message);
      attLogs = [];
    }

    // 7. Results & Marks
    let results = [];
    try {
      const storedMarks = localStorage.getItem(`student_marks_${tenantId}`);
      if (storedMarks) {
        const allMarks = JSON.parse(storedMarks);
        const myMarks = allMarks.filter(m => m.studentId === studentId || m.rollNo === 'GV-2026-001');
        if (myMarks.length > 0) {
          results = myMarks.map((m, idx) => ({
            id: idx + 1,
            subject: m.subject || 'Subject',
            marks: Number(m.marks || 0),
            max: Number(m.maxMarks || 100),
            grade: m.grade || 'A',
            remarks: m.remarks || 'Good performance',
          }));
        }
      }
      if (results.length === 0 && isDefault) {
        results = DEFAULT_RESULTS;
      }
    } catch (e) {
      results = isDefault ? DEFAULT_RESULTS : [];
    }

    // 8. Timetable
    let timetable = [];
    try {
      const storedTt = localStorage.getItem(`timetable_${tenantId}`);
      if (storedTt) {
        timetable = JSON.parse(storedTt);
      } else if (isDefault) {
        timetable = DEFAULT_TIMETABLE;
      }
    } catch (e) {
      timetable = isDefault ? DEFAULT_TIMETABLE : [];
    }

    // 9. Exams
    let exams = [];
    try {
      const storedExams = localStorage.getItem(`exams_${tenantId}`);
      if (storedExams) {
        exams = JSON.parse(storedExams);
      } else if (isDefault) {
        exams = DEFAULT_EXAMS;
      }
    } catch (e) {
      exams = isDefault ? DEFAULT_EXAMS : [];
    }

    
    // 10. Fees — load authoritative fee records from Firestore
      let fees = [];

      try {
        const feesQuery = query(
          collection(db, 'fees'),
          where('tenantId', '==', tenantId)
        );

        const feesSnapshot = await getDocs(feesQuery);

        const matchingFees = feesSnapshot.docs
          .map((feeDoc) => ({
            id: feeDoc.id,
            ...feeDoc.data(),
          }))
          .filter((fee) => {
            return (
              fee.rollNo === 'GV-2026-001' ||
              fee.studentId === studentId
            );
          });

        fees = matchingFees.map((fee) => ({
          id: fee.id,
          name: fee.feeHead || 'Tuition & Exam Fee',
          dueDate: fee.dueDate || '25 August 2026',
          amount: Number(
            fee.totalDue ?? fee.amount ?? 0
          ),
          status: fee.status || 'Pending',
          breakdown: fee.breakdown || 'Tuition & Laboratory fee',
          paidOn: fee.date,
          receiptNo: fee.txnId || fee.receiptNo,
        }));

        // Keep the old demo fallback only if Firestore has no matching fee.
        if (fees.length === 0 && isDefault) {
          fees = DEFAULT_FEES;
        }
      } catch (e) {
        console.warn('Firestore fees fetch failed:', e.message);
        fees = isDefault ? DEFAULT_FEES : [];
      }

    return {
      profile: null,
      timetable,
      exams,
      homework: hwList.map(hw => {
        const sub = homeworkSubmissions.find(s => s.homeworkId === hw.id);
        return sub ? { ...hw, status: 'Submitted', submittedAt: sub.submittedAt, notes: sub.notes, fileName: sub.fileName } : hw;
      }),
      studyVault: vault,
      notes,
      fees,
      messages: chatMsgs,
      results,
      attendance: attLogs,
    };
  } catch (err) {
    console.warn('Firestore fetchStudentPortalData fallback:', err.message);
    return {
      profile: null,
      timetable: isDefault ? DEFAULT_TIMETABLE : [],
      exams: isDefault ? DEFAULT_EXAMS : [],
      homework: isDefault ? DEFAULT_HOMEWORK : [],
      studyVault: isDefault ? DEFAULT_STUDY_VAULT : [],
      notes: isDefault ? DEFAULT_NOTES : [],
      fees: isDefault ? DEFAULT_FEES : [],
      messages: isDefault ? DEFAULT_MESSAGES : [],
      results: isDefault ? DEFAULT_RESULTS : [],
      attendance: [],
    };
  }
};

// 1b. Fetch the authenticated student's SIS record from Firestore `students`.
// Matched by tenant + student email (or doc id == uid). Returns null when the
// tenant has no record for this identity — callers must render neutral
// placeholders instead of fabricating values.
export const fetchStudentRecord = async (tenantId = 'tenant_gvis', { uid = '', email = '' } = {}) => {
  try {
    const snap = await getDocs(query(collection(db, 'students'), where('tenantId', '==', tenantId)));
    const cleanEmail = String(email || '').trim().toLowerCase();
    const match = snap.docs.find(d => {
      const s = d.data() || {};
      return (cleanEmail && String(s.email || '').trim().toLowerCase() === cleanEmail) || (uid && d.id === uid);
    });
    return match ? { id: match.id, ...match.data() } : null;
  } catch (err) {
    console.warn('Firestore fetchStudentRecord fallback:', err.message);
    return null;
  }
};

// 1c. Persist the student's editable profile fields to authoritative records:
// - Firestore `students` doc (matched by tenant + email/uid) — only fields that
//   exist in the admitStudent schema: name, parentName, parentPhone, address.
// - Firestore `users/{uid}` name when it changed and the doc exists.
// Fields absent from the Firestore students schema (e.g. bloodGroup) are NOT
// invented here — they are persisted in the local roster store by the caller.
export const updateStudentProfile = async ({ tenantId = 'tenant_gvis', uid = '', email = '', updates = {} }) => {
  const result = { studentDocUpdated: false, userDocUpdated: false };
  const schemaFields = ['name', 'parentName', 'parentPhone', 'address'];

  try {
    const snap = await getDocs(query(collection(db, 'students'), where('tenantId', '==', tenantId)));
    const cleanEmail = String(email || '').trim().toLowerCase();
    const match = snap.docs.find(d => {
      const s = d.data() || {};
      return (cleanEmail && String(s.email || '').trim().toLowerCase() === cleanEmail) || (uid && d.id === uid);
    });
    if (match) {
      const payload = {};
      schemaFields.forEach((field) => {
        if (typeof updates[field] === 'string') payload[field] = updates[field];
      });
      if (Object.keys(payload).length > 0) {
        payload.updatedAt = serverTimestamp();
        await updateDoc(doc(db, 'students', match.id), payload);
        result.studentDocUpdated = true;
      }
    }
  } catch (err) {
    console.warn('Firestore updateStudentProfile (students):', err.message);
  }

  if (uid && typeof updates.name === 'string' && updates.name.trim()) {
    try {
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists() && String(userSnap.data().name || '').trim() !== updates.name.trim()) {
        await updateDoc(doc(db, 'users', uid), { name: updates.name });
        result.userDocUpdated = true;
      }
    } catch (err) {
      console.warn('Firestore updateStudentProfile (users):', err.message);
    }
  }

  return result;
};

// 5b. Load the quiz questions available to a student from the tenant's
// Firestore `questionBank`, together with the student's own latest attempt.
//
// SECURITY: correct answers (correctIndex) and explanations are split out of
// the returned question list so the Student Portal render state never holds
// them before submission. Callers must keep `answerKey` out of React state.
// Only MCQ-capable questions (options + valid correctIndex) are returned;
// text-only questions are excluded from the online quiz.
export const fetchStudentQuizData = async (tenantId = 'tenant_gvis', studentId = '') => {
  const result = { questions: [], answerKey: {}, latestAttempt: null };

  try {
    const snap = await getDocs(query(collection(db, 'questionBank'), where('tenantId', '==', tenantId)));
    const mcq = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(q => Array.isArray(q.options) && q.options.length >= 2
        && typeof q.correctIndex === 'number'
        && q.correctIndex >= 0
        && q.correctIndex < q.options.length);

    const answerKey = {};
    mcq.forEach(q => {
      answerKey[q.id] = { correctIndex: q.correctIndex, explanation: q.explanation || '' };
    });
    result.answerKey = answerKey;
    // Strip correct answers/explanations out of the student-facing question list.
    result.questions = mcq.map(({ correctIndex: _correctIndex, explanation: _explanation, ...safeQuestion }) => safeQuestion);
  } catch (err) {
    console.warn('Firestore fetchStudentQuizData (questions):', err.message);
  }

  if (studentId) {
    try {
      // Single-field query on studentId (no composite index required);
      // tenant isolation is enforced by filtering on the fetched documents.
      const snap = await getDocs(query(collection(db, 'quizResults'), where('studentId', '==', studentId)));
      const attempts = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.tenantId === tenantId);
      attempts.sort((a, b) => {
        const timeOf = (attempt) => {
          if (!attempt.submittedAt) return 0;
          if (typeof attempt.submittedAt.toMillis === 'function') return attempt.submittedAt.toMillis();
          return 0;
        };
        return timeOf(b) - timeOf(a);
      });
      result.latestAttempt = attempts[0] || null;
    } catch (err) {
      console.warn('Firestore fetchStudentQuizData (attempts):', err.message);
    }
  }

  return result;
};

// 2. Submit Homework File / Text
export const submitHomeworkFile = async (submissionData) => {
  const tenantId = submissionData.tenantId || 'tenant_gvis';
  try {
    const subRef = collection(db, 'submissions');
    const payload = {
      ...submissionData,
      status: 'Submitted',
      submittedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(subRef, payload);

    // Save to local storage for instant sync with teacher view
    try {
      const stored = JSON.parse(localStorage.getItem(`submissions_${tenantId}`) || '[]');
      stored.unshift({ id: docRef.id, ...payload });
      localStorage.setItem(`submissions_${tenantId}`, JSON.stringify(stored));
    } catch {}

    await logAuditEvent({
      action: 'SUBMIT_HOMEWORK',
      actor: submissionData.studentName || 'Student',
      target: submissionData.homeworkTitle,
      details: `Submitted assignment for ${submissionData.homeworkTitle}`,
      tenantId,
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore submitHomeworkFile fallback:', err.message);
    const fallbackPayload = {
      id: 'sub_' + Date.now(),
      ...submissionData,
      status: 'Submitted',
      submittedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    try {
      const stored = JSON.parse(localStorage.getItem(`submissions_${tenantId}`) || '[]');
      stored.unshift(fallbackPayload);
      localStorage.setItem(`submissions_${tenantId}`, JSON.stringify(stored));
    } catch {}
    return fallbackPayload;
  }
};

// 3. Save Digital Notebook Note
export const saveStudentNotebookNote = async (noteData) => {
  const tenantId = noteData.tenantId || 'tenant_gvis';
  const studentId = noteData.studentId || 'std_101';
  try {
    const noteRef = collection(db, 'studentNotebooks');
    const payload = {
      ...noteData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(noteRef, payload);
    const savedObj = { id: docRef.id, ...noteData };

    try {
      const stored = JSON.parse(localStorage.getItem(`student_notes_${tenantId}_${studentId}`) || '[]');
      stored.unshift(savedObj);
      localStorage.setItem(`student_notes_${tenantId}_${studentId}`, JSON.stringify(stored));
    } catch {}

    return savedObj;
  } catch (err) {
    console.warn('Firestore saveStudentNotebookNote fallback:', err.message);
    const fallbackObj = { id: 'note_' + Date.now(), ...noteData };
    try {
      const stored = JSON.parse(localStorage.getItem(`student_notes_${tenantId}_${studentId}`) || '[]');
      stored.unshift(fallbackObj);
      localStorage.setItem(`student_notes_${tenantId}_${studentId}`, JSON.stringify(stored));
    } catch {}
    return fallbackObj;
  }
};

// 4. Delete Notebook Note
export const deleteStudentNotebookNote = async (noteId, tenantId = 'tenant_gvis', studentId = 'std_101') => {
  try {
    const noteRef = doc(db, 'studentNotebooks', noteId);
    await deleteDoc(noteRef);
  } catch (e) {
    console.warn('Firestore delete note error:', e.message);
  }
  try {
    const stored = JSON.parse(localStorage.getItem(`student_notes_${tenantId}_${studentId}`) || '[]');
    const updated = stored.filter(n => n.id !== noteId);
    localStorage.setItem(`student_notes_${tenantId}_${studentId}`, JSON.stringify(updated));
  } catch {}
  return true;
};

// 5. Submit Online Exam Quiz
export const submitOnlineQuiz = async (quizData) => {
  const tenantId = quizData.tenantId || 'tenant_gvis';
  try {
    const quizRef = collection(db, 'quizResults');
    const payload = {
      ...quizData,
      submittedAt: serverTimestamp(),
    };
    const docRef = await addDoc(quizRef, payload);
    await logAuditEvent({
      action: 'SUBMIT_QUIZ',
      actor: quizData.studentName || 'Student',
      target: quizData.quizTitle || 'Online Quiz',
      details: `Completed quiz with score ${quizData.score}/${quizData.totalQuestions}`,
      tenantId,
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore submitOnlineQuiz fallback:', err.message);
    return { id: 'quiz_' + Date.now(), ...quizData };
  }
};

// 6. Send Message to Teacher
export const sendTeacherMessage = async (msgData) => {
  const tenantId = msgData.tenantId || 'tenant_gvis';
  const studentId = msgData.studentId || 'std_101';
  try {
    const msgRef = collection(db, 'messages');
    const payload = {
      ...msgData,
      senderRole: msgData.senderRole || 'student',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(msgRef, payload);
    const savedMsg = { id: docRef.id, ...msgData };

    try {
      const stored = JSON.parse(localStorage.getItem(`messages_${tenantId}_${studentId}`) || '[]');
      stored.push(savedMsg);
      localStorage.setItem(`messages_${tenantId}_${studentId}`, JSON.stringify(stored));
    } catch {}

    return savedMsg;
  } catch (err) {
    console.warn('Firestore sendTeacherMessage fallback:', err.message);
    const fallbackMsg = { id: 'msg_' + Date.now(), ...msgData };
    try {
      const stored = JSON.parse(localStorage.getItem(`messages_${tenantId}_${studentId}`) || '[]');
      stored.push(fallbackMsg);
      localStorage.setItem(`messages_${tenantId}_${studentId}`, JSON.stringify(stored));
    } catch {}
    return fallbackMsg;
  }
};
