// src/store/studentStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_STUDENTS = [
  {
    id: 'st_101',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2026-001',
    admissionNo: 'ADM-2026-101',
    name: 'Arjun Verma',
    class: '10-A',
    parentName: 'Suresh Verma',
    phone: '+91 98765 43212',
    parentEmail: 'suresh.verma@gmail.com',
    category: 'GEN',
    attendance: '96%',
    feeStatus: 'Paid',
    status: 'Active',
    dob: '2011-05-14',
    bloodGroup: 'O+',
    gender: 'Male',
    address: '42 Park Avenue, Green Enclave, Sector 15',
    documents: [
      { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_arjun.pdf', date: '2026-04-10' },
      { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_cert_arjun.pdf', date: '2026-04-10' },
      { id: 'doc_3', name: 'Transfer Certificate (TC)', status: 'Verified', fileName: 'tc_arjun.pdf', date: '2026-04-12' },
    ]
  },
  {
    id: 'st_102',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2026-002',
    admissionNo: 'ADM-2026-102',
    name: 'Rohan Sharma',
    class: '10-A',
    parentName: 'Sanjeev Sharma',
    phone: '+91 98765 43213',
    parentEmail: 'sanjeev.sharma@gmail.com',
    category: 'OBC',
    attendance: '92%',
    feeStatus: 'Paid',
    status: 'Active',
    dob: '2011-08-22',
    bloodGroup: 'B+',
    gender: 'Male',
    address: '108 Civil Lines, Near Railway Station',
    documents: [
      { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_rohan.pdf', date: '2026-08-10' },
      { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_cert_rohan.pdf', date: '2026-08-10' },
      { id: 'doc_3', name: 'Transfer Certificate (TC)', status: 'Pending Verification', fileName: 'tc_rohan.pdf', date: '2026-08-10' },
    ]
  },
  {
    id: 'st_103',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2026-003',
    admissionNo: 'ADM-2026-103',
    name: 'Ananya Gupta',
    class: '8-B',
    parentName: 'Vikas Gupta',
    phone: '+91 98765 43214',
    parentEmail: 'vikas.gupta@gmail.com',
    category: 'GEN',
    attendance: '98%',
    feeStatus: 'Paid',
    status: 'Active',
    dob: '2013-02-10',
    bloodGroup: 'A+',
    gender: 'Female',
    address: '15 Lotus Towers, MG Road',
    documents: [
      { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_ananya.pdf', date: '2025-06-15' },
      { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_cert_ananya.pdf', date: '2025-06-15' },
    ]
  },
  {
    id: 'st_104',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2026-004',
    admissionNo: 'ADM-2026-104',
    name: 'Kabir Verma',
    class: '6-C',
    parentName: 'Anita Verma',
    phone: '+91 98765 43215',
    parentEmail: 'anita.verma@gmail.com',
    category: 'SC',
    attendance: '90%',
    feeStatus: 'Overdue',
    status: 'Active',
    dob: '2015-11-04',
    bloodGroup: 'AB+',
    gender: 'Male',
    address: '89 Sunrise Colony, Phase 2',
    documents: [
      { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_kabir.pdf', date: '2026-07-01' },
      { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_cert_kabir.pdf', date: '2026-07-01' },
      { id: 'doc_3', name: 'Caste Certificate (SC)', status: 'Verified', fileName: 'caste_cert_kabir.pdf', date: '2026-07-02' },
    ]
  },
  {
    id: 'st_105',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2026-005',
    admissionNo: 'ADM-2026-105',
    name: 'Priya Mishra',
    class: '9-B',
    parentName: 'Suresh Mishra',
    phone: '+91 98765 11223',
    parentEmail: 'suresh.mishra@gmail.com',
    category: 'ST',
    attendance: '94%',
    feeStatus: 'Paid',
    status: 'Active',
    dob: '2012-07-19',
    bloodGroup: 'O-',
    gender: 'Female',
    address: '204 High School Road, Ward 8',
    documents: [
      { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_priya.pdf', date: '2026-03-20' },
      { id: 'doc_2', name: 'Transfer Certificate (TC)', status: 'Verified', fileName: 'tc_priya.pdf', date: '2026-03-21' },
    ]
  },
  {
    id: 'st_106',
    tenantId: 'tenant_gvis',
    branchId: 'branch_main',
    session: '2026-27',
    rollNo: 'GV-2025-088',
    admissionNo: 'ADM-2025-088',
    name: 'Siddharth Rao',
    class: '12-A',
    parentName: 'Kiran Rao',
    phone: '+91 98765 66778',
    parentEmail: 'kiran.rao@gmail.com',
    category: 'GEN',
    attendance: '95%',
    feeStatus: 'Paid',
    status: 'Alumni',
    dob: '2008-03-12',
    bloodGroup: 'B+',
    gender: 'Male',
    address: '77 Heritage Villas, Lake Road',
    documents: [
      { id: 'doc_1', name: 'School Leaving Certificate', status: 'Verified', fileName: 'slc_siddharth.pdf', date: '2026-05-30' }
    ]
  }
];

export const useStudentStore = create(
  persist(
    (set, get) => ({
      students: INITIAL_STUDENTS,

      addStudent: (studentData) => {
        const id = `st_${Date.now()}`;
        const sEmail = (studentData.studentEmail || studentData.email || studentData.parentEmail || `${studentData.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`).toLowerCase();
        const sPassword = studentData.password || 'student123';

        const newStudent = {
          id,
          tenantId: studentData.tenantId || 'tenant_gvis',
          rollNo: studentData.rollNo || `GV-2026-${String(get().students.length + 1).padStart(3, '0')}`,
          admissionNo: studentData.admissionNo || `ADM-2026-${String(get().students.length + 101).padStart(3, '0')}`,
          name: studentData.name,
          studentEmail: sEmail,
          password: sPassword,
          class: studentData.class || studentData.className || '10-A',
          parentName: studentData.parentName || 'N/A',
          phone: studentData.phone || studentData.parentPhone || '',
          parentEmail: studentData.parentEmail || '',
          category: studentData.category || 'GEN',
          attendance: '100%',
          feeStatus: studentData.feeStatus || 'Paid',
          status: studentData.status || 'Active',
          dob: studentData.dob || '2012-01-01',
          bloodGroup: studentData.bloodGroup || 'O+',
          gender: studentData.gender || 'Male',
          address: studentData.address || '',
          documents: studentData.documents || [
            { id: 'doc_1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar_doc.pdf', date: new Date().toISOString().split('T')[0] },
            { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_cert.pdf', date: new Date().toISOString().split('T')[0] },
            { id: 'doc_3', name: 'Transfer Certificate (TC)', status: 'Pending Verification', fileName: 'tc_doc.pdf', date: new Date().toISOString().split('T')[0] },
          ],
          feeReceipt: studentData.feeReceipt || null,
        };

        try {
          const customUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
          customUsers.unshift({
            uid: id,
            email: sEmail,
            password: sPassword,
            name: studentData.name,
            role: 'student',
            tenantId: studentData.tenantId || 'tenant_gvis',
            branchId: 'branch_main',
            status: 'Active',
            schoolName: 'Student Portal'
          });
          localStorage.setItem('custom_users', JSON.stringify(customUsers));
        } catch (e) {
          console.warn('LocalStorage custom_users error:', e);
        }

        set((state) => ({
          students: [newStudent, ...state.students]
        }));
        return newStudent;
      },

      updateStudent: (studentId, updatedData) => {
        set((state) => ({
          students: state.students.map((s) => (s.id === studentId ? { ...s, ...updatedData } : s))
        }));
      },

      toggleStudentStatus: (studentId) => {
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id !== studentId) return s;
            const nextStatus = s.status === 'Active' ? 'Inactive' : s.status === 'Inactive' ? 'Alumni' : 'Active';
            return { ...s, status: nextStatus };
          })
        }));
      },

      setStudentStatus: (studentId, status) => {
        set((state) => ({
          students: state.students.map((s) => (s.id === studentId ? { ...s, status } : s))
        }));
      },

      uploadStudentDocument: (studentId, newDoc) => {
        set((state) => ({
          students: state.students.map((s) => {
            if (s.id !== studentId) return s;
            const docItem = {
              id: `doc_${Date.now()}`,
              name: newDoc.name || 'Submitted Document',
              status: newDoc.status || 'Verified',
              fileName: newDoc.fileName || 'uploaded_file.pdf',
              date: new Date().toISOString().split('T')[0],
            };
            return {
              ...s,
              documents: [docItem, ...(s.documents || [])]
            };
          })
        }));
      },

      bulkImportStudents: (importedStudents) => {
        set((state) => ({
          students: [...importedStudents, ...state.students]
        }));
      },

      deleteStudent: (studentId) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== studentId)
        }));
      },

      findParentByPhone: (phone) => {
        if (!phone) return null;
        const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
        if (cleaned.length < 6) return null;

        const match = get().students.find((s) => {
          if (!s.phone) return false;
          const sPhoneCleaned = s.phone.replace(/[\s\-\+\(\)]/g, '');
          return sPhoneCleaned.includes(cleaned) || cleaned.includes(sPhoneCleaned);
        });

        if (match) {
          return {
            parentName: match.parentName,
            parentEmail: match.parentEmail,
            parentPhone: match.phone,
            address: match.address,
            linkedChildName: match.name,
            linkedChildClass: match.class,
          };
        }
        return null;
      },

      isAdmissionNoUnique: (admNo, currentStudentId = null) => {
        if (!admNo) return true;
        const normalized = admNo.trim().toUpperCase();
        return !get().students.some((s) => s.id !== currentStudentId && s.admissionNo?.trim().toUpperCase() === normalized);
      },

      resetStudents: () => set({ students: INITIAL_STUDENTS }),
    }),
    {
      name: 'students-roster-storage',
    }
  )
);
