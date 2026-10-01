import assert from 'node:assert/strict';
import {
  hasAuthorizedRole,
  isAuthorizedUserProfile,
  matchesFirebaseSession,
} from '../services/authProfile.js';

const storage = new Map();
storage.set('auth-storage', JSON.stringify({
  state: {
    user: { uid: 'forged-user' },
    userProfile: { uid: 'forged-user', role: 'admin' },
    role: 'admin',
    academicSession: '2026-27',
  },
  version: 1,
}));

globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = { localStorage: globalThis.localStorage };

const { useAuthStore } = await import('../store/authStore.js');
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(useAuthStore.getState().user, null);
assert.equal(useAuthStore.getState().userProfile, null);
assert.equal(useAuthStore.getState().role, null);

const storedStudent = { uid: 'firebase-student', role: 'student', email: 'admin@example.test' };
assert.equal(isAuthorizedUserProfile('firebase-student', storedStudent), true);
assert.equal(storedStudent.role, 'student');
assert.equal(isAuthorizedUserProfile('firebase-student', { ...storedStudent, role: 'owner' }), false);
assert.equal(isAuthorizedUserProfile('firebase-student', { ...storedStudent, uid: 'another-uid' }), false);
assert.equal(isAuthorizedUserProfile('firebase-student', { ...storedStudent, isActive: false }), false);
assert.equal(hasAuthorizedRole(storedStudent.role, ['student']), true);
assert.equal(hasAuthorizedRole(storedStudent.role, ['admin']), false);

assert.equal(matchesFirebaseSession(null, { uid: 'forged-user' }, { uid: 'forged-user', role: 'admin' }), false);
assert.equal(matchesFirebaseSession('firebase-student', { uid: 'forged-user' }, { uid: 'forged-user', role: 'admin' }), false);
assert.equal(matchesFirebaseSession('firebase-student', { uid: 'firebase-student' }, { uid: 'firebase-student', role: 'student' }), true);

useAuthStore.getState().setUser({ uid: 'forged-user' });
useAuthStore.getState().setUserProfile({ uid: 'forged-user', role: 'admin' });
assert.deepEqual(JSON.parse(storage.get('auth-storage')).state, { academicSession: '2026-27' });

console.log('Authentication profile and persisted-session security tests passed.');
