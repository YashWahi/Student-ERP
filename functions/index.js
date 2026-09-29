'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const policy = require('./policy');
const userProvisioningPolicy = require('./userProvisioningPolicy');

admin.initializeApp();
const db = admin.firestore();
const REGION = 'asia-south1';
const KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');

function client() {
  const keyId = KEY_ID.value();
  const keySecret = KEY_SECRET.value();
  if (!keyId || !keySecret) throw new HttpsError('failed-precondition', 'Razorpay Test credentials are not configured.');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
function auth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in is required.');
  return request.auth;
}
function id(value) {
  const text = String(value || '').trim();
  if (!text || text.length > 80 || !/^[A-Za-z0-9 _-]+$/.test(text)) throw new HttpsError('invalid-argument', 'A valid record identifier is required.');
  return text;
}
function fail(result) {
  if (result && !result.ok) throw new HttpsError(result.code || 'permission-denied', result.message || 'Request denied.');
}
async function profile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  return snap.exists ? { ...snap.data(), uid: snap.id } : null;
}
async function fee(feeId) {
  let snap = await db.collection('fees').doc(feeId).get();
  if (!snap.exists) snap = await db.collection('assignedFees').doc(feeId).get();
  return snap.exists ? { ref: snap.ref, data: snap.data() } : null;
}
async function feeContext(request, feeId, data) {
  fail(policy.rejectClientAmounts(data));
  const callerResult = policy.callerAuthority({ authUid: request.auth.uid, profile: await profile(request.auth.uid) });
  fail(callerResult);
  const caller = callerResult.caller;
  const record = await fee(feeId);
  if (!record) throw new HttpsError('not-found', 'Fee record not found.');
  fail(policy.authorizeFeeBase({ caller, fee: record.data, feeId }));
  let students = [];
  const q = db.collection('students').where('tenantId', '==', caller.tenantId);
  const matches = caller.role === 'student'
    ? await q.where('email', '==', caller.email).get()
    : caller.role === 'parent' ? await q.where('parentId', '==', caller.uid).get() : null;
  if (matches) students = matches.docs.map((doc) => doc.data());
  fail(policy.authorizeFeeOwnership({ caller, fee: record.data, studentMatches: students, parentMatches: students }));
  const payable = policy.feePayable(record.data);
  fail(payable);
  return { caller, record, payable };
}
function signature(orderId, paymentId, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const actual = Buffer.from(String(signature), 'hex');
  const wanted = Buffer.from(expected, 'hex');
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}
function renewal(value) {
  const stored = value ? new Date(value) : new Date();
  const base = Number.isNaN(stored.getTime()) ? new Date() : stored;
  const start = base.getTime() > Date.now() ? base : new Date();
  return new Date(start.getTime() + 31536000000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
async function createOrder(kind, resourceId, context) {
  const field = kind === 'fee' ? 'feeId' : 'subId';
  let order;
  try {
    order = await client().orders.create({ amount: context.payable.payablePaise, currency: 'INR', receipt: `${kind}_${resourceId}`.slice(0, 40), notes: { [field]: resourceId } });
  } catch (error) {
    throw new HttpsError('internal', 'Razorpay Test order creation failed.');
  }
  if (!order?.id || !String(order.id).startsWith('order_')) throw new HttpsError('internal', 'Razorpay did not return a valid order id.');
  await db.collection('razorpay_orders').doc(order.id).set({ orderId: order.id, kind, [field]: resourceId, tenantId: context.tenantId || '', userId: context.userId, amount: order.amount, amountPaise: context.payable.payablePaise, currency: order.currency, status: order.status || 'created', createdAt: FieldValue.serverTimestamp() });
  return { id: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt, status: order.status, [field]: resourceId };
}

exports.getRazorpayPublicKey = onCall({ region: REGION, secrets: [KEY_ID] }, async (request) => { auth(request); return { keyId: KEY_ID.value() }; });
exports.createErpUser = onCall({ region: REGION }, async (request) => {
  const caller = auth(request);
  const data = request.data || {};
  const callerProfile = await profile(caller.uid);
  const role = String(data.role || '').trim().toLowerCase();
  const tenantId = data.tenantId ? id(data.tenantId) : null;
  const assignment = userProvisioningPolicy.authorizeUserRoleAssignment({
    callerProfile,
    role,
    tenantId,
  });
  fail(assignment);

  const email = String(data.email || '').trim().toLowerCase();
  const name = String(data.name || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new HttpsError('invalid-argument', 'A valid email address is required.');
  }
  if (!name || name.length > 120) {
    throw new HttpsError('invalid-argument', 'A valid user name is required.');
  }

  const suppliedPassword = data.password == null || data.password === ''
    ? null
    : String(data.password);
  if (suppliedPassword && (suppliedPassword.length < 8 || suppliedPassword.length > 128)) {
    throw new HttpsError('invalid-argument', 'Password must be between 8 and 128 characters.');
  }

  const branchId = data.branchId ? id(data.branchId) : null;
  if (tenantId) {
    const tenantSnap = await db.collection('tenants').doc(tenantId).get();
    if (!tenantSnap.exists) {
      throw new HttpsError('not-found', 'The selected tenant does not exist.');
    }
  }
  if (branchId) {
    const branchSnap = await db.collection('branches').doc(branchId).get();
    if (!branchSnap.exists || branchSnap.data().tenantId !== tenantId) {
      throw new HttpsError('permission-denied', 'The selected branch does not belong to this tenant.');
    }
  }

  let createdUser;
  try {
    createdUser = await admin.auth().createUser({
      email,
      password: suppliedPassword || crypto.randomBytes(32).toString('base64url'),
      displayName: name,
    });
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'An account with this email already exists.');
    }
    console.error('Firebase Auth user provisioning failed:', error);
    throw new HttpsError('internal', 'Unable to create the Firebase account.');
  }

  const userProfile = {
    uid: createdUser.uid,
    email,
    name,
    role,
    tenantId,
    branchId,
    phone: String(data.phone || ''),
    avatar: String(data.avatar || ''),
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (role === 'teacher') {
    userProfile.subject = String(data.subject || '');
    userProfile.qualification = String(data.qualification || '');
  }
  if (role === 'admin' && Array.isArray(data.enabledModules)) {
    userProfile.enabledModules = data.enabledModules.filter((module) => typeof module === 'string');
  }
  if (role === 'admin' && data.schoolName) {
    userProfile.schoolName = String(data.schoolName);
  }

  try {
    await db.collection('users').doc(createdUser.uid).create(userProfile);
  } catch (error) {
    try {
      await admin.auth().deleteUser(createdUser.uid);
    } catch (cleanupError) {
      console.error('Failed to remove Firebase account after profile creation failed:', cleanupError);
    }
    console.error('Firestore ERP profile provisioning failed:', error);
    throw new HttpsError('internal', 'Unable to save the ERP user profile.');
  }

  return {
    user: { uid: createdUser.uid, email, displayName: name },
    profile: {
      id: createdUser.uid,
      ...userProfile,
      createdAt: null,
      updatedAt: null,
    },
  };
});
exports.createRazorpayOrder = onCall({ region: REGION, secrets: [KEY_ID, KEY_SECRET] }, async (request) => { const caller = auth(request); const data = request.data || {}; const feeId = id(data.feeId); const context = await feeContext(request, feeId, data); return createOrder('fee', feeId, { payable: context.payable, tenantId: context.caller.tenantId, userId: caller.uid }); });
exports.createSubscriptionOrder = onCall({ region: REGION, secrets: [KEY_ID, KEY_SECRET] }, async (request) => { const caller = auth(request); const data = request.data || {}; const subId = id(data.subId); fail(policy.rejectClientAmounts(data, ['amount', 'totalDue', 'amountPaid', 'planPrice'])); const callerResult = policy.callerAuthority({ authUid: caller.uid, profile: await profile(caller.uid) }); fail(callerResult); const snap = await db.collection('subscriptions').doc(subId).get(); fail(policy.authorizeSubscription({ caller: callerResult.caller, sub: snap.data(), subId })); const payable = policy.subscriptionPayable(snap.data()); fail(payable); return createOrder('subscription', subId, { payable, tenantId: snap.data()?.tenantId || snap.data()?.college || '', userId: caller.uid }); });

exports.verifyRazorpayPayment = onCall({ region: REGION, secrets: [KEY_ID, KEY_SECRET] }, async (request) => {
  const caller = auth(request);
  const data = request.data || {};
  const orderId = String(data.orderId || '').trim();
  const paymentId = String(data.paymentId || '').trim();
  const sig = String(data.signature || '').trim();
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(paymentId) || !/^[a-f0-9]{64}$/i.test(sig)) throw new HttpsError('invalid-argument', 'A complete Razorpay payment response is required.');
  if (!signature(orderId, paymentId, sig, KEY_SECRET.value())) throw new HttpsError('permission-denied', 'Invalid payment signature.');
  const existing = await db.collection('razorpay_payments').doc(paymentId).get();
  if (existing.exists) {
    const prior = existing.data();
    if (prior.orderId !== orderId) throw new HttpsError('permission-denied', 'Payment is bound to another order.');
    if (prior.status === 'verified') return prior.receipt;
    throw new HttpsError('failed-precondition', 'Payment is already being processed.');
  }
  const orderSnap = await db.collection('razorpay_orders').doc(orderId).get();
  if (!orderSnap.exists) throw new HttpsError('failed-precondition', 'Order is not tracked by the backend.');
  const order = orderSnap.data();
  const kind = data.subId ? 'subscription' : 'fee';
  const field = kind === 'fee' ? 'feeId' : 'subId';
  const resourceId = id(data[field]);
  if (String(order[field]) !== resourceId) throw new HttpsError('permission-denied', 'Payment does not belong to this record.');
  if (String(order.userId) !== caller.uid) throw new HttpsError('permission-denied', 'Payment belongs to another authenticated user.');
  if (Number(order.amountPaise) !== Number(order.amount)) throw new HttpsError('failed-precondition', 'Order amount binding is invalid.');
  let receipt;
  if (kind === 'fee') {
    const context = await feeContext(request, resourceId, data);
    if (Number(context.payable.payablePaise) !== Number(order.amountPaise)) throw new HttpsError('failed-precondition', 'Fee amount changed after order creation.');
    const applied = policy.applyFeePayment(context.record.data, { amount: context.payable.payablePaise });
    fail(applied);
    receipt = { verified: true, kind: 'fee', feeId: resourceId, paymentId, orderId, status: applied.fee.status, amountPaid: applied.fee.amountPaid, totalDue: applied.fee.totalDue };
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(context.record.ref);
      if (!fresh.exists) throw new HttpsError('not-found', 'Fee record not found.');
      const current = policy.feePayable(fresh.data());
      if (!current.ok || current.payablePaise !== context.payable.payablePaise) throw new HttpsError('failed-precondition', 'Fee amount changed during verification.');
      const result = policy.applyFeePayment(fresh.data(), { amount: current.payablePaise });
      if (!result.ok) fail(result);
      tx.update(context.record.ref, result.fee);
      tx.update(orderSnap.ref, { status: 'paid', paymentId, paidAt: FieldValue.serverTimestamp() });
      tx.set(db.collection('razorpay_payments').doc(paymentId), { paymentId, orderId, status: 'verified', receipt, createdAt: FieldValue.serverTimestamp() });
    });
    receipt = (await db.collection('razorpay_payments').doc(paymentId).get()).data().receipt;
  } else {
    const subSnap = await db.collection('subscriptions').doc(resourceId).get();
    const callerResult = policy.callerAuthority({ authUid: caller.uid, profile: await profile(caller.uid) });
    fail(callerResult);
    fail(policy.authorizeSubscription({ caller: callerResult.caller, sub: subSnap.data(), subId: resourceId }));
    const payable = policy.subscriptionPayable(subSnap.data());
    fail(payable);
    if (payable.payablePaise !== Number(order.amountPaise)) throw new HttpsError('failed-precondition', 'Subscription amount changed after order creation.');
    receipt = { verified: true, kind: 'subscription', subId: resourceId, paymentId, orderId, status: 'Active', expiryDate: renewal(subSnap.data()?.expiryDate) };
    await db.runTransaction(async (tx) => {
      const current = await tx.get(subSnap.ref);
      const currentPayable = policy.subscriptionPayable(current.data());
      if (!currentPayable.ok || currentPayable.payablePaise !== payable.payablePaise) throw new HttpsError('failed-precondition', 'Subscription amount changed during verification.');
      tx.update(subSnap.ref, { status: 'Active', expiryDate: receipt.expiryDate });
      tx.update(orderSnap.ref, { status: 'paid', paymentId, paidAt: FieldValue.serverTimestamp() });
      tx.set(db.collection('razorpay_payments').doc(paymentId), { paymentId, orderId, status: 'verified', receipt, createdAt: FieldValue.serverTimestamp() });
    });
  }
  return receipt;
});
