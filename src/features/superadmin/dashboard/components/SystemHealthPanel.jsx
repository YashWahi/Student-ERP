// src/features/superadmin/dashboard/components/SystemHealthPanel.jsx
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, Check, X, Server } from 'lucide-react';

const INFRASTRUCTURE_SERVICES = [
  { label: 'Firebase Auth', status: 'Operational', isHealthy: true },
  { label: 'Firestore DB', status: 'Operational', isHealthy: true },
  { label: 'Cloud Storage', status: 'Healthy', isHealthy: true },
  { label: 'Cloud Functions', status: 'Active', isHealthy: true },
  { label: 'SMS Gateway', status: 'Active', isHealthy: true },
  { label: 'Payment Webhook', status: 'Active', isHealthy: true },
];

const SystemHealthPanel = ({
  securityAlerts = [],
  onDismissAlert,
  onResolveAlert,
}) => {
  const healthyCount = INFRASTRUCTURE_SERVICES.filter(s => s.isHealthy).length;
  const operationalPercent = Math.round((healthyCount / INFRASTRUCTURE_SERVICES.length) * 100);

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
            <ShieldCheck size={18} color="#2563EB" />
            Infrastructure Health & Security Hub
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Multi-tenant core engine services, cloud resources and real-time security events
          </p>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: '0.72rem',
            fontWeight: 700,
            backgroundColor: operationalPercent === 100 ? '#DCFCE7' : '#FEF3C7',
            color: operationalPercent === 100 ? '#16A34A' : '#D97706',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: operationalPercent === 100 ? '#16A34A' : '#D97706' }} />
          {operationalPercent}% Operational
        </span>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Infrastructure Matrix */}
        <div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 8,
            }}
          >
            Core Infrastructure Nodes
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 8,
            }}
          >
            {INFRASTRUCTURE_SERVICES.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{s.label}</div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#16A34A',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 2,
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#16A34A' }} />
                  {s.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Incident List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Security Incidents & Warnings ({securityAlerts.filter(a => !a.resolved).length})
          </div>

          {securityAlerts.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
              <ShieldCheck size={24} color="#16A34A" style={{ margin: '0 auto 6px', display: 'block' }} />
              Zero active security threats detected.
            </div>
          ) : (
            securityAlerts.map((alert) => {
              const isDanger = alert.severity === 'danger';
              const isWarning = alert.severity === 'warning';
              const isResolved = alert.resolved;

              return (
                <div
                  key={alert.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    backgroundColor: isResolved ? '#F8FAFC' : isDanger ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#F0F9FF',
                    border: `1px solid ${isResolved ? '#E2E8F0' : isDanger ? '#FECACA' : isWarning ? '#FDE68A' : '#BAE6FD'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {isDanger ? (
                        <AlertTriangle size={14} color="#DC2626" />
                      ) : isWarning ? (
                        <AlertTriangle size={14} color="#D97706" />
                      ) : (
                        <Info size={14} color="#0284C7" />
                      )}
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: isResolved ? '#64748B' : isDanger ? '#991B1B' : isWarning ? '#92400E' : '#075985',
                          textDecoration: isResolved ? 'line-through' : 'none',
                        }}
                      >
                        {alert.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2, paddingLeft: 20 }}>
                      {alert.affected} • {alert.time}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {!isResolved && (
                      <button
                        type="button"
                        onClick={() => onResolveAlert && onResolveAlert(alert.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#16A34A', height: 24 }}
                        title="Mark as resolved"
                      >
                        <Check size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDismissAlert && onDismissAlert(alert.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#94A3B8', height: 24 }}
                      title="Dismiss alert"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemHealthPanel;
