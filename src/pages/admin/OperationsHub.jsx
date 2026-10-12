// src/pages/admin/OperationsHub.jsx
import { useState } from 'react';
import {
  BookOpen, Truck, Building, Layers, ShieldCheck, UserCheck, Key, AlertTriangle,
  HelpCircle, Download, Plus, CheckCircle, Search, Clock, FileText, QrCode
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { exportToCSV } from '../../services/exportService';
import { checkInVisitor, issueGatePass, logDisciplineIncident, registerCampusAsset, createHelpdeskTicket } from '../../services/operationsService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_VISITORS = [
  { id: 'v1', visitorName: 'Sanjay Dutt', phone: '+91 98765 11223', hostName: 'Principal Office', purpose: 'Vendor Meeting', timeIn: '10:15 AM', status: 'Checked In' },
  { id: 'v2', visitorName: 'Meenakshi Sundaram', phone: '+91 98765 44332', hostName: 'Mrs. Priya Sharma', purpose: 'Parent Meeting', timeIn: '09:30 AM', status: 'Checked Out' },
];

const MOCK_GATEPASSES = [
  { id: 'gp1', personName: 'Arjun Verma (Student)', role: 'Student', class: 'Class 10-A', reason: 'Medical Emergency', approvedBy: 'Class Teacher', time: '11:00 AM', status: 'Approved' },
  { id: 'gp2', personName: 'Mr. Alok Singh (Faculty)', role: 'Teacher', class: 'Computer Dept', reason: 'Official Work', approvedBy: 'Sub-Admin', time: '01:30 PM', status: 'Approved' },
];

const MOCK_ASSETS = [
  { id: 'ast1', assetTag: 'AST-LAB-001', assetName: 'Dell OptiPlex 7090 Desktop', category: 'IT Hardware', room: 'Comp Lab 1', status: 'Operational', value: 48000 },
  { id: 'ast2', assetTag: 'AST-AUD-004', assetName: 'Epson 4K Laser Projector', category: 'AV Equipment', room: 'Main Auditorium', status: 'Under Maintenance', value: 85000 },
];

const MOCK_DISCIPLINE = [
  { id: 'd1', studentName: 'Kabir Verma', class: 'Class 6-C', incident: 'Classroom Disruption & Tardiness', severity: 'Minor Warning', action: 'Counselled by HOD', date: '2026-08-10' },
];

const OperationsHub = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [activeTab, setActiveTab] = useState('visitors');

  const [visitors, setVisitors] = useState(() => {
    const saved = localStorage.getItem(`ops_visitors_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_VISITORS;
  });

  const [gatePasses, setGatePasses] = useState(() => {
    const saved = localStorage.getItem(`ops_gatepasses_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_GATEPASSES;
  });

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem(`ops_assets_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_ASSETS;
  });

  const [discipline, setDiscipline] = useState(() => {
    const saved = localStorage.getItem(`ops_discipline_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_DISCIPLINE;
  });

  const updateVisitors = (list) => { setVisitors(list); localStorage.setItem(`ops_visitors_${currentTenant}`, JSON.stringify(list)); };
  const updateGatePasses = (list) => { setGatePasses(list); localStorage.setItem(`ops_gatepasses_${currentTenant}`, JSON.stringify(list)); };
  const updateAssets = (list) => { setAssets(list); localStorage.setItem(`ops_assets_${currentTenant}`, JSON.stringify(list)); };
  const updateDiscipline = (list) => { setDiscipline(list); localStorage.setItem(`ops_discipline_${currentTenant}`, JSON.stringify(list)); };

  // Modals
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);

  // Visitor Form
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visHost, setVisHost] = useState('Principal Office');
  const [visPurpose, setVisPurpose] = useState('');

  // Gate Pass Form
  const [passPerson, setPassPerson] = useState('');
  const [passReason, setPassReason] = useState('');

  // Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetCat, setAssetCat] = useState('IT Hardware');
  const [assetValue, setAssetValue] = useState(25000);

  // Discipline Form
  const [discStudent, setDiscStudent] = useState('');
  const [discIncident, setDiscIncident] = useState('');

  const handleCheckInVisitor = async (e) => {
    e.preventDefault();
    await checkInVisitor({
      tenantId: currentTenant,
      visitorName: visName,
      phone: visPhone,
      hostName: visHost,
      purpose: visPurpose,
    });
    updateVisitors([{ id: `v_${Date.now()}`, visitorName: visName, phone: visPhone, hostName: visHost, purpose: visPurpose, timeIn: 'Just Now', status: 'Checked In' }, ...visitors]);
    toast.success(`🎫 Visitor ${visName} checked in successfully!`);
    setShowVisitorModal(false);
    setVisName(''); setVisPhone(''); setVisHost('Principal Office'); setVisPurpose('');
  };

  const handleIssuePass = async (e) => {
    e.preventDefault();
    await issueGatePass({
      tenantId: currentTenant,
      personName: passPerson,
      reason: passReason,
      approvedBy: 'Gate Security Admin',
    });
    updateGatePasses([{ id: `gp_${Date.now()}`, personName: passPerson, role: 'Student', class: 'Class 10-A', reason: passReason, approvedBy: 'Gate Security', time: 'Just Now', status: 'Approved' }, ...gatePasses]);
    toast.success(`🎟️ Gate Pass issued for ${passPerson}!`);
    setShowPassModal(false);
    setPassPerson(''); setPassReason('');
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    const tag = `AST-CAMP-${Math.floor(100 + Math.random() * 900)}`;
    await registerCampusAsset({
      tenantId: currentTenant,
      assetTag: tag,
      assetName,
      category: assetCat,
      value: Number(assetValue),
    });
    updateAssets([{ id: `ast_${Date.now()}`, assetTag: tag, assetName, category: assetCat, room: 'Main Storage', status: 'Operational', value: Number(assetValue) }, ...assets]);
    toast.success(`🖥️ Asset ${assetName} registered with tag ${tag}!`);
    setShowAssetModal(false);
    setAssetName(''); setAssetCat('IT Hardware'); setAssetValue(25000);
  };

  const handleLogDiscipline = async (e) => {
    e.preventDefault();
    await logDisciplineIncident({
      tenantId: currentTenant,
      studentName: discStudent,
      incident: discIncident,
      severity: 'Formal Warning',
    });
    setDiscipline([{ id: `d_${Date.now()}`, studentName: discStudent, class: 'Class 10-A', incident: discIncident, severity: 'Formal Warning', action: 'Parent Notified', date: new Date().toISOString().split('T')[0] }, ...discipline]);
    toast.success(`⚠️ Disciplinary log created for ${discStudent}!`);
    setShowDisciplineModal(false);
    setDiscStudent(''); setDiscIncident('');
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Campus Operations & Security Command Center</h1>
          <p className="page-subtitle">Visitor management, gate passes, campus assets, inventory, discipline & helpdesk ticketing</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Visitor_GatePass_Report', visitors, [
            { key: 'visitorName', label: 'Visitor Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'hostName', label: 'Host' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'timeIn', label: 'Time In' },
            { key: 'status', label: 'Status' },
          ])}>
            <Download size={16} /> Export Logs CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowVisitorModal(true)}>
            <UserCheck size={16} /> Check In Visitor
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={<UserCheck size={22} />} label="Active Campus Visitors" value={`${visitors.filter(v => v.status === 'Checked In').length} On-Site`} color="#16A34A" />
        <StatCard icon={<Key size={22} />} label="Gate Passes Issued Today" value={`${gatePasses.length} Passes`} color="#2563EB" />
        <StatCard icon={<Layers size={22} />} label="Total Campus Assets" value={`₹${(assets.reduce((sum, a) => sum + Number(a.value || 0), 0) / 100000).toFixed(1)} Lakh`} color="#0F766E" />
        <StatCard icon={<HelpCircle size={22} />} label="Discipline Incidents" value={`${discipline.length} Incidents`} color="#D97706" />
      </div>

      {/* OPERATIONAL TAB NAVIGATION */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)', overflowX: 'auto' }}>
        {[
          { id: 'visitors', label: 'Visitor Management', icon: <UserCheck size={16} /> },
          { id: 'gatepass', label: 'Gate Pass Terminal', icon: <Key size={16} /> },
          { id: 'assets', label: 'Assets & Inventory', icon: <Layers size={16} /> },
          { id: 'discipline', label: 'Discipline Tracker', icon: <AlertTriangle size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* VISITORS TAB */}
      {activeTab === 'visitors' && (
        <DataTable
          columns={[
            { key: 'visitorName', label: 'Visitor Name & Phone', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.phone}</span></div> },
            { key: 'hostName', label: 'Host Person / Dept' },
            { key: 'purpose', label: 'Purpose of Visit' },
            { key: 'timeIn', label: 'Check-In Time' },
            { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Checked In' ? 'badge-success' : 'badge-neutral'}`}>{v}</span> },
          ]}
          data={visitors}
          title="Campus Visitor Register & Logs"
          searchPlaceholder="Search visitor name, host..."
        />
      )}

      {/* GATE PASS TAB */}
      {activeTab === 'gatepass' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>🎟️ Gate Pass Terminal & Exit Approvals</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setShowPassModal(true)}>
              <Plus size={14} /> Issue Gate Pass
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Person Name</th>
                  <th>Role / Class</th>
                  <th>Reason for Exit</th>
                  <th>Approved By</th>
                  <th>Time Issued</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.map(gp => (
                  <tr key={gp.id}>
                    <td><strong>{gp.personName}</strong></td>
                    <td><span className="badge badge-primary">{gp.class}</span></td>
                    <td>{gp.reason}</td>
                    <td>{gp.approvedBy}</td>
                    <td>{gp.time}</td>
                    <td><span className="badge badge-success">{gp.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSETS TAB */}
      {activeTab === 'assets' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>🖥️ Institutional Asset & Hardware Register</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssetModal(true)}>
              <Plus size={14} /> Register New Asset
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Location Room</th>
                  <th>Asset Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.assetTag}</strong></td>
                    <td>{a.assetName}</td>
                    <td><span className="badge badge-primary">{a.category}</span></td>
                    <td>{a.room}</td>
                    <td><strong>₹{a.value.toLocaleString('en-IN')}</strong></td>
                    <td><span className={`badge ${a.status === 'Operational' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISCIPLINE TAB */}
      {activeTab === 'discipline' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h4 style={{ margin: 0 }}>⚠️ Student Disciplinary Incident Tracker</h4>
            <button className="btn btn-primary btn-sm" onClick={() => setShowDisciplineModal(true)}>
              <Plus size={14} /> Log Disciplinary Incident
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Incident Detail</th>
                  <th>Severity Rating</th>
                  <th>Action Taken</th>
                  <th>Date Recorded</th>
                </tr>
              </thead>
              <tbody>
                {discipline.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.studentName}</strong></td>
                    <td><span className="badge badge-primary">{d.class}</span></td>
                    <td>{d.incident}</td>
                    <td><span className="badge badge-warning">{d.severity}</span></td>
                    <td>{d.action}</td>
                    <td>{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISITOR MODAL */}
      <Modal isOpen={showVisitorModal} onClose={() => setShowVisitorModal(false)} title="Check In Campus Visitor">
        <form onSubmit={handleCheckInVisitor}>
          <div className="form-group">
            <label className="form-label">Visitor Name *</label>
            <input className="form-input" placeholder="e.g. Ramesh Chandra" value={visName} onChange={e => setVisName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input className="form-input" placeholder="+91 98765 43210" value={visPhone} onChange={e => setVisPhone(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Host Person / Department *</label>
            <input className="form-input" placeholder="e.g. Principal Office / Mrs. Priya Sharma" value={visHost} onChange={e => setVisHost(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Purpose of Visit *</label>
            <input className="form-input" placeholder="e.g. Admission Query / Parent Meeting" value={visPurpose} onChange={e => setVisPurpose(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowVisitorModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Complete Check-In</button>
          </div>
        </form>
      </Modal>

      {/* GATE PASS MODAL */}
      <Modal isOpen={showPassModal} onClose={() => setShowPassModal(false)} title="Issue Gate Exit Pass">
        <form onSubmit={handleIssuePass}>
          <div className="form-group">
            <label className="form-label">Person Name *</label>
            <input className="form-input" placeholder="e.g. Arjun Verma (Class 10-A)" value={passPerson} onChange={e => setPassPerson(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Exit *</label>
            <textarea className="form-textarea" rows={3} placeholder="Medical emergency, early departure..." value={passReason} onChange={e => setPassReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowPassModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Issue Pass & Generate QR</button>
          </div>
        </form>
      </Modal>

      {/* ASSET MODAL */}
      <Modal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} title="Register Campus Asset">
        <form onSubmit={handleAddAsset}>
          <div className="form-group">
            <label className="form-label">Asset Name *</label>
            <input className="form-input" placeholder="e.g. Sony Bravia 65 Smart Display" value={assetName} onChange={e => setAssetName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={assetCat} onChange={e => setAssetCat(e.target.value)}>
              <option>IT Hardware</option>
              <option>AV Equipment</option>
              <option>Laboratory Instrument</option>
              <option>Campus Furniture</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Value (₹) *</label>
            <input className="form-input" type="number" value={assetValue} onChange={e => setAssetValue(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAssetModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Asset</button>
          </div>
        </form>
      </Modal>

      {/* DISCIPLINE MODAL */}
      <Modal isOpen={showDisciplineModal} onClose={() => setShowDisciplineModal(false)} title="Log Disciplinary Incident">
        <form onSubmit={handleLogDiscipline}>
          <div className="form-group">
            <label className="form-label">Student Name *</label>
            <input className="form-input" placeholder="e.g. Kabir Verma" value={discStudent} onChange={e => setDiscStudent(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Incident Description *</label>
            <textarea className="form-textarea" rows={3} placeholder="Describe the incident..." value={discIncident} onChange={e => setDiscIncident(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowDisciplineModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Incident Log</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OperationsHub;
