// src/pages/admin/AdmissionsCRM.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Phone, Calendar, Download, ArrowRight, LayoutGrid, List, Upload,
  BarChart2, Search, CheckCircle, Clock, XCircle, UserCheck, AlertTriangle, MessageSquare, Trash2
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../services/exportService';
import { useCrmStore } from '../../store/crmStore';
import { parseExcelOrCSV, normalizeCRMLeads } from '../../utils/excelParser';
import toast from 'react-hot-toast';

const KANBAN_STAGES = [
  { id: 'New', title: 'New Enquiries', color: 'var(--color-primary, #2563EB)', bg: 'var(--color-primary-light, #EFF6FF)' },
  { id: 'Contacted', title: 'Contacted & Pitch', color: '#0F766E', bg: '#F0FDFA' },
  { id: 'Follow-up', title: 'Follow-Up / Visit', color: '#D97706', bg: '#FFFBEB' },
  { id: 'Admitted', title: 'Admitted 🎉', color: '#16A34A', bg: '#F0FDF4' },
  { id: 'Lost', title: 'Lost / Closed', color: '#DC2626', bg: '#FEF2F2' },
];

const STAGE_COLORS = {
  'New': 'var(--color-primary, #2563EB)',
  'Contacted': '#0F766E',
  'Follow-up': '#D97706',
  'Admitted': '#16A34A',
  'Lost': '#DC2626'
};

const AdmissionsCRM = () => {
  const navigate = useNavigate();
  const { leads, addLead, updateLeadStage, updateLeadFollowUp, bulkImportLeads, deleteLead } = useCrmStore();
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // View states
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [counsellorFilter, setCounsellorFilter] = useState('All');
  const [reminderFilter, setReminderFilter] = useState('All'); // 'All' | 'Overdue' | 'DueToday' | 'Upcoming'

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showLogHistoryModal, setShowLogHistoryModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState(null);

  // Form States
  const [leadForm, setLeadForm] = useState({
    name: '',
    parentName: '',
    phone: '',
    email: '',
    targetClass: 'Class 10-A',
    source: 'Website Enquiry',
    counsellor: 'Sunita Mehra',
    followUpDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [followUpDateInput, setFollowUpDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [followUpNotesInput, setFollowUpNotesInput] = useState('');
  const [callLogInput, setCallLogInput] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for date status
  const getCallDateBadge = (dateStr) => {
    if (!dateStr || dateStr === 'Completed') {
      return <span className="badge badge-success">Completed</span>;
    }
    if (dateStr < todayStr) {
      return (
        <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
          <AlertTriangle size={10} style={{ marginRight: 3 }} /> Overdue: {dateStr}
        </span>
      );
    }
    if (dateStr === todayStr) {
      return (
        <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FCD34D' }}>
          <Clock size={10} style={{ marginRight: 3 }} /> Call Today
        </span>
      );
    }
    return (
      <span className="badge badge-ghost" style={{ fontSize: '0.72rem' }}>
        📅 {dateStr}
      </span>
    );
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== 'All' && l.status !== stageFilter) return false;
      if (counsellorFilter !== 'All' && l.counsellor !== counsellorFilter) return false;
      
      if (reminderFilter === 'Overdue' && (l.followUpDate >= todayStr || l.status === 'Admitted' || l.status === 'Lost')) return false;
      if (reminderFilter === 'DueToday' && l.followUpDate !== todayStr) return false;
      if (reminderFilter === 'Upcoming' && l.followUpDate <= todayStr) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchParent = l.parentName.toLowerCase().includes(q);
        const matchPhone = l.phone.toLowerCase().includes(q);
        const matchCounsellor = l.counsellor.toLowerCase().includes(q);
        const matchClass = l.class.toLowerCase().includes(q);
        const matchSource = l.source.toLowerCase().includes(q);
        return matchName || matchParent || matchPhone || matchCounsellor || matchClass || matchSource;
      }
      return true;
    });
  }, [leads, stageFilter, counsellorFilter, reminderFilter, searchQuery, todayStr]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const admitted = leads.filter(l => l.status === 'Admitted').length;
    const activeFollowups = leads.filter(l => l.status === 'Follow-up' || l.status === 'Contacted').length;
    const overdueCalls = leads.filter(l => l.followUpDate < todayStr && l.status !== 'Admitted' && l.status !== 'Lost').length;
    const conversionRate = total > 0 ? ((admitted / total) * 100).toFixed(1) : '0.0';

    // Chart: Stage Distribution
    const stageDistribution = KANBAN_STAGES.map(st => ({
      name: st.title,
      value: leads.filter(l => l.status === st.id).length,
      color: st.color
    }));

    // Chart: Source Breakdown
    const sources = ['Website Enquiry', 'Walk-in', 'Referral', 'Social Media', 'Online Ad'];
    const sourceData = sources.map(src => {
      const srcLeads = leads.filter(l => l.source === src);
      const srcAdmitted = srcLeads.filter(l => l.status === 'Admitted').length;
      return {
        source: src,
        total: srcLeads.length,
        admitted: srcAdmitted,
        conversion: srcLeads.length > 0 ? Math.round((srcAdmitted / srcLeads.length) * 100) : 0
      };
    });

    // Counsellor Performance
    const counsellors = Array.from(new Set(leads.map(l => l.counsellor))).filter(Boolean);
    const counsellorStats = counsellors.map(cName => {
      const cLeads = leads.filter(l => l.counsellor === cName);
      const cAdmitted = cLeads.filter(l => l.status === 'Admitted').length;
      const cFollowups = cLeads.filter(l => l.status === 'Follow-up' || l.status === 'Contacted').length;
      return {
        counsellor: cName,
        total: cLeads.length,
        active: cFollowups,
        admitted: cAdmitted,
        conversion: cLeads.length > 0 ? ((cAdmitted / cLeads.length) * 100).toFixed(1) : '0.0'
      };
    });

    return { total, admitted, activeFollowups, overdueCalls, conversionRate, stageDistribution, sourceData, counsellorStats };
  }, [leads, todayStr]);

  // Handlers
  const handleStageChange = (leadId, newStage) => {
    updateLeadStage(leadId, newStage);
    toast.success(`Pipeline stage updated to "${newStage}"`);
  };

  const handleCreateLead = (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast.error('Applicant name and phone number are required');
      return;
    }

    const created = addLead(leadForm);
    toast.success(`🎉 Enquiry for "${created.name}" created!`);
    setShowAddModal(false);
    setLeadForm({
      name: '', parentName: '', phone: '', email: '', targetClass: 'Class 10-A',
      source: 'Website Enquiry', counsellor: 'Sunita Mehra',
      followUpDate: new Date().toISOString().split('T')[0], notes: ''
    });
  };

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    updateLeadFollowUp(selectedLead.id, {
      nextDate: followUpDateInput,
      notes: followUpNotesInput,
      callNote: callLogInput ? `Call Note: ${callLogInput}` : null
    });
    toast.success(`📅 Call reminder set for ${selectedLead.name} on ${followUpDateInput}`);
    setShowFollowUpModal(false);
    setCallLogInput('');
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Parsing Excel lead records...', { id: 'import' });
      const rawRows = await parseExcelOrCSV(file);
      const normalized = normalizeCRMLeads(rawRows);
      if (normalized.length === 0) {
        toast.error('No valid records found in uploaded file', { id: 'import' });
        return;
      }
      bulkImportLeads(normalized);
      toast.success(`📥 Bulk import successful! ${normalized.length} leads added to pipeline.`, { id: 'import' });
      e.target.value = '';
    } catch (err) {
      toast.error(`Import failed: ${err.message}`, { id: 'import' });
    }
  };

  const handleAdmitRedirect = (lead) => {
    navigate(
      `/admin/students/admit?leadId=${lead.id}&name=${encodeURIComponent(lead.name)}&parentName=${encodeURIComponent(lead.parentName)}&phone=${encodeURIComponent(lead.phone)}&class=${encodeURIComponent(lead.class)}`
    );
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStageId) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      handleStageChange(leadId, targetStageId);
    }
    setDraggedLeadId(null);
  };

  const columns = [
    {
      key: 'name',
      label: 'Applicant & Parent',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{v}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Parent: {r.parentName}</div>
        </div>
      )
    },
    { key: 'class', label: 'Class', render: (v) => <span className="badge badge-primary">{v}</span> },
    { key: 'source', label: 'Lead Source' },
    { key: 'counsellor', label: 'Counsellor' },
    { key: 'phone', label: 'Phone', render: (v) => <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{v}</span> },
    { key: 'followUpDate', label: 'Call Schedule', render: (v) => getCallDateBadge(v) },
    {
      key: 'status',
      label: 'Pipeline Stage',
      render: (v, r) => (
        <select
          className="form-select"
          value={v}
          onChange={(e) => handleStageChange(r.id, e.target.value)}
          style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, borderColor: STAGE_COLORS[v] }}
        >
          {KANBAN_STAGES.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2 items-center">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSelectedLead(row);
              setFollowUpDateInput(row.followUpDate || todayStr);
              setFollowUpNotesInput(row.notes || '');
              setShowFollowUpModal(true);
            }}
            title="Schedule Follow Up Call"
          >
            <Calendar size={13} /> Follow Up
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => {
              setSelectedLead(row);
              setShowLogHistoryModal(true);
            }}
            title="Call Log History"
          >
            <MessageSquare size={13} />
          </button>
          {row.status !== 'Admitted' ? (
            <button className="btn btn-primary btn-sm" onClick={() => handleAdmitRedirect(row)}>
              Admit <ArrowRight size={13} />
            </button>
          ) : (
            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Enrolled</span>
          )}
          <button
            className="btn btn-ghost btn-sm btn-icon"
            style={{ color: '#DC2626' }}
            onClick={() => {
              if (window.confirm(`Delete lead "${row.name}"?`)) {
                deleteLead(row.id);
                toast.success('Lead removed');
              }
            }}
            title="Delete Lead"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="page-title">Admissions CRM & Pipeline Tracker</h1>
          <p className="page-subtitle">Track prospective student enquiries, counsellor call schedules, conversion metrics & Excel lead imports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* View Modes */}
          <div className="flex items-center gap-1" style={{ backgroundColor: '#FFFFFF', padding: 3, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <button
              className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid size={14} /> Kanban Board
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} /> Table Roster
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'analytics' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('analytics')}
            >
              <BarChart2 size={14} /> Conversion Report
            </button>
          </div>

          <label className="btn btn-secondary btn-md cursor-pointer flex items-center gap-2">
            <Upload size={16} /> Import Excel / CSV
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleExcelImport} style={{ display: 'none' }} />
          </label>

          <button className="btn btn-secondary" onClick={() => exportToCSV('Admissions_Leads', filteredLeads, columns)}>
            <Download size={16} /> Export CSV
          </button>

          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Admission Lead
          </button>
        </div>
      </div>

      {/* DYNAMIC KPI METRICS CARDS */}
      {loading ? (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div style={{ height: 12, width: '50%', backgroundColor: '#E2E8F0', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 28, width: '30%', backgroundColor: '#CBD5E1', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="card" style={{ padding: 18, borderLeft: '4px solid var(--color-primary, #2563EB)' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Total Enquiries</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', marginTop: 4 }}>{metrics.total}</div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>All prospective applicants</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #D97706' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Active Follow-ups</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#D97706', marginTop: 4 }}>{metrics.activeFollowups}</div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>In active communication</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #DC2626' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Overdue Call Reminders</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#DC2626', marginTop: 4 }}>{metrics.overdueCalls}</div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>Requires immediate action</div>
          </div>

          <div className="card" style={{ padding: 18, borderLeft: '4px solid #16A34A' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Conversion Rate</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#16A34A', marginTop: 4 }}>{metrics.conversionRate}%</div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>{metrics.admitted} of {metrics.total} enrolled</div>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="card flex justify-between items-center flex-wrap gap-3" style={{ padding: '12px 20px', marginBottom: 20 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="data-table-search" style={{ width: 260 }}>
            <Search size={14} color="#64748B" />
            <input
              type="text"
              placeholder="Search applicant, phone, counsellor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: '#64748B' }}>
            <strong>Stage:</strong>
            <select className="form-select" value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <option value="All">All Stages</option>
              {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: '#64748B' }}>
            <strong>Counsellor:</strong>
            <select className="form-select" value={counsellorFilter} onChange={e => setCounsellorFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <option value="All">All Counsellors</option>
              <option value="Sunita Mehra">Sunita Mehra</option>
              <option value="Amit Sharma">Amit Sharma</option>
              <option value="Rajesh Kumar">Rajesh Kumar</option>
            </select>
          </div>

          <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: '#64748B' }}>
            <strong>Reminders:</strong>
            <select className="form-select" value={reminderFilter} onChange={e => setReminderFilter(e.target.value)} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
              <option value="All">All Calls</option>
              <option value="Overdue">⚠️ Overdue</option>
              <option value="DueToday">📅 Call Today</option>
              <option value="Upcoming">⏳ Upcoming</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredLeads.length} of {leads.length} Enquiries
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, alignItems: 'start' }}>
          {KANBAN_STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                style={{
                  backgroundColor: stage.bg,
                  border: `1.5px solid ${stage.color}35`,
                  borderRadius: 12,
                  padding: 12,
                  minHeight: 520,
                  transition: 'background-color 0.2s ease'
                }}
              >
                {/* Stage Header */}
                <div className="flex justify-between items-center" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${stage.color}30` }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: stage.color }} />
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A' }}>{stage.title}</span>
                  </div>
                  <span className="badge" style={{ backgroundColor: '#FFFFFF', color: stage.color, fontWeight: 800, border: `1px solid ${stage.color}40` }}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stageLeads.length === 0 ? (
                    <div className="card-empty-state" style={{ padding: '28px 10px', textAlign: 'center', backgroundColor: '#FFFFFF90', borderRadius: 8, border: '1px dashed #CBD5E1' }}>
                      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>📌</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>No enquiries found</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Drag or add leads here</div>
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 10,
                          border: '1px solid #E2E8F0',
                          padding: 12,
                          boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                          cursor: 'grab',
                          position: 'relative'
                        }}
                      >
                        <div className="flex justify-between items-start" style={{ marginBottom: 4 }}>
                          <div>
                            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', display: 'block' }}>{lead.name}</span>
                            <span style={{ fontSize: '0.73rem', color: '#64748B' }}>Parent: {lead.parentName}</span>
                          </div>
                          <span className="badge badge-primary" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{lead.class}</span>
                        </div>

                        <div className="flex justify-between items-center" style={{ fontSize: '0.74rem', color: 'var(--color-primary, #2563EB)', marginBottom: 8, fontWeight: 600 }}>
                          <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>
                          <span style={{ fontSize: '0.68rem', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: 4 }}>{lead.source}</span>
                        </div>

                        {lead.notes && (
                          <div style={{ fontSize: '0.72rem', color: '#475569', backgroundColor: '#F8FAFC', padding: '6px 8px', borderRadius: 6, marginBottom: 8, border: '1px solid #F1F5F9' }}>
                            💡 {lead.notes}
                          </div>
                        )}

                        <div className="flex justify-between items-center" style={{ fontSize: '0.7rem', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                          <div>{getCallDateBadge(lead.followUpDate)}</div>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: '0.7rem', color: 'var(--color-primary, #2563EB)' }}
                            onClick={() => {
                              setSelectedLead(lead);
                              setFollowUpDateInput(lead.followUpDate || todayStr);
                              setFollowUpNotesInput(lead.notes || '');
                              setShowFollowUpModal(true);
                            }}
                          >
                            Set Call Date
                          </button>
                        </div>

                        {/* Stage Dropdown Selector for Touch / Easy Move */}
                        <div className="flex justify-between items-center" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: '0.68rem', color: '#94A3B8' }}>Counsellor: {lead.counsellor.split(' ')[0]}</span>
                          <select
                            className="form-select"
                            value={lead.status}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            style={{ padding: '2px 6px', fontSize: '0.68rem', borderRadius: 4 }}
                          >
                            {KANBAN_STAGES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                          </select>
                        </div>

                        {lead.status !== 'Admitted' && (
                          <div style={{ marginTop: 8, textAlign: 'right' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ width: '100%', fontSize: '0.72rem', padding: '4px 8px', justifyContent: 'center' }}
                              onClick={() => handleAdmitRedirect(lead)}
                            >
                              Admit Student <ArrowRight size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: TABLE ROSTER */}
      {viewMode === 'list' && (
        <div className="card">
          <DataTable
            columns={columns}
            data={filteredLeads}
            title="All Admissions Enquiries Directory"
            searchPlaceholder="Search applicant, phone, counsellor, class..."
            emptyText="No admission enquiries match your search/filter criteria"
          />
        </div>
      )}

      {/* VIEW MODE 3: CONVERSION REPORT & CHARTS */}
      {viewMode === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="grid-2">
            {/* Stage Distribution Chart */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: '#0F172A' }}>📊 Enquiry Pipeline Breakdown</h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.stageDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ name, value }) => `${name.split(' ')[0]}: ${value}`}
                    >
                      {metrics.stageDistribution.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Lead Source Conversion Chart */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: '#0F172A' }}>🎯 Lead Source Conversion Metrics</h3>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.sourceData}>
                    <XAxis dataKey="source" style={{ fontSize: '0.72rem' }} />
                    <YAxis style={{ fontSize: '0.72rem' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="admitted" name="Admitted" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Counsellor Performance Summary Table */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: '#0F172A' }}>👩‍💼 Counsellor Performance & Conversion Metrics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', padding: '10px 0', fontSize: '0.8rem', color: '#64748B' }}>
                    <th style={{ padding: 10 }}>Counsellor Name</th>
                    <th style={{ padding: 10 }}>Total Assigned Leads</th>
                    <th style={{ padding: 10 }}>Active Follow-ups</th>
                    <th style={{ padding: 10 }}>Confirmed Admissions</th>
                    <th style={{ padding: 10 }}>Conversion %</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.counsellorStats.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{c.counsellor}</td>
                      <td style={{ padding: 10 }}>{c.total}</td>
                      <td style={{ padding: 10, color: '#D97706', fontWeight: 600 }}>{c.active}</td>
                      <td style={{ padding: 10, color: '#16A34A', fontWeight: 700 }}>{c.admitted}</td>
                      <td style={{ padding: 10 }}>
                        <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>{c.conversion}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LEAD MODAL */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Admission Enquiry Lead">
        <form onSubmit={handleCreateLead}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Student / Applicant Name *</label>
              <input
                className="form-input"
                required
                placeholder="e.g. Kabir Verma"
                value={leadForm.name}
                onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Parent / Guardian Name *</label>
              <input
                className="form-input"
                required
                placeholder="e.g. Anita Verma"
                value={leadForm.parentName}
                onChange={e => setLeadForm({ ...leadForm, parentName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone Number *</label>
              <input
                className="form-input"
                required
                placeholder="+91 98765 43210"
                value={leadForm.phone}
                onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Class *</label>
              <select className="form-select" value={leadForm.targetClass} onChange={e => setLeadForm({ ...leadForm, targetClass: e.target.value })}>
                <option>Class 10-A</option>
                <option>Class 10-B</option>
                <option>Class 9-A</option>
                <option>Class 8-A</option>
                <option>Class 6-C</option>
                <option>Class 5-A</option>
                <option>Class 1-B</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Lead Source</label>
              <select className="form-select" value={leadForm.source} onChange={e => setLeadForm({ ...leadForm, source: e.target.value })}>
                <option>Website Enquiry</option>
                <option>Walk-in</option>
                <option>Referral</option>
                <option>Social Media</option>
                <option>Online Ad</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assign Counsellor</label>
              <select className="form-select" value={leadForm.counsellor} onChange={e => setLeadForm({ ...leadForm, counsellor: e.target.value })}>
                <option>Sunita Mehra</option>
                <option>Amit Sharma</option>
                <option>Rajesh Kumar</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">First Call / Follow-up Date</label>
              <input
                type="date"
                className="form-input"
                value={leadForm.followUpDate}
                onChange={e => setLeadForm({ ...leadForm, followUpDate: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Initial Notes & Special Requirements</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Interested in hostel facility & robotics lab"
              value={leadForm.notes}
              onChange={e => setLeadForm({ ...leadForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Lead to Pipeline</button>
          </div>
        </form>
      </Modal>

      {/* FOLLOW-UP CALL REMINDER & LOG MODAL */}
      <Modal isOpen={showFollowUpModal} onClose={() => setShowFollowUpModal(false)} title={`Set Call Reminder & Log — ${selectedLead?.name || ''}`}>
        <form onSubmit={handleSaveFollowUp}>
          <div className="form-group">
            <label className="form-label">Next Call Date / Schedule *</label>
            <input
              type="date"
              className="form-input"
              required
              value={followUpDateInput}
              onChange={e => setFollowUpDateInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Add Call Conversation Note</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Spoke to parent; scheduled campus visit for Saturday"
              value={callLogInput}
              onChange={e => setCallLogInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">General Lead Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={followUpNotesInput}
              onChange={e => setFollowUpNotesInput(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Schedule & Log</button>
          </div>
        </form>
      </Modal>

      {/* CALL LOG HISTORY MODAL */}
      <Modal isOpen={showLogHistoryModal} onClose={() => setShowLogHistoryModal(false)} title={`Call Log History — ${selectedLead?.name || ''}`}>
        <div style={{ padding: 4 }}>
          <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 14 }}>
            Contact: <strong>{selectedLead?.phone}</strong> · Parent: <strong>{selectedLead?.parentName}</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {selectedLead?.callLogs && selectedLead.callLogs.length > 0 ? (
              selectedLead.callLogs.map((log, idx) => (
                <div key={idx} style={{ padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: 4 }}>
                    <span>📅 Logged on {log.date}</span>
                    <span>Counsellor: {selectedLead.counsellor}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#0F172A' }}>{log.note}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>No previous call logs recorded.</div>
            )}
          </div>

          <div className="flex justify-end" style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => setShowLogHistoryModal(false)}>Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdmissionsCRM;
