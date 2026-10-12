// src/pages/parent/Overview.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { CheckCircle2, Award, CreditCard, MessageCircle, User, Calendar, AlertCircle, FileText, Download, Plus, HeartHandshake, Star } from 'lucide-react';
import { initiateFeePayout } from '../../services/razorpayService';
import { generateFeeReceiptPDF } from '../../services/pdfService';
import { bookPTMSlot, raiseParentComplaint, submitParentFeedback } from '../../services/parentService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const ParentOverview = () => {
  const navigate = useNavigate();
  const [activeChild, setActiveChild] = useState('Arjun Verma (Class 10-A)');
  const [feeStatus, setFeeStatus] = useState('Pending');
  const [showPTMModal, setShowPTMModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [ptmDate, setPtmDate] = useState('2026-08-20');
  const [ptmTime, setPtmTime] = useState('10:00 AM - 10:30 AM');
  const [complaintCategory, setComplaintCategory] = useState('Fee & Billing Query');
  const [complaintDesc, setComplaintDesc] = useState('');

  const [feedbackCategory, setFeedbackCategory] = useState('Academic Quality');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const [ptmBookings, setPtmBookings] = useState([
    { id: 'ptm_1', child: 'Arjun Verma (Class 10-A)', teacher: 'Mrs. Priya Sharma', date: '2026-08-20', time: '10:00 AM - 10:30 AM', status: 'Confirmed' }
  ]);

  const [complaints, setComplaints] = useState([
    { id: 'comp_1', child: 'Arjun Verma (Class 10-A)', category: 'Fee & Billing Query', desc: 'Q1 Receipt copy requested', status: 'Resolved' }
  ]);

  const [feedbackList, setFeedbackList] = useState([
    { id: 'fb_1', child: 'Arjun Verma (Class 10-A)', category: 'Academic Quality', rating: 5, comment: 'Excellent teaching methodology.', date: '2026-08-01' }
  ]);

  const childrenList = ['Arjun Verma (Class 10-A)', 'Kabir Verma (Class 6-C)'];

  const handlePayChildFee = async () => {
    await initiateFeePayout({
      studentId: 'child_101',
      studentName: activeChild,
      feeId: 'fee_q2',
      amount: 18500,
      feeType: 'Quarterly School Fee',
      parentEmail: 'parent@test.com',
      parentPhone: '+91 9876543212',
      onSuccess: (res) => {
        setFeeStatus('Paid');
        toast.success(`🎉 Fee Payment Successful! Txn ID: ${res.paymentId}`);
        generateFeeReceiptPDF({
          receiptNo: res.paymentId,
          studentName: activeChild,
          rollNo: 'GV-2026-001',
          className: 'Class 10-A',
          feeType: 'Quarterly School Fee (Q2)',
          amount: 18500,
          paymentMethod: 'Razorpay Online',
        });
      },
      onFailure: () => {
        toast.error('Payment cancelled');
      }
    });
  };

  const handleBookPTM = async (e) => {
    e.preventDefault();
    const docId = await bookPTMSlot({ tenantId: 'tenant_gvis', parentName: 'Mr. Suresh Verma', childName: activeChild, teacherName: 'Mrs. Priya Sharma', date: ptmDate, timeSlot: ptmTime });
    const newBooking = { id: docId || `ptm_${Date.now()}`, child: activeChild, teacher: 'Mrs. Priya Sharma', date: ptmDate, time: ptmTime, status: 'Confirmed' };
    setPtmBookings(prev => [newBooking, ...prev]);
    toast.success(`🎉 PTM slot booked on ${ptmDate} at ${ptmTime}!`);
    setShowPTMModal(false);
  };

  const handleRaiseComplaint = async (e) => {
    e.preventDefault();
    const docId = await raiseParentComplaint({ tenantId: 'tenant_gvis', parentName: 'Mr. Suresh Verma', childName: activeChild, category: complaintCategory, description: complaintDesc });
    const newComplaint = { id: docId || `comp_${Date.now()}`, child: activeChild, category: complaintCategory, desc: complaintDesc, status: 'Open' };
    setComplaints(prev => [newComplaint, ...prev]);
    toast.success(`✅ Ticket submitted under ${complaintCategory}!`);
    setShowComplaintModal(false);
    setComplaintDesc('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;
    const docId = await submitParentFeedback({ tenantId: 'tenant_gvis', parentName: 'Mr. Suresh Verma', childName: activeChild, category: feedbackCategory, rating: feedbackRating, comment: feedbackComment });
    const newFb = { id: docId || `fb_${Date.now()}`, child: activeChild, category: feedbackCategory, rating: feedbackRating, comment: feedbackComment, date: new Date().toISOString().split('T')[0] };
    setFeedbackList(prev => [newFb, ...prev]);
    toast.success(`⭐ Feedback submitted for ${activeChild}!`);
    setShowFeedbackModal(false);
    setFeedbackComment('');
  };

  return (
    <div className="animate-fadeIn">
      {/* Top Header & Multi-Child Switcher Dropdown */}
      <div className="page-header flex justify-between items-center flex-wrap" style={{ gap: 16 }}>
        <div>
          <h1 className="page-title">Parent Self-Service Portal</h1>
          <p className="page-subtitle">Monitoring child academic performance, attendance, fee dues & teacher communication</p>
        </div>

        {/* Multi-Child Selector */}
        <div className="card flex items-center gap-3" style={{ padding: '10px 18px', backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary-border)' }}>
          <User size={18} color="var(--color-primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>Select Child:</span>
          <select
            className="form-select"
            style={{ border: 'none', background: 'transparent', padding: 0, fontWeight: 800, fontSize: '0.95rem', width: 220, color: 'var(--color-primary)' }}
            value={activeChild}
            onChange={e => setActiveChild(e.target.value)}
          >
            {childrenList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* TOP ROW: PARENT KPIS */}
      <div className="grid-3" style={{ gap: 20, marginBottom: 28 }}>
        <StatCard icon={<CheckCircle2 size={22} />} label="Today's Attendance Status" value="Present" color="#16A34A" />
        <StatCard icon={<CheckCircle2 size={22} />} label="Monthly Attendance %" value="96%" color="#0F766E" />
        <StatCard icon={<Award size={22} />} label="Latest Exam Score" value="92.4% (A+)" color="#7C3AED" />
        <StatCard icon={<CreditCard size={22} />} label="Pending School Fee" value={feeStatus === 'Paid' ? 0 : 18500} prefix="₹" color={feeStatus === 'Paid' ? '#16A34A' : '#DC2626'} />
        <StatCard icon={<Calendar size={22} />} label="Next PTM Meeting" value={ptmBookings[0]?.date || 'None'} color="#0EA5E9" />
        <StatCard icon={<AlertCircle size={22} />} label="Active Notices" value="2 new" color="#D97706" />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header flex justify-between items-center">
          <h4 style={{ margin: 0 }}>⚡ Parent Quick Desk</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFeedbackModal(true)}>
            <HeartHandshake size={14} /> Submit Feedback
          </button>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ gap: 16 }}>
            <div className="card flex items-center justify-between" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={handlePayChildFee}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.3rem' }}>💳</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Pay School Fee</div>
              </div>
            </div>

            <div className="card flex items-center justify-between" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => setShowPTMModal(true)}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.3rem' }}>📅</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Book PTM Slot</div>
              </div>
            </div>

            <div className="card flex items-center justify-between" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => navigate('/parent/messages')}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Message Teacher</div>
              </div>
            </div>

            <div className="card flex items-center justify-between" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => setShowComplaintModal(true)}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Raise Query / Helpdesk</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid-2" style={{ gap: 24, marginBottom: 24 }}>
        {/* Fee Payment Box */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>🏫 School Fee Payment & Receipts</h4>
            {feeStatus === 'Paid' && (
              <button className="btn btn-ghost btn-sm" onClick={() => generateFeeReceiptPDF({ receiptNo: 'REC-901', studentName: activeChild, className: 'Class 10-A', feeType: 'Tuition Fee (Q2)', amount: 18500 })}>
                <Download size={14} /> Receipt PDF
              </button>
            )}
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: 6 }}>
              {feeStatus === 'Paid' ? '₹0 Due' : '₹18,500'}
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              {feeStatus === 'Paid' ? 'Fee received. Receipt generated and sent to parent@test.com' : 'Quarter 2 Fee due date: 31st August 2026'}
            </p>
            {feeStatus !== 'Paid' ? (
              <button className="btn btn-primary btn-lg" onClick={handlePayChildFee}>
                <CreditCard size={18} /> Pay School Fee Online
              </button>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>Paid ✓</span>
            )}
          </div>
        </div>

        {/* Teacher Communication Box */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ margin: 0 }}>💬 Teacher Communication Channel</h4>
          </div>
          <div className="card-body">
            <div style={{ padding: 16, backgroundColor: 'var(--color-bg-primary)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>Mrs. Priya Sharma (Class Teacher - 10-A)</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                "Arjun performed exceptionally well in today's Math unit test!"
              </div>
            </div>
            <button className="btn btn-secondary w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/parent/messages')}>
              <MessageCircle size={16} /> Send Direct Message to Class Teacher
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC LISTS FOR PTM & HELPDESK & FEEDBACK */}
      <div className="grid-3" style={{ gap: 24 }}>
        {/* Booked PTM Slots */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>📅 Booked PTM Slots</h4>
            <span className="badge badge-primary">{ptmBookings.length} Booked</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            {ptmBookings.map(b => (
              <div key={b.id} style={{ padding: 10, borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 700 }}>{b.teacher} ({b.date})</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Slot: {b.time} | <span className="badge badge-success">{b.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Helpdesk Queries */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>⚠️ Helpdesk Tickets</h4>
            <span className="badge badge-warning">{complaints.length} Tickets</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            {complaints.map(c => (
              <div key={c.id} style={{ padding: 10, borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                <div style={{ fontWeight: 700 }}>{c.category}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>{c.desc} | <span className="badge badge-info">{c.status}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Submissions */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>⭐ Parent Feedback</h4>
            <span className="badge badge-success">{feedbackList.length} Sent</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            {feedbackList.map(f => (
              <div key={f.id} style={{ padding: 10, borderBottom: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: 700 }}>{f.category}</span>
                  <span>{'⭐'.repeat(f.rating)}</span>
                </div>
                <div style={{ color: 'var(--color-text-muted)', marginTop: 2 }}>"{f.comment}"</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Book PTM Modal */}
      <Modal isOpen={showPTMModal} onClose={() => setShowPTMModal(false)} title="Book Parent-Teacher Meeting (PTM) Slot">
        <form onSubmit={handleBookPTM}>
          <div className="form-group">
            <label className="form-label">Select Date *</label>
            <input className="form-input" type="date" value={ptmDate} onChange={e => setPtmDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Time Slot *</label>
            <select className="form-select" value={ptmTime} onChange={e => setPtmTime(e.target.value)}>
              <option>10:00 AM - 10:30 AM</option>
              <option>11:00 AM - 11:30 AM</option>
              <option>02:00 PM - 02:30 PM</option>
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPTMModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm PTM Booking</button>
          </div>
        </form>
      </Modal>

      {/* Raise Complaint Modal */}
      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Raise Helpdesk Query / Complaint">
        <form onSubmit={handleRaiseComplaint}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={complaintCategory} onChange={e => setComplaintCategory(e.target.value)}>
              <option>Fee & Billing Query</option>
              <option>Academic Issue</option>
              <option>Transport Issue</option>
              <option>Hostel / Mess Issue</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" rows={4} placeholder="Describe your query or concern..." value={complaintDesc} onChange={e => setComplaintDesc(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowComplaintModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Ticket</button>
          </div>
        </form>
      </Modal>

      {/* Parent Feedback Modal */}
      <Modal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} title="Submit Parent Feedback">
        <form onSubmit={handleSubmitFeedback}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={feedbackCategory} onChange={e => setFeedbackCategory(e.target.value)}>
              <option>Academic Quality</option>
              <option>Infrastructure & Facilities</option>
              <option>Transport & Safety</option>
              <option>Teacher Communication</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Rating *</label>
            <select className="form-select" value={feedbackRating} onChange={e => setFeedbackRating(Number(e.target.value))}>
              <option value={5}>5 Stars — Excellent</option>
              <option value={4}>4 Stars — Good</option>
              <option value={3}>3 Stars — Average</option>
              <option value={2}>2 Stars — Fair</option>
              <option value={1}>1 Star — Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Comments *</label>
            <textarea className="form-textarea" rows={3} placeholder="Share your suggestions..." value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Feedback</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ParentOverview;

