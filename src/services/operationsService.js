// src/services/operationsService.js
import { db } from '../config/firebase';
import { collection, addDoc, doc, updateDoc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { logAuditEvent } from './auditService';

// 1. Digital Library Service
export const issueLibraryBook = async (issueData) => {
  const libRef = collection(db, 'libraryIssues');
  const payload = {
    ...issueData,
    status: 'Issued',
    issuedAt: serverTimestamp(),
  };
  const docRef = await addDoc(libRef, payload);
  await logAuditEvent({
    action: 'LIBRARY_ISSUE_BOOK',
    actor: 'Librarian',
    target: issueData.bookTitle,
    details: `Issued book "${issueData.bookTitle}" to student ${issueData.studentName}`,
    tenantId: issueData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 2. Transport Route Service
export const addTransportRoute = async (routeData) => {
  const transRef = collection(db, 'transportRoutes');
  const payload = {
    ...routeData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(transRef, payload);
  return docRef.id;
};

// 3. Hostel Bed Allocation
export const allocateHostelBed = async (allocData) => {
  const hostelRef = collection(db, 'hostelAllocations');
  const payload = {
    ...allocData,
    status: 'Allocated',
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(hostelRef, payload);
  return docRef.id;
};

// 4. Inventory Stock Requisition
export const logInventoryStock = async (stockData) => {
  const invRef = collection(db, 'inventory');
  const payload = {
    ...stockData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(invRef, payload);
  return docRef.id;
};

// 5. Asset Management Register
export const registerCampusAsset = async (assetData) => {
  const assetRef = collection(db, 'assets');
  const payload = {
    ...assetData,
    status: 'Operational',
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(assetRef, payload);
  await logAuditEvent({
    action: 'REGISTER_ASSET',
    actor: 'Admin',
    target: assetData.assetName,
    details: `Registered asset "${assetData.assetName}" (Tag: ${assetData.assetTag})`,
    tenantId: assetData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 6. Visitor Management Register
export const checkInVisitor = async (visitorData) => {
  const visRef = collection(db, 'visitors');
  const payload = {
    ...visitorData,
    status: 'Checked In',
    checkInTime: serverTimestamp(),
  };
  const docRef = await addDoc(visRef, payload);
  await logAuditEvent({
    action: 'VISITOR_CHECKIN',
    actor: 'Security Gatekeeper',
    target: visitorData.visitorName,
    details: `Checked in visitor ${visitorData.visitorName} to meet ${visitorData.hostName}`,
    tenantId: visitorData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 7. Gate Pass Generator
export const issueGatePass = async (passData) => {
  const passRef = collection(db, 'gatePasses');
  const payload = {
    ...passData,
    status: 'Approved',
    issuedAt: serverTimestamp(),
  };
  const docRef = await addDoc(passRef, payload);
  await logAuditEvent({
    action: 'ISSUE_GATE_PASS',
    actor: 'Security / Admin',
    target: passData.personName,
    details: `Issued Gate Pass #${docRef.id.slice(-6)} for ${passData.personName}. Reason: ${passData.reason}`,
    tenantId: passData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 8. Disciplinary Incident Logger
export const logDisciplineIncident = async (incidentData) => {
  const discRef = collection(db, 'discipline');
  const payload = {
    ...incidentData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(discRef, payload);
  await logAuditEvent({
    action: 'LOG_DISCIPLINE',
    actor: 'Disciplinary Officer',
    target: incidentData.studentName,
    details: `Logged disciplinary incident for ${incidentData.studentName}: ${incidentData.incident}`,
    tenantId: incidentData.tenantId || 'tenant_gvis',
  });
  return docRef.id;
};

// 9 & 10. Helpdesk & Complaints Ticket Routing
export const createHelpdeskTicket = async (ticketData) => {
  const ticketRef = collection(db, 'helpdesk');
  const payload = {
    ...ticketData,
    status: 'Open',
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(ticketRef, payload);
  return docRef.id;
};
