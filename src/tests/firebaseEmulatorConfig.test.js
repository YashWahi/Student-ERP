import assert from 'node:assert/strict';
import { getFirebaseConfig, shouldUseFirebaseEmulators } from '../config/firebase.js';

assert.equal(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'false' }, { location: { hostname: 'localhost' } }), false);
assert.equal(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'true' }, { location: { hostname: 'example.com' } }), false);
assert.equal(shouldUseFirebaseEmulators({ VITE_USE_FIREBASE_EMULATORS: 'true' }, { location: { hostname: 'localhost' } }), true);

const emulatorConfig = getFirebaseConfig({ VITE_USE_FIREBASE_EMULATORS: 'true' });
assert.equal(emulatorConfig.projectId, 'demo-test');
assert.equal(emulatorConfig.databaseURL, 'http://127.0.0.1:8080?ns=demo-test');

console.log('Firebase emulator config guard passed.');
