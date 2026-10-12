// src/services/parentService.js
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';

export const LINKED_CHILDREN_SEED = [
  {
    id: 'child_101',
    name: 'Arjun Verma',
    class: 'Class 10-A',
    rollNo: 'GV-2026-001',
    teacher: 'Mrs. Priya Sharma',
    teacherEmail: 'priya.sharma@school.edu',
    attendancePct: '96%',
    feeDue: 18500,
    busRoute: 'Route 101 — Bus UP-16-AB-1234',
    driverPhone: '+91 99887 76655',
    lastGateCheckIn: 'Today, 08:45 AM (Gate A - Main Campus)',
    checkInStatus: 'Present (On Time)',
  },
  {
    id: 'child_102',
    name: 'Kabir Verma',
    class: 'Class 6-C',
    rollNo: 'GV-2026-004',
    teacher: 'Mr. Rajesh Verma',
    teacherEmail: 'rajesh.verma@school.edu',
    attendancePct: '92%',
    feeDue: 14500,
    busRoute: 'Route 102 — Bus UP-14-CD-5678',
    driverPhone: '+91 99887 76644',
    lastGateCheckIn: 'Today, 08:40 AM (Gate B - Junior Wing)',
    checkInStatus: 'Present (On Time)',
  },
  {
    id: 'child_103',
    name: 'Ananya Verma',
    class: 'Class 3-B',
    rollNo: 'GV-2026-009',
    teacher: 'Ms. Sneha Gupta',
    teacherEmail: 'sneha.gupta@school.edu',
    attendancePct: '98%',
    feeDue: 12000,
    busRoute: 'Route 105 — Bus UP-14-EF-9012',
    driverPhone: '+91 99887 76633',
    lastGateCheckIn: 'Today, 08:35 AM (Gate C - Primary Block)',
    checkInStatus: 'Present (On Time)',
  },
];

export const INITIAL_ATTENDANCE_ALERTS_SEED = [
  { id: 'al_1', childId: 'child_101', date: '13 Aug 2026', time: '08:45 AM', type: 'Check-In', status: 'Present', location: 'Gate A - Main Campus', details: 'Arjun scanned RFID smart card at main gate.' },
  { id: 'al_2', childId: 'child_102', date: '13 Aug 2026', time: '08:40 AM', type: 'Check-In', status: 'Present', location: 'Gate B - Junior Wing', details: 'Kabir scanned RFID smart card at junior gate.' },
  { id: 'al_3', childId: 'child_103', date: '13 Aug 2026', time: '08:35 AM', type: 'Check-In', status: 'Present', location: 'Gate C - Primary Block', details: 'Ananya scanned RFID smart card at primary gate.' },
  { id: 'al_4', childId: 'child_101', date: '12 Aug 2026', time: '08:50 AM', type: 'Check-In', status: 'Present', location: 'Gate A - Main Campus', details: 'Arjun scanned RFID smart card at main gate.' },
  { id: 'al_5', childId: 'child_101', date: '10 Aug 2026', time: '09:00 AM', type: 'Leave Alert', status: 'Absent', location: 'Classroom 201', details: 'Approved Medical Leave applied by parent.' },
];

export const INITIAL_HOMEWORK_SEED = [
  { id: 'hw_101', childId: 'child_101', title: 'Quadratic Equations Ex 4.2', subject: 'Mathematics', teacher: 'Mrs. Priya Sharma', due: '14 Aug 2026', status: 'Pending', notes: 'Solve all odd numbered problems.' },
  { id: 'hw_102', childId: 'child_101', title: 'Lab Report: Acid & Bases Titration', subject: 'Physics', teacher: 'Mr. Rajesh Verma', due: '18 Aug 2026', status: 'Pending', notes: 'Attach observation table graph.' },
  { id: 'hw_103', childId: 'child_102', title: 'Fractions & Decimals Exercise 3.1', subject: 'Mathematics', teacher: 'Mr. Rajesh Verma', due: '15 Aug 2026', status: 'Pending', notes: 'Page 45 in NCERT textbook.' },
  { id: 'hw_104', childId: 'child_103', title: 'English Reading & Cursive Handwriting', subject: 'English', teacher: 'Ms. Sneha Gupta', due: '14 Aug 2026', status: 'Submitted', notes: 'Completed in class workbook.' },
];

export const INITIAL_EXAMS_SEED = [
  { id: 'ex_101', childId: 'child_101', title: 'Mid-Term Exam: Mathematics', subject: 'Mathematics', date: '22 Aug 2026', time: '09:30 AM - 12:30 PM', room: 'Hall 201', syllabus: 'Quadratic Equations, Real Numbers, Triangles' },
  { id: 'ex_102', childId: 'child_101', title: 'Mid-Term Exam: Physics & Chemistry', subject: 'Science', date: '25 Aug 2026', time: '09:30 AM - 12:30 PM', room: 'Lab 1', syllabus: 'Optics, Chemical Reactions & Equations' },
  { id: 'ex_103', childId: 'child_102', title: 'Unit Assessment: Mathematics', subject: 'Mathematics', date: '21 Aug 2026', time: '10:00 AM - 11:30 AM', room: 'Room 104', syllabus: 'Fractions, Decimals, Data Handling' },
  { id: 'ex_104', childId: 'child_103', title: 'Class 3 Monthly Assessment', subject: 'General Knowledge & English', date: '20 Aug 2026', time: '09:30 AM - 11:00 AM', room: 'Room 302', syllabus: 'Chapters 1 to 4 Grammar & Vocabulary' },
];

export const INITIAL_LEAVE_APPLICATIONS_SEED = [
  { id: 'lv_101', childId: 'child_101', leaveType: 'Medical Leave', fromDate: '2026-08-10', toDate: '2026-08-10', reason: 'Fever and viral cold doctor consultation', status: 'Approved', teacherRemark: 'Leave approved by Mrs. Priya Sharma' },
  { id: 'lv_102', childId: 'child_102', leaveType: 'Family Event', fromDate: '2026-07-02', toDate: '2026-07-03', reason: 'Attending elder sibling graduation ceremony outstation', status: 'Approved', teacherRemark: 'Leave granted by Mr. Rajesh Verma' },
];

export const INITIAL_TRANSACTIONS_SEED = [
  { id: 'REC-901', childId: 'child_101', feeType: 'Tuition Fee (Q1)', amount: 18500, date: '2026-04-10', status: 'Paid', method: 'Online Razorpay' },
  { id: 'REC-804', childId: 'child_102', feeType: 'Tuition Fee (Q1)', amount: 14500, date: '2026-04-12', status: 'Paid', method: 'Online Razorpay' },
  { id: 'REC-702', childId: 'child_103', feeType: 'Tuition Fee (Q1)', amount: 12000, date: '2026-04-14', status: 'Paid', method: 'Online Razorpay' },
];

export const INITIAL_PTM_SEED = [
  { id: 'ptm_1', childId: 'child_101', teacherName: 'Mrs. Priya Sharma', date: '2026-08-28', timeSlot: '10:30 AM - 10:45 AM', room: 'Room 204', status: 'Confirmed' },
  { id: 'ptm_2', childId: 'child_102', teacherName: 'Mr. Rajesh Verma', date: '2026-08-29', timeSlot: '11:00 AM - 11:30 AM', room: 'Room 108', status: 'Confirmed' },
];

export const INITIAL_COMPLAINTS_SEED = [
  { id: 'ticket_101', childId: 'child_101', category: 'Fee & Billing Query', description: 'Fee Receipt Re-issue Request for Q1 payment', status: 'Resolved', date: '2026-08-01', response: 'Receipt PDF re-sent to parent email.' },
];

export const INITIAL_FEEDBACK_SEED = [
  { id: 'fb_101', childId: 'child_101', category: 'Academic Quality', rating: 5, comment: 'Great progress in Science lab practicals. Appreciate teacher support.', date: '2026-08-05' },
];

export const INITIAL_CHAT_MESSAGES_SEED = [
  { id: 'msg_1', childId: 'child_101', sender: 'Parent', senderName: 'Mr. Suresh Verma', text: "Hello Mrs. Priya Sharma, I would like to inquire about tomorrow's schedule.", time: '10:15 AM' },
  { id: 'msg_2', childId: 'child_101', sender: 'Teacher', senderName: 'Mrs. Priya Sharma', text: "Hello Mr. Verma! Tomorrow is normal class schedule with Math unit test in period 3.", time: '10:20 AM' },
  { id: 'msg_3', childId: 'child_102', sender: 'Parent', senderName: 'Mr. Suresh Verma', text: 'Hello Mr. Rajesh, please confirm Kabir bus route details.', time: '09:30 AM' },
  { id: 'msg_4', childId: 'child_102', sender: 'Teacher', senderName: 'Mr. Rajesh Verma', text: 'Confirmed, Kabir is assigned to Route 102 (Bus UP-14-CD-5678).', time: '09:45 AM' },
];

// Fetch complete parent data from Firestore with seed fallback
export const fetchParentPortalData = async (parentId = 'parent_001', tenantId = 'tenant_gvis') => {
  try {
    let leaves = [];
    try {
      const q = query(collection(db, 'leaveApplications'), where('parentId', '==', parentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        leaves = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Error fetching leave applications:', e.message);
    }

    let ptm = [];
    try {
      const q = query(collection(db, 'ptmBookings'), where('parentId', '==', parentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        ptm = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Error fetching ptm bookings:', e.message);
    }

    let complaints = [];
    try {
      const q = query(collection(db, 'complaints'), where('parentId', '==', parentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        complaints = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Error fetching complaints:', e.message);
    }

    let feedback = [];
    try {
      const q = query(collection(db, 'feedback'), where('parentId', '==', parentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        feedback = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Error fetching feedback:', e.message);
    }

    let messages = [];
    try {
      const q = query(collection(db, 'messages'), where('parentId', '==', parentId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn('Error fetching messages:', e.message);
    }

    return {
      children: LINKED_CHILDREN_SEED,
      attendanceAlerts: INITIAL_ATTENDANCE_ALERTS_SEED,
      homework: INITIAL_HOMEWORK_SEED,
      exams: INITIAL_EXAMS_SEED,
      leaveApplications: leaves.length > 0 ? leaves : INITIAL_LEAVE_APPLICATIONS_SEED,
      transactions: INITIAL_TRANSACTIONS_SEED,
      ptmBookings: ptm.length > 0 ? ptm : INITIAL_PTM_SEED,
      complaints: complaints.length > 0 ? complaints : INITIAL_COMPLAINTS_SEED,
      feedbackList: feedback.length > 0 ? feedback : INITIAL_FEEDBACK_SEED,
      chatMessages: messages.length > 0 ? messages : INITIAL_CHAT_MESSAGES_SEED,
    };
  } catch (err) {
    console.warn('Firestore fetchParentPortalData fallback:', err.message);
    return {
      children: LINKED_CHILDREN_SEED,
      attendanceAlerts: INITIAL_ATTENDANCE_ALERTS_SEED,
      homework: INITIAL_HOMEWORK_SEED,
      exams: INITIAL_EXAMS_SEED,
      leaveApplications: INITIAL_LEAVE_APPLICATIONS_SEED,
      transactions: INITIAL_TRANSACTIONS_SEED,
      ptmBookings: INITIAL_PTM_SEED,
      complaints: INITIAL_COMPLAINTS_SEED,
      feedbackList: INITIAL_FEEDBACK_SEED,
      chatMessages: INITIAL_CHAT_MESSAGES_SEED,
    };
  }
};

// 1. Book PTM Meeting Slot
export const bookPTMSlot = async (bookingData) => {
  try {
    const ptmRef = collection(db, 'ptmBookings');
    const payload = {
      ...bookingData,
      status: 'Confirmed',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(ptmRef, payload);
    await logAuditEvent({
      action: 'BOOK_PTM',
      actor: bookingData.parentName || 'Parent',
      target: bookingData.childName,
      details: `Booked PTM slot on ${bookingData.date} at ${bookingData.timeSlot}`,
      tenantId: bookingData.tenantId || 'tenant_gvis',
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore bookPTMSlot fallback:', err.message);
    return { id: 'ptm_' + Date.now(), ...bookingData, status: 'Confirmed' };
  }
};

// 2. Raise Complaint / Helpdesk Ticket
export const raiseParentComplaint = async (ticketData) => {
  try {
    const compRef = collection(db, 'complaints');
    const payload = {
      ...ticketData,
      status: 'Open',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(compRef, payload);
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore raiseParentComplaint fallback:', err.message);
    return { id: 'comp_' + Date.now(), ...ticketData, status: 'Open' };
  }
};

// 3. Submit Feedback
export const submitParentFeedback = async (feedbackData) => {
  try {
    const fbRef = collection(db, 'feedback');
    const payload = {
      ...feedbackData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(fbRef, payload);
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore submitParentFeedback fallback:', err.message);
    return { id: 'fb_' + Date.now(), ...feedbackData };
  }
};

// 4. Submit Child Leave Request
export const submitChildLeave = async (leaveData) => {
  try {
    const leaveRef = collection(db, 'leaveApplications');
    const payload = {
      ...leaveData,
      status: 'Pending',
      teacherRemark: 'Under review by class teacher',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(leaveRef, payload);
    await logAuditEvent({
      action: 'APPLY_LEAVE',
      actor: leaveData.parentName || 'Parent',
      target: leaveData.childName,
      details: `Applied for ${leaveData.leaveType} from ${leaveData.fromDate} to ${leaveData.toDate}`,
      tenantId: leaveData.tenantId || 'tenant_gvis',
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore submitChildLeave fallback:', err.message);
    return { id: 'lv_' + Date.now(), ...leaveData, status: 'Pending', teacherRemark: 'Under review by class teacher' };
  }
};

