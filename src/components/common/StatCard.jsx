// src/components/common/StatCard.jsx
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({
  icon,
  label,
  value,
  trend,
  trendValue,
  color = '#6C63FF',
  suffix = '',
  prefix = '',
  onClick,
  delay = 0,
}) => {
  const hasNumericTrend = typeof trendValue === 'number' && !isNaN(trendValue);
  const isPositive = hasNumericTrend ? trendValue >= 0 : true;

  const displayValue = value === undefined || value === null || (typeof value === 'number' && isNaN(value))
    ? 0
    : typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : value;

  const isCssVar = typeof color === 'string' && color.startsWith('var(');
  const iconBg = isCssVar ? 'var(--color-primary-light, #EFF6FF)' : (typeof color === 'string' && color.startsWith('#') ? `${color}18` : 'rgba(37, 99, 235, 0.1)');
  const barBg = color || 'var(--color-primary, #2563EB)';

  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      whileHover={onClick ? { y: -4 } : {}}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 3, background: barBg,
        borderRadius: '12px 12px 0 0',
      }} />

      {/* Background icon */}
      <div style={{
        position: 'absolute', right: 16, top: 16,
        fontSize: '4rem', opacity: 0.04,
        pointerEvents: 'none',
      }}>
        {icon}
      </div>

      <div className="card-icon" style={{ background: iconBg, color: barBg }}>
        {icon}
      </div>

      <div className="card-value">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="card-label">{label}</div>

      {hasNumericTrend ? (
        <div className={`card-trend ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trendValue)}% {trend}</span>
        </div>
      ) : trend ? (
        <div className="card-trend neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)', padding: '2px 8px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>
          <span>{trend}</span>
        </div>
      ) : null}
    </motion.div>
  );
};

export default StatCard;
