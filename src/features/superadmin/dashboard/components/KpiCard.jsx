// src/features/superadmin/dashboard/components/KpiCard.jsx
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

const KpiCard = ({
  icon,
  label,
  value,
  trend,
  trendValue,
  hasComparison = false,
  isPositive = true,
  comparisonLabel = 'No comparison data',
  color = '#2563EB',
  prefix = '',
  suffix = '',
  description,
  onClick,
  delay = 0,
}) => {
  const displayValue =
    value === undefined || value === null || (typeof value === 'number' && isNaN(value))
      ? 0
      : typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      whileHover={
        onClick
          ? {
              y: -3,
              borderColor: color,
              boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.08)',
            }
          : {}
      }
    >
      {/* Top Color Accent Line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: color,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#64748B',
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
          <div
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0F172A',
              marginTop: 4,
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"tnum"',
            }}
          >
            {prefix}
            {displayValue}
            {suffix}
          </div>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: `${color}14`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        {hasComparison && typeof trendValue === 'number' && !isNaN(trendValue) ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2',
              color: isPositive ? '#16A34A' : '#DC2626',
            }}
          >
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>
              {isPositive ? '↑' : '↓'} {trendValue}% this month
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: '#F1F5F9',
              color: '#64748B',
            }}
          >
            <span>{comparisonLabel || 'No comparison data'}</span>
          </div>
        )}

        {description && (
          <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 500 }}>
            {description}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default KpiCard;
