// src/features/superadmin/dashboard/components/CustomizeWidgetsModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal';
import { RotateCcw } from 'lucide-react';

const WIDGET_DEFINITIONS = [
  { key: 'kpis', label: '8-Metric Primary KPI Grid', desc: 'Core platform institutions, revenue, student capacity, renewals' },
  { key: 'quickActions', label: 'Platform Quick Action Command Tiles', desc: '11 direct enterprise operations and provisioning links' },
  { key: 'revenueChart', label: 'SaaS Revenue & Enrollment Growth Charts', desc: 'Interactive AreaChart and BarChart projections' },
  { key: 'subscriptionAnalytics', label: 'Subscription Plan Matrix & Health Signals', desc: 'Tier distribution and active operational signals' },
  { key: 'expiringSubscriptions', label: 'Expiring Subscriptions Watchlist', desc: 'Time-filtered renewals tracking table' },
  { key: 'systemHealth', label: 'System Health & Security Alerts Hub', desc: 'Live infrastructure nodes and incident monitoring' },
  { key: 'tenantsTable', label: 'Institutional Tenants Directory Table', desc: 'Searchable, filterable multi-tenant roster with actions' },
  { key: 'paymentsTable', label: 'Recent Payment Transactions Table', desc: 'Invoice history, payment status and receipts' },
  { key: 'activityFeed', label: 'Live Platform Audit Trail', desc: 'Real-time security and administrative logs' },
];

const CustomizeWidgetsModal = ({
  isOpen,
  onClose,
  currentPrefs = {},
  onSavePrefs,
  onResetPrefs,
}) => {
  const [localPrefs, setLocalPrefs] = useState(currentPrefs);

  useEffect(() => {
    setLocalPrefs(currentPrefs);
  }, [currentPrefs, isOpen]);

  const handleToggle = (key) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚙️ Configure SuperAdmin Dashboard Widgets"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
          Enable or disable executive dashboard modules to tailor your control center view. Preferences are securely persisted.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
          {WIDGET_DEFINITIONS.map((w) => (
            <div
              key={w.key}
              onClick={() => handleToggle(w.key)}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                backgroundColor: localPrefs[w.key] !== false ? '#F8FAFC' : '#FFFFFF',
                border: `1px solid ${localPrefs[w.key] !== false ? '#BFDBFE' : '#E2E8F0'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                  {w.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
                  {w.desc}
                </div>
              </div>

              <input
                type="checkbox"
                checked={localPrefs[w.key] !== false}
                onChange={() => {}}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#2563EB' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={onResetPrefs}
            style={{ fontSize: '0.78rem', color: '#64748B' }}
          >
            <RotateCcw size={13} />
            <span>Reset to Default</span>
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onSavePrefs(localPrefs)}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CustomizeWidgetsModal;
