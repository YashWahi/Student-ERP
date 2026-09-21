// src/features/superadmin/dashboard/components/ActivityTimeline.jsx
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

const ActivityTimeline = ({ auditLogs = [] }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.98rem',
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ClipboardList size={18} color="#2563EB" />
            Live Platform Audit Trail
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Real-time multi-tenant governance, provisioning events and permission changes
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm flex items-center gap-1"
          onClick={() => navigate('/superadmin/audit')}
          style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
        >
          <span>Full Audit Log</span>
          <ExternalLink size={12} />
        </button>
      </div>

      <div style={{ padding: '18px 20px', flex: 1, overflowY: 'auto' }}>
        {auditLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#64748B', fontSize: '0.8rem' }}>
            No recent platform audit activity logged.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {auditLogs.map((log, idx) => (
              <div key={log.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <Zap size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {log.time || 'Recently'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#475569', marginTop: 2 }}>
                    {log.details || `Operation executed on target: ${log.target || 'Platform'}`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>
                    Actor: <strong style={{ color: '#64748B' }}>{log.actor || 'Super Admin'}</strong> • Target: {log.target || 'Global'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
