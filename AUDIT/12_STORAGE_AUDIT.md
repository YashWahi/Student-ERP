# Storage Audit — EduERP Pro

## Document Vault & Storage Verification
- **PDF Document Engine (`pdfService.js`)**: Generates client-side PDF documents (Fee Receipts, Admit Cards, Student ID Cards, Transcripts) dynamically using jsPDF and html2canvas.
- **Excel & Document Upload Engine (`excelParser.js`)**: Validates file types (`.xlsx`, `.csv`), parses headers, and normalizes student/lead records.
