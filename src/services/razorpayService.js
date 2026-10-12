// src/services/razorpayService.js
//
// Student-ERP — Razorpay Test Mode frontend client (Issue #19).
//
// Secure flow: Frontend -> Cloud Functions backend -> Razorpay Test API ->
// real order_id -> Razorpay Checkout -> backend HMAC verification ->
// Firestore payment update (server-side, Admin SDK).
//
// SECURITY RULES enforced here:
// - The Key Secret is NEVER present in this file or any frontend code.
// - No fake order ids (order_rzp_*) or fabricated payment ids (pay_test_*).
// - No client-side "verified: true" — only the backend verdict marks Paid.
// - Firestore writes happen server-side in verifyRazorpayPayment; the frontend
//   only generates the PDF receipt + UI updates after backend confirmation.
import toast from 'react-hot-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { FALLBACK_RAZORPAY_KEY_ID, RAZORPAY_FUNCTIONS } from '../config/payments';
import { generateFeeReceiptPDF } from './pdfService';

const fn = (name) => httpsCallable(functions, name);

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Resolve the public Razorpay Test Key ID (safe for browser use).
 * Primary source: getRazorpayPublicKey callable. Falls back to the
 * VITE_RAZORPAY_KEY_ID env override for local dev only.
 */
export const getRazorpayKeyId = async () => {
  try {
    const res = await fn(RAZORPAY_FUNCTIONS.getPublicKey)({});
    if (res?.data?.keyId) return res.data.keyId;
  } catch (err) {
    console.warn('getRazorpayPublicKey callable failed, using env fallback:', err?.message || err);
  }
  if (FALLBACK_RAZORPAY_KEY_ID) return FALLBACK_RAZORPAY_KEY_ID;
  throw new Error(
    'Razorpay Test Key ID is not configured. Deploy the payment functions and set the RAZORPAY_KEY_ID secret.',
  );
};

/**
 * 1. Create Razorpay Order — via backend ONLY.
 * FEE FLOW: the ONLY client input is feeId. The backend loads the
 * authoritative fee record, authorizes the caller, derives the payable
 * server-side and returns the REAL Razorpay-issued order (order_...).
 * Any client amount/tenant/identity field is REJECTED server-side, so this
 * function deliberately sends no amounts at all. Throws on failure so
 * Checkout never opens with a fake or missing order id.
 */
export const createRazorpayOrder = async ({ feeId }) => {
  if (!feeId) {
    throw new Error('A fee identifier is required to create an order.');
  }
  let res;
  try {
    res = await fn(RAZORPAY_FUNCTIONS.createOrder)({ feeId });
  } catch (err) {
    throw new Error(extractCallableMessage(err, 'Failed to create Razorpay order. Please try again.'));
  }
  const order = res?.data;
  if (!order?.id || !String(order.id).startsWith('order_')) {
    throw new Error('Backend did not return a valid Razorpay order id.');
  }
  return order;
};

/**
 * 1b. Create Subscription Order — via backend ONLY. Same authority model:
 * the ONLY client input is subId; the plan amount comes from
 * subscriptions/{subId} server-side. Superadmin-only.
 */
export const createSubscriptionOrder = async ({ subId }) => {
  if (!subId) {
    throw new Error('A subscription identifier is required to create an order.');
  }
  let res;
  try {
    res = await fn(RAZORPAY_FUNCTIONS.createSubscriptionOrder)({ subId });
  } catch (err) {
    throw new Error(extractCallableMessage(err, 'Failed to create subscription order. Please try again.'));
  }
  const order = res?.data;
  if (!order?.id || !String(order.id).startsWith('order_')) {
    throw new Error('Backend did not return a valid Razorpay order id.');
  }
  return order;
};

/**
 * Extract a human-readable message from a callable HttpsError.
 */
export const extractCallableMessage = (err, fallback) => {
  const details = err?.details;
  if (typeof details === 'string' && details.trim()) return details;
  const message = err?.message || '';
  // firebase/functions prefixes callable failures; prefer the server message.
  const match = message.match(/(invalid-argument|failed-precondition|unauthenticated|permission-denied|internal|unavailable)\s*[:\-]?\s*(.+)$/i);
  if (match && match[2]) return match[2].trim();
  if (message && !/^internal$/i.test(message.trim())) return message;
  return fallback;
};

/**
 * 2. Verify payment signature — via backend ONLY.
 * Sends ONLY identifiers + the RAW Razorpay triple (all required) to
 * verifyRazorpayPayment. The backend HMAC-verifies, re-authorizes the caller,
 * re-derives amounts, enforces order<->resource binding + idempotency, and —
 * for subscriptions — renews server-side. Firestore writes happen ONLY there.
 * This function throws on any rejection — the caller must NOT mark anything
 * Paid when this rejects.
 */
export const verifyPaymentSignature = async ({
  paymentId,
  orderId,
  signature,
  feeId,
  subId,
}) => {
  if (!paymentId || !orderId || !signature) {
    throw new Error('Incomplete payment response from Razorpay. Missing payment id, order id or signature.');
  }
  const hasFee = feeId !== undefined && feeId !== null && feeId !== '';
  const hasSub = subId !== undefined && subId !== null && subId !== '';
  if ((hasFee && hasSub) || (!hasFee && !hasSub)) {
    throw new Error('Exactly one of feeId or subId is required for verification.');
  }
  let res;
  try {
    res = await fn(RAZORPAY_FUNCTIONS.verifyPayment)({
      orderId,
      paymentId,
      signature,
      ...(hasFee ? { feeId } : { subId }),
    });
  } catch (err) {
    throw new Error(extractCallableMessage(err, 'Payment signature verification failed.'));
  }
  if (!res?.data?.verified) {
    throw new Error('Payment could not be verified by the server.');
  }
  return res.data;
};

/**
 * Open Razorpay Checkout for a backend-created order and verify the result.
 * Shared by fee payments and subscription renewals so both get real order_ids,
 * mandatory server verification, cancellation handling and identical UX.
 * Identity/amount context lives SERVER-side: the frontend passes only the
 * resource id (feeId XOR subId) plus display metadata for the receipt.
 */
const openVerifiedCheckout = async ({
  keyId,
  orderData,
  name,
  description,
  prefill,
  resourceRef,
  receiptMeta,
  onSuccess,
  onFailure,
}) => {
  const options = {
    key: keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name,
    description,
    order_id: orderData.id,
    image: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
    handler: async function (response) {
      try {
        // No fallbacks: a missing field means an unverifiable payment.
        const verified = await verifyPaymentSignature({
          paymentId: response?.razorpay_payment_id,
          orderId: response?.razorpay_order_id || orderData.id,
          signature: response?.razorpay_signature,
          ...resourceRef,
        });

        // Firestore is already updated server-side; generate the PDF receipt.
        // IMPORTANT: generateFeeReceiptPDF is async (awaits QR code rendering).
        // It MUST be awaited so that failures are caught and the receipt is not
        // silently lost. onSuccess is only called after the PDF attempt settles.
        try {
          await generateFeeReceiptPDF({
            receiptNo: verified.txnId,
            studentName: receiptMeta.studentName,
            rollNo: receiptMeta.rollNo,
            className: receiptMeta.className,
            feeType: receiptMeta.feeType,
            amount: verified.amountPaid,
            paymentMethod: 'Online (Razorpay)',
          });
        } catch (pdfErr) {
          // Receipt generation failure must NOT prevent the success callback —
          // payment is already verified server-side — but it must be surfaced so
          // the user is not left without a receipt without any indication.
          console.warn('Receipt PDF generation failed:', pdfErr?.message || pdfErr);
          toast.error('Payment recorded, but the receipt PDF could not be generated. Please contact support.');
        }

        onSuccess && onSuccess({
          paymentId: verified.txnId,
          orderId: verified.orderId,
          signature: response?.razorpay_signature,
          amount: verified.amountPaid,
          status: verified.status,
          expiryDate: verified.expiryDate,
          ...receiptMeta.extra,
        });
      } catch (err) {
        onFailure && onFailure(err);
      }
    },
    prefill,
    theme: { color: '#2563EB' },
    modal: {
      ondismiss: function () {
        onFailure && onFailure(new Error('Payment window closed before completion. No amount was charged.'));
      },
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (resp) {
    const reason = resp?.error?.description || 'Payment failed. No amount was marked as paid.';
    onFailure && onFailure(new Error(reason));
  });
  rzp.open();
};

// __PART3__ (openVerifiedCheckout ends above)

/**
 * 3. Initiate Student Online Fee Payout via Razorpay Checkout.
 * Same signature/UI contract as before (extra amount/tenant/display args are
 * accepted for backwards compatibility but NEVER sent to the backend):
 * backend order (feeId only) -> Checkout with the REAL order_id ->
 * server verification -> onSuccess ONLY when verified.
 */
export const initiateFeePayout = async ({
  tenantId = 'tenant_gvis',
  studentId,
  studentName,
  rollNo,
  className,
  feeId,
  amount,
  feeType,
  totalDue,
  parentEmail,
  parentPhone,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error('Razorpay SDK failed to load. Please check your internet connection.');
    onFailure && onFailure(new Error('SDK load failed'));
    return;
  }

  try {
    if (!feeId) {
      throw new Error('A fee identifier is required to start the payment.');
    }

    // 1. Real backend order for the AUTHORITATIVE payable (throws on failure —
    //    Checkout never opens). Only the feeId leaves the browser.
    const orderData = await createRazorpayOrder({ feeId });

    const keyId = await getRazorpayKeyId();

    // 2+3. Checkout with the REAL order_id, then server verification.
    await openVerifiedCheckout({
      keyId,
      orderData,
      name: 'EduERP Pro — Online Fee Payment',
      description: `${feeType || 'Tuition Fee'} for ${studentName} (${rollNo || 'Student'})`,
      prefill: {
        name: studentName,
        email: parentEmail || 'parent@school.edu.in',
        contact: parentPhone || '9876543210',
      },
      resourceRef: { feeId },
      receiptMeta: {
        studentName,
        rollNo,
        className,
        feeType: feeType || 'Tuition & Exam Fee',
        extra: { studentId },
      },
      onSuccess,
      onFailure,
    });
  } catch (err) {
    console.error('Razorpay payment error:', err);
    onFailure && onFailure(err);
  }
};

// __PART4__ (initiateFeePayout ends above)

/**
 * 4. Initiate Platform SaaS Subscription Checkout.
 * Secure path: real backend order for the AUTHORITATIVE plan amount from
 * subscriptions/{subId} (superadmin-only) + mandatory server verification +
 * server-side renewal. The browser never renews by itself.
 * The caller passes subId (stable identifier — no Date.now ids). Legacy
 * display args (tenantId/collegeName/planTier/amount) are accepted for UI
 * text only and are NEVER sent to the backend.
 */
export const initiatePlatformSubscriptionCheckout = async ({
  subId,
  tenantId,
  collegeName,
  planTier,
  amount,
  adminEmail,
  onSuccess,
  onFailure,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error('Razorpay SDK failed to load.');
    onFailure && onFailure(new Error('SDK load failed'));
    return;
  }

  try {
    if (!subId) {
      throw new Error('A subscription identifier is required to start the payment.');
    }

    // One stable identifier end-to-end: subId -> order -> verify -> renewal.
    const orderData = await createSubscriptionOrder({ subId });

    const keyId = await getRazorpayKeyId();

    await openVerifiedCheckout({
      keyId,
      orderData,
      name: 'EduERP SaaS Platform',
      description: `${planTier || 'Subscription'} Plan Renewal for ${collegeName || subId}`,
      prefill: { name: collegeName, email: adminEmail },
      resourceRef: { subId },
      receiptMeta: {
        studentName: collegeName || subId,
        rollNo: tenantId || '',
        className: 'SaaS Subscription',
        feeType: `${planTier || 'Subscription'} Plan Renewal`,
        extra: { tenantId, amount, planTier, subId },
      },
      onSuccess,
      onFailure,
    });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    onFailure && onFailure(err);
  }
};
