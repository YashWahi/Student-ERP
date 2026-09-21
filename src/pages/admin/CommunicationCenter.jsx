// src/pages/admin/CommunicationCenter.jsx
import { useState } from 'react';
import {
  MessageSquare, Send, Bell, Mail, Smartphone, FileText, CheckCheck,
  Calendar, Layers, Clock, Plus, Filter, ShieldCheck, Download, AlertCircle, Trash2
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { exportToCSV } from '../../services/exportService';
import { sendBroadcastAnnouncement, postSchoolNotice, sendResendEmail } from '../../services/communicationService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MESSAGE_TEMPLATES = [
  { id: 't1', name: 'Quarterly Fee Due Reminder', subject: 'Important: Quarterly Fee Due Reminder', body: 'Dear Parent, this is a friendly reminder that the Quarterly Fee for Q2 is due on 31st August 2026. Please pay online via the Parent Portal.' },
  { id: 't2', name: 'PTM Invitation Notice', subject: 'Parent-Teacher Meeting Scheduled', body: 'Dear Parent, you are cordially invited to attend the PTM scheduled for 20th August 2026. Please book your preferred slot via the portal.' },
  { id: 't3', name: 'Low Attendance Warning Alert', subject: 'Attendance Warning Notice', body: 'Dear Parent, your ward’s monthly attendance has fallen below 75%. Please contact the class teacher immediately.' },
];

const MOCK_BROADCASTS = [
  { id: 'b1', subject: 'Independence Day Celebration & Schedule', target: 'All Students & Staff', channels: 'Email + Push', sentBy: 'Branch Admin', date: '2026-08-12', recipients: 840, delivered: 836, status: 'Delivered' },
  { id: 'b2', subject: 'Urgent: Monsoon Rainy Day School Holiday', target: 'All Parents', channels: 'Email + Push + SMS', sentBy: 'Sub-Admin', date: '2026-08-05', recipients: 380, delivered: 380, status: 'Delivered' },
];

const MOCK_NOTICES = [
  { id: 'n1', title: 'Mid-Term Examination Date Sheet Released', category: 'Academics', postedBy: 'Exam Cell', date: '2026-08-10', isPinned: true },
  { id: 'n2', title: 'Annual Sports Day Registration Open', category: 'Events', postedBy: 'Sports Dept', date: '2026-08-08', isPinned: false },
];

const CommunicationCenter = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [activeTab, setActiveTab] = useState('broadcast'); // broadcast | notices | templates | logs | preferences
  
  const [broadcasts, setBroadcasts] = useState(() => {
    try {
      const saved = localStorage.getItem(`comm_broadcasts_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return isCustomCollege ? [] : MOCK_BROADCASTS;
  });

  const [notices, setNotices] = useState(() => {
    try {
      const saved = localStorage.getItem(`comm_notices_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return isCustomCollege ? [] : MOCK_NOTICES;
  });

  const updateBroadcasts = (newList) => {
    setBroadcasts(newList);
    try {
      localStorage.setItem(`comm_broadcasts_${currentTenant}`, JSON.stringify(newList));
    } catch {}
  };

  const updateNotices = (newList) => {
    setNotices(newList);
    try {
      localStorage.setItem(`comm_notices_${currentTenant}`, JSON.stringify(newList));
    } catch {}
  };

  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Form states
  const [bcastSubject, setBcastSubject] = useState('');
  const [bcastAudience, setBcastAudience] = useState('all_parents');
  const [bcastContent, setBcastContent] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCat, setNoticeCat] = useState('Academics');

  const handleSelectTemplate = (tmpl) => {
    setBcastSubject(tmpl.subject);
    setBcastContent(tmpl.body);
    toast.success(`Template "${tmpl.name}" loaded!`);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!bcastSubject.trim()) return;

    await sendBroadcastAnnouncement({
      tenantId: currentTenant,
      senderName: 'Branch Admin',
      targetAudience: bcastAudience,
      subject: bcastSubject,
      content: bcastContent,
    });

    try {
      await sendResendEmail({
        to: 'parent@school.edu.in',
        subject: bcastSubject,
        htmlBody: `<div style="font-family:sans-serif;padding:20px;"><h2>${bcastSubject}</h2><p>${bcastContent}</p><hr/><p style="color:#64748b;font-size:12px;">Campus ERP Broadcast</p></div>`,
      });
    } catch {}

    const newB = {
      id: `b_${Date.now()}`,
      subject: bcastSubject,
      target: bcastAudience === 'all_parents' ? 'All Parents' : 'All Students',
      channels: 'Email + Push',
      sentBy: 'Branch Admin',
      date: new Date().toISOString().split('T')[0],
      recipients: 380,
      delivered: 380,
      status: 'Delivered',
    };

    updateBroadcasts([newB, ...broadcasts]);
    toast.success(`📢 Broadcast "${bcastSubject}" dispatched via Email/Push!`);
    setShowBroadcastModal(false);
    setBcastSubject('');
    setBcastContent('');
    setBcastAudience('all_parents');
  };

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;

    await postSchoolNotice({
      tenantId: currentTenant,
      title: noticeTitle,
      category: noticeCat,
      postedBy: 'Branch Admin',
      isPinned: true,
    });

    const newN = {
      id: `n_${Date.now()}`,
      title: noticeTitle,
      category: noticeCat,
      postedBy: 'Branch Admin',
      date: new Date().toISOString().split('T')[0],
      isPinned: true
    };

    updateNotices([newN, ...notices]);
    toast.success(`📌 Notice "${noticeTitle}" posted to Notice Board!`);
    setShowNoticeModal(false);
    setNoticeTitle('');
  };

  const broadcastColumns = [
    { key: 'subject', label: 'Broadcast Campaign', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.target} · {r.channels}</span></div> },
    { key: 'sentBy', label: 'Dispatched By' },
    { key: 'date', label: 'Sent Date' },
    { key: 'delivered', label: 'Delivery Rate', render: (v, r) => <span><strong>{v}</strong> / {r.recipients} (100%)</span> },
    { key: 'status', label: 'Status', render: (v) => <span className="badge badge-success">{v}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => updateBroadcasts(broadcasts.filter(b => b.id !== r.id))} title="Delete broadcast">
          <Trash2 size={14} />
        </button>
      )
    }
  ];

  const noticeColumns = [
    { key: 'title', label: 'Notice Headline', render: (v, r) => <div><strong>{r.isPinned ? '📌 ' : ''}{v}</strong></div> },
    { key: 'category', label: 'Category', render: (v) => <span className="badge badge-primary">{v}</span> },
    { key: 'postedBy', label: 'Author' },
    { key: 'date', label: 'Published Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => updateNotices(notices.filter(n => n.id !== r.id))} title="Delete notice">
          <Trash2 size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Campus Communication Hub</h1>
          <p className="page-subtitle">Multi-channel announcements, WhatsApp/SMS alerts, dynamic templates & institutional notice board</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setShowNoticeModal(true)}>
            <Plus size={16} /> Post Notice
          </button>
          <button className="btn btn-primary" onClick={() => setShowBroadcastModal(true)}>
            <Send size={16} /> Send Broadcast
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<Send size={20} />} label="Total Broadcasts Sent" value={broadcasts.length} color="var(--color-primary)" />
        <StatCard icon={<CheckCheck size={20} />} label="Delivery Success Rate" value="99.5%" color="var(--color-success)" />
        <StatCard icon={<Bell size={20} />} label="Active Campus Notices" value={notices.length} color="var(--color-warning)" />
        <StatCard icon={<Smartphone size={20} />} label="Integrated Gateway" value="WhatsApp + Email" color="#7c3aed" />
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
          📢 Broadcast History
        </button>
        <button className={`tab-btn ${activeTab === 'notices' ? 'active' : ''}`} onClick={() => setActiveTab('notices')}>
          📌 Official Notice Board
        </button>
        <button className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`} onClick={() => setActiveTab('templates')}>
          📝 Message Templates
        </button>
      </div>

      {activeTab === 'broadcast' && (
        <DataTable
          columns={broadcastColumns}
          data={broadcasts}
          searchPlaceholder="Search broadcasts by subject or audience..."
        />
      )}

      {activeTab === 'notices' && (
        <DataTable
          columns={noticeColumns}
          data={notices}
          searchPlaceholder="Search notice board..."
        />
      )}

      {activeTab === 'templates' && (
        <div className="grid-3" style={{ gap: 16 }}>
          {MESSAGE_TEMPLATES.map(tmpl => (
            <div key={tmpl.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 700 }}>{tmpl.name}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 12, backgroundColor: 'var(--color-bg-primary)', padding: 10, borderRadius: 6 }}>
                  {tmpl.body}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => { handleSelectTemplate(tmpl); setShowBroadcastModal(true); }}>
                Use Template in Broadcast
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal isOpen={showBroadcastModal} onClose={() => setShowBroadcastModal(false)} title="Send Multi-Channel Broadcast">
        <form onSubmit={handleSendBroadcast}>
          <div className="form-group">
            <label className="form-label">Target Audience</label>
            <select className="form-select" value={bcastAudience} onChange={e => setBcastAudience(e.target.value)}>
              <option value="all_parents">All Parents (Classes 1-12)</option>
              <option value="all_students">All Students</option>
              <option value="all_staff">All Faculty & Staff</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Broadcast Subject / Headline *</label>
            <input className="form-input" required placeholder="e.g. Annual Sports Day Schedule" value={bcastSubject} onChange={e => setBcastSubject(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Broadcast Body / Message *</label>
            <textarea className="form-input" style={{ height: 100 }} required placeholder="Enter message text..." value={bcastContent} onChange={e => setBcastContent(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Send size={15} /> Send Broadcast</button>
          </div>
        </form>
      </Modal>

      {/* Notice Modal */}
      <Modal isOpen={showNoticeModal} onClose={() => setShowNoticeModal(false)} title="Publish Institutional Notice">
        <form onSubmit={handlePostNotice}>
          <div className="form-group">
            <label className="form-label">Notice Headline *</label>
            <input className="form-input" required placeholder="e.g. Science Exhibition Registration Open" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notice Category</label>
            <select className="form-select" value={noticeCat} onChange={e => setNoticeCat(e.target.value)}>
              <option value="Academics">Academics</option>
              <option value="Events">Events & Celebrations</option>
              <option value="Examinations">Examinations</option>
              <option value="Administration">Administration</option>
            </select>
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowNoticeModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Plus size={15} /> Publish Notice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CommunicationCenter;
