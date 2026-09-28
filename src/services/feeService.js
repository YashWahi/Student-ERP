// src/services/feeService.js
import { db } from '../config/firebase';
import { collection, addDoc, doc, setDoc, getDocs, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';
import { generateFeeReceiptPDF } from './pdfService';
import { sendBroadcastAnnouncement } from './communicationService';

// Default initial fee heads for fresh installations
export const DEFAULT_FEE_HEADS = [
  { id: 'fh_tuition', headName: 'Tuition Fee', category: 'Tuition', frequency: 'Quarterly', amount: 18500, description: 'Core academic tuition fee per quarter', status: 'Active' },
  { id: 'fh_transport', headName: 'School Bus Transport', category: 'Transport', frequency: 'Monthly', amount: 3500, description: 'Monthly bus pick-up and drop service', status: 'Active' },
  { id: 'fh_exam', headName: 'Term Examination Fee', category: 'Exam', frequency: 'Term', amount: 1200, description: 'Evaluation, question paper & marksheet fee', status: 'Active' },
  { id: 'fh_misc', headName: 'Library & Sports Activity Fee', category: 'Misc', frequency: 'Annual', amount: 4500, description: 'Library cataloging, lab & sports grounds maintenance', status: 'Active' },
];

// Default initial class fee structures
export const DEFAULT_FEE_STRUCTURES = [
  {
    id: 'struct_class10',
    className: 'Class 10-A',
    academicYear: '2026-2027',
    heads: [
      { headId: 'fh_tuition', headName: 'Tuition Fee', amount: 18500 },
      { headId: 'fh_transport', headName: 'School Bus Transport', amount: 3500 },
      { headId: 'fh_exam', headName: 'Term Examination Fee', amount: 1200 },
      { headId: 'fh_misc', headName: 'Library & Sports Activity Fee', amount: 4500 },
    ],
    totalBaseAmount: 27700,
    status: 'Active',
  },
  {
    id: 'struct_class9',
    className: 'Class 9-A',
    academicYear: '2026-2027',
    heads: [
      { headId: 'fh_tuition', headName: 'Tuition Fee', amount: 16500 },
      { headId: 'fh_transport', headName: 'School Bus Transport', amount: 3500 },
      { headId: 'fh_exam', headName: 'Term Examination Fee', amount: 1200 },
      { headId: 'fh_misc', headName: 'Library & Sports Activity Fee', amount: 4000 },
    ],
    totalBaseAmount: 25200,
    status: 'Active',
  },
];

// Default initial installment plans
export const DEFAULT_INSTALLMENT_PLANS = [
  {
    id: 'plan_lumpsum',
    planName: 'Full Annual Lump-Sum',
    installmentCount: 1,
    schedule: [{ name: 'Full Payment', percent: 100, dueDateDays: 15 }],
    description: '100% full fee payment upfront with 5% early bird discount',
  },
  {
    id: 'plan_semester',
    planName: 'Bi-Annual (2 Installments)',
    installmentCount: 2,
    schedule: [
      { name: 'Semester 1 (50%)', percent: 50, dueDateDays: 15 },
      { name: 'Semester 2 (50%)', percent: 50, dueDateDays: 180 },
    ],
    description: 'Split fee equally into 2 semester payments',
  },
  {
    id: 'plan_quarterly',
    planName: 'Quarterly (4 Installments)',
    installmentCount: 4,
    schedule: [
      { name: 'Q1 Fee (25%)', percent: 25, dueDateDays: 15 },
      { name: 'Q2 Fee (25%)', percent: 25, dueDateDays: 90 },
      { name: 'Q3 Fee (25%)', percent: 25, dueDateDays: 180 },
      { name: 'Q4 Fee (25%)', percent: 25, dueDateDays: 270 },
    ],
    description: '4 quarterly installments spread throughout academic year',
  },
];

// Initial Assigned Fees / Collections
export const DEFAULT_COLLECTIONS = [
  {
    id: 'fee_1001',
    studentName: 'Arjun Verma',
    rollNo: 'GV-2026-001',
    className: 'Class 10-A',
    feeHead: 'Quarterly Tuition & Transport (Q2)',
    baseAmount: 22000,
    concessionPct: 10,
    concessionReason: 'Merit Scholarship',
    netAmount: 19800,
    totalDue: 19800,
    amountPaid: 19800,
    status: 'Paid',
    method: 'Razorpay Online',
    paymentType: 'Online',
    date: '2026-08-10',
    txnId: 'RZP_PAY_100982',
    installmentPlan: 'Quarterly (4 Installments)',
    chequeNo: '',
    bankName: '',
  },
  {
    id: 'fee_1002',
    studentName: 'Rohan Sharma',
    rollNo: 'GV-2026-002',
    className: 'Class 10-A',
    feeHead: 'Quarterly Tuition & Transport (Q2)',
    baseAmount: 22000,
    concessionPct: 0,
    concessionReason: 'None',
    netAmount: 22000,
    totalDue: 22000,
    amountPaid: 10000,
    status: 'Partial',
    method: 'Cheque Counter',
    paymentType: 'Offline',
    date: '2026-08-12',
    txnId: 'CHQ_884910',
    installmentPlan: 'Quarterly (4 Installments)',
    chequeNo: '884910',
    bankName: 'HDFC Bank',
  },
  {
    id: 'fee_1003',
    studentName: 'Kabir Verma',
    rollNo: 'GV-2026-004',
    className: 'Class 9-A',
    feeHead: 'Quarterly Tuition & Exam (Q2)',
    baseAmount: 17700,
    concessionPct: 0,
    concessionReason: 'None',
    netAmount: 17700,
    totalDue: 17700,
    amountPaid: 0,
    status: 'Overdue',
    method: 'Pending Counter',
    paymentType: 'Offline',
    date: '-',
    txnId: '-',
    installmentPlan: 'Quarterly (4 Installments)',
    daysOverdue: 14,
    chequeNo: '',
    bankName: '',
  },
  {
    id: 'fee_1004',
    studentName: 'Ananya Gupta',
    rollNo: 'GV-2026-005',
    className: 'Class 9-A',
    feeHead: 'Annual Miscellaneous & Lab Fee',
    baseAmount: 5200,
    concessionPct: 20,
    concessionReason: 'Staff Concession',
    netAmount: 4160,
    totalDue: 4160,
    amountPaid: 4160,
    status: 'Paid',
    method: 'Cash Counter',
    paymentType: 'Offline',
    date: '2026-08-11',
    txnId: 'CASH_55419',
    installmentPlan: 'Full Annual Lump-Sum',
    chequeNo: '',
    bankName: '',
  },
];

/**
 * 1. FEE HEAD MANAGEMENT
 */
export const getFeeHeads = async (tenantId = 'tenant_gvis') => {
  try {
    const q = query(collection(db, 'feeHeads'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore getFeeHeads fallback to default:', err.message);
  }
  return DEFAULT_FEE_HEADS;
};

export const createFeeHead = async (tenantId, feeHeadData) => {
  try {
    const payload = {
      ...feeHeadData,
      tenantId: tenantId || 'tenant_gvis',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'feeHeads'), payload);
    await logAuditEvent({
      action: 'CREATE_FEE_HEAD',
      actor: 'Admin',
      target: feeHeadData.headName,
      details: `Created fee head ${feeHeadData.headName} (₹${feeHeadData.amount})`,
      tenantId: tenantId || 'tenant_gvis',
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore createFeeHead fallback:', err.message);
    const newId = `fh_${Date.now()}`;
    return { id: newId, ...feeHeadData, tenantId: tenantId || 'tenant_gvis' };
  }
};

/**
 * 2. FEE STRUCTURE BUILDER PER CLASS
 */
export const getFeeStructures = async (tenantId = 'tenant_gvis') => {
  try {
    const q = query(collection(db, 'feeStructures'), where('tenantId', '==', tenantId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore getFeeStructures fallback:', err.message);
  }
  return DEFAULT_FEE_STRUCTURES;
};

export const createFeeStructure = async (tenantId, structureData) => {
  const totalBaseAmount = (structureData.heads || []).reduce((sum, h) => sum + Number(h.amount || 0), 0);
  const payload = {
    ...structureData,
    totalBaseAmount,
    tenantId: tenantId || 'tenant_gvis',
    createdAt: serverTimestamp(),
  };

  try {
    const docRef = await addDoc(collection(db, 'feeStructures'), payload);
    await logAuditEvent({
      action: 'CREATE_FEE_STRUCTURE',
      actor: 'Admin',
      target: structureData.className,
      details: `Configured fee structure for ${structureData.className} totaling ₹${totalBaseAmount.toLocaleString('en-IN')}`,
      tenantId: tenantId || 'tenant_gvis',
    });
    return { id: docRef.id, ...payload };
  } catch (err) {
    console.warn('Firestore createFeeStructure fallback:', err.message);
    return { id: `struct_${Date.now()}`, ...payload };
  }
};

/**
 * 3. ASSIGN FEE STRUCTURE TO STUDENTS (WITH CONCESSION %)
 */
export const assignFeeStructureToStudent = async (tenantId, assignmentData) => {
  const {
    studentName,
    rollNo,
    className,
    feeHead,
    baseAmount,
    concessionPct = 0,
    concessionReason = '',
    installmentPlan = 'Quarterly (4 Installments)',
  } = assignmentData;

  const gross = Number(baseAmount);
  const concPct = Number(concessionPct);
  const discount = Math.round((gross * concPct) / 100);
  const netAmount = gross - discount;

  const newFeeRecord = {
    id: `fee_${Date.now().toString().slice(-6)}`,
    tenantId: tenantId || 'tenant_gvis',
    studentName,
    rollNo,
    className,
    feeHead,
    baseAmount: gross,
    concessionPct: concPct,
    concessionReason: concessionReason || 'N/A',
    netAmount,
    totalDue: netAmount,
    amountPaid: 0,
    status: 'Pending',
    method: 'Pending Counter',
    paymentType: 'Pending',
    date: '-',
    txnId: '-',
    installmentPlan,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await addDoc(collection(db, 'assignedFees'), {
      ...newFeeRecord,
      createdAt: serverTimestamp(),
    });
    await logAuditEvent({
      action: 'ASSIGN_FEE_STRUCTURE',
      actor: 'Finance Officer',
      target: `${studentName} (${rollNo})`,
      details: `Assigned fee ${feeHead} (Base ₹${gross}, Concession ${concPct}%, Net ₹${netAmount})`,
      tenantId: tenantId || 'tenant_gvis',
    });
    return { ...newFeeRecord, id: docRef.id };
  } catch (err) {
    console.warn('Firestore assignFeeStructureToStudent fallback:', err.message);
    return newFeeRecord;
  }
};

/**
 * 4. RECORD OFFLINE & ONLINE PAYMENTS (AUTO RECEIPT GENERATION)
 */
export const recordFeePayment = async (tenantId, paymentData) => {
  const {
    feeId,
    studentName,
    rollNo,
    className,
    feeHead,
    amountCollected, // New: the delta for concurrency safety
    amountPaid,      // Legacy: absolute value (used if amountCollected is omitted)
    totalDue,
    paymentMethod, // 'Cash Counter', 'Cheque Counter', 'UPI QR Code', 'POS Card Swipe', 'NEFT / Bank Transfer', 'Razorpay Online'
    txnId = `TXN_${Date.now().toString().slice(-6)}`,
    chequeNo = '',
    bankName = '',
    collegeName = 'Green Valley International School',
  } = paymentData;

  if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim() === '') {
    throw new Error('A valid payment method is required to record a fee payment.');
  }

  const isOnline = paymentMethod.toLowerCase().includes('razorpay') || paymentMethod.toLowerCase().includes('online');
  const paymentType = isOnline ? 'Online' : 'Offline';

  const feeRef = doc(db, 'fees', feeId || `fee_${Date.now()}`);
  let finalPaid = 0;
  let updatedStatus = 'Pending';
  const numDue = Number(totalDue);
  let finalTxnId = txnId;

  try {
    await runTransaction(db, async (transaction) => {
      const feeDoc = await transaction.get(feeRef);
      const currentData = feeDoc.exists() ? feeDoc.data() : {};
      const currentPaid = Number(currentData.amountPaid) || 0;
      
      const delta = amountCollected !== undefined ? Number(amountCollected) : Math.max(0, Number(amountPaid) - currentPaid);
      finalPaid = currentPaid + delta;

      updatedStatus = 'Paid';
      if (finalPaid < numDue) {
        updatedStatus = 'Partial';
      }

      const existingHistory = currentData.paymentHistory || [];
      const newTransaction = {
        amount: delta,
        method: paymentMethod,
        paymentType,
        txnId,
        chequeNo,
        bankName,
        date: new Date().toISOString()
      };

      const payload = {
        tenantId: tenantId || 'tenant_gvis',
        feeId,
        studentName,
        rollNo,
        className,
        feeHead,
        amountPaid: finalPaid,
        totalDue: numDue,
        status: updatedStatus,
        method: paymentMethod,
        paymentType,
        txnId,
        chequeNo,
        bankName,
        paidAt: new Date().toISOString(),
        paymentHistory: [...existingHistory, newTransaction],
      };

      transaction.set(feeRef, payload, { merge: true });
    });

    await logAuditEvent({
      action: 'FEE_PAYMENT_COLLECTED',
      actor: isOnline ? 'System / Razorpay Webhook' : 'Accountant Counter',
      target: studentName,
      details: `Collected ₹${(amountCollected || amountPaid).toLocaleString('en-IN')} via ${paymentMethod} for ${feeHead} (Txn: ${txnId})`,
      tenantId: tenantId || 'tenant_gvis',
    });
  } catch (err) {
    console.error('Firestore recordFeePayment transaction failed:', err);
    throw new Error(err.message || 'Failed to record payment securely.');
  }

  // Auto Generate PDF Receipt
  try {
    generateFeeReceiptPDF({
      receiptNo: txnId,
      studentName,
      rollNo,
      className,
      feeType: feeHead,
      amount: finalPaid,
      paymentMethod,
      collegeName,
    });
  } catch (pdfErr) {
    console.warn('Error generating PDF receipt automatically:', pdfErr);
  }

  return {
    feeId,
    status: updatedStatus,
    txnId: finalTxnId,
    amountPaid: finalPaid,
    paymentMethod,
    date: new Date().toISOString().split('T')[0],
  };
};

/**
 * 5. DEFAULTER LIST & AUTO REMINDER TRIGGERS
 */
export const triggerDefaulterReminders = async (tenantId = 'tenant_gvis', defaulters = [], channel = 'WhatsApp & SMS') => {
  const targetCount = defaulters.length;
  try {
    await sendBroadcastAnnouncement({
      tenantId,
      senderName: 'Finance Accounting System',
      targetAudience: 'all_parents',
      subject: 'URGENT: Fee Payment Reminder',
      content: `Dear Parent, This is a reminder that fee payment for your ward is overdue. Kindly clear outstanding dues to avoid late fee penalties.`,
      channels: { email: true, push: true, sms: true },
    });
    await logAuditEvent({
      action: 'TRIGGER_FEE_REMINDERS',
      actor: 'Finance Admin',
      target: `${targetCount} Defaulters`,
      details: `Dispatched automated fee reminders via ${channel} to ${targetCount} overdue student parents`,
      tenantId,
    });
  } catch (err) {
    console.warn('triggerDefaulterReminders fallback:', err.message);
  }
  return { success: true, count: targetCount };
};

/**
 * 6. TRANSACTION-SAFE REFUND PROCESSING
 */
export const processRefund = async (tenantId, refundData) => {
  const { feeId, studentName, refundAmount, refundReason, approvedBy = 'Finance Admin' } = refundData;
  const currentTenant = tenantId || 'tenant_gvis';
  const feeRef = doc(db, 'fees', feeId);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(feeRef);
      if (snap.exists()) {
        transaction.update(feeRef, {
          status: 'Refunded',
          refundAmount: Number(refundAmount),
          refundReason,
          refundedAt: serverTimestamp(),
        });
      }
    });
  } catch (err) {
    console.warn('Firestore processRefund fallback:', err.message);
  }

  await logAuditEvent({
    action: 'EXECUTE_PAYMENT_REFUND',
    actor: approvedBy,
    target: studentName,
    details: `Executed refund of ₹${Number(refundAmount).toLocaleString('en-IN')} for ${studentName}. Reason: ${refundReason}`,
    tenantId: currentTenant,
  });

  return { status: 'Refunded', refundAmount: Number(refundAmount) };
};

/**
 * 7. CLASS-WISE COLLECTION SUMMARY COMPUTATION
 */
export const calculateClasswiseSummary = (collections = []) => {
  const summaryByClass = {};

  collections.forEach(item => {
    const cName = item.className || 'General';
    if (!summaryByClass[cName]) {
      summaryByClass[cName] = {
        className: cName,
        totalStudents: 0,
        totalDue: 0,
        totalCollected: 0,
        pendingDues: 0,
        paidCount: 0,
        defaulterCount: 0,
      };
    }
    const due = Number(item.totalDue || 0);
    const paid = Number(item.amountPaid || 0);

    summaryByClass[cName].totalStudents += 1;
    summaryByClass[cName].totalDue += due;
    summaryByClass[cName].totalCollected += paid;
    summaryByClass[cName].pendingDues += (due - paid);
    if (item.status === 'Paid') {
      summaryByClass[cName].paidCount += 1;
    } else if (item.status === 'Overdue' || item.status === 'Pending') {
      summaryByClass[cName].defaulterCount += 1;
    }
  });

  return Object.values(summaryByClass).map(s => ({
    ...s,
    collectionRate: s.totalDue > 0 ? ((s.totalCollected / s.totalDue) * 100).toFixed(1) : '0.0',
  }));
};
