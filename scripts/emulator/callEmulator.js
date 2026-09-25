// Creates ONLY a real Razorpay Test order through the Functions Emulator.
// This script never fabricates a payment ID, signature, or payment completion.
// Finish the payment in the real Razorpay TEST Checkout opened by the React app.
//
// Usage (after seedEmulator.js):
//   node scripts/emulator/createTestOrder.js
//   node scripts/emulator/createTestOrder.js subscription

const PROJECT = process.env.FIRESTORE_EMULATOR_PROJECT || 'demo-test';
const REGION = 'asia-south1';
const FN_BASE = `http://127.0.0.1:5001/${PROJECT}/${REGION}`;

async function signIn(email, password) {
  const response = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) },
  );
  if (!response.ok) throw new Error(`Sign-in failed: ${response.status} ${await response.text()}`);
  return (await response.json()).idToken;
}

async function call(name, token, data) {
  const response = await fetch(`${FN_BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  });
  const body = await response.text();
  console.log(`${name} -> HTTP ${response.status}`);
  console.log(body);
  if (!response.ok) process.exitCode = 1;
}

const subscription = process.argv[2] === 'subscription';
const token = subscription
  ? await signIn('super@test.local', 'super123')
  : await signIn('admin@test.local', 'admin123');

await call(subscription ? 'createSubscriptionOrder' : 'createRazorpayOrder', token,
  subscription ? { subId: 'sub_emulator_001' } : { feeId: 'fee_emulator_001' });
console.log('\nA genuine Razorpay Test order response is shown above. Complete payment only in Razorpay TEST Checkout; this script cannot verify or mark a payment Paid.');

