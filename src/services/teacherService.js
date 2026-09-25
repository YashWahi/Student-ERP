// src/services/teacherService.js
import { db } from '../config/firebase.js';
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService.js';

// Helper for safe query with fallback
const safeQuery = async (promise, timeoutMs = 800) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore query timeout')), timeoutMs))
  ]).catch(() => null);
};

// Normalizes class identifiers so "Class 10-A" and "10-A" map to the same document.
export const normalizeClassKey = (value) =>
  String(value || '').replace(/^class\s+/i, '').trim().replace(/\s+/g, '-').toLowerCase();

// 1. Attendance Logger & Fetcher
export const markClassAttendance = async (attendanceData) => {
  const { tenantId = 'tenant_gvis', branchId = 'branch_main', classId, date, teacherId, records } = attendanceData;
  const classKey = normalizeClassKey(classId);
  // Deterministic doc id guarantees a single document per tenant + class + date,
  // regardless of whether the teacher UI passed "Class 10-A" or "10-A".
  const docId = `att_${tenantId}_${classKey}_${date}`;

  const payload = {
    tenantId,
    branchId,
    classId,
    classKey,
    date,
    teacherId,
    records,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`attendance_${tenantId}_${classId}`) || '[]');
    const filtered = existing.filter(a => a.date !== date);
    filtered.unshift(payload);
    localStorage.setItem(`attendance_${tenantId}_${classId}`, JSON.stringify(filtered));

    const cleanClass = classId.replace('Class ', '').trim();
    const existingClean = JSON.parse(localStorage.getItem(`attendance_${tenantId}_${cleanClass}`) || '[]');
    const filteredClean = existingClean.filter(a => a.date !== date);
    filteredClean.unshift(payload);
    localStorage.setItem(`attendance_${tenantId}_${cleanClass}`, JSON.stringify(filteredClean));
  } catch (e) {
    console.warn('LocalStorage attendance save error:', e);
  }

  try {
    const attRef = doc(db, 'attendance', docId);
    setDoc(attRef, payload, { merge: true }).catch(e => console.warn('Firestore setDoc attendance non-blocking:', e.message));
  } catch (err) {
    console.warn('Firestore markClassAttendance fallback:', err.message);
  }

  await logAuditEvent({
    action: 'MARK_ATTENDANCE',
    actor: 'Teacher',
    target: `${classId}`,
    details: `Marked attendance for ${records.length} students on ${date}`,
    tenantId,
  });
};

export const fetchClassAttendance = async ({ tenantId = 'tenant_gvis', classId, date }) => {
  const classKey = normalizeClassKey(classId);
  const candidateIds = [
    `att_${tenantId}_${classKey}_${date}`,
    `att_${tenantId}_${classId}_${date}`, // legacy documents written before class normalization
  ];

  for (const docId of candidateIds) {
    try {
      const attRef = doc(db, 'attendance', docId);
      const snap = await getDoc(attRef);
      if (snap.exists()) {
        return snap.data();
      }
    } catch (err) {
      console.warn('Firestore fetchClassAttendance fallback:', err.message);
    }
  }

  // Query fallback for documents persisted under a different class spelling.
  try {
    const qAtt = query(collection(db, 'attendance'), where('tenantId', '==', tenantId));
    const snap = await getDocs(qAtt);
    const matched = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .find(d => d.date === date && normalizeClassKey(d.classId || d.classKey) === classKey);
    if (matched) return matched;
  } catch {}

  const localKeys = [...new Set([
    classId,
    String(classId || '').replace(/^class\s+/i, '').trim(),
  ].filter(Boolean))];
  for (const key of localKeys) {
    try {
      const local = JSON.parse(localStorage.getItem(`attendance_${tenantId}_${key}`) || '[]');
      const found = local.find(a => a.date === date);
      if (found) return found;
    } catch {}
  }

  return null;
};

// 2. Attendance Correction Request
export const submitAttendanceCorrection = async (correctionData) => {
  const tenantId = correctionData.tenantId || 'tenant_gvis';
  const payload = {
    ...correctionData,
    status: 'Pending Admin Review',
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`attendance_corrections_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`attendance_corrections_${tenantId}`, JSON.stringify(existing));
  } catch {}

  try {
    const corrRef = collection(db, 'attendanceCorrections');
    addDoc(corrRef, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  } catch {}

  await logAuditEvent({
    action: 'REQUEST_ATTENDANCE_CORRECTION',
    actor: correctionData.teacherName || 'Teacher',
    target: `Student ${correctionData.studentName} (${correctionData.rollNo})`,
    details: `Requested correction from ${correctionData.oldStatus} to ${correctionData.newStatus}. Reason: ${correctionData.reason}`,
    tenantId,
  });

  return payload;
};

// 3. Homework & Assignment Creator & Fetcher
export const createHomework = async (homeworkData) => {
  const hwId = `hw_${Date.now()}`;
  const tenantId = homeworkData.tenantId || 'tenant_gvis';
  const payload = {
    id: hwId,
    ...homeworkData,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`homework_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`homework_${tenantId}`, JSON.stringify(existing));

    const hwListKey = `homework_list_${tenantId}`;
    const existingList = JSON.parse(localStorage.getItem(hwListKey) || '[]');
    existingList.unshift(payload);
    localStorage.setItem(hwListKey, JSON.stringify(existingList));
  } catch (e) {
    console.warn('LocalStorage homework save error:', e);
  }

  try {
    const hwRef = collection(db, 'homework');
    addDoc(hwRef, { ...payload, timestamp: serverTimestamp() }).catch(e => console.warn('Firestore addDoc hw non-blocking:', e.message));
  } catch (err) {
    console.warn('Firestore createHomework fallback:', err.message);
  }

  await logAuditEvent({
    action: 'CREATE_HOMEWORK',
    actor: homeworkData.teacherName || 'Teacher',
    target: homeworkData.title,
    details: `Assigned homework for ${homeworkData.classId || homeworkData.class}. Due: ${homeworkData.dueDate}`,
    tenantId,
  });

  return hwId;
};

export const fetchHomeworkList = async ({ tenantId = 'tenant_gvis', classId }) => {
  let firestoreList = [];
  try {
    const hwRef = collection(db, 'homework');
    let q = query(hwRef);
    if (tenantId) {
      q = query(hwRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot) {
      firestoreList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore fetchHomeworkList fallback:', err.message);
  }

  const localList = JSON.parse(localStorage.getItem(`homework_${tenantId}`) || localStorage.getItem(`homework_list_${tenantId}`) || '[]');
  const results = [...firestoreList, ...localList];
  if (classId) {
    return results.filter(item => !item.classId || item.classId === classId || item.class === classId);
  }
  return results;
};

// 4. Grading & Marks Entry & Fetcher
export const enterStudentMarks = async (marksData) => {
  const gradeId = `grade_${Date.now()}_${marksData.studentId || marksData.rollNo || ''}`;
  const tenantId = marksData.tenantId || 'tenant_gvis';
  const payload = {
    id: gradeId,
    ...marksData,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`grades_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`grades_${tenantId}`, JSON.stringify(existing));

    const marksKey = `student_marks_${tenantId}`;
    const existingMarks = JSON.parse(localStorage.getItem(marksKey) || '[]');
    const filteredMarks = existingMarks.filter(m => !(m.rollNo === marksData.rollNo && m.assignmentTitle === marksData.assignmentTitle));
    filteredMarks.unshift(payload);
    localStorage.setItem(marksKey, JSON.stringify(filteredMarks));
  } catch (e) {
    console.warn('LocalStorage grades save error:', e);
  }

  try {
    const marksRef = collection(db, 'grades');
    addDoc(marksRef, { ...payload, timestamp: serverTimestamp() }).catch(e => console.warn('Firestore addDoc grade non-blocking:', e.message));
  } catch (err) {
    console.warn('Firestore enterStudentMarks fallback:', err.message);
  }

  await logAuditEvent({
    action: 'RECORD_STUDENT_MARKS',
    actor: 'Teacher',
    target: marksData.studentName || marksData.studentId,
    details: `Entered marks ${marksData.marks}/100 (${marksData.grade}) for ${marksData.assignmentTitle}`,
    tenantId,
  });

  return gradeId;
};

export const fetchStudentMarks = async ({ tenantId = 'tenant_gvis', classId }) => {
  try {
    const marksRef = collection(db, 'grades');
    let q = query(marksRef);
    if (tenantId) {
      q = query(marksRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (classId) {
        return results.filter(item => !item.classId || item.classId === classId || item.class === classId);
      }
      return results;
    }
  } catch (err) {
    console.warn('Firestore fetchStudentMarks fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`grades_${tenantId}`) || localStorage.getItem(`student_marks_${tenantId}`) || '[]');
    if (classId) {
      return local.filter(item => !item.classId || item.classId === classId || item.class === classId);
    }
    return local;
  } catch {}

  return [];
};

// 5. Study Material Publisher & Fetcher
export const publishStudyMaterial = async (materialData) => {
  const tenantId = materialData.tenantId || 'tenant_gvis';
  const matId = `mat_${Date.now()}`;
  const payload = {
    id: matId,
    ...materialData,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`study_materials_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`study_materials_${tenantId}`, JSON.stringify(existing));
  } catch {}

  try {
    const matRef = collection(db, 'studyMaterials');
    addDoc(matRef, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  } catch (err) {
    console.warn('Firestore publishStudyMaterial fallback:', err.message);
  }

  await logAuditEvent({
    action: 'PUBLISH_STUDY_MATERIAL',
    actor: 'Teacher',
    target: materialData.title,
    details: `Published ${materialData.type} for ${materialData.classId || 'All Classes'}`,
    tenantId,
  });

  return matId;
};

export const fetchStudyMaterials = async ({ tenantId = 'tenant_gvis', classId }) => {
  try {
    const matRef = collection(db, 'studyMaterials');
    let q = query(matRef);
    if (tenantId) {
      q = query(matRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (classId) {
        return results.filter(item => !item.classId || item.classId === classId || item.class === classId);
      }
      return results;
    }
  } catch (err) {
    console.warn('Firestore fetchStudyMaterials fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`study_materials_${tenantId}`) || '[]');
    if (classId) {
      return local.filter(item => !item.classId || item.classId === classId || item.class === classId);
    }
    return local;
  } catch {}

  return [];
};

// 6. Teaching Diary Logger & Lesson Planning
export const logTeachingDiaryEntry = async (diaryData) => {
  const tenantId = diaryData.tenantId || 'tenant_gvis';
  const diaryId = `diary_${Date.now()}`;
  const payload = {
    id: diaryId,
    ...diaryData,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`teaching_diary_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`teaching_diary_${tenantId}`, JSON.stringify(existing));
  } catch {}

  try {
    const diaryRef = collection(db, 'teachingDiary');
    addDoc(diaryRef, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  } catch (err) {
    console.warn('Firestore logTeachingDiaryEntry fallback:', err.message);
  }

  return diaryId;
};

export const fetchTeachingDiaryEntries = async ({ tenantId = 'tenant_gvis', classId }) => {
  try {
    const diaryRef = collection(db, 'teachingDiary');
    let q = query(diaryRef);
    if (tenantId) {
      q = query(diaryRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (classId) {
        return results.filter(item => !item.classId || item.classId === classId || item.class === classId);
      }
      return results;
    }
  } catch (err) {
    console.warn('Firestore fetchTeachingDiaryEntries fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`teaching_diary_${tenantId}`) || '[]');
    if (classId) {
      return local.filter(item => !item.classId || item.classId === classId || item.class === classId);
    }
    return local;
  } catch {}

  return [];
};

// 7. Parent Message Sender & Fetcher
export const sendParentMessage = async (msgData) => {
  const tenantId = msgData.tenantId || 'tenant_gvis';
  const msgId = `msg_${Date.now()}`;
  const payload = {
    id: msgId,
    ...msgData,
    createdAt: new Date().toISOString(),
  };

  try {
    const teacherId = msgData.teacherId || 'teacher_active';
    const key = `parent_chats_${tenantId}_${teacherId}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(payload);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {}

  try {
    const msgRef = collection(db, 'messages');
    addDoc(msgRef, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  } catch (err) {
    console.warn('Firestore sendParentMessage fallback:', err.message);
  }

  return msgId;
};

export const fetchParentMessages = async ({ tenantId = 'tenant_gvis', teacherId }) => {
  try {
    const msgRef = collection(db, 'messages');
    let q = query(msgRef);
    if (tenantId) {
      q = query(msgRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore fetchParentMessages fallback:', err.message);
  }
  return [];
};

// 8. Staff Leave Application & Fetcher
export const applyStaffLeave = async (leaveData) => {
  const tenantId = leaveData.tenantId || 'tenant_gvis';
  const leaveId = `leave_${Date.now()}`;
  const payload = {
    id: leaveId,
    ...leaveData,
    status: leaveData.status || 'Pending Approval',
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = JSON.parse(localStorage.getItem(`staff_leaves_${tenantId}`) || '[]');
    existing.unshift(payload);
    localStorage.setItem(`staff_leaves_${tenantId}`, JSON.stringify(existing));
  } catch {}

  try {
    const leaveRef = collection(db, 'leaveRequests');
    addDoc(leaveRef, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  } catch (err) {
    console.warn('Firestore applyStaffLeave fallback:', err.message);
  }

  return leaveId;
};

export const fetchStaffLeaveRequests = async ({ tenantId = 'tenant_gvis', teacherId, staffId }) => {
  try {
    const leaveRef = collection(db, 'leaveRequests');
    let q = query(leaveRef);
    if (tenantId) {
      q = query(leaveRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const idToMatch = teacherId || staffId;
      if (idToMatch) {
        return results.filter(item => item.teacherId === idToMatch || item.staffId === idToMatch);
      }
      return results;
    }
  } catch (err) {
    console.warn('Firestore fetchStaffLeaveRequests fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`staff_leaves_${tenantId}`) || '[]');
    const idToMatch = teacherId || staffId;
    if (idToMatch) {
      return local.filter(item => item.teacherId === idToMatch || item.staffId === idToMatch);
    }
    return local;
  } catch {}

  return [];
};

// 9. Staff Duties Logger & Fetcher & Update Status
export const fetchStaffDuties = async ({ tenantId = 'tenant_gvis', staffId }) => {
  try {
    const dutiesRef = collection(db, 'staffDuties');
    let q = query(dutiesRef);
    if (tenantId) {
      q = query(dutiesRef, where('tenantId', '==', tenantId));
    }
    const snapshot = await safeQuery(getDocs(q), 500);
    if (snapshot && !snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore fetchStaffDuties fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`staff_duties_${tenantId}`) || '[]');
    if (staffId) {
      return local.filter(item => item.staffId === staffId);
    }
    return local;
  } catch {}

  return [];
};

export const updateStaffDutyStatus = async ({ dutyId, status, tenantId = 'tenant_gvis' }) => {
  try {
    const dutyRef = doc(db, 'staffDuties', String(dutyId));
    await setDoc(dutyRef, { status, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore updateStaffDutyStatus fallback:', err.message);
  }

  try {
    const local = JSON.parse(localStorage.getItem(`staff_duties_${tenantId}`) || '[]');
    const updated = local.map(d => d.id === dutyId ? { ...d, status } : d);
    localStorage.setItem(`staff_duties_${tenantId}`, JSON.stringify(updated));
  } catch {}
};

