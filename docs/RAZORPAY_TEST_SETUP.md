# Razorpay Test Mode — Setup & Verification Guide (Issue #19)

> Test Mode only. Never use live credentials here, never commit secrets,
> never paste the Key Secret into source code or chat.

## 1. Get Razorpay Test credentials

1. Sign in to the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Ensure **Test Mode** is ON (toggle in the left nav — never use Live Mode).
3. Go to **Settings → API Keys → Generate Test Key**.
4. Copy the **Key ID** (`rzp_test_...`) and **Key Secret** (shown once).

## 2. Configure secrets (the ONLY place the secret lives)

The Key Secret exists **only** as a Firebase Functions secret — it is never
bundled into the Vite/React app and never committed.

```powershell
# From d:\Student-ERP (requires firebase CLI login + Blaze plan*)
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
```

Paste the Test Key ID / Test Key Secret when prompted. Verify with:

```powershell
firebase functions:secrets:access RAZORPAY_KEY_ID --project cafe-265bd
# (Do NOT print the secret value in shared logs.)
```

\* Cloud Functions need the **Blaze (pay-as-you-go)** plan for outbound calls
to `api.razorpay.com`. Test-Mode order calls cost nothing from Razorpay.

### Local frontend fallback (optional, Key ID only)

```powershell
Copy-Item .env.example .env.local
# Edit .env.local and set VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

`.env.local` is git-ignored. **Never put `RAZORPAY_KEY_SECRET` in any `.env`
file** — `VITE_` variables ship to the browser.

## 3. Install + deploy the backend

```powershell
cd functions
npm install
cd ..
firebase deploy --only functions
```

Expected functions (region `asia-south1`):

| Function | Purpose |
|---|---|
| `getRazorpayPublicKey` | Returns public Test Key ID only |
| `createRazorpayOrder` | Fee flow: takes ONLY `feeId`; loads `fees/{feeId}` (+ `assignedFees` fallback), authorizes caller, derives payable server-side, creates REAL Test order (`order_...`), binds order→fee→tenant→user→amount |
| `createSubscriptionOrder` | Subscription flow: takes ONLY `subId`; loads `subscriptions/{subId}`, superadmin-only, authoritative plan amount, one stable `subId` end-to-end |
| `verifyRazorpayPayment` | HMAC-SHA256 verifies `order_id\|payment_id`, enforces order↔resource binding + `paymentId` idempotency inside ONE Firestore transaction, renews subscriptions server-side. ONLY this path marks Paid/renewed |

New server-side Firestore collections: `razorpay_orders` (bound to fee/sub), `razorpay_payments` (doc id = `paymentId`, idempotency key).

## 4. Frontend flow (already wired — no UI changes needed)

`initiateFeePayout` / `initiatePlatformSubscriptionCheckout` in
`src/services/razorpayService.js` now (frontend sends identifiers ONLY — no
amounts, no tenantId, no identity fields):

1. Fee flow: `createRazorpayOrder({ feeId })` → backend authorizes + derives
   payable → real `order_id`.
   Subscription flow: `createSubscriptionOrder({ subId })` → backend checks
   superadmin + plan amount → real `order_id` (one stable `subId`, no
   `Date.now()` ids).
2. Open Checkout with `order_id` (Key ID from `getRazorpayPublicKey`).
3. Forward raw `razorpay_payment_id / razorpay_order_id / razorpay_signature`
   to `verifyRazorpayPayment` — no `pay_test_*` / `simulated_sig` fallbacks.
4. `onSuccess` fires ONLY on `{ verified: true }`; Firestore was already
   updated server-side; a PDF receipt is generated.
5. `payment.failed` / modal dismiss / any error → `onFailure`, nothing marked Paid.

## 5. Test-Mode verification script (the 9 checks from Issue #19)

1. **Create a test order** — pay any fee in the app with DevTools Network open;
   confirm a `createRazorpayOrder` callable request succeeds.
2. **Real order id** — confirm the response `id` starts with `order_` (not
   `order_rzp_`).
3. **Open Checkout** — the Razorpay modal opens with Test Mode banner.
4. **Complete a test payment** — use Razorpay test cards (`4111 1111 1111 1111`,
   any future expiry/CVV) or test UPI.
5. **Response reaches backend** — confirm a `verifyRazorpayPayment` callable
   request carries all three fields.
6. **Valid signature accepted** — response `{ verified: true, status: 'Paid' }`,
   `fees/{feeId}` updated, receipt PDF downloads.
7. **Tampered signature rejected** — re-send the callable with one hex char
   changed; expect `permission-denied: Payment signature verification failed`
   and NO Firestore change.
8. **Firestore gated on verification** — `fees` doc contains `razorpayOrderId`,
   `razorpaySignature`, `verifiedAt` only after success.
9. **Cancellation safe** — close the modal / fail the payment; `onFailure`
   fires and the fee stays unpaid.

## 6. Automated checks in this repo

```powershell
node src/tests/razorpayVerification.test.js   # HMAC vector + tamper/missing/fake-id tests (7/7)
node src/tests/razorpayPolicy.test.js         # Attack simulations: amount tamper, cross-tenant,
                                              # cross-student, parent, replay, binding, subscription (23 checks)
npm test        # full suite (includes both files above)
npm run lint    # oxlint
npm run build   # vite production build
```

Security model (enforced in `functions/policy.js`, wired in `functions/index.js`):
frontend sends identifiers ONLY (`feeId` for fees, `subId` for subscriptions).
Any client `amount/totalDue/amountPaid/tenantId/identity` field is REJECTED.
Payable amounts come from `fees/{feeId}` (`totalDue − amountPaid`) or
`subscriptions/{subId}` (`amount`). Caller authority comes from
`users/{uid}` (role + tenantId). Student ownership = `students.email` →
`rollNo`; parent ownership = `students.parentId == uid` → `rollNo`s; legacy
fee docs without `rollNo` are fail-closed for student/parent roles.
Verification runs HMAC first, then ONE Firestore transaction enforcing
order↔resource binding with `razorpay_payments/{paymentId}` idempotency.

## 7. Limitations

- End-to-end live testing needs the two secrets set + `firebase deploy --only
  functions` on a Blaze-plan project (not done from this checkout).
- Webhook (`payment.captured`) auto-reconciliation is intentionally out of
  scope: the synchronous callable verification covers the required flow.
- The old client mocks (`order_rzp_*`, unconditional `verified: true`,
  `verifyWebhookSignature` stub, hardcoded test Key ID) are deleted.
