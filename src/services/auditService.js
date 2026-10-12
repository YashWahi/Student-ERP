// src/services/auditService.js
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export const logAuditEvent = async ({ action, actor, target, details, tenantId = 'platform' }) => {
  const logObj = {
    id: `log_${Date.now()}`,
    action,
    actor: actor || 'Super Admin',
    target: target || 'Platform',
    details,
    tenantId,
    time: new Date().toLocaleString('en-IN'),
    ip: '192.168.1.1',
  };

  try {
    const existing = JSON.parse(localStorage.getItem('audit_logs_cache') || '[]');
    existing.unshift(logObj);
    localStorage.setItem('audit_logs_cache', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage log save error:', e);
  }

  try {
    const logRef = collection(db, 'auditLogs');
    addDoc(logRef, {
      ...logObj,
      timestamp: serverTimestamp(),
    }).catch(err => console.warn('Audit logging fallback:', err.message));
  } catch (err) {
    console.warn('Audit logging fallback:', err.message);
  }
};

export const getAuditLogs = async () => {
  let firestoreLogs = [];
  try {
    const logRef = collection(db, 'auditLogs');
    const q = query(logRef, orderBy('timestamp', 'desc'));
    const snap = await getDocs(q);
    firestoreLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Firestore audit fetch fallback:', err.message);
  }
  const localLogs = JSON.parse(localStorage.getItem('audit_logs_cache') || '[]');
  return [...firestoreLogs, ...localLogs];
};

