// src/features/superadmin/dashboard/utils/kpiCalculator.js

/**
 * Calculates a safe trend percentage between current and previous period values.
 * Prevents NaN, Infinity, division by zero, and invalid comparisons.
 *
 * @param {number|null|undefined} current - Current period value
 * @param {number|null|undefined} previous - Previous period value
 * @returns {{ hasComparison: boolean, trendValue: number | null, isPositive: boolean, label: string }}
 */
export const calculateSafeTrend = (current, previous) => {
  // If either current or previous is invalid, null, undefined or not a finite number
  if (
    current === null ||
    current === undefined ||
    typeof current !== 'number' ||
    !Number.isFinite(current)
  ) {
    return {
      hasComparison: false,
      trendValue: null,
      isPositive: true,
      label: 'No comparison data',
    };
  }

  if (
    previous === null ||
    previous === undefined ||
    typeof previous !== 'number' ||
    !Number.isFinite(previous) ||
    previous <= 0
  ) {
    return {
      hasComparison: false,
      trendValue: null,
      isPositive: true,
      label: 'No comparison data',
    };
  }

  // Safe percentage calculation: ((current - previous) / previous) * 100
  const diff = current - previous;
  const rawPercentage = (diff / previous) * 100;

  if (!Number.isFinite(rawPercentage) || Number.isNaN(rawPercentage)) {
    return {
      hasComparison: false,
      trendValue: null,
      isPositive: true,
      label: 'No comparison data',
    };
  }

  const roundedPercentage = Math.round(rawPercentage * 10) / 10;
  const isPositive = roundedPercentage >= 0;

  return {
    hasComparison: true,
    trendValue: Math.abs(roundedPercentage),
    isPositive,
    label: `${isPositive ? '↑' : '↓'} ${Math.abs(roundedPercentage)}% vs last period`,
  };
};

/**
 * Formats a currency value in Indian Rupees (INR)
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrencyINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Formats a standard integer number with locale separators
 * @param {number} num
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN');
};

/**
 * Aggregates summary statistics for a list of institutional tenants.
 * @param {Array<Object>} tenants
 * @returns {Object}
 */
export const calculateTenantKPIs = (tenants = []) => {
  const list = Array.isArray(tenants) ? tenants : [];

  let totalStudents = 0;
  let totalStaff = 0;
  let totalMrr = 0;
  let activeCount = 0;
  let trialCount = 0;
  let expiredCount = 0;

  const planCounts = {
    Basic: 0,
    Standard: 0,
    Premium: 0,
    Enterprise: 0,
  };

  const healthCounts = {
    healthy: 0,
    needsAttention: 0,
    atRisk: 0,
    suspended: 0,
  };

  list.forEach((t) => {
    const students = Number(t.studentsCount || t.students || 0);
    const staff = Number(t.teachersCount || t.teachers || Math.round(students / 18) || 0);
    const mrrVal = Number(t.mrrValue || (t.plan === 'Enterprise' ? 120000 : t.plan === 'Premium' ? 48000 : t.plan === 'Standard' ? 24000 : 12000));

    totalStudents += isNaN(students) ? 0 : students;
    totalStaff += isNaN(staff) ? 0 : staff;

    const status = (t.status || 'Active').toLowerCase();
    if (status === 'active') {
      activeCount++;
      totalMrr += isNaN(mrrVal) ? 0 : mrrVal;
      healthCounts.healthy++;
    } else if (status === 'trial') {
      trialCount++;
      healthCounts.needsAttention++;
    } else if (status === 'expiring') {
      expiredCount++;
      healthCounts.atRisk++;
    } else if (status === 'suspended' || status === 'expired') {
      expiredCount++;
      healthCounts.suspended++;
    } else {
      activeCount++;
      healthCounts.healthy++;
    }

    const plan = t.plan || 'Standard';
    if (planCounts[plan] !== undefined) {
      planCounts[plan]++;
    } else {
      planCounts.Standard = (planCounts.Standard || 0) + 1;
    }
  });

  const pendingRevenue = expiredCount * 24000;

  return {
    totalInstitutions: list.length,
    activeInstitutions: activeCount,
    trialInstitutions: trialCount,
    suspendedOrExpired: expiredCount,
    totalStudents,
    totalStaff,
    mrr: totalMrr,
    pendingRevenue,
    planCounts,
    healthCounts,
  };
};
