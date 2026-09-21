// src/features/superadmin/dashboard/components/KpiGrid.jsx
import { useNavigate } from 'react-router-dom';
import {
  Building2, CheckCircle2, Clock, AlertTriangle,
  GraduationCap, Users, TrendingUp, CreditCard
} from 'lucide-react';
import KpiCard from './KpiCard';

const KpiGrid = ({ kpis = {}, loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: 22,
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div className="skeleton" style={{ height: 16, width: '40%' }} />
              <div className="skeleton" style={{ height: 32, width: '60%' }} />
              <div className="skeleton" style={{ height: 16, width: '75%' }} />
            </div>
          ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}
    >
      {/* 1. Total Institutions */}
      <KpiCard
        icon={<Building2 size={22} />}
        label="Total Institutions"
        value={kpis.totalInstitutions}
        hasComparison={kpis.tenantsTrend?.hasComparison}
        trendValue={kpis.tenantsTrend?.trendValue}
        isPositive={kpis.tenantsTrend?.isPositive}
        comparisonLabel={kpis.tenantsTrend?.label}
        description="registered tenants"
        color="#2563EB"
        onClick={() => navigate('/superadmin/colleges')}
        delay={0.05}
      />

      {/* 2. Active Institutions */}
      <KpiCard
        icon={<CheckCircle2 size={22} />}
        label="Active Institutions"
        value={kpis.activeInstitutions}
        hasComparison={false}
        comparisonLabel="Fully operational"
        description="98.5% uptime"
        color="#16A34A"
        onClick={() => navigate('/superadmin/colleges')}
        delay={0.1}
      />

      {/* 3. Trial Institutions */}
      <KpiCard
        icon={<Clock size={22} />}
        label="Trial Institutions"
        value={kpis.trialInstitutions}
        hasComparison={false}
        comparisonLabel="14-day evaluation"
        description="in onboarding"
        color="#0EA5E9"
        onClick={() => navigate('/superadmin/colleges')}
        delay={0.15}
      />

      {/* 4. Suspended / Expired */}
      <KpiCard
        icon={<AlertTriangle size={22} />}
        label="Suspended / Expired"
        value={kpis.suspendedOrExpired}
        hasComparison={false}
        comparisonLabel={kpis.suspendedOrExpired > 0 ? 'Requires attention' : 'All active'}
        description="overdue renewals"
        color="#DC2626"
        onClick={() => navigate('/superadmin/subscriptions/expiring')}
        delay={0.2}
      />

      {/* 5. Total Enrolled Students */}
      <KpiCard
        icon={<GraduationCap size={22} />}
        label="Total Students"
        value={kpis.totalStudents}
        hasComparison={kpis.studentsTrend?.hasComparison}
        trendValue={kpis.studentsTrend?.trendValue}
        isPositive={kpis.studentsTrend?.isPositive}
        comparisonLabel={kpis.studentsTrend?.label}
        description="active capacity"
        color="#7C3AED"
        delay={0.25}
      />

      {/* 6. Total Teachers & Staff */}
      <KpiCard
        icon={<Users size={22} />}
        label="Teachers & Staff"
        value={kpis.totalStaff}
        hasComparison={false}
        comparisonLabel="1:18 faculty ratio"
        description="faculty roster"
        color="#0F766E"
        delay={0.3}
      />

      {/* 7. Monthly Recurring Revenue (MRR) */}
      <KpiCard
        icon={<TrendingUp size={22} />}
        label="Monthly Recurring Revenue"
        value={kpis.mrr}
        prefix="₹"
        hasComparison={kpis.mrrTrend?.hasComparison}
        trendValue={kpis.mrrTrend?.trendValue}
        isPositive={kpis.mrrTrend?.isPositive}
        comparisonLabel={kpis.mrrTrend?.label}
        description="active subscriptions"
        color="#16A34A"
        onClick={() => navigate('/superadmin/subscriptions')}
        delay={0.35}
      />

      {/* 8. Pending Renewals */}
      <KpiCard
        icon={<CreditCard size={22} />}
        label="Pending Renewals"
        value={kpis.pendingRevenue}
        prefix="₹"
        hasComparison={false}
        comparisonLabel="Current billing cycle"
        description="due invoices"
        color="#F59E0B"
        onClick={() => navigate('/superadmin/subscriptions/expiring')}
        delay={0.4}
      />
    </div>
  );
};

export default KpiGrid;
