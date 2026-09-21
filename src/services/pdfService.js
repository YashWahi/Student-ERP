// src/services/pdfService.js
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generate QR code data URL asynchronously with fallback handling
 */
const generateQRDataUrl = async (text, options = {}) => {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      ...options,
    });
  } catch (err) {
    console.warn('Failed to generate QR code via QRCode library:', err);
    return null;
  }
};

/**
 * Fallback vector QR placeholder drawing if QR base64 fails
 */
const drawQRFallback = (doc, x, y, size = 20, text = 'VERIFY') => {
  doc.setDrawColor(15, 23, 42);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'FD');

  doc.setFillColor(15, 23, 42);
  doc.rect(x + 2, y + 2, 5, 5, 'F');
  doc.rect(x + size - 7, y + 2, 5, 5, 'F');
  doc.rect(x + 2, y + size - 7, 5, 5, 'F');
  doc.rect(x + 7, y + 7, 6, 6, 'F');

  if (text) {
    doc.setFontSize(4.5);
    doc.setTextColor(100, 116, 139);
    doc.text(text, x + size / 2, y + size + 3, { align: 'center' });
  }
};

/**
 * Render QR Code onto jsPDF document
 */
const drawQRCodeOnPDF = async (doc, text, x, y, size = 20, label = 'SCAN TO VERIFY') => {
  const qrDataUrl = await generateQRDataUrl(text);
  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.rect(x - 1, y - 1, size + 2, size + 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(x - 1, y - 1, size + 2, size + 2, 'D');
    doc.addImage(qrDataUrl, 'PNG', x, y, size, size);
  } else {
    drawQRFallback(doc, x, y, size, label);
  }
  if (label) {
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + size / 2, y + size + 3, { align: 'center' });
  }
};

/**
 * Helper to render student photo placeholder or image onto ID card
 */
const drawPhotoPlaceholder = (doc, x, y, w, h) => {
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');

  // Avatar icon representation
  doc.setFillColor(148, 163, 184);
  doc.circle(x + w / 2, y + 8, 4, 'F');
  doc.ellipse(x + w / 2, y + 20, 7, 5, 'F');

  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PHOTO', x + w / 2, y + h - 1.5, { align: 'center' });
};

/**
 * 1. Generate Student ID Card PDF
 * Standard CR80 Card Format (54mm x 85.6mm portrait)
 */
export const generateStudentIDCardPDF = async ({
  studentName = 'Arjun Verma',
  rollNo = 'GV-2026-001',
  className = 'Class 10-A',
  dob = '14-05-2011',
  bloodGroup = 'O+',
  parentPhone = '+91 98765 43210',
  photoUrl = null,
  collegeName = 'Green Valley International',
  academicYear = '2026-2027',
  verificationUrl = null,
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [54, 85.6], // Standard CR80 Card size
  });

  const cardWidth = 54;
  const cardHeight = 85.6;
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/student/${rollNo}`;

  // Card Outer Border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(0, 0, cardWidth, cardHeight, 'D');

  // Header Background Banner
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, cardWidth, 18, 'F');

  // Gold Accent Strip
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 18, cardWidth, 1, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName.toUpperCase(), cardWidth / 2, 7, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('STUDENT IDENTITY CARD', cardWidth / 2, 13, { align: 'center' });

  // Photo Area
  const photoX = 17;
  const photoY = 22;
  const photoW = 20;
  const photoH = 24;

  if (photoUrl) {
    try {
      doc.addImage(photoUrl, 'JPEG', photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn('Failed to add student image, rendering placeholder:', e);
      drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // Student Name
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(studentName, cardWidth / 2, 51, { align: 'center' });

  // Roll & Class Pills
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(4, 54, cardWidth - 8, 8, 1.5, 1.5, 'F');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`ROLL NO: ${rollNo}`, 7, 59);
  doc.setTextColor(15, 23, 42);
  doc.text(`CLASS: ${className}`, cardWidth - 7, 59, { align: 'right' });

  // Details
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`DOB: ${dob}`, 6, 66);
  doc.text(`Blood: ${bloodGroup}`, 6, 70);
  doc.text(`Emergency: ${parentPhone}`, 6, 74);

  // Scannable QR Code on bottom right
  await drawQRCodeOnPDF(doc, targetUrl, 38, 64, 11, '');

  // Footer bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 79, cardWidth, 6.6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`ACADEMIC YEAR ${academicYear} • VERIFIED ID`, cardWidth / 2, 83, { align: 'center' });

  doc.save(`ID_Card_${studentName.replace(/\s+/g, '_')}.pdf`);
  return doc;
};

/**
 * 2. Generate Exam Admit Cards / Hall Tickets PDF
 * Official A4 Portrait Format (210mm x 297mm)
 */
export const generateAdmitCardPDF = async ({
  examName = 'Mid-Term Examination 2026',
  studentName = 'Arjun Verma',
  rollNo = 'GV-2026-001',
  className = 'Class 10-A',
  registrationNo = 'REG-2026-8912',
  examCenter = 'Main Campus Auditorium Hall B',
  seatNo = 'Seat A-12',
  dateSheet = [
    { date: '10-09-2026', time: '09:00 AM - 12:00 PM', code: 'MATH-101', subject: 'Mathematics', room: 'Hall B-12' },
    { date: '12-09-2026', time: '09:00 AM - 12:00 PM', code: 'PHY-102', subject: 'Physics', room: 'Hall B-12' },
    { date: '14-09-2026', time: '09:00 AM - 12:00 PM', code: 'CHEM-103', subject: 'Chemistry', room: 'Hall B-12' },
    { date: '16-09-2026', time: '09:00 AM - 12:00 PM', code: 'ENG-104', subject: 'English Literature', room: 'Hall B-12' },
    { date: '18-09-2026', time: '09:00 AM - 12:00 PM', code: 'CS-105', subject: 'Computer Science', room: 'Lab 2' },
  ],
  collegeName = 'Green Valley International School',
  schoolAddress = '742 Evergreen Terrace, Sector 4, New Delhi',
  verificationUrl = null,
}) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/hall-ticket/${rollNo}`;

  // Header Banner Background
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold Accent Line
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 36, 210, 1.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName, 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(schoolAddress, 14, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`EXAMINATION ADMIT CARD / HALL TICKET — ${examName.toUpperCase()}`, 14, 30);

  // Scannable QR Code on top right
  await drawQRCodeOnPDF(doc, targetUrl, 172, 44, 24, 'HALL TICKET QR');

  // Candidate Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 152, 42, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CANDIDATE & EXAMINATION DETAILS', 20, 52);

  doc.setLineWidth(0.2);
  doc.setDrawColor(203, 213, 225);
  doc.line(20, 54, 160, 54);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Candidate Name: ${studentName}`, 20, 61);
  doc.text(`Roll Number: ${rollNo}`, 20, 67);
  doc.text(`Registration No: ${registrationNo}`, 20, 73);
  doc.text(`Class & Section: ${className}`, 20, 79);

  doc.text(`Exam Center: ${examCenter}`, 90, 61);
  doc.text(`Assigned Seat:`, 90, 67);

  // Seat Badge Highlight
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(114, 63.5, 28, 5.5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(seatNo, 128, 67.5, { align: 'center' });

  // Datesheet Table Title
  let y = 96;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('EXAMINATION DATESHEET & SUBJECT SCHEDULE', 14, y);

  y += 4;
  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 9, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Date', 18, y + 6);
  doc.text('Timing Slot', 48, y + 6);
  doc.text('Code', 95, y + 6);
  doc.text('Subject Title', 118, y + 6);
  doc.text('Invigilator Sign', 165, y + 6);

  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  dateSheet.forEach((item, index) => {
    const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(14, y, 182, 9, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 9, 'D');

    doc.setTextColor(15, 23, 42);
    doc.text(item.date, 18, y + 6);
    doc.text(item.time, 48, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(item.code || 'SUB-101', 95, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(item.subject, 118, y + 6);

    // Invigilator signature box line
    doc.setDrawColor(203, 213, 225);
    doc.line(162, y + 7, 192, y + 7);

    y += 9;
  });

  // Candidate Rules Box
  y += 8;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, y, 182, 38, 2, 2, 'FD');

  doc.setTextColor(30, 58, 138);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT INSTRUCTIONS FOR CANDIDATES:', 18, y + 7);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  const rules = [
    '1. Candidates must carry this original Admit Card along with a valid Student ID Card to the exam hall.',
    '2. Entry will be permitted 30 minutes prior to the scheduled exam commencement time.',
    '3. Mobile phones, smartwatches, programmable calculators, and study notes are strictly prohibited.',
    '4. Candidates must remain seated until exam scripts are collected by the presiding invigilator.',
  ];

  let ruleY = y + 13;
  rules.forEach((rule) => {
    doc.text(rule, 18, ruleY);
    ruleY += 5.5;
  });

  // Signatures
  y += 54;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  doc.line(20, y, 65, y);
  doc.line(82, y, 128, y);
  doc.line(145, y, 190, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Candidate Signature', 42.5, y + 5, { align: 'center' });
  doc.text('Invigilator Signature', 105, y + 5, { align: 'center' });
  doc.text('Controller of Exams (Stamp)', 167.5, y + 5, { align: 'center' });

  // Footer Line
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Official Computer-Generated Exam Admit Card • Validated with Digital QR Code', 105, 285, { align: 'center' });

  doc.save(`Admit_Card_${studentName.replace(/\s+/g, '_')}.pdf`);
  return doc;
};

/**
 * 3. Generate Transfer Certificate / TC PDF
 * Official Formal A4 Format (210mm x 297mm)
 */
export const generateTransferCertificatePDF = async ({
  tcNo = `TC/2026/00842`,
  bookNo = '2026/01',
  admissionNo = 'ADM-2022-451',
  studentName = 'Arjun Verma',
  rollNo = 'GV-2026-001',
  fatherName = 'Mr. Suresh Verma',
  motherName = 'Mrs. Sunita Verma',
  dob = '14-05-2011',
  dobWords = 'Fourteenth May Two Thousand Eleven',
  nationality = 'Indian',
  category = 'General',
  classStudied = 'Class 10-A',
  classPromotedTo = 'Promoted to Class 11th (Science Stream)',
  examResult = 'Passed & Promoted in Annual Examination 2026',
  duesPaidUpTo = 'March 2026 (All Dues Cleared)',
  workingDays = '220 Days',
  attendedDays = '212 Days',
  conduct = 'Good & Exemplary',
  reasonForLeaving = 'Parent Relocation to Bangalore',
  issueDate = new Date().toLocaleDateString('en-IN'),
  remarks = 'Fit for admission to higher secondary education.',
  collegeName = 'Green Valley International School',
  affiliationNo = 'CBSE Affiliation No. 2730198 | School Code: 89120',
  schoolAddress = '742 Evergreen Terrace, Sector 4, New Delhi',
  verificationUrl = null,
}) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/tc/${tcNo.replace(/\//g, '-')}`;

  // Certificate Formal Border (Double Frame)
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, 194, 281, 'D');

  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.4);
  doc.rect(10, 10, 190, 277, 'D');

  // Header Letterhead
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName.toUpperCase(), 105, 22, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(affiliationNo, 105, 27, { align: 'center' });
  doc.text(schoolAddress, 105, 31, { align: 'center' });

  // Document Title Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(30, 35, 150, 8.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSFER CERTIFICATE / SCHOOL LEAVING CERTIFICATE', 105, 41, { align: 'center' });

  // QR Code Verification
  await drawQRCodeOnPDF(doc, targetUrl, 168, 47, 24, 'TC VERIFY QR');

  // TC Meta Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`TC Serial No: ${tcNo}`, 14, 49);
  doc.text(`Book No: ${bookNo}`, 14, 55);
  doc.text(`Admission No: ${admissionNo}`, 90, 49);
  doc.text(`Issue Date: ${issueDate}`, 90, 55);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, 59, 196, 59);

  // Particulars Table
  const fields = [
    { label: '1. Name of Pupil:', val: studentName },
    { label: '2. Roll / Admission Number:', val: `${rollNo} / ${admissionNo}` },
    { label: "3. Father's / Guardian's Name:", val: fatherName },
    { label: "4. Mother's Name:", val: motherName },
    { label: '5. Nationality & Religion:', val: `${nationality} | Category: ${category}` },
    { label: '6. Date of Birth (in figures & words):', val: `${dob} (${dobWords})` },
    { label: '7. Class in which pupil last studied:', val: classStudied },
    { label: '8. School / Board Annual Examination Result:', val: examResult },
    { label: '9. Qualified for promotion to higher class:', val: classPromotedTo },
    { label: '10. Month up to which school dues paid:', val: duesPaidUpTo },
    { label: '11. Total Working Days / Attended Days:', val: `${workingDays} / ${attendedDays}` },
    { label: '12. General Conduct & Character:', val: conduct },
    { label: '13. Reason for leaving school:', val: reasonForLeaving },
    { label: '14. Any other remarks:', val: remarks },
  ];

  let y = 67;
  fields.forEach((f, idx) => {
    const rowBg = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...rowBg);
    doc.rect(14, y - 5, 182, 9, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 9, 'D');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(f.label, 18, y + 1);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(String(f.val), 88, y + 1);

    y += 9.5;
  });

  // Undertaking Text
  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Certified that the above information is in accordance with the official school register and records.', 105, y, { align: 'center' });

  // Signatures & Principal Seal Box
  y += 32;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  doc.line(20, y, 65, y);
  doc.line(82, y, 128, y);
  doc.line(145, y, 190, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By (Class Teacher)', 42.5, y + 5, { align: 'center' });
  doc.text('Checked By (Admin Officer)', 105, y + 5, { align: 'center' });
  doc.text('Principal Signature & Seal', 167.5, y + 5, { align: 'center' });

  doc.save(`Transfer_Certificate_${studentName.replace(/\s+/g, '_')}.pdf`);
  return doc;
};

/**
 * 4. Generate Student Marksheet / Report Card PDF
 * Official A4 Portrait Format (210mm x 297mm)
 */
export const generateReportCardPDF = async ({
  studentName = 'Arjun Verma',
  rollNo = 'GV-2026-001',
  admissionNo = 'ADM-2022-451',
  className = 'Class 10-A',
  academicYear = '2025-2026',
  examName = 'Mid-Term Examination 2026',
  attendance = '96.4% (212 / 220 Days)',
  subjects = [
    { name: 'Mathematics', max: 100, pass: 35, marks: 95, grade: 'A+', remarks: 'Outstanding' },
    { name: 'Physics', max: 100, pass: 35, marks: 92, grade: 'A+', remarks: 'Excellent' },
    { name: 'Chemistry', max: 100, pass: 35, marks: 88, grade: 'A', remarks: 'Very Good' },
    { name: 'English Literature', max: 100, pass: 35, marks: 85, grade: 'A', remarks: 'Very Good' },
    { name: 'Computer Science', max: 100, pass: 35, marks: 96, grade: 'A+', remarks: 'Outstanding' },
  ],
  overallPct = '91.2%',
  gpa = '9.2 / 10.0',
  rank = '1st',
  resultStatus = 'PASSED WITH DISTINCTION',
  teacherRemarks = 'Exemplary academic performance, active participation, and outstanding leadership qualities.',
  collegeName = 'Green Valley International School',
  verificationUrl = null,
}) => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/report-card/${rollNo}`;

  // Header Banner Background
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold Accent Line
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 36, 210, 1.5, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName, 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`OFFICIAL ACADEMIC REPORT CARD — ${examName.toUpperCase()}`, 14, 25);
  doc.setFontSize(8.5);
  doc.text(`Academic Session: ${academicYear}`, 14, 31);

  // Scannable QR Code
  await drawQRCodeOnPDF(doc, targetUrl, 172, 44, 24, 'VERIFY REPORT QR');

  // Student Profile Container Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 152, 34, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student Name: ${studentName}`, 20, 52);
  doc.text(`Roll Number: ${rollNo}`, 20, 58);
  doc.text(`Admission No: ${admissionNo}`, 20, 64);
  doc.text(`Class & Section: ${className}`, 20, 70);

  doc.text(`Attendance: ${attendance}`, 90, 52);
  doc.text(`Aggregate Pct: ${overallPct}`, 90, 58);
  doc.text(`Overall GPA: ${gpa}`, 90, 64);
  doc.text(`Class Rank: ${rank}`, 90, 70);

  // Subject Table Header
  let y = 86;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 9, 'D');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Subject Title', 18, y + 6);
  doc.text('Max Marks', 82, y + 6);
  doc.text('Pass Marks', 110, y + 6);
  doc.text('Obtained', 138, y + 6);
  doc.text('Grade', 165, y + 6);

  y += 9;
  let totalMax = 0;
  let totalObtained = 0;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  subjects.forEach((sub, index) => {
    const maxM = Number(sub.max || 100);
    const obtM = Number(sub.marks || 0);
    totalMax += maxM;
    totalObtained += obtM;

    const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(14, y, 182, 9, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, y, 182, 9, 'D');

    doc.setTextColor(15, 23, 42);
    doc.text(sub.name, 18, y + 6);
    doc.text(String(maxM), 82, y + 6);
    doc.text(String(sub.pass || 35), 110, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(String(obtM), 138, y + 6);
    doc.setTextColor(37, 99, 235);
    doc.text(sub.grade || 'A', 165, y + 6);
    doc.setFont('helvetica', 'normal');

    y += 9;
  });

  // Total Summary Row
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, 182, 9, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 9, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL AGGREGATE SCORES', 18, y + 6);
  doc.text(String(totalMax), 82, y + 6);
  doc.text(String(totalObtained), 138, y + 6);
  doc.setTextColor(22, 163, 74);
  doc.text(resultStatus, 165, y + 6);

  // Teacher Remarks Box
  y += 16;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');

  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 3, 26, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLASS TEACHER REMARKS & EVALUATION:', 22, y + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(51, 65, 85);
  doc.text(`"${teacherRemarks}"`, 22, y + 15);

  // Signatures Section
  y += 48;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  doc.line(20, y, 65, y);
  doc.line(82, y, 128, y);
  doc.line(145, y, 190, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Class Teacher Signature', 42.5, y + 5, { align: 'center' });
  doc.text('Parent / Guardian Signature', 105, y + 5, { align: 'center' });
  doc.text('Principal Signature & Stamp', 167.5, y + 5, { align: 'center' });

  // Document Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 280, 196, 280);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Official Computer-Generated Marksheet • Verified with Digital QR Code', 105, 285, { align: 'center' });

  doc.save(`Report_Card_${studentName.replace(/\s+/g, '_')}.pdf`);
  return doc;
};

/**
 * 5. Generate Fee Receipt PDF
 */
export const generateFeeReceiptPDF = async ({
  receiptNo,
  studentName,
  rollNo,
  className,
  feeType,
  amount,
  paymentMethod = 'Online (Razorpay)',
  date = new Date().toLocaleDateString('en-IN'),
  collegeName = 'Green Valley International School',
  verificationUrl = null,
}) => {
  const doc = new jsPDF();
  const recNo = receiptNo || `REC-${Date.now().toString().slice(-6)}`;
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/receipt/${recNo}`;

  // Header Banner
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold Accent Strip
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 36, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName, 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 27);

  // QR Code Verification Box
  await drawQRCodeOnPDF(doc, targetUrl, 172, 44, 24, 'SCAN TO VERIFY');

  // Receipt Meta
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Receipt No: ${recNo}`, 14, 46);
  doc.text(`Payment Date: ${date}`, 14, 52);

  // Student Details Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 58, 150, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('STUDENT DETAILS:', 18, 66);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${studentName}`, 18, 73);
  doc.text(`Roll No: ${rollNo || 'N/A'}`, 18, 80);
  doc.text(`Class & Section: ${className}`, 18, 86);

  // Payment Breakdown Table
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 100, 182, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 100, 182, 10, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Particulars / Fee Head', 18, 106);
  doc.text('Amount (INR)', 160, 106);

  doc.setFont('helvetica', 'normal');
  doc.text(feeType, 18, 118);
  doc.text(`Rs. ${Number(amount).toLocaleString('en-IN')}`, 160, 118);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 126, 196, 126);

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL PAID:', 115, 136);
  doc.setTextColor(22, 163, 74);
  doc.text(`Rs. ${Number(amount).toLocaleString('en-IN')}`, 160, 136);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${paymentMethod}`, 18, 136);

  // Footer Note
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 155, 196, 155);
  doc.setFontSize(8);
  doc.text('This is an official computer-generated fee receipt with digital QR security verification.', 14, 162);
  doc.text('Thank you for your prompt fee payment.', 14, 167);

  doc.save(`Fee_Receipt_${recNo}.pdf`);
  return doc;
};

/**
 * 6. Generate Staff Salary Payslip PDF
 */
export const generateStaffPayslipPDF = async ({
  empId,
  employeeName,
  designation,
  department,
  month = 'August 2026',
  basicSalary,
  allowances,
  deductions,
  netPay,
  collegeName = 'Green Valley International School',
  verificationUrl = null,
}) => {
  const doc = new jsPDF();
  const targetUrl = verificationUrl || `https://verify.school-erp.edu/payslip/${empId}`;

  // Header Banner
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 36, 'F');

  // Gold Accent Line
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 36, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(collegeName, 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`EMPLOYEE MONTHLY PAYSLIP — ${month.toUpperCase()}`, 14, 27);

  // QR Code Verification
  await drawQRCodeOnPDF(doc, targetUrl, 172, 44, 24, 'HR VERIFY QR');

  // Employee Meta Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 150, 36, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE INFORMATION:', 18, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Employee ID: ${empId}`, 18, 60);
  doc.text(`Employee Name: ${employeeName}`, 18, 68);
  doc.text(`Designation: ${designation}`, 90, 60);
  doc.text(`Department: ${department}`, 90, 68);

  // Earnings vs Deductions Table
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 88, 182, 10, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, 88, 182, 10, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Earnings Particulars', 18, 94);
  doc.text('Amount (INR)', 90, 94);
  doc.text('Deductions Particulars', 110, 94);
  doc.text('Amount (INR)', 170, 94);

  doc.setFont('helvetica', 'normal');
  doc.text('Basic Salary', 18, 106);
  doc.text(`Rs. ${Number(basicSalary).toLocaleString('en-IN')}`, 90, 106);

  doc.text('PF & ESI Deductions', 110, 106);
  doc.text(`Rs. ${Number(deductions).toLocaleString('en-IN')}`, 170, 106);

  doc.text('Allowances (HRA + Special)', 18, 116);
  doc.text(`Rs. ${Number(allowances).toLocaleString('en-IN')}`, 90, 116);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 126, 196, 126);

  // Net Payable
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET SALARY PAYABLE:', 110, 136);
  doc.setTextColor(22, 163, 74);
  doc.text(`Rs. ${Number(netPay).toLocaleString('en-IN')}`, 170, 136);

  // Footer Note
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 155, 196, 155);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('This is an official computer-generated payslip issued by HR & Accounts with QR verification.', 14, 162);

  doc.save(`Payslip_${empId}_${month.replace(/\s+/g, '_')}.pdf`);
  return doc;
};
