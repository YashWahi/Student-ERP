// src/utils/excelParser.js
import * as XLSX from 'xlsx';

/**
 * Parses an Excel (.xlsx, .xls) or CSV (.csv) file into an array of objects.
 * Automatically maps common column header variations to target field keys.
 */
export const parseExcelOrCSV = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const reader = new FileReader();
    const isCSV = file.name.endsWith('.csv');

    if (isCSV) {
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
          if (lines.length === 0) return resolve([]);
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
          const rows = [];

          for (let i = 1; i < lines.length; i++) {
            // Regex to handle CSV lines with quotes
            const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
            if (values.length === 0) continue;
            
            const rowObj = {};
            headers.forEach((header, idx) => {
              const val = values[idx] ? values[idx].trim().replace(/^["']|["']$/g, '') : '';
              rowObj[header] = val;
            });
            rows.push(rowObj);
          }
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    }
  });
};

/**
 * Normalizes CRM lead fields from raw imported row objects.
 */
export const normalizeCRMLeads = (rawRows) => {
  return rawRows.map((row, idx) => {
    const keys = Object.keys(row);
    const findKey = (candidates) => {
      const match = keys.find(k => candidates.some(c => k.toLowerCase().includes(c)));
      return match ? row[match] : '';
    };

    const name = findKey(['student', 'applicant', 'name']) || row.name || `Applicant ${idx + 1}`;
    const parentName = findKey(['parent', 'guardian']) || row.parentName || 'N/A';
    const phone = findKey(['phone', 'mobile', 'contact']) || row.phone || '+91 98765 00000';
    const targetClass = findKey(['class', 'grade']) || row.class || 'Class 10-A';
    const source = findKey(['source', 'channel']) || row.source || 'Bulk Import';
    const counsellor = findKey(['counsellor', 'agent']) || row.counsellor || 'Sunita Mehra';
    const notes = findKey(['note', 'remark', 'requirement']) || row.notes || 'Imported via Excel';
    const followUpDate = findKey(['date', 'followup', 'call']) || row.followUpDate || new Date().toISOString().split('T')[0];
    const status = findKey(['status', 'stage']) || row.status || 'New';

    return {
      id: `lead_imp_${Date.now()}_${idx}`,
      name: String(name).trim(),
      parentName: String(parentName).trim(),
      phone: String(phone).trim(),
      class: String(targetClass).trim(),
      source: String(source).trim(),
      counsellor: String(counsellor).trim(),
      notes: String(notes).trim(),
      followUpDate: String(followUpDate).trim(),
      status: ['New', 'Contacted', 'Follow-up', 'Admitted', 'Lost'].includes(status) ? status : 'New',
      callLogs: [
        { date: new Date().toISOString().split('T')[0], note: 'Bulk imported into CRM system' }
      ]
    };
  });
};

/**
 * Normalizes Student roster fields from raw imported row objects.
 */
export const normalizeStudents = (rawRows) => {
  return rawRows.map((row, idx) => {
    const keys = Object.keys(row);
    const findKey = (candidates) => {
      const match = keys.find(k => candidates.some(c => k.toLowerCase().includes(c)));
      return match ? row[match] : '';
    };

    const name = findKey(['student name', 'name', 'full name']) || row.name || `Student ${idx + 1}`;
    const rollNo = findKey(['roll', 'registration', 'student id']) || row.rollNo || `GV-2026-${String(idx + 10).padStart(3, '0')}`;
    const className = findKey(['class', 'section', 'grade']) || row.class || '10-A';
    const parentName = findKey(['parent', 'father', 'mother', 'guardian']) || row.parentName || 'Parent';
    const phone = findKey(['phone', 'mobile', 'contact']) || row.phone || '+91 98765 00000';
    const category = (findKey(['category', 'quota', 'caste']) || row.category || 'GEN').toUpperCase();
    const dob = findKey(['dob', 'birth', 'date of birth']) || row.dob || '2012-05-15';
    const bloodGroup = findKey(['blood', 'group']) || row.bloodGroup || 'O+';
    const status = findKey(['status', 'state']) || row.status || 'Active';

    const validCategory = ['GEN', 'OBC', 'SC', 'ST'].includes(category) ? category : 'GEN';
    const validStatus = ['Active', 'Inactive', 'Alumni'].includes(status) ? status : 'Active';

    return {
      id: `st_imp_${Date.now()}_${idx}`,
      rollNo: String(rollNo).trim(),
      admissionNo: `ADM-2026-${String(idx + 100).padStart(3, '0')}`,
      name: String(name).trim(),
      class: String(className).trim(),
      parentName: String(parentName).trim(),
      phone: String(phone).trim(),
      parentEmail: `${String(parentName).toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      category: validCategory,
      attendance: '95%',
      feeStatus: 'Paid',
      status: validStatus,
      dob: String(dob).trim(),
      bloodGroup: String(bloodGroup).trim(),
      documents: [
        { id: 'doc_1', name: 'Aadhaar Card Copy', status: 'Verified', fileName: 'aadhaar_card.pdf', date: '2026-08-10' },
        { id: 'doc_2', name: 'Birth Certificate', status: 'Verified', fileName: 'birth_certificate.pdf', date: '2026-08-10' },
        { id: 'doc_3', name: 'Transfer Certificate (TC)', status: 'Pending Verification', fileName: 'tc_document.pdf', date: '2026-08-10' },
      ]
    };
  });
};
