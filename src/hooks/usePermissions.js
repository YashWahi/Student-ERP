// src/hooks/usePermissions.js
import { useAuthStore } from '../store/authStore.js';

export const ALL_MODULES = [
  { id: 'students', name: 'Student Information System (SIS)', icon: '👨‍🎓', desc: 'Student profile 360°, parent mapping, documents, promotions' },
  { id: 'teachers', name: 'Faculty & Teacher Management', icon: '👩‍🏫', desc: 'Faculty profiles, subject allocations, class teachers' },
  { id: 'staff', name: 'Non-Teaching Staff Portal', icon: '👨‍💼', desc: 'Administrative staff rosters, duties, leave tracking' },
  { id: 'attendance', name: 'Attendance & Biometrics', icon: '✅', desc: 'Daily class attendance, leave requests, low-attendance alerts' },
  { id: 'fees', name: 'Fees & Finance Ledger', icon: '💰', desc: 'Fee structures, Razorpay online payments, receipts, discounts' },
  { id: 'exams', name: 'Exams & Result Engine', icon: '📝', desc: 'Term exam scheduling, marks entry, GPA calculation, report cards' },
  { id: 'homework', name: 'Homework & Digital LMS', icon: '📚', desc: 'Homework assignment, student file submissions, grading' },
  { id: 'timetable', name: 'Weekly Timetable Builder', icon: '📅', desc: 'Class and teacher timetables, conflict detection' },
  { id: 'library', name: 'Digital Library Catalog', icon: '📖', desc: 'Book cataloging, ISBN search, issue & return tracking' },
  { id: 'transport', name: 'Transport & Fleet Routes', icon: '🚌', desc: 'Bus routes, driver management, student stop assignments' },
  { id: 'hostel', name: 'Hostel & Dormitories', icon: '🏨', desc: 'Hostel block management, bed allocation, warden contacts' },
  { id: 'payroll', name: 'HR & Staff Payroll Processing', icon: '💵', desc: 'Employee salary structure setup, allowances, PDF payslips' },
  { id: 'communication', name: 'Communication & Notices', icon: '💬', desc: 'Internal chat, parent-teacher messages, school notices' },
  { id: 'complaints', name: 'Helpdesk & Complaints', icon: '⚠️', desc: 'Parent/student query ticketing, issue tracking' },
  { id: 'reports', name: 'Custom Reports Engine', icon: '📊', desc: 'Custom report builder, CSV & PDF export capabilities' },
  { id: 'idcards', name: 'Student & Staff ID Cards', icon: '🪪', desc: 'CR80 Student ID card generator with QR barcode' },
];

const ROLE_PERMISSIONS = {
  superadmin: ['*'],
  subadmin: ['colleges.read', 'branches.manage', 'analytics.read', 'announcements.create'],
  admin: ['students.read', 'students.create', 'students.update', 'students.delete', 'fees.read', 'fees.collect', 'teachers.manage', 'timetable.manage', 'reports.export'],
  teacher: ['attendance.read', 'attendance.mark', 'homework.create', 'results.enter', 'messages.send'],
  student: ['timetable.read', 'homework.submit', 'results.read', 'fees.pay'],
  parent: ['attendance.read', 'results.read', 'fees.pay', 'messages.send', 'ptm.book'],
  staff: ['roster.read', 'salary.read', 'leave.apply'],
};

export const hasPermission = (userProfile, permission) => {
  if (!userProfile) return false;
  if (userProfile.role === 'superadmin') return true;
  const permissions = ROLE_PERMISSIONS[userProfile.role] || [];
  return permissions.includes('*') || permissions.includes(permission);
};

export const validateTenantIsolation = (userContext, targetDocument) => {
  if (!userContext || !targetDocument) return false;
  if (userContext.role === 'superadmin') return true;
  return userContext.tenantId === targetDocument.tenantId;
};

export const usePermissions = () => {
  const { userProfile, role } = useAuthStore();

  const checkPermission = (permission) => {
    return hasPermission(userProfile || { role }, permission);
  };

  const isModuleEnabled = (moduleId) => {
    if (role === 'superadmin') return true;
    const enabledModules = userProfile?.enabledModules || {};
    if (enabledModules[moduleId] === false) return false;
    return true;
  };

  const validateIsolation = (targetDocument) => {
    return validateTenantIsolation(userProfile || { role }, targetDocument);
  };

  return {
    role,
    userProfile,
    hasPermission: checkPermission,
    isModuleEnabled,
    validateTenantIsolation: validateIsolation,
  };
};
