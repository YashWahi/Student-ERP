// src/features/superadmin/dashboard/components/QuickActionGrid.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Create Institution',
    desc: 'Provision tenant database, main campus & root admin',
    icon: '🏫',
    path: '/superadmin/colleges/create',
  },
  {
    title: 'Manage Institutions',
    desc: 'Filter, inspect & configure all school tenants',
    icon: '📋',
    path: '/superadmin/colleges',
  },
  {
    title: 'Theme Studio',
    desc: 'Customize brand palette, CSS tokens & portal themes',
    icon: '🎨',
    path: '/superadmin/theme-studio',
  },
  {
    title: 'Module Matrix',
    desc: 'Toggle LMS, Fees, Transport, Hostel per college',
    icon: '🧩',
    path: '/superadmin/modules',
  },
  {
    title: 'Subscriptions',
    desc: 'Manage contract tiers, renewal schedules & licenses',
    icon: '💳',
    path: '/superadmin/subscriptions',
  },
  {
    title: 'Payment Gateway',
    desc: 'Inspect live Razorpay & Stripe transaction logs',
    icon: '🧾',
    path: '/superadmin/subscriptions',
  },
  {
    title: 'User Directory',
    desc: 'Cross-tenant faculty, staff & student credentials',
    icon: '👥',
    path: '/superadmin/users',
  },
  {
    title: 'Permissions & RBAC',
    desc: 'Security policies, admin privileges & role controls',
    icon: '🛡️',
    path: '/superadmin/rbac',
  },
  {
    title: 'Announcements',
    desc: 'Dispatch emergency banner alerts to school portals',
    icon: '📢',
    actionKey: 'broadcast',
  },
  {
    title: 'Reports & Analytics',
    desc: 'Examine student growth & revenue trajectories',
    icon: '📊',
    path: '/superadmin/analytics',
  },
  {
    title: 'Audit Logs',
    desc: 'Immutable platform security & administrative history',
    icon: '📜',
    path: '/superadmin/audit',
  },
];

const QuickActionGrid = ({ onOpenBroadcast }) => {
  const navigate = useNavigate();

  const handleAction = (item) => {
    if (item.actionKey === 'broadcast' && onOpenBroadcast) {
      onOpenBroadcast();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        marginBottom: 28,
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
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
          gap: 8,
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
            <Zap size={18} color="#2563EB" />
            Platform Quick Action Center
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Direct access to multi-tenant governance, provisioning, security policies and billing tools
          </p>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #DBEAFE',
          }}
        >
          SuperAdmin Operations
        </span>
      </div>

      <div style={{ padding: 18 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {QUICK_ACTIONS.map((qa) => (
            <div
              key={qa.title}
              onClick={() => handleAction(qa)}
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(37, 99, 235, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>{qa.icon}</span>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                  }}
                >
                  <ArrowRight size={13} />
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A', marginBottom: 2 }}>
                  {qa.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.35 }}>
                  {qa.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionGrid;
