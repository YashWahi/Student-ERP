// src/pages/student/Overview.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { CheckSquare, BookOpen, Award, CreditCard, Clock, Download, Upload, Edit3, ArrowRight } from 'lucide-react';
import { initiateFeePayout } from '../../services/razorpayService';
import toast from 'react-hot-toast';

const StudentOverview = () => {
  const navigate = useNavigate();
  const [feeStatus, setFeeStatus] = useState('Pending');

  const handlePayStudentFee = async () => {
    await initiateFeePayout({
      studentId: 'std_101',
      studentName: 'Arjun Verma',
      feeId: 'fee_q2',
      amount: 18500,
      feeType: 'Tuition Fee (Q2)',
      parentEmail: 'parent@test.com',
      parentPhone: '+91 9876543212',
      onSuccess: (res) => {
        setFeeStatus('Paid');
        toast.success(`🎉 Fee Paid Successfully! Receipt Payment ID: ${res.paymentId}`);
      },
      onFailure: (err) => {
        toast.error(`Payment cancelled or failed`);
      }
    });
  };

  return (
    <div className="animate-fadeIn">
      {/* Hero Greeting Banner */}
      <div className="card" style={{ padding: '24px 32px', marginBottom: 28, background: 'linear-gradient(135deg, var(--color-primary-light), #FFFFFF)', border: '1px solid var(--color-primary-border)' }}>
        <div className="flex justify-between items-center">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>STUDENT SELF-SERVICE PORTAL</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: 2 }}>Good Morning, Arjun Verma 👋</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>Class 10-A · Roll No: GV-2026-001 · Green Valley International School</p>
          </div>
          <button className="btn btn-primary" onClick={handlePayStudentFee}>
            <CreditCard size={16} /> Pay Term Fee Online
          </button>
        </div>
      </div>

      {/* TOP ROW: 6 STUDENT KPIS */}
      <div className="grid-3" style={{ gap: 20, marginBottom: 28 }}>
        <StatCard icon={<CheckSquare size={22} />} label="Monthly Attendance %" value="96%" color="#16A34A" />
        <StatCard icon={<Clock size={22} />} label="Next Upcoming Class" value="Math (09:00 AM)" color="var(--color-primary, #2563EB)" />
        <StatCard icon={<BookOpen size={22} />} label="Pending Homework" value="2 tasks" color="#D97706" />
        <StatCard icon={<Award size={22} />} label="Next Exam Date" value="10 Sep 2026" color="#7C3AED" />
        <StatCard icon={<CreditCard size={22} />} label="Fee Due (Q2)" value={feeStatus === 'Paid' ? 0 : 18500} prefix="₹" color={feeStatus === 'Paid' ? '#16A34A' : '#DC2626'} />
        <StatCard icon={<Award size={22} />} label="Last Exam Grade" value="A+ (92.4%)" color="#0F766E" />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h4 style={{ margin: 0 }}>⚡ Student Quick Action Desk</h4>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ gap: 16 }}>
            {[
              { label: 'Submit Homework File', icon: '📤', action: () => navigate('/student/homework') },
              { label: 'View Report Card', icon: '📜', action: () => navigate('/student/results') },
              { label: 'Download Notes & Study Material', icon: '📖', action: () => navigate('/student/notebook') },
              { label: 'Open Digital Notebook', icon: '📝', action: () => navigate('/student/notebook') },
            ].map(qa => (
              <div
                key={qa.label}
                className="card flex items-center justify-between"
                style={{ padding: '14px 18px', cursor: 'pointer' }}
                onClick={qa.action}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.3rem' }}>{qa.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{qa.label}</div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Homework Submission Box */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>📚 Assigned Homework & Tasks</h4>
            <span className="badge badge-warning">2 Pending</span>
          </div>
          <div className="card-body">
            {[
              { subject: 'Mathematics', title: 'Quadratic Equations Ex 4.2', dueDate: 'Tomorrow, 5:00 PM', status: 'Pending' },
              { subject: 'Science', title: 'Lab Report: Acid & Bases', dueDate: '15 Aug 2026', status: 'Pending' },
              { subject: 'English', title: 'Essay on Climate Change', dueDate: 'Completed', status: 'Submitted' },
            ].map((hw, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{hw.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{hw.subject} · Due: {hw.dueDate}</div>
                </div>
                <button
                  className={`btn btn-sm ${hw.status === 'Submitted' ? 'btn-ghost' : 'btn-primary'}`}
                  onClick={() => hw.status !== 'Submitted' ? navigate('/student/homework') : undefined}
                >
                  {hw.status === 'Submitted' ? 'Submitted ✓' : 'Upload File'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Term Fee Payment Box */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>💳 Term School Fee Ledger</h4>
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              {feeStatus === 'Paid' ? '₹0' : '₹18,500'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              {feeStatus === 'Paid' ? 'All term fees paid up to date! Receipt generated.' : 'Tuition Fee (Quarter 2) Due Date: 31 Aug 2026'}
            </p>

            {feeStatus !== 'Paid' ? (
              <button className="btn btn-primary btn-lg" onClick={handlePayStudentFee}>
                <CreditCard size={18} /> Pay Online via Razorpay
              </button>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>Paid ✓</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
