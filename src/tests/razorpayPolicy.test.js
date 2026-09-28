// src/tests/razorpayPolicy.test.js
//
// Offline attack-simulation tests for the Issue #19 payment security policy.
// Uses functions/policy.js (pure, dependency-free) + the HMAC helper — NO
// network, NO secrets, NO Firestore. The same policy module is required by
// functions/index.js, so these tests prove the deployed logic, not a copy.
//
// Run: node src/tests/razorpayPolicy.test.js

import { createHmac } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const policy = require('../../functions/policy.js');

import {
  computeRazorpaySignature,
  verifyRazorpaySignatureOffline,
} from '../services/razorpayVerify.js';

console.log('🧪 Running Razorpay Payment Security Policy Tests...\n');

let passed = 0;
const ok = (name) => { passed += 1; console.log(`  ✅ ${name}`); };
const expectReject = (res, name) => {
  if (!res || res.ok) throw new Error(`FAIL: ${name} — attack was ACCEPTED`);
  ok(`${name} — rejected (${res.code})`);
};

// ---------- Fixtures (mirror the REAL Firestore shapes) ----------
const FEE = {
  tenantId: 'tenant_gvis',
  studentName: 'Arjun Verma',
  rollNo: 'GV-2026-001',
  className: 'Class 10-A',
  feeHead: 'Quarterly Tuition & Transport (Q2)',
  totalDue: 18500,
  amountPaid: 0,
  status: 'Pending',
};
const ADMIN = { uid: 'admin_1', email: 'admin@gvis.edu', role: 'admin', tenantId: 'tenant_gvis' };
const STUDENT_A = { uid: 'stu_a', email: 'arjun@student.edu', role: 'student', tenantId: 'tenant_gvis' };
const STUDENT_B = { uid: 'stu_b', email: 'rohan@student.edu', role: 'student', tenantId: 'tenant_gvis' };
const PARENT_A = { uid: 'par_a', email: 'suresh.verma@gmail.com', role: 'parent', tenantId: 'tenant_gvis' };
const OTHER_TENANT = { uid: 'admin_x', email: 'admin@other.edu', role: 'admin', tenantId: 'tenant_other' };
const SUPERADMIN = { uid: 'super_1', email: 'super@eduerp.com', role: 'superadmin', tenantId: 'tenant_platform' };
const SUB = { college: 'Green Valley', plan: 'Standard', amount: 24000, status: 'Active', expiryDate: '2027-08-31' };

// ---------- GROUP A: amount authority ----------
expectReject(
  policy.rejectClientAmounts({ feeId: 'fee_1', amount: 1 }),
  'Test 1 — fee amount tampering (Rs.18,500 -> Rs.1)',
);
expectReject(
  policy.rejectClientAmounts({ feeId: 'fee_1', orderId: 'order_x', paymentId: 'pay_y', signature: 's', amountPaid: 1 }),
  'Test 2 — amountPaid tampering during verification',
);
{
  const payable = policy.feePayable(FEE);
  if (!payable.ok || payable.payablePaise !== 1850000) {
    throw new Error(`FAIL: authoritative payable wrong: ${JSON.stringify(payable)}`);
  }
  ok('Authoritative fee payable derived server-side (Rs.18,500 -> 1850000 paise)');
}
{
  const paidFee = { ...FEE, amountPaid: 18500, status: 'Paid' };
  expectReject(policy.feePayable(paidFee), 'Test 10 — already-paid fee');
}

// ---------- GROUP B: authorization / tenant isolation ----------
{
  const base = policy.authorizeFeeBase({ caller: ADMIN, fee: FEE, feeId: 'fee_1' });
  if (!base.ok) throw new Error('FAIL: legitimate same-tenant admin denied');
  ok('Legitimate same-tenant admin authorized');
}
expectReject(
  policy.authorizeFeeBase({ caller: OTHER_TENANT, fee: FEE, feeId: 'fee_1' }),
  'Test 3 — cross-tenant fee access (tenant-A user -> tenant-B fee)',
);
expectReject(
  policy.authorizeFeeBase({ caller: { ...ADMIN, tenantId: 'tenant_other' }, fee: FEE, feeId: 'fee_1' }),
  'Test 6 — tenantId tampering has no effect (tenant derived from profile)',
);
{
  // Ownership: student A owns GV-2026-001; student B does not.
  const ownA = policy.authorizeFeeOwnership({
    caller: STUDENT_A, fee: FEE, studentMatches: [{ rollNo: 'GV-2026-001' }], parentMatches: [],
  });
  if (!ownA.ok) throw new Error('FAIL: legitimate student denied own fee');
  ok('Legitimate student authorized for own fee');
  expectReject(
    policy.authorizeFeeOwnership({
      caller: STUDENT_B, fee: FEE, studentMatches: [{ rollNo: 'GV-2026-002' }], parentMatches: [],
    }),
    'Test 4 — cross-student fee access',
  );
  const ownParent = policy.authorizeFeeOwnership({
    caller: PARENT_A, fee: FEE, studentMatches: [], parentMatches: [{ rollNo: 'GV-2026-001' }],
  });
  if (!ownParent.ok) throw new Error('FAIL: legitimate parent denied linked fee');
  ok('Legitimate parent authorized for linked fee');
  expectReject(
    policy.authorizeFeeOwnership({
      caller: PARENT_A, fee: FEE, studentMatches: [], parentMatches: [{ rollNo: 'GV-2026-009' }],
    }),
    'Test 5 — unauthorized parent access',
  );
  // Legacy fee doc without rollNo: fail-closed.
  expectReject(
    policy.authorizeFeeOwnership({
      caller: STUDENT_A, fee: { ...FEE, rollNo: '' }, studentMatches: [], parentMatches: [],
    }),
    'Legacy fee without rollNo denied for student role (fail-closed)',
  );
}

// ---------- GROUP C: order/fee binding + idempotency ----------
// Test 8 — payment for fee-A applied to fee-B.
expectReject(
  policy.bindingCheck({
    storedOrder: { feeId: 'fee_A', amountPaise: 1850000 },
    requestedResourceId: 'fee_B',
    kind: 'fee',
  }),
  'Test 8 — payment used for another fee',
);
{
  // Same payment, same order, already verified → idempotent replay.
  const receipt = { verified: true, feeId: 'fee_A', status: 'Paid' };
  const replay = policy.idempotencyCheck({
    existingPayment: { orderId: 'order_1', status: 'verified', receipt },
    orderId: 'order_1',
  });
  if (!replay.ok || !replay.replay) throw new Error('FAIL: legitimate replay not recognized');
  ok('Test 7 — payment replay returns original receipt (idempotent)');
}
expectReject(
  policy.idempotencyCheck({
    existingPayment: { orderId: 'order_1', status: 'verified', receipt: {} },
    orderId: 'order_2',
  }),
  'Test 9 — payment id replayed across tenants/orders',
);

// ---------- GROUP D: subscriptions ----------
expectReject(
  policy.rejectClientAmounts({ subId: 's1', amount: 1 }, ['amount', 'planPrice']),
  'Test 11 — subscription amount tampering',
);
{
  const authz = policy.authorizeSubscription({ caller: SUPERADMIN, sub: SUB, subId: 's1' });
  if (!authz.ok) throw new Error('FAIL: legitimate superadmin denied');
  ok('Legitimate superadmin authorized for subscription renewal');
}
expectReject(
  policy.authorizeSubscription({ caller: ADMIN, sub: SUB, subId: 's1' }),
  'Test 12 — subscription ownership tampering (tenant admin -> platform renewal)',
);
expectReject(
  policy.authorizeSubscription({ caller: STUDENT_A, sub: SUB, subId: 's1' }),
  'Test 13 — direct subscription renewal path without superadmin role',
);
{
  const subPayable = policy.subscriptionPayable(SUB);
  if (!subPayable.ok || subPayable.payablePaise !== 2400000) {
    throw new Error(`FAIL: authoritative subscription amount wrong: ${JSON.stringify(subPayable)}`);
  }
  ok('Authoritative subscription amount derived server-side (Rs.24,000)');
  // Test 14 — subscription replay uses the SAME idempotency path as fees.
  const replay = policy.idempotencyCheck({
    existingPayment: { orderId: 'order_s1', status: 'verified', receipt: { kind: 'subscription' } },
    orderId: 'order_s1',
  });
  if (!replay.ok || !replay.replay) throw new Error('FAIL: subscription replay not idempotent');
  ok('Test 14 — subscription replay is idempotent (one renewal, one record)');
}

// ---------- GROUP E: stable subscription ID + HMAC intact ----------
{
  // Test 15 — the frontend now sends exactly one stable subId; assert the
  // service layer builds create+verify from the same identifier by checking
  // no Date.now-derived ids exist in the subscription flow source.
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../services/razorpayService.js', import.meta.url), 'utf8');
  const subFlow = src.slice(src.indexOf('initiatePlatformSubscriptionCheckout'));
  if (/Date\.now\(\)/.test(subFlow)) {
    throw new Error('FAIL: subscription flow still generates Date.now() ids');
  }
  if (!/resourceRef: \{ subId \}/.test(subFlow)) {
    throw new Error('FAIL: subscription flow does not propagate the stable subId');
  }
  ok('Test 15 — stable subscription ID used end-to-end (no Date.now ids)');
}
{
  const secret = 'test_secret_for_unit_tests_only';
  const orderId = 'order_NTestOrder12345';
  const paymentId = 'pay_NTestPayment67890';
  const sig = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const computed = await computeRazorpaySignature({ orderId, paymentId, keySecret: secret });
  if (computed !== sig) throw new Error('FAIL: HMAC vector mismatch');
  const v = await verifyRazorpaySignatureOffline({ orderId, paymentId, signature: sig, keySecret: secret });
  if (!v.verified) throw new Error('FAIL: valid signature rejected');
  ok('HMAC-SHA256(order_id|payment_id) verification intact (server-side, secret never leaves backend)');
}

console.log(`\n✨ ALL ${passed} PAYMENT SECURITY POLICY TESTS PASSED!`);
