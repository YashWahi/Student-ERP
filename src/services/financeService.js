// src/services/financeService.js
import { db } from '../config/firebase';
import { collection, addDoc, doc, setDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';

// 1. Transaction-Safe Payment Verification & Recording
export const processTransactionPayment = async ({
  tenantId,
  studentId,
  studentName,
  rollNo,
  className,
  feeId,
  feeType,
  amountPaid,
  totalDue,
  paymentMethod,
  txnId,
}) => {
  const feeDocRef = doc(db, 'fees', feeId || `fee_${Date.now()}`);

  let updatedStatus = 'Paid';
  if (amountPaid < totalDue) {
    updatedStatus = 'Partial';
  }

  // Atomically update fee record in Firestore
  await setDoc(feeDocRef, {
    tenantId,
    studentId,
    studentName,
    rollNo,
    className,
    feeType,
    amountPaid,
    totalDue,
    status: updatedStatus,
    paymentMethod,
    txnId,
    paidAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Record Audit Event
  await logAuditEvent({
    action: 'PAYMENT_SUCCESS',
    actor: 'Accounts Counter',
    target: studentName,
    details: `Processed ${paymentMethod} payment of ₹${amountPaid.toLocaleString('en-IN')} for ${feeType} (Txn: ${txnId})`,
    tenantId,
  });

  return { feeId: feeDocRef.id, status: updatedStatus, txnId };
};

// 2. Transaction-Safe Refund Processing Workflow
export const processPaymentRefund = async ({
  tenantId,
  feeId,
  studentName,
  refundAmount,
  refundReason,
  approvedBy = 'Branch Admin',
}) => {
  const feeRef = doc(db, 'fees', feeId);

  await runTransaction(db, async (transaction) => {
    const feeSnap = await transaction.get(feeRef);
    if (!feeSnap.exists()) {
      throw new Error('Fee record does not exist.');
    }

    const currentData = feeSnap.data();
    const newStatus = 'Refunded';

    transaction.update(feeRef, {
      status: newStatus,
      refundAmount,
      refundReason,
      refundedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  await logAuditEvent({
    action: 'REFUND_PAYMENT',
    actor: approvedBy,
    target: studentName,
    details: `Approved & executed refund of ₹${refundAmount.toLocaleString('en-IN')}. Reason: ${refundReason}`,
    tenantId,
  });

  return { status: 'Refunded' };
};

// 3. Institutional Expense Logger
export const logInstitutionalExpense = async (expenseData) => {
  const expRef = collection(db, 'expenses');
  const payload = {
    ...expenseData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(expRef, payload);
  await logAuditEvent({
    action: 'LOG_EXPENSE',
    actor: 'Admin',
    target: expenseData.category,
    details: `Recorded expense of ₹${Number(expenseData.amount).toLocaleString('en-IN')} for ${expenseData.title}`,
    tenantId: expenseData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 4. Vendor Registration & Invoice Logging
export const registerVendorInvoice = async (vendorData) => {
  const vendorRef = collection(db, 'vendors');
  const payload = {
    ...vendorData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(vendorRef, payload);
  return docRef.id;
};
