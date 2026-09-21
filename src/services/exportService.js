// src/services/exportService.js

/**
 * Export data array to CSV file download
 */
export const exportToCSV = (filename, rows, columns) => {
  if (!rows || !rows.length) {
    alert('No data available to export');
    return;
  }

  const headers = columns.map(c => c.label || c.key);
  const keys = columns.map(c => c.key);

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      keys
        .map(k => {
          let val = row[k];
          if (val === null || val === undefined) val = '';
          val = String(val).replace(/"/g, '""'); // Escape double quotes
          return `"${val}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
