// scripts/emulator/seedEmulator.js
//
// Seeds the local Firestore emulator with the minimum dataset needed to
// exercise the Razorpay callables end-to-end WITHOUT live credentials:
//   users/admin_test      -> { role: 'admin', tenantId: 'tenant_gvis' }
//   users/student         -> { role: 'student', tenantId: 'tenant_gvis' }
//   fees/fee_emulator_001 -> Pending fee, totalDue 18500, amountPaid 0
//   subscriptions/sub_emulator_001 -> Standard plan, amount 24000
//
// Also creates matching Auth emulator users.
//
// Run AFTER `firebase emulators:start`:
//   node scripts/emulator/seedEmulator.js
//
// Uses ONLY the Firestore/Auth emulator REST APIs (no extra npm deps).

const PROJECT = process.env.FIRESTORE_EMULATOR_PROJECT || 'demo-test';
const FIRESTORE_BASE =
  `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const AUTH_BASE =
  'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';

const post = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`${url} -> ${res.status} ${await res.text()}`);
  }

  return res.json();
};

const putDoc = async (collection, docId, fields) => {
  const res = await fetch(
    `${FIRESTORE_BASE}/${collection}/${docId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer owner',
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `seed ${collection}/${docId} -> ${res.status} ${await res.text()}`
    );
  }
};

const str = (v) => ({ stringValue: String(v) });
const num = (v) => ({ integerValue: String(v) });

const seed = async () => {
  // Auth users (passwords are emulator-local only, NOT real credentials).
  const accounts = [
    ['admin@test.local', 'admin123'],
    ['super@test.local', 'super123'],
    ['student@test.local', 'student123'],
  ];

  for (const [email, password] of accounts) {
    try {
      await post(
        `${AUTH_BASE}/accounts:signUp?key=fake-api-key`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );

      console.log(`auth user created: ${email}`);
    } catch (err) {
      console.log(
        `auth user skipped (${email}): ${err.message.slice(0, 120)}`
      );
    }
  }

  // Resolve Auth UIDs.
  const identities = {};

  for (const [email, password] of accounts) {
    let identity;

    try {
      identity = await post(
        `${AUTH_BASE}/accounts:signUp?key=fake-api-key`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );
    } catch (err) {
      identity = await post(
        `${AUTH_BASE}/accounts:signInWithPassword?key=fake-api-key`,
        {
          email,
          password,
          returnSecureToken: true,
        }
      );
    }

    identities[email] = identity.localId;
    console.log(`auth user ready: ${email}`);
  }

  const adminUid = identities['admin@test.local'];
  const superUid = identities['super@test.local'];
  const studentUid = identities['student@test.local'];

  // Admin profile.
  await putDoc('users', adminUid, {
    uid: str(adminUid),
    email: str('admin@test.local'),
    name: str('Emulator Admin'),
    role: str('admin'),
    tenantId: str('tenant_gvis'),
    branchId: str('branch_main'),
  });

  // Superadmin profile.
  await putDoc('users', superUid, {
    uid: str(superUid),
    email: str('super@test.local'),
    name: str('Emulator Superadmin'),
    role: str('superadmin'),
    tenantId: str('tenant_platform'),
    branchId: str('branch_main'),
  });

  // Legacy/test admin documents.
  await putDoc('users', 'admin_test', {
    uid: str('admin_test'),
    email: str('admin@test.local'),
    name: str('Emulator Admin'),
    role: str('admin'),
    tenantId: str('tenant_gvis'),
    branchId: str('branch_main'),
  });

  await putDoc('users', 'super_test', {
    uid: str('super_test'),
    email: str('super@test.local'),
    name: str('Emulator Superadmin'),
    role: str('superadmin'),
    tenantId: str('tenant_platform'),
    branchId: str('branch_main'),
  });

  // Student profile used for Razorpay ownership testing.
  await putDoc('users', studentUid, {
    uid: str(studentUid),
    email: str('student@test.local'),
    name: str('Arjun Verma'),
    role: str('student'),
    tenantId: str('tenant_gvis'),
    branchId: str('branch_main'),
  });

  // Student SIS record.
  // The Razorpay policy links the student's email to this roll number.
  await putDoc('students', studentUid, {
    tenantId: str('tenant_gvis'),
    email: str('student@test.local'),
    rollNo: str('GV-2026-001'),
    parentId: str(''),
    parentName: str('Emulator Parent'),
    parentPhone: str('0000000000'),
  });

  // Pending fee belonging to GV-2026-001.
  await putDoc('fees', 'fee_emulator_001', {
    tenantId: str('tenant_gvis'),
    feeId: str('fee_emulator_001'),
    studentName: str('Arjun Verma (Emulator)'),
    rollNo: str('GV-2026-001'),
    className: str('Class 10-A'),
    feeHead: str('Quarterly Tuition & Transport (Q2)'),
    totalDue: num(18500),
    amountPaid: num(0),
    status: str('Pending'),
  });

  // Superadmin subscription fixture.
  await putDoc('subscriptions', 'sub_emulator_001', {
    college: str('Emulator College'),
    plan: str('Standard'),
    amount: num(24000),
    status: str('Active'),
    expiryDate: str('2027-08-31'),
  });

  console.log(
    'seed complete: admin, superadmin, student, fee_emulator_001, subscriptions/sub_emulator_001'
  );
};

seed().catch((err) => {
  console.error(`SEED FAILED: ${err.message}`);
  process.exit(1);
});