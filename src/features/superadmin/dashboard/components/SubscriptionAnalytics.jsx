// src/features/superadmin/dashboard/components/SubscriptionAnalytics.jsx
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, ShieldAlert, HeartPulse, CheckCircle2, AlertCircle } from 'lucide-react';

const SubscriptionAnalytics = ({ planCounts = {}, healthCounts = {}, onSelectFilter }) => {
  const navigate = useNavigate();

  const handlePlanClick = (planName) => {
    if (onSelectFilter) {
      onSelectFilter(planName);
    }
    navigate('/superadmin/subscriptions');
  };

  const handleHealthClick = (statusName) => {
    navigate('/superadmin/colleges');
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
            <Layers size={18} color="#2563EB" />
            Subscription Tiers & Tenant Health Matrix
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Breakdown of active enterprise licenses categorized by plan tier and real-time operational status
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm flex items-center gap-1"
          onClick={() => navigate('/superadmin/subscriptions')}
          style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
        >
          <span>Manage Subscriptions</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ padding: 20 }}>
        {/* Tier Distribution Cards */}
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
            }}
          >
            Subscription Distribution by Plan
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            {/* Basic */}
            <div
              onClick={() => handlePlanClick('Basic')}
              style={{
                padding: '16px 18px',
                borderRadius: 10,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#64748B';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                  BASIC TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>₹12K / mo</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '4px 0 2px' }}>
                {planCounts.Basic || 0} Institutions
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                Core SIS, Admissions & Attendance
              </div>
            </div>

            {/* Standard */}
            <div
              onClick={() => handlePlanClick('Standard')}
              style={{
                padding: '16px 18px',
                borderRadius: 10,
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563EB';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#BFDBFE';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>
                  STANDARD TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#3B82F6' }}>₹24K / mo</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E40AF', margin: '4px 0 2px' }}>
                {planCounts.Standard || 0} Institutions
              </div>
              <div style={{ fontSize: '0.74rem', color: '#1E40AF' }}>
                Full LMS, Fees, Timetable & HR
              </div>
            </div>

            {/* Premium */}
            <div
              onClick={() => handlePlanClick('Premium')}
              style={{
                padding: '16px 18px',
                borderRadius: 10,
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#7C3AED';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E9D5FF';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED' }}>
                  PREMIUM TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9333EA' }}>₹48K / mo</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#6B21A8', margin: '4px 0 2px' }}>
                {planCounts.Premium || 0} Institutions
              </div>
              <div style={{ fontSize: '0.74rem', color: '#6B21A8' }}>
                Hostel, Transport, Theme Studio
              </div>
            </div>

            {/* Enterprise */}
            <div
              onClick={() => handlePlanClick('Enterprise')}
              style={{
                padding: '16px 18px',
                borderRadius: 10,
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#16A34A';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#BBF7D0';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A' }}>
                  ENTERPRISE TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#15803D' }}>₹1.2L / mo</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#14532D', margin: '4px 0 2px' }}>
                {planCounts.Enterprise || 0} Institutions
              </div>
              <div style={{ fontSize: '0.74rem', color: '#14532D' }}>
                Multi-Branch, Custom API, Dedicated SLA
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Operational Health Signals */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#F8FAFC',
            borderRadius: 10,
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HeartPulse size={16} color="#2563EB" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
              Tenant Operational Health Signals:
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16A34A' }} />
              <span style={{ color: '#475569', fontWeight: 600 }}>
                Healthy: <strong>{healthCounts.healthy || 0}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0EA5E9' }} />
              <span style={{ color: '#475569', fontWeight: 600 }}>
                Needs Attention (Trial): <strong>{healthCounts.needsAttention || 0}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
              <span style={{ color: '#475569', fontWeight: 600 }}>
                At Risk (Expiring): <strong>{healthCounts.atRisk || 0}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#DC2626' }} />
              <span style={{ color: '#475569', fontWeight: 600 }}>
                Suspended: <strong>{healthCounts.suspended || 0}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
