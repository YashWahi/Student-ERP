import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAinTROq8ttJWVhQdxR6pf_cSik13dXuMs',
  authDomain: 'cafe-265bd.firebaseapp.com',
  databaseURL: 'https://cafe-265bd-default-rtdb.firebaseio.com',
  projectId: 'cafe-265bd',
  storageBucket: 'cafe-265bd.firebasestorage.app',
  messagingSenderId: '396904698649',
  appId: '1:396904698649:web:dacc483343354438e5ab88',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateTenant() {
  try {
    const tenantRef1 = doc(db, 'tenants', 'tenant_123_1786631943809');
    await updateDoc(tenantRef1, { status: 'Active' });
    console.log('✅ Updated tenant_123_1786631943809 status to Active in Firestore!');

    const tenantRef2 = doc(db, 'tenants', 'tenant_1234_1786639030076');
    await updateDoc(tenantRef2, { status: 'Active' });
    console.log('✅ Updated tenant_1234_1786639030076 status to Active in Firestore!');
  } catch (e) {
    console.error('Error updating tenant status:', e.message);
  }
}

updateTenant();
