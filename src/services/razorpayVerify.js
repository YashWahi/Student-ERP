// src/services/razorpayVerify.js
//
// Shared, framework-free Razorpay HMAC-SHA256 verification helper (Issue #19).
//
// The production verification path runs server-side in
// functions/index.js (verifyRazorpayPayment) using Node crypto + timingSafeEqual.
// This module mirrors the exact algorithm so the offline unit test
// (src/tests/razorpayVerification.test.js) can prove the vector logic without
// network access or secrets. It is NOT a substitute for server verification and
// must never be used to mark a fee as Paid on its own.

/**
 * Compute the Razorpay payment signature for order_id|payment_id.
 * Uses WebCrypto (browser + Node 20) — no secret ever leaves the caller.
 */
export const computeRazorpaySignature = async ({ orderId, paymentId, keySecret }) => {
  if (!orderId || !paymentId || !keySecret) {
    throw new Error('orderId, paymentId and keySecret are all required.');
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(keySecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${orderId}|${paymentId}`));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Constant-time hex signature comparison (guards against timing attacks).
 * Returns false — never throws — for malformed input.
 */
export const signaturesMatch = (expectedHex, actualHex) => {
  if (typeof expectedHex !== 'string' || typeof actualHex !== 'string') return false;
  if (expectedHex.length !== actualHex.length || expectedHex.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i += 1) {
    diff |= expectedHex.charCodeAt(i) ^ actualHex.charCodeAt(i);
  }
  return diff === 0;
};

/**
 * Offline mirror of the server check: recompute + constant-time compare.
 * Rejects fabricated ids (order_rzp_*, pay_test_*) the same way the backend does.
 */
export const verifyRazorpaySignatureOffline = async ({ orderId, paymentId, signature, keySecret }) => {
  if (!orderId || !paymentId || !signature || !keySecret) {
    return { verified: false, reason: 'missing-fields' };
  }
  if (!String(orderId).startsWith('order_') || !String(paymentId).startsWith('pay_')) {
    return { verified: false, reason: 'invalid-id-format' };
  }
  const expected = await computeRazorpaySignature({ orderId, paymentId, keySecret });
  const verified = signaturesMatch(expected, String(signature));
  return verified ? { verified: true } : { verified: false, reason: 'signature-mismatch' };
};
