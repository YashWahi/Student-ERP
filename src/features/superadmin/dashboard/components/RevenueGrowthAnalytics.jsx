// src/features/superadmin/dashboard/components/RevenueGrowthAnalytics.jsx
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, TrendingUp, Users, ExternalLink } from 'lucide-react';
import { TIME_RANGES } from '../hooks/useSuperAdminDashboard';

const RevenueGrowthAnalytics = ({
  timeRange = '6M',
  setTimeRange,
  chartData = [],
  onExport,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 20,
        marginBottom: 28,
      }}
    >
      {/* 1. SaaS Revenue & MRR Growth */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
              <TrendingUp size={18} color="#2563EB" />
              SaaS Revenue & MRR Trajectory
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              Actual subscription revenue vs targeted monthly milestones
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Time Range Selector */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F1F5F9',
                padding: 3,
                borderRadius: 8,
                gap: 2,
              }}
            >
              {TIME_RANGES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeRange(t)}
                  style={{
                    padding: '3px 9px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: timeRange === t ? '#FFFFFF' : 'transparent',
                    color: timeRange === t ? '#2563EB' : '#64748B',
                    boxShadow: timeRange === t ? '0 1px 2px 0 rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon"
              onClick={onExport}
              style={{ border: '1px solid #E2E8F0', height: 28, width: 28 }}
              title="Export revenue data as CSV"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        <div style={{ padding: '18px 20px', flex: 1 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    `₹${Number(val).toLocaleString('en-IN')}`,
                    name === 'revenue' ? 'Actual MRR' : 'Target Milestone',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  formatter={(value) => (
                    <span style={{ color: '#475569', fontWeight: 500 }}>
                      {value === 'revenue' ? 'Actual Subscription MRR' : 'Target Target Benchmark'}
                    </span>
                  )}
                />
                <Area
                  type="monotone"
                  name="revenue"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  name="target"
                  dataKey="target"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Platform Student Capacity */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
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
              <Users size={18} color="#7C3AED" />
              Student Enrollment & Capacity
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              Total active student licenses provisioned across tenant schools
            </p>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1"
            onClick={() => navigate('/superadmin/colleges')}
            style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 600 }}
          >
            <span>View Tenants</span>
            <ExternalLink size={12} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', flex: 1 }}>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
                <Tooltip
                  formatter={(val) => [Number(val).toLocaleString('en-IN'), 'Enrolled Students']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  formatter={() => (
                    <span style={{ color: '#475569', fontWeight: 500 }}>
                      Active Enrolled Students
                    </span>
                  )}
                />
                <Bar
                  dataKey="students"
                  name="students"
                  fill="#7C3AED"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueGrowthAnalytics;

