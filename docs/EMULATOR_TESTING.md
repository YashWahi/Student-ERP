# Firebase Emulator — real Razorpay TEST API without Blaze
#
# The payment function always calls the real Razorpay Node SDK. With the
# Functions Emulator, the function process can make outbound HTTPS requests;
// From repository root:
//   Copy-Item .env.example .env.local
//   npm install
//   npm run dev
//
// .env.local selects demo-test and connects Auth/Firestore/Functions to the
// local emulators. The browser receives no Razorpay Key Secret.
# this does not deploy anything and does not require the Blaze plan.
#
# ---------------------------------------------------------------------------
# 1. Install dependencies
# ---------------------------------------------------------------------------
# cd functions
# npm install
# cd ..
#
# ---------------------------------------------------------------------------
# 2. Configure local TEST credentials
# ---------------------------------------------------------------------------
# Copy functions/.env.example to functions/.env.demo-test.local.
# Put ONLY your Razorpay Test Key ID and Test Key Secret in that file:
#
#   RAZORPAY_KEY_ID=rzp_test_<your-test-key-id>
#   RAZORPAY_KEY_SECRET=<your-test-key-secret>
#
# The file is ignored by Git. Never place real values in .env.example or any
# committed file. The Functions Emulator loads .env.<project>.local when the
# emulator project is demo-test. For another project id, use that exact id in
# the filename (for example .env.cafe-265bd.local), or export the two variables
# in the emulator shell.
#
# ---------------------------------------------------------------------------
# 3. Start the emulators (no deploy, no Blaze)
# ---------------------------------------------------------------------------
# From the repository root:
#   npx firebase emulators:start --only auth,firestore,functions --project demo-test
#
# Do not set RAZORPAY_MOCK. There is no mock switch in functions/index.js.
# The standalone functions/razorpayMock.js is only an offline unit-test helper
# and is not imported by the payment callables.
#
# The emulator makes the real outbound request to Razorpay's Test API. The
# resulting order id must be a genuine order_... value returned by Razorpay.
# Emulator UI: http://127.0.0.1:4000
#
# ---------------------------------------------------------------------------
# 4. Seed emulator-only Auth and Firestore data
# ---------------------------------------------------------------------------
# In another terminal:
#   node scripts/emulator/seedEmulator.js
#
# The seed uses a local project only. It creates users, fees, and subscription
# records for authorized local testing; it does not touch the production
# project.
#
# ---------------------------------------------------------------------------
# 5. Start the React frontend
# ---------------------------------------------------------------------------
#   npm install
#   npm run dev
#
# Sign in using a seeded local user whose Firestore profile matches the target
# fee/subscription. The frontend obtains the public Test Key ID from the
# callable and opens Razorpay TEST Checkout with the order id returned by the
# callable. The Key Secret is never sent to the browser.
#
# ---------------------------------------------------------------------------
# 6. Complete and verify a real test payment
# ---------------------------------------------------------------------------
# 1. Trigger the existing Pay Fee action.
# 2. Copy the order id from the callable response or Firestore Emulator UI.
#    It must be an order_... id returned by Razorpay, not a locally generated
#    value.
# 3. Complete Razorpay TEST Checkout. Use a Razorpay test payment method; for
#    card testing use the Razorpay test card details supplied in the Razorpay
#    dashboard/docs (for example 4111 1111 1111 1111 with a future expiry and
#    any CVV, if the dashboard offers that test method).
# 4. Checkout returns razorpay_payment_id, razorpay_order_id, and
#    razorpay_signature. The frontend sends these identifiers to
#    verifyRazorpayPayment; it does not mark the fee Paid itself.
# 5. Confirm the response contains verified:true and status:Paid, then inspect
#    the Firestore Emulator:
#      fees/fee_emulator_001                       status: Paid
#      razorpay_orders/<real order id>             status: paid
#      razorpay_payments/<real payment id>        status: verified
#
# If the signature is invalid, the function returns permission-denied and the
# fee remains unchanged. Cancellation/dismissal does not write a payment record.
#
# ---------------------------------------------------------------------------
# 7. Negative and replay checks
# ---------------------------------------------------------------------------
# Duplicate verification: call the same verified triple again. The second call
# returns the original receipt and does not create another payment or fee
# transaction. Use the existing scripts as callable-level checks where useful;
# the browser flow is the authoritative real Checkout test.
# Invalid signature: alter one signature character. Expect permission-denied.
# Wrong amount: send a client amount such as 1. Expect invalid-argument because
# the callable derives the payable amount from Firestore only.
# Wrong fee/tenant: use another fee id or tenant. Expect permission-denied.
# Razorpay API failure: expect an internal error with no secret or key details.
#
# ---------------------------------------------------------------------------
# 8. Stop
# ---------------------------------------------------------------------------
# Press Ctrl+C. Nothing is deployed. Delete the local dotenv file when finished
# if desired; it is ignored and should never be committed.
#
# Deployment later uses Firebase Functions secrets, not the emulator dotenv:
#   firebase functions:secrets:set RAZORPAY_KEY_ID
#   firebase functions:secrets:set RAZORPAY_KEY_SECRET
#   firebase deploy --only functions
# The above is optional and is not part of local testing.

