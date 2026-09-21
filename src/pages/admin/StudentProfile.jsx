// src/pages/admin/StudentProfile.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../../store/studentStore';
import {
  User, Phone, Mail, MapPin, Calendar, Award, FileText,
  CreditCard, ArrowLeft, Download, ShieldCheck, CheckCircle
} from 'lucide-react';
import { generateStudentIDCardPDF } from '../../services/pdfService';
import toast from 'react-hot-toast';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students } = useStudentStore();

  const student = students.find(s => s.id === id || s.rollNo === id || s.admissionNo === id) || students[0];

  const [activeTab, setActiveTab] = useState('overview'); // overview | attendance | fees | docs | marks

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h2>Student Not Found</h2>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/admin/students')}>Back to Student List</button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost" onClick={() => navigate('/admin/students')}>
          <ArrowLeft size={18} /> Back to List
        </button>
        <div>
          <h1 className="page-title">{student.name}</h1>
          <p className="page-subtitle">Roll No: {student.rollNo} · Admission No: {student.admissionNo || 'ADM-2026-101'} · Class: {student.class}</p>
        </div>
      </div>

      {/* Top Profile Hero Card */}
      <div className="card p-6 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border-2 border-blue-200">
            {student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
              <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{student.status}</span>
              <span className="badge badge-primary">{student.category} Quota</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1"><User size={14} /> Parent: {student.parentName}</span>
              <span className="flex items-center gap-1"><Phone size={14} /> {student.phone}</span>
              <span className="flex items-center gap-1"><Mail size={14} /> {student.parentEmail || 'parent@test.com'}</span>
            </div>
          </div>
        </div>
        <button className="btn btn-secondary flex items-center gap-2" onClick={() => generateStudentIDCardPDF(student)}>
          <Download size={16} /> Download ID Card PDF
        </button>
      </div>

      {/* Tabs Nav */}
      <div className="flex border-b border-slate-200 space-x-6">
        {[
          { id: 'overview', label: '360° Profile Overview' },
          { id: 'fees', label: 'Fee Payment Ledger' },
          { id: 'docs', label: 'KYC & Verification Docs' },
          { id: 'attendance', label: 'Attendance Records' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Personal & Academic Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Date of Birth:</span> <strong>{student.dob || '14 May 2011'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Blood Group:</span> <strong>{student.bloodGroup || 'O+'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Gender:</span> <strong>{student.gender || 'Male'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Class & Section:</span> <strong>{student.class}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Address:</span> <strong>{student.address || '42 Park Avenue, Sector 15'}</strong></div>
            </div>
          </div>

          <div className="card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">Academic Performance Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Overall Attendance Rate:</span> <strong className="text-green-600">{student.attendance || '96%'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Fee Status:</span> <strong className="text-blue-600">{student.feeStatus || 'Paid'}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Last Term GPA:</span> <strong>9.4 / 10 (A+)</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Disciplinary Record:</span> <strong className="text-emerald-600">Clean (0 Alerts)</strong></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="card p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Fee Statement Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3">Fee Head</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">Tuition & Exam Fee (Q2)</td>
                  <td className="p-3">25 Aug 2026</td>
                  <td className="p-3">₹18,500</td>
                  <td className="p-3"><span className="badge badge-warning">Pending</span></td>
                </tr>
                <tr className="border-b">
                  <td className="p-3">Tuition & Exam Fee (Q1)</td>
                  <td className="p-3">15 Apr 2026</td>
                  <td className="p-3">₹18,500</td>
                  <td className="p-3"><span className="badge badge-success">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="card p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Verification Documents</h3>
          <div className="space-y-3">
            {(student.documents || [
              { id: '1', name: 'Aadhaar Card', status: 'Verified', fileName: 'aadhaar.pdf' },
              { id: '2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_certificate.pdf' },
            ]).map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-600" size={18} />
                  <div>
                    <div className="font-semibold text-sm">{doc.name}</div>
                    <div className="text-xs text-slate-500">{doc.fileName}</div>
                  </div>
                </div>
                <span className="badge badge-success">{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card p-6 bg-white rounded-xl border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4">Recent Daily Attendance Logs</h3>
          <p className="text-sm text-slate-600">Total Present Days: 88 | Total Absent Days: 3 | Cumulative Attendance Rate: {student.attendance || '96%'}</p>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
