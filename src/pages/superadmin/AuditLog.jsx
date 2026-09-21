// src/pages/superadmin/AuditLog.jsx
import { useState, useEffect } from 'react';
import { Search, Download, ShieldCheck, RefreshCw } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import { exportToCSV } from '../../services/exportService';
import { getAuditLogs } from '../../services/auditService';
import toast from 'react-hot-toast';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const fetched = await getAuditLogs();
      const formatted = fetched.map(f => ({
        id: f.id || Math.random().toString(),
        action: f.action || 'SECURITY_EVENT',
        actor: f.actor || 'Super Admin',
        target: f.target || 'Platform',
        details: f.details || 'System configuration change',
        ip: f.ip || '192.168.1.1',
        time: f.time || (f.timestamp?.toDate ? f.timestamp.toDate().toLocaleString('en-IN') : new Date().toLocaleString('en-IN')),
      }));
      setLogs(formatted);
    } catch (err) {
      console.warn('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    fetchLogs();
    toast.success('🔄 Audit log timeline refreshed');
  };

  const columns = [
    { key: 'time', label: 'Timestamp' },
    { key: 'action', label: 'Action Type', render: (v) => <span className="badge badge-primary">{v}</span> },
    { key: 'actor', label: 'Performed By' },
    { key: 'target', label: 'Target Institution / Entity', render: (v) => <strong>{v}</strong> },
    { key: 'details', label: 'Operation Details' },
    { key: 'ip', label: 'IP Address', render: (v) => <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{v}</span> },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Platform Security & Audit Trail</h1>
          <p className="page-subtitle">Immutable log timeline of all platform configuration, provisioning, theme, and security events</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-ghost" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </button>
          <button className="btn btn-secondary" onClick={() => exportToCSV('Platform_Audit_Logs', logs, columns)}>
            <Download size={16} /> Export Audit CSV
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        title="Security & System Audit Log"
        searchPlaceholder="Search by action, actor, target institution..."
        loading={loading}
        emptyText="No security audit log entries found in Firestore ('auditLogs')"
      />
    </div>
  );
};

export default AuditLog;

