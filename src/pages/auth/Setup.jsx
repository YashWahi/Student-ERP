// src/pages/auth/Setup.jsx
// ONE-TIME SETUP PAGE — Create SuperAdmin account
// Visit: http://localhost:5173/setup  (DELETE this page after setup)

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const Setup = () => {
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);

  const createSuperAdmin = async () => {
    setStatus('⏳ Creating SuperAdmin account...');
    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        'superadmin@eduerp.com',
        'SuperAdmin@123'
      );
      await updateProfile(cred.user, { displayName: 'Super Admin' });

      // 2. Save profile to Firestore
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        name: 'Super Admin',
        email: 'superadmin@eduerp.com',
        role: 'superadmin',
        tenantId: null,
        branchId: null,
        phone: '+91 9999999999',
        avatar: '',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus('✅ SuperAdmin created! Email: superadmin@eduerp.com | Password: SuperAdmin@123');
      setDone(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setStatus('⚠️ SuperAdmin already exists! Go to /login and use: superadmin@eduerp.com / SuperAdmin@123');
        setDone(true);
      } else {
        setStatus(`❌ Error: ${err.message}`);
      }
    }
  };

  const createDemoAdmin = async () => {
    setStatus('⏳ Creating Demo Admin...');
    try {
      // Create tenant first
      const { addDoc, collection } = await import('firebase/firestore');
      const tenantRef = await addDoc(collection(db, 'tenants'), {
        name: 'Green Valley International School',
        email: 'admin@greenvalley.com',
        phone: '+91 9876543210',
        address: 'Sector 62, Noida, UP',
        plan: 'premium',
        subscriptionStatus: 'active',
        subscriptionExpiry: new Date('2027-12-31'),
        maxBranches: 10,
        maxStudents: 10000,
        maxTeachers: 500,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const branchRef = await addDoc(collection(db, 'branches'), {
        tenantId: tenantRef.id,
        name: 'Green Valley - Main Campus',
        address: 'Sector 62, Noida',
        phone: '+91 9876543210',
        isMain: true,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      const adminCred = await createUserWithEmailAndPassword(auth, 'admin@greenvalley.com', 'Admin@123');
      await updateProfile(adminCred.user, { displayName: 'Admin - Green Valley' });
      await setDoc(doc(db, 'users', adminCred.user.uid), {
        uid: adminCred.user.uid,
        name: 'Dr. Rajesh Kumar',
        email: 'admin@greenvalley.com',
        role: 'admin',
        tenantId: tenantRef.id,
        branchId: branchRef.id,
        phone: '+91 9876543210',
        avatar: '',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create demo teacher
      const teacherCred = await createUserWithEmailAndPassword(auth, 'teacher@greenvalley.com', 'Teacher@123');
      await setDoc(doc(db, 'users', teacherCred.user.uid), {
        uid: teacherCred.user.uid,
        name: 'Mrs. Priya Sharma',
        email: 'teacher@greenvalley.com',
        role: 'teacher',
        tenantId: tenantRef.id,
        branchId: branchRef.id,
        subject: 'Mathematics',
        phone: '+91 9876543211',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create demo student
      const studentCred = await createUserWithEmailAndPassword(auth, 'student@greenvalley.com', 'Student@123');
      await setDoc(doc(db, 'users', studentCred.user.uid), {
        uid: studentCred.user.uid,
        name: 'Arjun Verma',
        email: 'student@greenvalley.com',
        role: 'student',
        tenantId: tenantRef.id,
        branchId: branchRef.id,
        rollNo: 'GV-2024-001',
        class: '10-A',
        phone: '+91 9876543212',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create demo parent
      const parentCred = await createUserWithEmailAndPassword(auth, 'parent@test.com', 'Parent@123');
      await setDoc(doc(db, 'users', parentCred.user.uid), {
        uid: parentCred.user.uid,
        name: 'Mr. Suresh Verma',
        email: 'parent@test.com',
        role: 'parent',
        tenantId: tenantRef.id,
        branchId: branchRef.id,
        childId: studentCred.user.uid,
        phone: '+91 9876543213',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatus(`✅ All demo accounts created!
      
🏫 Tenant ID: ${tenantRef.id}
🏢 Branch ID: ${branchRef.id}

👔 Admin: admin@greenvalley.com / Admin@123
👩‍🏫 Teacher: teacher@greenvalley.com / Teacher@123
👨‍🎓 Student: student@greenvalley.com / Student@123
👨‍👩‍👧 Parent: parent@test.com / Parent@123`);
      setDone(true);
    } catch (err) {
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 40,
        maxWidth: 600,
        width: '100%',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔧</div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>EduERP Pro — Initial Setup</h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            ⚠️ One-time setup page. Delete after use. Do NOT deploy to production.
          </p>
        </div>

        {!done && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={createSuperAdmin}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #6C63FF, #4D45D9)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              🛡️ Step 1: Create SuperAdmin Account
            </button>

            <button
              onClick={createDemoAdmin}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #00D4AA, #00A882)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              🏫 Step 2: Create Demo College + All Roles
            </button>
          </div>
        )}

        {status && (
          <div style={{
            marginTop: 24,
            padding: '16px 20px',
            background: status.includes('✅') ? 'rgba(16,185,129,0.1)' : status.includes('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${status.includes('✅') ? 'rgba(16,185,129,0.3)' : status.includes('❌') ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            borderRadius: 10,
            color: status.includes('✅') ? '#10B981' : status.includes('❌') ? '#EF4444' : '#3B82F6',
            fontSize: '0.875rem',
            whiteSpace: 'pre-line',
            lineHeight: 1.7,
          }}>
            {status}
          </div>
        )}

        {done && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #6C63FF, #00D4AA)',
                color: 'white',
                borderRadius: 10,
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              🚀 Go to Login Page
            </a>
          </div>
        )}

        <div style={{ marginTop: 24, padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
          <p style={{ color: '#EF4444', fontSize: '0.78rem', margin: 0 }}>
            🔴 <strong>IMPORTANT:</strong> Ye page sirf ek baar use karo. Setup ke baad App.jsx se /setup route hata do ya is file ko delete karo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Setup;
