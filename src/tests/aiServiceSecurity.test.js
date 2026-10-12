// src/tests/aiServiceSecurity.test.js
//
// Issue #43 — AI Service Security Tests
//
// Verifies:
//   1. No secret AI API key is exposed in frontend source.
//   2. No VITE_* variable is used for a private AI API credential.
//   3. groqService does not make any real API calls (correctly mock-only).
//   4. Existing mock AI functions still return expected outputs.
//   5. No claim is made that real AI is being called.
//
// Run: node src/tests/aiServiceSecurity.test.js

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Running AI Service Security Tests (Issue #43)...\n');

let passed = 0;
const ok = (name) => { passed += 1; console.log(`  ✅ ${name}`); };
const fail = (name, reason) => { throw new Error(`FAIL: ${name} — ${reason}`); };

const groqSrc = readFileSync(join(__dirname, '../services/groqService.js'), 'utf8');

// ── Test 1: No VITE_GROQ_API_KEY as active code in groqService ─────────────
{
  // The comment block explains what was removed (and mentions the string by name).
  // We only need to ensure the string is not used as ACTIVE code (assignment/access).
  // Active use would look like: import.meta.env.VITE_GROQ_API_KEY (outside a comment).
  // Strip comment lines (starting with // or * after optional whitespace) then test.
  const codeLines = groqSrc.split('\n')
    .filter(line => !/^\s*(\/\/|\/?\*|\*\/)/.test(line))
    .join('\n');
  const hasActiveViteGroq = /VITE_GROQ_API_KEY/.test(codeLines);
  if (hasActiveViteGroq) {
    fail(
      'No VITE_GROQ_API_KEY as active code in groqService',
      'VITE_* variables are bundled into client JS and visible to every browser. A Groq secret must be server-side only.',
    );
  }
  ok('VITE_GROQ_API_KEY is NOT used as active code in groqService.js (no browser exposure)');
}

// ── Test 2: No hardcoded gsk_ / sk- / Bearer token in groqService ───────────
{
  const hasHardcodedKey = /gsk_[a-zA-Z0-9_]+|sk-[a-zA-Z0-9]+|Bearer\s+[a-zA-Z0-9._-]{20,}/.test(groqSrc);
  if (hasHardcodedKey) {
    fail(
      'No hardcoded API key in groqService',
      'A hardcoded API key (gsk_*, sk-*, or Bearer token) was found in frontend source.',
    );
  }
  ok('No hardcoded AI API key found in groqService.js');
}

// ── Test 3: No import.meta.env usage in groqService ─────────────────────────
{
  const hasImportMetaEnv = /import\.meta\.env/.test(groqSrc);
  if (hasImportMetaEnv) {
    fail(
      'No import.meta.env in groqService',
      'import.meta.env reads VITE_* variables that are bundled into client JS. Secret keys must not be read here.',
    );
  }
  ok('import.meta.env is NOT used in groqService.js');
}

// ── Test 4: No fetch() or axios call to a Groq/OpenAI endpoint ──────────────
{
  const hasRealApiCall = /fetch\s*\(\s*['"`]https?:\/\/(api\.groq|api\.openai|generativelanguage\.googleapis)/.test(groqSrc);
  if (hasRealApiCall) {
    fail(
      'No direct API call in groqService',
      'A direct AI API call was found in frontend code. This would require exposing a secret key client-side.',
    );
  }
  ok('No direct Groq/OpenAI/Gemini API call found in groqService.js (correctly mock-only)');
}

// ── Test 5: Functions are exported (UI still functions) ─────────────────────
{
  const exports = [
    'aiDraftNoticeContent',
    'aiDetectAttendanceAnomalies',
    'aiComputeFeeDefaultRiskScore',
    'aiSummarizeTeacherRemarks',
    'aiGenerateParentFAQAnswer',
  ];
  for (const fn of exports) {
    if (!groqSrc.includes(`export const ${fn}`)) {
      fail(`groqService exports ${fn}`, `Function ${fn} is not exported. UI depending on it will break.`);
    }
  }
  ok('All five AI service functions are still exported (mock UI still works)');
}

// ── Test 6: Mock functions are clearly labelled [MOCK] ──────────────────────
{
  const mockLabels = (groqSrc.match(/\[MOCK\]/g) || []).length;
  if (mockLabels < 5) {
    fail(
      'Mock functions labelled [MOCK]',
      `Expected at least 5 [MOCK] labels (one per function). Found ${mockLabels}. False claims of real AI are not allowed.`,
    );
  }
  ok(`All AI functions are clearly labelled [MOCK] (${mockLabels} labels found)`);
}

// ── Test 7: Mock function outputs are correct (regression) ──────────────────
{
  // Dynamic import of the mock module
  const { aiGenerateParentFAQAnswer, aiComputeFeeDefaultRiskScore, aiDetectAttendanceAnomalies } =
    await import('../services/groqService.js');

  // FAQ keyword matching
  const feeAnswer = aiGenerateParentFAQAnswer('How do I pay the fee?');
  if (!feeAnswer.includes('Fee Payout')) {
    fail('aiGenerateParentFAQAnswer fee query', `Unexpected answer: ${feeAnswer}`);
  }

  const busAnswer = aiGenerateParentFAQAnswer('Where is my bus?');
  if (!busAnswer.includes('Transport Tracking')) {
    fail('aiGenerateParentFAQAnswer bus query', `Unexpected answer: ${busAnswer}`);
  }

  // Risk scoring
  const highRisk = aiComputeFeeDefaultRiskScore({ feeDue: 25000, delayedPaymentHistoryCount: 3, attendancePct: '70' });
  if (highRisk.riskLabel !== 'High Default Risk') {
    fail('aiComputeFeeDefaultRiskScore high risk', `Expected High Default Risk, got: ${highRisk.riskLabel}`);
  }

  const lowRisk = aiComputeFeeDefaultRiskScore({ feeDue: 0, delayedPaymentHistoryCount: 0, attendancePct: '95' });
  if (lowRisk.riskLabel !== 'Low Default Risk') {
    fail('aiComputeFeeDefaultRiskScore low risk', `Expected Low Default Risk, got: ${lowRisk.riskLabel}`);
  }

  // Anomaly detection
  const anomalies = aiDetectAttendanceAnomalies([
    { studentId: 'stu_1', studentName: 'Arjun', className: '10-A', status: 'Absent', consecutiveAbsences: 3 },
    { studentId: 'stu_2', studentName: 'Priya', className: '10-B', status: 'Present', consecutiveAbsences: 0 },
  ]);
  if (anomalies.length !== 1 || anomalies[0].studentId !== 'stu_1') {
    fail('aiDetectAttendanceAnomalies', `Expected 1 anomaly for stu_1, got: ${JSON.stringify(anomalies)}`);
  }

  ok('Mock AI functions produce correct regression outputs (UI behavior preserved)');
}

// ── Test 8: No VITE_GROQ_API_KEY in .env.example ────────────────────────────
{
  const envExample = readFileSync(join(__dirname, '../../.env.example'), 'utf8');
  if (/VITE_GROQ_API_KEY/.test(envExample)) {
    fail(
      'No VITE_GROQ_API_KEY in .env.example',
      '.env.example documents VITE_GROQ_API_KEY which would encourage developers to add it to .env.local and expose it.',
    );
  }
  ok('VITE_GROQ_API_KEY is NOT documented in .env.example');
}

// ── Test 9: Verify no AI key in any VITE_ variable across all src files ─────
{
  const { execSync } = await import('node:child_process');
  // Search for any VITE_ variable that looks like an AI key pattern
  let hasExposedAIKey = false;
  try {
    const result = execSync(
      'grep -r "VITE_GROQ\\|VITE_OPENAI\\|VITE_GEMINI\\|VITE_AI_KEY" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" 2>/dev/null || true',
      { cwd: join(__dirname, '../..'), encoding: 'utf8' },
    );
    hasExposedAIKey = result.trim().length > 0;
  } catch (_) {
    // grep exits non-zero when no results found on some platforms
    hasExposedAIKey = false;
  }
  if (hasExposedAIKey) {
    fail(
      'No VITE_ AI key in any src file',
      'A VITE_GROQ/VITE_OPENAI/VITE_GEMINI/VITE_AI_KEY variable was found in frontend source.',
    );
  }
  ok('No VITE_GROQ / VITE_OPENAI / VITE_GEMINI / VITE_AI_KEY found in any frontend source file');
}

console.log(`\n✨ ALL ${passed} AI SERVICE SECURITY TESTS PASSED! (Issue #43)`);
console.log('\n⚠️  REMAINING: Client-side portion fixed; real AI integration requires server-side implementation.');
console.log('   Required: A Cloud Function (functions/aiProxy.js) or backend endpoint that holds');
console.log('   the Groq/OpenAI API key in Firebase Secret Manager and exposes a secure callable.');
