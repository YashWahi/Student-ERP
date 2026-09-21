import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import { Building2, Users, GraduationCap, DollarSign, Award, CheckCircle, Bell, Megaphone, Settings, UserCheck, BarChart2, Plus, Check } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getBranches } from '../../services/tenantService';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const SEED_BRANCHES = [
  { id: 1, name: 'Green Valley - Main Campus', location: 'Noida, Sector 62', admin: 'Dr. Rajesh Kumar', students: 1850, teachers: 95, attendance: '94%', feeStatus: '₹42.5L collected', status: 'Active' },
  { id: 2, name: 'Green Valley - Gurugram Branch', location: 'DLF Phase 3, Gurugram', admin: 'Sunita Mehra', students: 1200, teachers: 60, attendance: '88%', feeStatus: '₹28.1L collected', status: 'Active' },
  { id: 3, name: 'Green Valley - Delhi North Campus', location: 'Model Town, Delhi', admin: 'Amit Sharma', students: 950, teachers: 48, attendance: '92%', feeStatus: '₹22.4L collected', status: 'Active' },
];

const SEED_ANNOUNCEMENTS = [
  { id: 1, title: 'Mid-Term Examination Date Sheet Announcement', details: 'Published to all 3 campuses for Academic Session 2026-27.', date: 'Today, 09:30 AM' },
  { id: 2, title: 'Annual Inter-Campus Cultural Fest Registration', details: 'Call for student registrations across Noida, Gurugram and Delhi campuses.', date: '11 Aug 2026' },
];

const SEED_NOTIFICATIONS = [
  { id: 1, text: '⚠️ Gurugram branch monthly fee collection target reached 78%.', read: false },
  { id: 2, text: '✅ Main Campus Mid-term examination results uploaded.', read: false },
  { id: 3, text: 'ℹ️ Delhi North Campus scheduled server maintenance completed.', read: true },
];

const SubAdminOverview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const path = location.pathname;
  const isBranchesView = path === '/subadmin/branches';
  const isAdminsView = path === '/subadmin/admins';
  const isAnalyticsView = path === '/subadmin/analytics';
  const isAnnouncementsView = path === '/subadmin/announcements';
  const isNotificationsView = path === '/subadmin/notifications';
  const isSettingsView = path === '/subadmin/settings';

  const [branches, setBranches] = useState(SEED_BRANCHES);
  const [announcements, setAnnouncements] = useState(SEED_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', details: '' });

  const [groupSettings, setGroupSettings] = useState(() => {
    const saved = localStorage.getItem('subadmin_group_settings');
    return saved ? JSON.parse(saved) : {
      groupName: 'Green Valley Group of Institutions',
      contactEmail: 'subadmin@greenvalley.edu',
      primaryCity: 'Noida, UP',
    };
  });

  useEffect(() => {
    const loadRealBranches = async () => {
      const real = await getBranches();
      if (real.length > 0) {
        const formatted = real.map((b, idx) => ({
          id: b.branchId || b.id || (idx + 10),
          name: b.name,
          location: b.location || b.address || 'India',
          admin: b.admin || b.headAdminName || 'Branch Admin',
          students: b.students || 850,
          teachers: b.teachers || 45,
          attendance: b.attendance || '93%',
          feeStatus: b.feeStatus || '₹18.5L collected',
          status: b.status || 'Active',
        }));
        setBranches([...formatted, ...SEED_BRANCHES]);
      }
    };
    loadRealBranches();
  }, []);

  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim()) {
      toast.error('Please specify announcement title');
      return;
    }
    const created = {
      id: Date.now(),
      title: newAnnouncement.title,
      details: newAnnouncement.details || 'Broadcasted to all institutional campuses.',
      date: 'Just now',
    };
    setAnnouncements([created, ...announcements]);
    await logAuditEvent({
      action: 'BROADCAST_ANNOUNCEMENT',
      actor: 'Sub Admin',
      target: 'Institutional Group',
      details: `Broadcasted announcement: "${newAnnouncement.title}" to all branch campuses.`,
    });
    toast.success('📢 Announcement broadcast to all campuses!');
    setAnnouncementModalOpen(false);
    setNewAnnouncement({ title: '', details: '' });
  };

  const handleSaveGroupSettings = async () => {
    localStorage.setItem('subadmin_group_settings', JSON.stringify(groupSettings));
    await logAuditEvent({
      action: 'UPDATE_GROUP_SETTINGS',
      actor: 'Sub Admin',
      target: groupSettings.groupName,
      details: `Updated group settings: Name="${groupSettings.groupName}", Email="${groupSettings.contactEmail}"`,
    });
    toast.success('⚙️ College Group Settings Saved!');
  };

  const toggleNotificationRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const totalStudentsCount = branches.reduce((acc, b) => acc + (Number(b.students) || 0), 0);
  const totalTeachersCount = branches.reduce((acc, b) => acc + (Number(b.teachers) || 0), 0);

  const branchAttendanceData = branches.map(b => ({
    branch: b.name.replace('Green Valley - ', ''),
    attendance: parseInt(b.attendance) || 90,
  }));

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">
            {isBranchesView ? 'Institutional Branches Directory' :
             isAdminsView ? 'Branch Administrators & Roles' :
             isAnalyticsView ? 'Cross-Branch Analytics & Insights' :
             isAnnouncementsView ? 'Institutional Announcements' :
             isNotificationsView ? 'System Notifications & Audit' :
             isSettingsView ? 'College Group Global Settings' :
             'Multi-Branch Control Center'}
          </h1>
          <p className="page-subtitle">Unified multi-campus governance & operational analytics</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => navigate('/subadmin/branches/create')}>
            <Plus size={16} /> Create New Branch
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard icon={<Building2 size={22} />} label="Total Branches" value={branches.length} color="#6C63FF" suffix=" active" />
        <StatCard icon={<GraduationCap size={22} />} label="Total Students" value={totalStudentsCount} trend="across all branches" trendValue={6.4} color="#00D4AA" />
        <StatCard icon={<Users size={22} />} label="Total Staff & Teachers" value={totalTeachersCount} color="#FF6584" />
        <StatCard icon={<DollarSign size={22} />} label="Total Fee Collected" value={9300000} prefix="₹" trend="vs last term" trendValue={14.2} color="#10B981" />
      </div>

      {/* TAB SUB-VIEWS */}
      {isAnnouncementsView && (
        <div className="card" style={{ marginBottom: 28, padding: 24 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>📢 Multi-Branch Group Announcements</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setAnnouncementModalOpen(true)}>
              + Broadcast Announcement
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {announcements.map(a => (
              <div key={a.id} style={{ padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: 'var(--color-bg-surface)' }}>
                <div className="flex justify-between items-center">
                  <strong>{a.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.date}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>{a.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isNotificationsView && (
        <div className="card" style={{ marginBottom: 28, padding: 24 }}>
          <h4 style={{ margin: '0 0 16px' }}>🔔 Sub-Admin Notifications & Activity Stream</h4>
          <div className="flex flex-col gap-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className="flex justify-between items-center"
                style={{
                  padding: 14, border: '1px solid var(--color-border)', borderRadius: 8,
                  backgroundColor: n.read ? 'var(--color-bg-primary)' : 'var(--color-primary-light)',
                  cursor: 'pointer',
                }}
                onClick={() => toggleNotificationRead(n.id)}
              >
                <span style={{ fontSize: '0.875rem', fontWeight: n.read ? 500 : 700 }}>{n.text}</span>
                <span className={`badge ${n.read ? 'badge-neutral' : 'badge-primary'}`}>
                  {n.read ? 'Read' : 'New'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSettingsView && (
        <div className="card" style={{ marginBottom: 28, padding: 24 }}>
          <h4 style={{ margin: '0 0 16px' }}>⚙️ College Group Settings</h4>
          <div className="grid-2" style={{ gap: 20, maxWidth: 800 }}>
            <div className="form-group">
              <label className="form-label">Institution Group Name</label>
              <input
                className="form-input"
                value={groupSettings.groupName}
                onChange={e => setGroupSettings({ ...groupSettings, groupName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SubAdmin Group Contact Email</label>
              <input
                className="form-input"
                value={groupSettings.contactEmail}
                onChange={e => setGroupSettings({ ...groupSettings, contactEmail: e.target.value })}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSaveGroupSettings}>
            Save Settings
          </button>
        </div>
      )}

      {/* Attendance & Performance Grid */}
      {(!isSettingsView && !isNotificationsView && !isAnnouncementsView) && (
        <div className="grid-2" style={{ marginBottom: 28 }}>
          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card-header">
              <div>
                <h4 style={{ margin: 0 }}>Branch Attendance Comparison</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>Average student attendance (%)</p>
              </div>
            </div>
            <div className="card-body" style={{ padding: '16px 24px' }}>
              <div className="chart-container" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="branch" stroke="var(--text-muted)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Attendance']} />
                    <Bar dataKey="attendance" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card-header">
              <h4 style={{ margin: 0 }}>Branch Ranking & Highlights</h4>
            </div>
            <div className="card-body">
              {branches.slice(0, 5).map((b, i) => (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                  borderBottom: i < Math.min(branches.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: i === 0 ? 'rgba(0,212,170,0.15)' : 'var(--bg-glass)',
                    color: i === 0 ? '#00D4AA' : 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                  }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{b.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin: {b.admin} · {b.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success">{b.attendance} Att.</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{b.feeStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Branches Table preview */}
      {(!isSettingsView && !isNotificationsView) && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>{isAdminsView ? 'Branch Administrators Ledger' : 'Branch Quick Status'}</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/subadmin/branches')}>Manage All Branches →</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Branch Name</th>
                    <th>Branch Head</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Attendance Today</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map(b => (
                    <tr key={b.id}>
                      <td><strong>{b.name}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.location}</span></td>
                      <td>{b.admin}</td>
                      <td>{b.students}</td>
                      <td>{b.teachers}</td>
                      <td><span style={{ color: '#10B981', fontWeight: 600 }}>{b.attendance}</span></td>
                      <td><span className="badge badge-success">{b.status || 'Active'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      <Modal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        title="Broadcast Group Announcement"
      >
        <form onSubmit={handleBroadcastAnnouncement}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Announcement Title *</label>
            <input
              className="form-input"
              placeholder="e.g. Mid-Term Date Sheet Announcement"
              value={newAnnouncement.title}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Announcement Details / Message</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Detailed notification text for branch students & faculty..."
              value={newAnnouncement.details}
              onChange={e => setNewAnnouncement({ ...newAnnouncement, details: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setAnnouncementModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Broadcast Announcement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubAdminOverview;
