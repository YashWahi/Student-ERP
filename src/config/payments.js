// src/config/payments.js
//
// Student-ERP — payment backend configuration (Issue #19).
// Contains NO secrets. The Razorpay Key Secret lives ONLY in Firebase
// Functions secrets (RAZORPAY_KEY_SECRET) and is never bundled into the app.

/**
 * Region where the Razorpay Cloud Functions are deployed.
 * Must match FUNCTIONS_REGION in functions/index.js.
 */
export const FUNCTIONS_REGION = 'asia-south1';

/** Callable Cloud Function names (see functions/index.js). */
export const RAZORPAY_FUNCTIONS = {
  getPublicKey: 'getRazorpayPublicKey',
  createOrder: 'createRazorpayOrder',
  createSubscriptionOrder: 'createSubscriptionOrder',
  verifyPayment: 'verifyRazorpayPayment',
};

/**
 * Public Razorpay Test Key ID override for local development.
 * Preferred source is the getRazorpayPublicKey callable; this env var is only a
 * fallback so Checkout can initialise when functions are unreachable offline.
 * NEVER put a Key Secret in any VITE_ variable — it would ship to the browser.
 */
export const FALLBACK_RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
