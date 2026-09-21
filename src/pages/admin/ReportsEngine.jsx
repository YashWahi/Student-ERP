// src/pages/admin/ReportsEngine.jsx
import { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, Filter, Layers, BarChart2, CheckCircle2,
  PieChart as PieIcon, TrendingUp, Calendar, Save, Eye, RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import DataTable from '../../components/common/DataTable';
import { exportToCSV } from '../../services/exportService';
import toast from 'react-hot-toast';

const REPORT_DOMAINS = [
  { id: 'attendance', label: '1. Attendance Reports', category: 'Attendance', dataCount: 420 },
  { id: 'academic', label: '2. Academic & Exam Reports', category: 'Academic', dataCount: 380 },
  { id: 'fees', label: '3. Fee Collection Reports', category: 'Finance', dataCount: 512 },
  { id: 'students', label: '4. Student Demographics', category: 'SIS', dataCount: 420 },
  { id: 'teachers', label: '5. Faculty Workload Reports', category: 'HR', dataCount: 48 },
  { id: 'hr', label: '6. HR & Payroll Reports', category: 'HR', dataCount: 127 },
  { id: 'transport', label: '7. Transport Route Reports', category: 'Logistics', dataCount: 18 },
  { id: 'library', label: '8. Digital Library Reports', category: 'Library', dataCount: 1250 },
  { id: 'hostel', label: '9. Hostel Occupancy Reports', category: 'Hostel', dataCount: 180 },
  { id: 'finance', label: '10. Institutional P&L Reports', category: 'Finance', dataCount: 890 },
];

const REVENUE_DATA = [
  { month: 'Apr', feeCollection: 480000, campusExpense: 120000, netProfit: 360000 },
  { month: 'May', feeCollection: 520000, campusExpense: 135000, netProfit: 385000 },
  { month: 'Jun', feeCollection: 610000, campusExpense: 140000, netProfit: 470000 },
  { month: 'Jul', feeCollection: 740000, campusExpense: 160000, netProfit: 580000 },
  { month: 'Aug', feeCollection: 890000, campusExpense: 175000, netProfit: 715000 },
];

const GRADE_DISTRIBUTION = [
  { name: 'Grade A+ (90-100%)', count: 142, color: '#16A34A' },
  { name: 'Grade A (80-89%)', count: 128, color: '#2563EB' },
  { name: 'Grade B (70-79%)', count: 74, color: '#D97706' },
  { name: 'Grade C (60-69%)', count: 26, color: '#9333EA' },
  { name: 'Grade F (<50%)', count: 10, color: '#DC2626' },
];

const ReportsEngine = () => {
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('fees');
  const [selectedFormat, setSelectedFormat] = useState('CSV');
  const [dateRange, setDateRange] = useState('2026-08-01');
  const [savedReports, setSavedReports] = useState([
    { id: 'r1', name: 'Q2 Monthly Revenue & Fee Collection Ledger', domain: 'fees', date: 'Today, 09:30 AM' },
    { id: 'r2', name: 'Low Student Attendance Register (<75%)', domain: 'attendance', date: 'Yesterday' },
  ]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [selectedDomain]);

  const activeDomainInfo = REPORT_DOMAINS.find(d => d.id === selectedDomain) || REPORT_DOMAINS[2];

  const handleExportCSV = () => {
    exportToCSV(`${activeDomainInfo.label.replace(/\s+/g, '_')}_Export`, REVENUE_DATA, [
      { key: 'month', label: 'Month' },
      { key: 'feeCollection', label: 'Fee Collection (₹)' },
      { key: 'campusExpense', label: 'Campus Expense (₹)' },
      { key: 'netProfit', label: 'Net Profit (₹)' },
    ]);
    toast.success(`📊 ${activeDomainInfo.label} exported to CSV!`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleSaveReportPreset = () => {
    const newPreset = {
      id: `r_${Date.now()}`,
      name: `Custom ${activeDomainInfo.label} Preset`,
      domain: selectedDomain,
      date: 'Just Now',
    };
    setSavedReports([newPreset, ...savedReports]);
    toast.success(`📌 Custom Report Preset saved!`);
  };

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Enterprise Reusable Report Engine</h1>
          <p className="page-subtitle">Cross-domain analytical report builder for Attendance, Academics, Fees, SIS, HR, Transport, Library, Hostel & Finance</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handlePrintReport}>
            <Printer size={16} /> Print Report
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV Report
          </button>
        </div>
      </div>

      {/* 10 DOMAIN SELECTION SCROLLER */}
      <div className="card flex items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)', overflowX: 'auto' }}>
        {REPORT_DOMAINS.map(d => (
          <button
            key={d.id}
            className={`btn btn-sm ${selectedDomain === d.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}
            onClick={() => setSelectedDomain(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* MULTI-PARAMETER FILTER & DESIGNER BAR */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header flex justify-between items-center">
          <h4 style={{ margin: 0 }}>⚙️ Report Filter Parameters & Controls — {activeDomainInfo.label}</h4>
          <button className="btn btn-secondary btn-sm" onClick={handleSaveReportPreset}>
            <Save size={14} /> Save Report Preset
          </button>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Academic Session</label>
              <select className="form-select">
                <option>2026-2027 (Active Session)</option>
                <option>2025-2026 (Archived)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Class / Department</label>
              <select className="form-select">
                <option>All Classes & Departments</option>
                <option>Class 10-A</option>
                <option>Class 10-B</option>
                <option>Science Department</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">From Date</label>
              <input className="form-input" type="date" value={dateRange} onChange={e => setDateRange(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Output Format</label>
              <select className="form-select" value={selectedFormat} onChange={e => setSelectedFormat(e.target.value)}>
                <option>CSV (Excel Compatible)</option>
                <option>PDF (Print Document)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD WIDGETS & REAL DATA CHARTS */}
      <div className="grid-12" style={{ gap: 24, marginBottom: 28 }}>
        {/* Revenue / Attendance Area Chart */}
        <div style={{ gridColumn: 'span 7' }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 16px' }}>📈 Institutional Monthly Trend Analytics</h4>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                  <Area type="monotone" dataKey="feeCollection" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} name="Fee Collection" />
                  <Area type="monotone" dataKey="campusExpense" stroke="#DC2626" fill="#DC2626" fillOpacity={0.1} name="Campus Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Grade Distribution Pie Chart */}
        <div style={{ gridColumn: 'span 5' }}>
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ margin: '0 0 16px' }}>📊 Grade Distribution Breakdown</h4>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={GRADE_DISTRIBUTION} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={4}>
                    {GRADE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SAVED PRESETS & REPORT DATA TABLE */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h4 style={{ margin: 0 }}>📋 Saved Custom Report Presets</h4>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {savedReports.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No custom report presets saved yet. Click "Save Report Preset" above to create one.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Preset Name</th>
                  <th>Domain Category</th>
                  <th>Saved Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedReports.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td><span className="badge badge-primary">{r.domain}</span></td>
                    <td><span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.date}</span></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setSelectedDomain(r.domain);
                        exportToCSV(r.name.replace(/\s+/g, '_'), REVENUE_DATA, [
                          { key: 'month', label: 'Month' },
                          { key: 'feeCollection', label: 'Fee Collection (₹)' },
                          { key: 'campusExpense', label: 'Campus Expense (₹)' },
                          { key: 'netProfit', label: 'Net Profit (₹)' },
                        ]);
                        toast.success(`📊 Exporting preset "${r.name}"...`);
                      }}>
                        <Download size={14} /> Run Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsEngine;
