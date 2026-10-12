// src/features/superadmin/dashboard/components/ExpiringSubscriptionsPanel.jsx
import { Clock, CheckCircle2, RefreshCw, Eye } from 'lucide-react';

const ExpiringSubscriptionsPanel = ({
  expiringSubscriptions = [],
  expiryDaysFilter = 30,
  setExpiryDaysFilter,
  onRenew,
  onViewTenant,
}) => {
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
            <Clock size={17} color="#F59E0B" />
            Expiring Subscriptions Watchlist
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Tenants approaching license renewal deadline within threshold
          </p>
        </div>

        {/* Days Filter Pills */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F1F5F9',
            padding: 3,
            borderRadius: 8,
            gap: 2,
          }}
        >
          {[7, 15, 30, 60].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setExpiryDaysFilter(days)}
              style={{
                padding: '3px 8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: expiryDaysFilter === days ? '#FFFFFF' : 'transparent',
                color: expiryDaysFilter === days ? '#2563EB' : '#64748B',
                boxShadow: expiryDaysFilter === days ? '0 1px 2px 0 rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Institution</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Plan</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Days Left</th>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>MRR</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expiringSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                  <CheckCircle2 size={24} color="#16A34A" style={{ margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>All active subscriptions in good standing</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>
                    No licenses expiring within the next {expiryDaysFilter} days.
                  </div>
                </td>
              </tr>
            ) : (
              expiringSubscriptions.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <strong style={{ color: '#0F172A' }}>{c.name}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Code: {c.code}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                      }}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          c.daysToExpiry <= 7
                            ? '#FEE2E2'
                            : c.daysToExpiry <= 15
                            ? '#FEF3C7'
                            : '#F0F9FF',
                        color:
                          c.daysToExpiry <= 7
                            ? '#DC2626'
                            : c.daysToExpiry <= 15
                            ? '#D97706'
                            : '#0284C7',
                      }}
                    >
                      {c.daysToExpiry} days
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <strong style={{ color: '#16A34A' }}>{c.mrr}</strong>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onViewTenant && onViewTenant(c)}
                        style={{ padding: '3px 8px', fontSize: '0.72rem', height: 26 }}
                        title="View Tenant Profile"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onRenew && onRenew(c)}
                        style={{ padding: '3px 10px', fontSize: '0.72rem', height: 26, fontWeight: 600 }}
                      >
                        Renew
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpiringSubscriptionsPanel;
