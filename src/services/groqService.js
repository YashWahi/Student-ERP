// src/services/groqService.js

/**
 * Groq AI Service Helper
 * Provides AI assistance for drafting SMS/notice announcements, detecting attendance anomalies,
 * scoring fee default risks, auto-summarizing report card comments, and answering parent FAQs.
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'gsk_mock_key_iitiancraft_school_erp_ai';

/**
 * 1. AI Auto-Draft Notice / SMS Announcement
 */
export const aiDraftNoticeContent = async ({ promptTopic, targetAudience = 'Parents', tone = 'Professional & Formal' }) => {
  try {
    // Simulated Groq LLM completion with fallback response
    return `OFFICIAL NOTICE: ${promptTopic.toUpperCase()}\n\nDear ${targetAudience},\n\nWe would like to inform you regarding ${promptTopic.toLowerCase()}. Please ensure all necessary arrangements are completed by the due date. For further details, please log in to the ERP Portal.\n\nRegards,\nSchool Administration`;
  } catch (err) {
    console.warn('Groq AI draft error:', err);
    return `Official Notice: ${promptTopic}. Please check ERP portal for details.`;
  }
};

/**
 * 2. AI Attendance Anomaly Detection
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
 * 3. AI Fee Default Risk Scoring
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
 * 4. AI Auto-Summarize Report Card Comments
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
 * 5. AI Parent FAQ Chatbot Response Generator
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
