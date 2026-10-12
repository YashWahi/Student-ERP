import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function checkFirebase() {
  console.log('=== FIREBASE FIRESTORE DATA CHECK (Project: cafe-265bd) ===\n');
  const collections = ['tenants', 'schools', 'users', 'branches', 'subscriptions'];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`\n📂 Collection [${colName}]: Total ${snap.docs.length} documents.`);
      snap.docs.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data);
        console.log(`  - Doc ID: ${doc.id}`);
        console.log(`    Name: ${data.name || data.collegeName || data.college || 'N/A'}`);
        console.log(`    Email: ${data.email || data.adminEmail || data.headAdminEmail || 'N/A'}`);
        console.log(`    Role: ${data.role || 'N/A'} | TenantId: ${data.tenantId || 'N/A'}`);
        if (str.toLowerCase().includes('manik')) {
          console.log(`    ✨ MATCH FOR "manik":`, JSON.stringify(data, null, 2));
        }
      });
    } catch (e) {
      console.error(`  Error querying [${colName}]:`, e.message);
    }
  }
}

checkFirebase();
