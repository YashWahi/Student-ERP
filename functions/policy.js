// functions/policy.js
//
// Pure, dependency-free payment security policy for Issue #19 hardening.
//
// This module contains NO I/O, NO secrets, and NO framework imports so it can
// be unit-tested offline with plain `node`. functions/index.js wires these
// decisions to Firestore (Admin SDK) + Razorpay inside transactions.
//
// Design principles:
// - The backend is the authority for identity, tenant, amount, order, payment.
// - Client-supplied amounts are REJECTED, never silently accepted.
// - Client-supplied tenantId is never accepted (functions take no tenant input).
// - Ownership uses ONLY existing schema fields (see SCHEMA NOTES below).
//
// SCHEMA NOTES (verified against this repository):
// - users/{uid}: { uid, email, name, role, tenantId, branchId, ... }.
//   Roles in use: superadmin | admin | subadmin | teacher | student | parent | staff.
//   superadmin tenantId = 'tenant_platform'.
// - fees/{feeId}: { tenantId, studentName, rollNo, className, feeHead,
//   totalDue, amountPaid, status, method, paymentType, txnId, ... }.
//   Authoritative payable = totalDue - amountPaid. Ownership key = rollNo.
//   Assigned (unpaid) fees may also live in `assignedFees` with the same shape.
// - students docs (admitStudent): { tenantId, email (student), rollNo,
//   parentId (parent Auth uid or null), parentName, parentPhone, ... }.
//   NOTE: Firestore students docs carry NO parentEmail field, and fee docs
//   carry NO studentId/parentEmail field. Server-side linkage therefore is:
//     student -> students.email == caller.email  => rollNo
//     parent  -> students.parentId == caller.uid => rollNos[]
//   Fee docs keyed only by rollNo (+ tenantId).
// - subscriptions/{subId}: { college, plan, amount, status, expiryDate, ... }.
//   Both payment entry points are superadmin-only surfaces in this app
//   (Subscriptions.jsx route + superadmin dashboard hook), so the preserved
//   authorization model for subscription payment is role == 'superadmin'.

'use strict';

const MAX_AMOUNT_PAISA = 100000000; // Rs. 10,00,000 safety cap per order

const deny = (code, message) => ({ ok: false, code, message });

function toPaiseStrict(rupees) {
  const n = Number(rupees);
  if (!Number.isFinite(n) || n <= 0) {
    return deny('invalid-argument', 'Authoritative amount is not a positive number.');
  }
  const paise = Math.round(n * 100);
  if (paise < 100) {
    return deny('failed-precondition', 'Payable amount is below the Rs. 1 minimum.');
  }
  if (paise > MAX_AMOUNT_PAISA) {
    return deny('failed-precondition', 'Payable amount exceeds the maximum allowed per order.');
  }
  return { ok: true, paise };
}

/**
 * Reject ANY client-supplied amount field. The frontend must send only
 * identifiers (feeId/subId); amounts are derived server-side. Presence of a
 * client amount is treated as tampering and rejected outright.
 */
function rejectClientAmounts(data, fields = ['amount', 'totalDue', 'amountPaid']) {
  const d = data || {};
  for (const f of fields) {
    if (d[f] !== undefined && d[f] !== null) {
      return deny('invalid-argument', `Client-supplied '${f}' is not accepted. Amounts are derived server-side.`);
    }
  }
  return { ok: true };
}

/**
 * Authoritative remaining payable for a fee record.
 * Returns { ok:true, remaining, payablePaise } or a rejection.
 */
function feePayable(fee) {
  if (!fee) return deny('not-found', 'Fee record not found.');
  if (fee.status === 'Paid') {
    return deny('failed-precondition', 'Fee is already fully paid.');
  }
  const due = Number(fee.totalDue);
  const paid = Number(fee.amountPaid || 0);
  if (!Number.isFinite(due) || due <= 0) {
    return deny('failed-precondition', 'Fee record has no outstanding dues.');
  }
  if (!Number.isFinite(paid) || paid < 0) {
    return deny('failed-precondition', 'Fee record carries an invalid paid amount.');
  }
  const remaining = Math.round((due - paid) * 100) / 100;
  if (remaining <= 0) {
    return deny('failed-precondition', 'Fee is already fully paid.');
  }
  const conv = toPaiseStrict(remaining);
  if (!conv.ok) return conv;
  return { ok: true, remaining, payablePaise: conv.paise };
}

/**
 * Pure computation of the post-payment fee ledger state.
 * amountPaid ACCUMULATES (supports partial payments); status escalates only.
 */
function applyFeePayment(arg1, arg2) {
  let fee = arg1;
  let orderPaise = arg2?.amount || arg2?.orderPaise;
  if (arg1 && arg1.fee) {
    fee = arg1.fee;
    orderPaise = arg1.orderPaise || arg1.amount;
  }
  const due = Number(fee?.totalDue || 0);
  const paid = Number(fee?.amountPaid || 0);
  const added = Number(orderPaise || 0) / 100;
  const newPaid = Math.round((paid + added) * 100) / 100;
  const res = {
    amountPaid: newPaid,
    totalDue: due,
    status: newPaid >= due ? 'Paid' : 'Partial',
  };
  return {
    ok: true,
    ...res,
    fee: res,
  };
}

/**
 * Resolve the caller's authority from the stored users/{uid} profile.
 * Returns { ok:true, caller:{ uid, email, role, tenantId } } or rejection.
 * Members without a stored users doc, or with a missing tenantId, are denied.
 * (This also blocks localStorage-only demo logins from paying: they have no
 * Firebase Auth uid / no users doc, so requireAuth already rejects them.)
 */
function callerAuthority({ authUid, profile }) {
  if (!authUid) return deny('unauthenticated', 'Sign in is required.');
  if (!profile) return deny('permission-denied', 'No user profile found for this account.');
  const role = String(profile.role || '').toLowerCase();
  const tenantId = profile.tenantId;
  if (!role) return deny('permission-denied', 'User profile has no role.');
  if (!tenantId) return deny('permission-denied', 'User profile has no tenant.');
  return {
    ok: true,
    caller: {
      uid: authUid,
      email: String(profile.email || '').toLowerCase().trim(),
      role,
      tenantId: String(tenantId),
    },
  };
}

const FEE_PAYER_ROLES = new Set(['admin', 'student', 'parent']);

/**
 * Base fee authorization shared by create + verify:
 * - fee must exist and carry a tenantId
 * - caller tenant must equal fee tenant (superadmin operating cross-tenant
 *   is NOT part of this app's flow — fee screens are tenant-scoped — denied)
 * - caller role must be one that may pay fees (admin/student/parent)
 */
function authorizeFeeBase({ caller, fee, feeId }) {
  if (!fee) return deny('not-found', `Fee '${feeId || 'unknown'}' not found.`);
  if (!fee.tenantId) return deny('failed-precondition', 'Fee record has no tenant.');
  if (String(fee.tenantId) !== String(caller.tenantId)) {
    return deny('permission-denied', 'Fee belongs to another tenant.');
  }
  if (!FEE_PAYER_ROLES.has(caller.role)) {
    return deny('permission-denied', `Role '${caller.role}' may not pay fees.`);
  }
  return { ok: true };
}

/**
 * Ownership for student/parent roles using ONLY existing fields:
 * - student: caller.email must match a students doc email whose rollNo equals
 *   the fee rollNo. Matching is done against an explicit candidates list
 *   supplied by the caller of this function (the Firestore query result),
 *   never against client input. Legacy fee docs without rollNo are denied.
 * - parent: caller.uid must equal students.parentId for a students doc whose
 *   rollNo equals the fee rollNo.
 * - admin: tenant match is sufficient (existing model: admins manage the
 *   whole tenant ledger, including counter collection).
 */
function authorizeFeeOwnership({ caller, fee, studentMatches = [], parentMatches = [] }) {
  if (caller.role === 'admin') return { ok: true };
  const feeRollNo = fee.rollNo ? String(fee.rollNo) : '';
  if (!feeRollNo) {
    return deny('permission-denied', 'Fee record has no student linkage.');
  }
  if (caller.role === 'student') {
    const allowed = (studentMatches || []).some((s) => String(s.rollNo) === feeRollNo);
    return allowed
      ? { ok: true }
      : deny('permission-denied', 'Fee belongs to another student.');
  }
  if (caller.role === 'parent') {
    const allowed = (parentMatches || []).some((s) => String(s.rollNo) === feeRollNo);
    return allowed
      ? { ok: true }
      : deny('permission-denied', 'Fee is not linked to this parent account.');
  }
  return deny('permission-denied', `Role '${caller.role}' may not pay fees.`);
}

/**
 * Subscription authorization — preserved app model:
 * subscription payment surfaces are superadmin-only (Subscriptions.jsx route
 * + superadmin dashboard hook), so the payer must be role == 'superadmin'.
 * No tenant comparison against the caller (superadmin lives on
 * tenant_platform); the subscription doc itself carries the target tenant.
 */
function authorizeSubscription({ caller, sub, subId }) {
  if (!sub) return deny('not-found', `Subscription '${subId || 'unknown'}' not found.`);
  if (caller.role !== 'superadmin') {
    return deny('permission-denied', 'Only a Super Admin may renew subscriptions.');
  }
  return { ok: true };
}

function subscriptionPayable(sub) {
  if (!sub) return deny('not-found', 'Subscription record not found.');
  const amount = Number(sub.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return deny('failed-precondition', 'Subscription has no payable amount.');
  }
  const conv = toPaiseStrict(amount);
  if (!conv.ok) return conv;
  return { ok: true, amount, payablePaise: conv.paise };
}

/**
 * Order <-> resource binding enforced at verification.
 */
function bindingCheck({ storedOrder, requestedResourceId, kind }) {
  if (!storedOrder) return deny('failed-precondition', 'Order is not tracked by the backend.');
  const field = kind === 'fee' ? storedOrder.feeId : storedOrder.subId;
  if (!field) return deny('failed-precondition', 'Tracked order has no resource binding.');
  if (String(field) !== String(requestedResourceId)) {
    return deny('permission-denied', 'Payment does not belong to the requested record.');
  }
  return { ok: true };
}

/**
 * Idempotency decision for razorpay_payments/{paymentId}.
 */
function idempotencyCheck({ existingPayment, orderId }) {
  if (!existingPayment) return { ok: true, replay: false };
  if (existingPayment.orderId && String(existingPayment.orderId) !== String(orderId)) {
    return deny('permission-denied', 'Payment id is bound to a different order.');
  }
  if (existingPayment.status === 'verified') {
    return { ok: true, replay: true, receipt: existingPayment.receipt || null };
  }
  return deny('failed-precondition', 'Payment is already being processed.');
}

module.exports = {
  MAX_AMOUNT_PAISA,
  toPaiseStrict,
  rejectClientAmounts,
  feePayable,
  applyFeePayment,
  callerAuthority,
  authorizeFeeBase,
  authorizeFeeOwnership,
  authorizeSubscription,
  subscriptionPayable,
  bindingCheck,
  idempotencyCheck,
};
