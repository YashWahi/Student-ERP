// src/services/groqService.js
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  AI SERVICE — MOCK / TEMPLATE IMPLEMENTATION                    ║
// ║                                                                  ║
// ║  All five functions below use deterministic template/rule        ║
// ║  logic. They are NOT calling any real AI API.                   ║
// ║                                                                  ║
// ║  SECURITY NOTE (Issue #43):                                     ║
// ║  The previous implementation declared:                          ║
// ║    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY       ║
// ║  Any VITE_* variable is bundled into client JavaScript and is   ║
// ║  visible to every browser. A Groq (or any LLM) secret key      ║
// ║  MUST NEVER be placed in a VITE_* variable or any client-side  ║
// ║  code. That declaration has been removed.                       ║
// ║                                                                  ║
// ║  TO ENABLE REAL AI:                                             ║
// ║  Real AI API calls require a server-side boundary. Options:    ║
// ║   • A Firebase Cloud Function (e.g., functions/aiProxy.js)     ║
// ║     that holds the Groq/OpenAI secret via Secret Manager and   ║
// ║     exposes a secure callable for the frontend.                ║
// ║   • A dedicated backend API endpoint (/api/ai/...) that the    ║
// ║     frontend calls with a session credential (not a raw key).  ║
// ║  Until that backend is deployed, these mock functions provide  ║
// ║  stable UI behavior without any API dependency.                ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// NOTE: No AI API key is declared here. Secret credentials must
// live server-side only (Firebase Secret Manager or equivalent).
//
// Client-side portion fixed; real AI integration requires server-side implementation.

/**
 * 1. [MOCK] AI Auto-Draft Notice / SMS Announcement
 *
 * Returns a deterministic template response.
 * Real implementation: call a server-side AI proxy (Cloud Function or backend
 * endpoint) that uses the Groq/OpenAI API with a secret key held in
 * Firebase Secret Manager — never exposed to the browser.
 */
export const aiDraftNoticeContent = async ({ promptTopic, targetAudience = 'Parents', tone = 'Professional & Formal' }) => {
  try {
    // [MOCK] Deterministic template — not a real LLM completion.
    return `OFFICIAL NOTICE: ${promptTopic.toUpperCase()}\n\nDear ${targetAudience},\n\nWe would like to inform you regarding ${promptTopic.toLowerCase()}. Please ensure all necessary arrangements are completed by the due date. For further details, please log in to the ERP Portal.\n\nRegards,\nSchool Administration`;
  } catch (err) {
    console.warn('AI draft error (mock):', err);
    return `Official Notice: ${promptTopic}. Please check ERP portal for details.`;
  }
};

/**
 * 2. [MOCK] AI Attendance Anomaly Detection
 *
 * Uses a simple threshold rule (consecutiveAbsences >= 3).
 * Real implementation: send aggregated records to a server-side AI proxy
 * for pattern analysis and risk prediction.
 */
export const aiDetectAttendanceAnomalies = (attendanceRecords = []) => {
  const anomalies = [];
  attendanceRecords.forEach((record) => {
    if (record.status === 'Absent' && record.consecutiveAbsences >= 3) {
      anomalies.push({
        studentId: record.studentId,
        studentName: record.studentName,
        className: record.className,
        anomalyType: 'Sudden Consecutive Absences',
        riskLevel: 'High Risk',
        recommendation: 'Immediate counsellor check-in & parent phone call recommended.',
      });
    }
  });
  return anomalies;
};

/**
 * 3. [MOCK] AI Fee Default Risk Scoring
 *
 * Uses a hardcoded scoring rubric. Not a trained model.
 * Real implementation: send the student financial profile to a server-side
 * model endpoint that returns a calibrated, ML-backed risk score.
 */
export const aiComputeFeeDefaultRiskScore = (student) => {
  let score = 0;
  if (student.feeDue > 20000) score += 40;
  else if (student.feeDue > 10000) score += 25;

  if (student.delayedPaymentHistoryCount >= 3) score += 35;
  else if (student.delayedPaymentHistoryCount >= 1) score += 15;

  if (student.attendancePct && parseFloat(student.attendancePct) < 75) score += 25;

  const riskLabel = score >= 65 ? 'High Default Risk' : score >= 35 ? 'Moderate Default Risk' : 'Low Default Risk';
  return { score, riskLabel };
};

/**
 * 4. [MOCK] AI Auto-Summarize Report Card Comments
 *
 * Returns a canned comment based on score thresholds.
 * Real implementation: call a server-side language model proxy with the
 * full academic record to generate a personalised narrative summary.
 */
export const aiSummarizeTeacherRemarks = ({ studentName, mathScore, physicsScore, englishScore, attendancePct }) => {
  if (mathScore >= 90 && physicsScore >= 90) {
    return `${studentName} demonstrates outstanding analytical rigor and conceptual mastery. Excellent academic dedication and attendance record (${attendancePct}).`;
  }
  if (mathScore >= 75 && physicsScore >= 75) {
    return `${studentName} exhibits strong academic understanding with consistent effort. Continuous practice in problem solving will lead to top grades.`;
  }
  return `${studentName} is showing steady progress. Additional focused practice and regular classroom revision are recommended for upcoming terms.`;
};

/**
 * 5. [MOCK] AI Parent FAQ Chatbot Response Generator
 *
 * Uses keyword matching. Not a real NLU / LLM pipeline.
 * Real implementation: call a server-side AI proxy with the user query;
 * the backend holds the API key and returns a model-generated answer.
 */
export const aiGenerateParentFAQAnswer = (userQuery) => {
  const q = userQuery.toLowerCase();
  if (q.includes('fee') || q.includes('due') || q.includes('pay')) {
    return '💳 You can pay school fees online anytime under the "Fee Payout" tab using Razorpay UPI, Credit/Debit cards, or NetBanking. Instant PDF receipts are available for download immediately after payment.';
  }
  if (q.includes('bus') || q.includes('route') || q.includes('transport') || q.includes('eta')) {
    return '🚌 You can track live bus location and stop arrival ETAs under the "Transport Tracking" tab in your Parent Portal.';
  }
  if (q.includes('leave') || q.includes('absent')) {
    return '📝 To inform the school about a planned absence, go to the "Child Leave Application" tab and submit the leave duration with reason.';
  }
  if (q.includes('exam') || q.includes('result') || q.includes('marksheet')) {
    return '🏆 Exam datesheets, admit cards, and term marksheet report cards with QR codes can be downloaded directly from the "Academic Results" tab.';
  }
  return `ℹ️ Thank you for your inquiry. For specific administrative assistance regarding "${userQuery}", please contact the school office or send a direct message to your class teacher via the Parent Portal.`;
};
