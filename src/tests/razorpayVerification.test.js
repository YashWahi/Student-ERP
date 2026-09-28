// src/tests/razorpayVerification.test.js
//
// Offline unit tests for the Razorpay HMAC-SHA256 verification logic
// (Issue #19). Mirrors the server algorithm in functions/index.js via the
// shared helper in src/services/razorpayVerify.js — no network, no secrets.
//
// Run: node src/tests/razorpayVerification.test.js
// (Also appended to the `npm test` chain in package.json.)

import { createHmac } from 'node:crypto';
import {
  computeRazorpaySignature,
  signaturesMatch,
  verifyRazorpaySignatureOffline,
} from '../services/razorpayVerify.js';

console.log('🧪 Running Razorpay Signature Verification Unit Tests...\n');

// ---- Fixture: a known-good vector generated with Node crypto (ground truth).
const TEST_SECRET = 'test_secret_for_unit_tests_only';
const ORDER_ID = 'order_NTestOrder12345';
const PAYMENT_ID = 'pay_NTestPayment67890';
const VALID_SIGNATURE = createHmac('sha256', TEST_SECRET)
  .update(`${ORDER_ID}|${PAYMENT_ID}`)
  .digest('hex');

// Test 1: helper reproduces the Razorpay documented HMAC vector.
const computed = await computeRazorpaySignature({
  orderId: ORDER_ID,
  paymentId: PAYMENT_ID,
  keySecret: TEST_SECRET,
});
if (computed !== VALID_SIGNATURE) {
  throw new Error(`FAIL: HMAC vector mismatch.\n expected: ${VALID_SIGNATURE}\n actual:   ${computed}`);
}
console.log('  ✅ HMAC-SHA256(order_id|payment_id) matches Razorpay documented algorithm');

// Test 2: valid signature is accepted.
const ok = await verifyRazorpaySignatureOffline({
  orderId: ORDER_ID,
  paymentId: PAYMENT_ID,
  signature: VALID_SIGNATURE,
  keySecret: TEST_SECRET,
});
if (!ok.verified) throw new Error(`FAIL: valid signature rejected: ${JSON.stringify(ok)}`);
console.log('  ✅ Valid signature accepted');

// Test 3: tampered signature is rejected.
const tampered = `${VALID_SIGNATURE.slice(0, -1)}${VALID_SIGNATURE.endsWith('0') ? '1' : '0'}`;
const bad = await verifyRazorpaySignatureOffline({
  orderId: ORDER_ID,
  paymentId: PAYMENT_ID,
  signature: tampered,
  keySecret: TEST_SECRET,
});
if (bad.verified) throw new Error('FAIL: tampered signature was accepted');
console.log('  ✅ Tampered signature rejected');

// Test 4: wrong secret is rejected.
const wrongSecret = await verifyRazorpaySignatureOffline({
  orderId: ORDER_ID,
  paymentId: PAYMENT_ID,
  signature: VALID_SIGNATURE,
  keySecret: 'some_other_secret',
});
if (wrongSecret.verified) throw new Error('FAIL: signature with wrong secret was accepted');
console.log('  ✅ Wrong-secret signature rejected');

// Test 5: missing fields are rejected (never verified:true on partial input).
for (const partial of [
  { paymentId: PAYMENT_ID, signature: VALID_SIGNATURE, keySecret: TEST_SECRET },
  { orderId: ORDER_ID, signature: VALID_SIGNATURE, keySecret: TEST_SECRET },
  { orderId: ORDER_ID, paymentId: PAYMENT_ID, keySecret: TEST_SECRET },
]) {
  const r = await verifyRazorpaySignatureOffline(partial);
  if (r.verified) throw new Error(`FAIL: partial input accepted: ${JSON.stringify(partial)}`);
}
console.log('  ✅ Missing payment fields rejected');

// Test 6: fabricated client-side ids (order_rzp_*, pay_test_*) are rejected.
const fake = await verifyRazorpaySignatureOffline({
  orderId: `order_rzp_${Date.now()}`,
  paymentId: `pay_test_${Date.now()}`,
  signature: 'simulated_sig',
  keySecret: TEST_SECRET,
});
if (fake.verified) throw new Error('FAIL: fabricated order_rzp_/pay_test_ ids were accepted');
console.log('  ✅ Fabricated order_rzp_/pay_test_ ids rejected');

// Test 7: constant-time comparator sanity.
if (!signaturesMatch('abcdef1234', 'abcdef1234')) throw new Error('FAIL: equal strings not matched');
if (signaturesMatch('abcdef1234', 'abcdef1235')) throw new Error('FAIL: differing strings matched');
if (signaturesMatch('abc', 'abcd')) throw new Error('FAIL: different-length strings matched');
console.log('  ✅ Constant-time signature comparison behaves correctly');

console.log('\n✨ ALL RAZORPAY VERIFICATION TESTS PASSED!');
