// src/services/academicService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createUserAccount } from './authService';
import { logAuditEvent } from './auditService';

/* ─── CLASSES & SECTIONS ─── */
export const createClass = async ({ tenantId, branchId, name, section, classTeacherId, subjectIds = [] }) => {
  const ref = await addDoc(collection(db, 'classes'), {
    tenantId,
    branchId,
    name,
    section,
    classTeacherId: classTeacherId || null,
    subjectIds,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getClassesByBranch = async (tenantId, branchId) => {
  const q = query(
    collection(db, 'classes'),
    where('tenantId', '==', tenantId),
    where('branchId', '==', branchId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* ─── SUBJECTS ─── */
export const createSubject = async ({ tenantId, branchId, classId, name, code, teacherId, maxMarks = 100 }) => {
  const ref = await addDoc(collection(db, 'subjects'), {
    tenantId,
    branchId,
    classId,
    name,
 code,
    teacherId: teacherId || null,
    maxMarks,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const getSubjectsByClass = async (tenantId, classId) => {
  const q = query(
    collection(db, 'subjects'),
    where('tenantId', '==', tenantId),
    where('classId', '==', classId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* ─── TEACHERS ─── */
export const createTeacher = async ({ tenantId, branchId, name, email, phone, password, subject, qualification }) => {
  const { user, profile } = await createUserAccount({
    email,
    password,
    name,
    role: 'teacher',
    tenantId,
    branchId,
    phone,
    subject,
    qualification,
  });

  return { uid: user.uid, profile };
};

export const getTeachersByBranch = async (tenantId, branchId) => {
  const q = query(
    collection(db, 'users'),
    where('tenantId', '==', tenantId),
    where('branchId', '==', branchId),
    where('role', '==', 'teacher')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/* ─── STUDENTS ─── */
export const admitStudent = async ({
  tenantId,
  branchId,
  classId,
  name,
  email,
  phone,
  rollNo,
  admissionNo,
  dob,
  gender,
  parentName,
  parentEmail,
  parentPhone,
  address,
}) => {
  let parentUid = null;
  if (parentEmail) {
    try {
      const parentAcc = await createUserAccount({
        email: parentEmail,
        name: parentName || 'Parent',
        role: 'parent',
        tenantId,
        branchId,
        phone: parentPhone,
      });
      parentUid = parentAcc.user.uid;
    } catch (error) {
      if (error.code !== 'functions/already-exists') {
        throw error;
      }
      console.warn('Parent account already exists and was not linked automatically.');
    }
  }

  const studentAcc = await createUserAccount({
    email: email || `student_${Date.now()}@eduerp.com`,
    name,
    role: 'student',
    tenantId,
    branchId,
    phone,
  });

  const studentData = {
    tenantId,
    branchId,
    classId,
    name,
    email: studentAcc.profile.email,
    phone,
    rollNo,
    admissionNo: admissionNo || `ADM-${Date.now().toString().slice(-6)}`,
    dob: dob || '',
    gender: gender || 'Other',
    parentId: parentUid,
    parentName,
    parentPhone,
    address,
    isActive: true,
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(db, 'students'), studentData);
  if (parentUid) {
    await updateDoc(doc(db, 'users', parentUid), {
      childId: studentAcc.user.uid,
    });
  }

  return studentAcc.user.uid;
};

export const getStudentsByBranch = async (tenantId, branchId) => {
  const q = query(
    collection(db, 'users'),
    where('tenantId', '==', tenantId),
    where('branchId', '==', branchId),
    where('role', '==', 'student')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getExams = async (tenantId = 'tenant_gvis') => {
  try {
    const q = query(collection(db, 'exams'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('Firestore getExams fallback:', err.message);
  }
  return null;
};

export const createExamTerm = async (examData) => {
  try {
    const payload = {
      ...examData,
      tenantId: examData.tenantId || 'tenant_gvis',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'exams'), payload);
    await logAuditEvent({
      action: 'SCHEDULE_EXAM',
      actor: 'Admin',
      target: examData.name,
      details: `Scheduled exam ${examData.name} for ${examData.class}`,
      tenantId: examData.tenantId || 'tenant_gvis',
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore createExamTerm fallback:', err.message);
    return { id: `ex_${Date.now()}`, ...examData };
  }
};

export const getQuestions = async (tenantId = 'tenant_gvis') => {
  try {
    const q = query(collection(db, 'questionBank'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('Firestore getQuestions fallback:', err.message);
  }
  return null;
};

export const addQuestionToBank = async (qData) => {
  try {
    const payload = {
      ...qData,
      tenantId: qData.tenantId || 'tenant_gvis',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'questionBank'), payload);
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore addQuestionToBank fallback:', err.message);
    return { id: `q_${Date.now()}`, ...qData };
  }
};

/* ─── RESULT LOCKING & SECURITY ─── */
export const lockExamResult = async (examId, examName, tenantId = 'tenant_gvis') => {
  try {
    const examRef = doc(db, 'exams', examId);
    await updateDoc(examRef, {
      isLocked: true,
      lockedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore lockExamResult fallback:', err.message);
  }
  await logAuditEvent({
    action: 'LOCK_RESULT',
    actor: 'Admin',
    target: examName,
    details: `Locked examination results for ${examName}. Modifications disabled.`,
    tenantId,
  });
};

export const saveStudentMarksTransaction = async (examId, studentMarks, userRole) => {
  try {
    const examRef = doc(db, 'exams', examId);

    await runTransaction(db, async (transaction) => {
      const examSnap = await transaction.get(examRef);
      if (examSnap.exists() && examSnap.data().isLocked && userRole !== 'superadmin') {
        throw new Error('SECURITY VIOLATION: Results for this term are locked. Only SuperAdmin can modify locked results.');
      }

      transaction.set(doc(db, 'grades', `grade_${examId}_${studentMarks.studentName || studentMarks.studentId}`), {
        ...studentMarks,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
  } catch (err) {
    console.warn('Firestore saveStudentMarksTransaction fallback:', err.message);
  }
};
