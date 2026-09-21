// src/tests/kpiCalculator.test.js
import { calculateSafeTrend, calculateTenantKPIs, formatCurrencyINR, formatNumber } from '../features/superadmin/dashboard/utils/kpiCalculator.js';

console.log('🧪 Running KPI Calculator & NaN-Prevention Unit Tests...\n');

// Test 1: Division by Zero & Zero Denominator
const zeroPrev = calculateSafeTrend(150, 0);
if (zeroPrev.hasComparison !== false || zeroPrev.label !== 'No comparison data' || zeroPrev.trendValue !== null) {
  throw new Error(`FAIL: Zero previous value should return 'No comparison data', got: ${JSON.stringify(zeroPrev)}`);
}
console.log('  ✅ Zero previous value handled safely (no NaN/Infinity)');

// Test 2: Null / Undefined / NaN Inputs
const nullPrev = calculateSafeTrend(100, null);
if (nullPrev.hasComparison !== false || nullPrev.label !== 'No comparison data') {
  throw new Error(`FAIL: Null previous value failed: ${JSON.stringify(nullPrev)}`);
}

const undefinedPrev = calculateSafeTrend(100, undefined);
if (undefinedPrev.hasComparison !== false || undefinedPrev.label !== 'No comparison data') {
  throw new Error(`FAIL: Undefined previous value failed: ${JSON.stringify(undefinedPrev)}`);
}

const nanCurrent = calculateSafeTrend(NaN, 100);
if (nanCurrent.hasComparison !== false || nanCurrent.label !== 'No comparison data') {
  throw new Error(`FAIL: NaN current value failed: ${JSON.stringify(nanCurrent)}`);
}

const nanPrev = calculateSafeTrend(100, NaN);
if (nanPrev.hasComparison !== false || nanPrev.label !== 'No comparison data') {
  throw new Error(`FAIL: NaN previous value failed: ${JSON.stringify(nanPrev)}`);
}
console.log('  ✅ Null, undefined, and NaN inputs handled safely');

// Test 3: Positive Growth
const positiveTrend = calculateSafeTrend(120, 100);
if (!positiveTrend.hasComparison || positiveTrend.trendValue !== 20 || !positiveTrend.isPositive) {
  throw new Error(`FAIL: Positive growth calculation failed: ${JSON.stringify(positiveTrend)}`);
}
console.log('  ✅ Positive growth calculated correctly (20%)');

// Test 4: Negative Growth
const negativeTrend = calculateSafeTrend(80, 100);
if (!negativeTrend.hasComparison || negativeTrend.trendValue !== 20 || negativeTrend.isPositive) {
  throw new Error(`FAIL: Negative growth calculation failed: ${JSON.stringify(negativeTrend)}`);
}
console.log('  ✅ Negative growth calculated correctly (-20%)');

// Test 5: Float rounding precision
const precisionTrend = calculateSafeTrend(112.4, 100);
if (precisionTrend.trendValue !== 12.4) {
  throw new Error(`FAIL: Precision rounding failed: ${JSON.stringify(precisionTrend)}`);
}
console.log('  ✅ Decimal precision formatted cleanly (12.4%)');

// Test 6: Tenant Aggregation
const mockTenants = [
  { name: 'College A', plan: 'Enterprise', status: 'Active', students: 4500, teachers: 250, mrrValue: 120000 },
  { name: 'College B', plan: 'Standard', status: 'Active', students: 850, teachers: 45, mrrValue: 24000 },
  { name: 'College C', plan: 'Premium', status: 'Trial', students: 1200, teachers: 60, mrrValue: 48000 },
  { name: 'College D', plan: 'Basic', status: 'Suspended', students: 500, teachers: 25, mrrValue: 12000 },
];

const kpis = calculateTenantKPIs(mockTenants);
if (kpis.totalInstitutions !== 4) throw new Error('FAIL: totalInstitutions mismatch');
if (kpis.activeInstitutions !== 2) throw new Error('FAIL: activeInstitutions mismatch');
if (kpis.trialInstitutions !== 1) throw new Error('FAIL: trialInstitutions mismatch');
if (kpis.suspendedOrExpired !== 1) throw new Error('FAIL: suspendedOrExpired mismatch');
if (kpis.totalStudents !== 7050) throw new Error('FAIL: totalStudents mismatch');
if (kpis.totalStaff !== 380) throw new Error('FAIL: totalStaff mismatch');
if (kpis.mrr !== 144000) throw new Error('FAIL: active MRR mismatch');
console.log('  ✅ Tenant KPIs aggregated accurately across plans and statuses');

// Test 7: Formatting
if (formatCurrencyINR(144000) !== '₹1,44,000') throw new Error('FAIL: INR currency format mismatch');
if (formatNumber(7050) !== '7,050') throw new Error('FAIL: Number format mismatch');
console.log('  ✅ INR Currency and number locale formatting verified');

console.log('\n✨ ALL KPI CALCULATOR & NAN PREVENTION TESTS PASSED WITH 100% SUCCESS!');
