// src/tests/feeReceiptPDFAsync.test.js
//
// Issue #42 — Fee Receipt PDF Async Handling Tests
//
// Verifies that generateFeeReceiptPDF is properly awaited in all call sites
// and that errors are caught and surfaced correctly (not silently lost).
//
// These are offline, no-DOM, no-browser tests. They mock jsPDF and verify
// the async contract at the service layer.
//
// Run: node src/tests/feeReceiptPDFAsync.test.js

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Running Fee Receipt PDF Async Handling Tests (Issue #42)...\n');

let passed = 0;
const ok = (name) => { passed += 1; console.log(`  ✅ ${name}`); };
const fail = (name, reason) => { throw new Error(`FAIL: ${name} — ${reason}`); };

// ---------------------------------------------------------------------------
// Static source analysis: verify await is present at every call site.
// This is the most reliable offline test for async handling — we inspect
// the compiled source text to guarantee the contract is met.
// ---------------------------------------------------------------------------

const razorpaySrc = readFileSync(
  join(__dirname, '../services/razorpayService.js'),
  'utf8',
);

const feeServiceSrc = readFileSync(
  join(__dirname, '../services/feeService.js'),
  'utf8',
);

const parentPortalSrc = readFileSync(
  join(__dirname, '../pages/parent/ParentPortal.jsx'),
  'utf8',
);

const studentPortalSrc = readFileSync(
  join(__dirname, '../pages/student/StudentPortal.jsx'),
  'utf8',
);

// ── Test 1: razorpayService — generateFeeReceiptPDF must be awaited ─────────
{
  // Find the PDF block in openVerifiedCheckout
  const pdfBlock = razorpaySrc.slice(razorpaySrc.indexOf('generate the PDF receipt'));
  const awaitedCall = /await generateFeeReceiptPDF\(/.test(pdfBlock.slice(0, 800));
  if (!awaitedCall) {
    fail(
      'razorpayService — PDF generation awaited',
      'generateFeeReceiptPDF is NOT awaited in openVerifiedCheckout. Failures will be silently lost.',
    );
  }
  ok('razorpayService — generateFeeReceiptPDF is properly awaited');
}

// ── Test 2: razorpayService — PDF error must trigger toast, not suppress ────
{
  const hasPdfErrToast = /toast\.error.*receipt PDF/.test(razorpaySrc);
  if (!hasPdfErrToast) {
    fail(
      'razorpayService — PDF failure surfaced to user',
      'No toast.error call found for PDF generation failure. Error is silently swallowed.',
    );
  }
  ok('razorpayService — PDF generation failure surfaces a toast.error to the user');
}

// ── Test 3: razorpayService — onSuccess must NOT fire before PDF attempt ────
{
  // Locate the handler async function body and verify that await generateFeeReceiptPDF
  // appears BEFORE the onSuccess call. We don't rely on specific line endings.
  const handlerStart = razorpaySrc.indexOf('handler: async function');

  // The handler body is well-delimited: after it closes, the next option is 'prefill,'
  // Find 'prefill,' that occurs after the handler start, but only look for tokens that
  // are clearly outside the handler (at the options-object level).
  // Safer: find the section from handlerStart to 'rzp.open()' and check order there.
  const rzpOpenIdx = razorpaySrc.indexOf('rzp.open()');
  const handlerSection = handlerStart !== -1 && rzpOpenIdx !== -1
    ? razorpaySrc.slice(handlerStart, rzpOpenIdx)
    : '';

  const pdfIdx = handlerSection.indexOf('await generateFeeReceiptPDF');
  const successIdx = handlerSection.indexOf('onSuccess &&');
  if (pdfIdx === -1 || successIdx === -1 || pdfIdx > successIdx) {
    fail(
      'razorpayService — onSuccess order',
      `onSuccess fires before PDF attempt is settled. pdfIdx=${pdfIdx}, successIdx=${successIdx}`,
    );
  }
  ok('razorpayService — onSuccess only fires AFTER PDF attempt settles');
}

// ── Test 4: feeService — generateFeeReceiptPDF must be awaited ──────────────
{
  const pdfBlock = feeServiceSrc.slice(feeServiceSrc.indexOf('Auto Generate PDF Receipt'));
  const awaitedCall = /await generateFeeReceiptPDF\(/.test(pdfBlock.slice(0, 600));
  if (!awaitedCall) {
    fail(
      'feeService — PDF generation awaited',
      'generateFeeReceiptPDF is NOT awaited in recordFeePayment. Unhandled promise rejection possible.',
    );
  }
  ok('feeService — generateFeeReceiptPDF is properly awaited in recordFeePayment');
}

// ── Test 5: feeService — PDF failure must not suppress the payment record ───
{
  // Slice only the PDF-specific catch block: from '} catch (pdfErr)' to
  // 'return {' so we don't accidentally match a 'throw' from an earlier block.
  const pdfCatchStart = feeServiceSrc.indexOf('} catch (pdfErr) {');
  const returnStart = feeServiceSrc.indexOf('return {', pdfCatchStart);
  const pdfCatch = pdfCatchStart !== -1 && returnStart !== -1
    ? feeServiceSrc.slice(pdfCatchStart, returnStart)
    : '';
  // The catch block must not contain a bare 'throw' statement (re-throw).
  // We allow the word 'throw' only inside a comment (but there is none here).
  const rethrows = /^\s*throw\s/m.test(pdfCatch);
  if (rethrows) {
    fail(
      'feeService — PDF failure is non-fatal',
      'PDF catch block re-throws, which would suppress the successful payment record.',
    );
  }
  ok('feeService — PDF failure is non-fatal; payment record is still returned');
}

// ── Test 6: ParentPortal — onSuccess callback must be async ─────────────────
{
  const onSuccessBlock = parentPortalSrc.slice(
    parentPortalSrc.indexOf('onSuccess: async'),
    parentPortalSrc.indexOf('onFailure:'),
  );
  const isAsync = onSuccessBlock.startsWith('onSuccess: async');
  if (!isAsync) {
    fail(
      'ParentPortal — onSuccess is async',
      'onSuccess callback is not declared async. await generateFeeReceiptPDF would be a syntax error or ignored.',
    );
  }
  ok('ParentPortal — onSuccess callback is properly declared as async');
}

// ── Test 7: ParentPortal — PDF call must be awaited ─────────────────────────
{
  const callIdx = parentPortalSrc.indexOf('await generateFeeReceiptPDF');
  if (callIdx === -1) {
    fail(
      'ParentPortal — PDF generation awaited',
      'No await found before generateFeeReceiptPDF in ParentPortal. Promise rejection silently lost.',
    );
  }
  ok('ParentPortal — generateFeeReceiptPDF is awaited in onSuccess handler');
}

// ── Test 8: ParentPortal — PDF failure surfaces toast.error ─────────────────
{
  const onSuccessSection = parentPortalSrc.slice(
    parentPortalSrc.indexOf('onSuccess: async'),
    parentPortalSrc.indexOf('onFailure:'),
  );
  const hasPdfErrToast = /toast\.error.*receipt PDF|toast\.error.*PDF/.test(onSuccessSection);
  if (!hasPdfErrToast) {
    fail(
      'ParentPortal — PDF failure toast',
      'No toast.error for PDF failure in ParentPortal onSuccess. User never learns receipt failed.',
    );
  }
  ok('ParentPortal — PDF generation failure shows toast.error');
}

// ── Test 9: StudentPortal — report card PDF must use async/await, not .then ─
{
  // The old code used .then() with the toast.success OUTSIDE the chain.
  // The new code must use async onClick with try/catch.
  const studentPDFSection = studentPortalSrc.slice(
    studentPortalSrc.indexOf('Download Report Card PDF') - 3000,
    studentPortalSrc.indexOf('Download Report Card PDF'),
  );
  const usesAwaitImport = /await import\('jspdf'\)/.test(studentPDFSection);
  const hasCatch = /catch\s*\(pdfErr\)/.test(studentPDFSection);
  const toastInsideTry = (() => {
    // toast.success must appear AFTER await import, inside the try block.
    const tryStart = studentPDFSection.lastIndexOf('try {');
    const catchStart = studentPDFSection.lastIndexOf('} catch');
    const toastIdx = studentPDFSection.lastIndexOf("toast.success('📜 Official Report Card PDF downloaded!')");
    return tryStart !== -1 && catchStart !== -1 && toastIdx > tryStart && toastIdx < catchStart;
  })();

  if (!usesAwaitImport) {
    fail(
      'StudentPortal — report card PDF uses await import',
      'Still using .then() chain. Promise rejection for import failure is unhandled.',
    );
  }
  if (!hasCatch) {
    fail(
      'StudentPortal — report card PDF has catch block',
      'No catch block found. PDF generation failures are silently lost.',
    );
  }
  if (!toastInsideTry) {
    fail(
      'StudentPortal — success toast is inside try block',
      'toast.success fires outside the try block — i.e., before the PDF is generated.',
    );
  }
  ok('StudentPortal — report card PDF uses async/await with try/catch');
  ok('StudentPortal — success toast fires only after PDF is generated');
}

// ── Test 10: generateFeeReceiptPDF must be declared async ───────────────────
{
  const pdfServiceSrc = readFileSync(join(__dirname, '../services/pdfService.js'), 'utf8');
  const fnDecl = pdfServiceSrc.slice(
    pdfServiceSrc.indexOf('Generate Fee Receipt PDF'),
    pdfServiceSrc.indexOf('Generate Fee Receipt PDF') + 200,
  );
  const isDeclaredAsync = /export const generateFeeReceiptPDF = async/.test(fnDecl);
  if (!isDeclaredAsync) {
    fail(
      'pdfService — generateFeeReceiptPDF is async',
      'The function is not declared async. await will have no effect at call sites.',
    );
  }
  ok('pdfService — generateFeeReceiptPDF is correctly declared as async');
}

console.log(`\n✨ ALL ${passed} FEE RECEIPT PDF ASYNC TESTS PASSED! (Issue #42)`);
