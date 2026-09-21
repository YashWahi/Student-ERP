// src/services/studentService.js
import { db } from '../config/firebase';
import { collection, addDoc, doc, deleteDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';

// Default Initial Data Seeds
export const DEFAULT_STUDENT_PROFILE = {
  name: 'Arjun Verma',
  rollNo: 'GV-2026-001',
  class: 'Class 10-A',
  school: 'Green Valley International School',
  parentName: 'Mr. Suresh Verma',
  parentPhone: '+91 98765 43212',
  parentEmail: 'parent@test.com',
  bloodGroup: 'B+',
  dob: '2011-05-14',
  address: 'H-142, Sector 62, Noida, Uttar Pradesh',
  emergencyContact: '+91 98765 43210',
};

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

export const DEFAULT_ATTENDANCE_LOGS = [
  { id: 1, date: '13 Aug 2026', status: 'Present', checkIn: '08:45 AM', remarks: 'On Time' },
  { id: 2, date: '12 Aug 2026', status: 'Present', checkIn: '08:50 AM', remarks: 'On Time' },
  { id: 3, date: '11 Aug 2026', status: 'Present', checkIn: '08:42 AM', remarks: 'On Time' },
  { id: 4, date: '10 Aug 2026', status: 'Absent', checkIn: '-', remarks: 'Approved Medical Leave' },
  { id: 5, date: '09 Aug 2026', status: 'Present', checkIn: '08:48 AM', remarks: 'On Time' },
];

// 1. Fetch Complete Student Portal Data from Firestore / Local Scoped Storage
export const fetchStudentPortalData = async (studentId = 'student_001', tenantId = 'tenant_gvis', studentClass = 'Class 10-A') => {
  const isDefault = tenantId === 'tenant_gvis';

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

    // 6. Attendance Logs
    let attLogs = [];
    try {
      const cleanClass = studentClass.replace('Class ', '');
      const classAtt = JSON.parse(localStorage.getItem(`attendance_${tenantId}_${cleanClass}`) || localStorage.getItem(`attendance_${tenantId}_${studentClass}`) || '[]');
      if (classAtt && classAtt.length > 0) {
        attLogs = classAtt.map((att, idx) => {
          const rec = (att.records || []).find(r => r.studentId === studentId || r.rollNo === 'GV-2026-001') || { status: 'Present' };
          return {
            id: idx + 1,
            date: att.date || 'Today',
            status: rec.status || 'Present',
            checkIn: rec.status === 'Present' ? '08:45 AM' : '-',
            remarks: rec.status === 'Present' ? 'On Time' : 'Absence Logged',
          };
        });
      }
      if (attLogs.length === 0 && isDefault) {
        attLogs = DEFAULT_ATTENDANCE_LOGS;
      }
    } catch (e) {
      attLogs = isDefault ? DEFAULT_ATTENDANCE_LOGS : [];
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

    // 10. Fees
    let fees = [];
    try {
      const storedFees = localStorage.getItem(`collections_${tenantId}`);
      if (storedFees) {
        const myFees = JSON.parse(storedFees).filter(f => f.studentId === studentId || f.rollNo === 'GV-2026-001');
        if (myFees.length > 0) {
          fees = myFees.map((f, idx) => ({
            id: f.id || `fee_${idx}`,
            name: f.feeHead || 'Tuition & Exam Fee',
            dueDate: f.dueDate || '25 August 2026',
            amount: Number(f.totalDue || f.amount || 18500),
            status: f.status || 'Pending',
            breakdown: f.breakdown || 'Tuition & Laboratory fee',
            paidOn: f.date,
            receiptNo: f.txnId || f.receiptNo,
          }));
        }
      }
      if (fees.length === 0 && isDefault) {
        fees = DEFAULT_FEES;
      }
    } catch (e) {
      fees = isDefault ? DEFAULT_FEES : [];
    }

    return {
      profile: DEFAULT_STUDENT_PROFILE,
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
      profile: DEFAULT_STUDENT_PROFILE,
      timetable: isDefault ? DEFAULT_TIMETABLE : [],
      exams: isDefault ? DEFAULT_EXAMS : [],
      homework: isDefault ? DEFAULT_HOMEWORK : [],
      studyVault: isDefault ? DEFAULT_STUDY_VAULT : [],
      notes: isDefault ? DEFAULT_NOTES : [],
      fees: isDefault ? DEFAULT_FEES : [],
      messages: isDefault ? DEFAULT_MESSAGES : [],
      results: isDefault ? DEFAULT_RESULTS : [],
      attendance: isDefault ? DEFAULT_ATTENDANCE_LOGS : [],
    };
  }
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
