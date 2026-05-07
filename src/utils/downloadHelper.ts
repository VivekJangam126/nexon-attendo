/**
 * Download Helper
 * Handles file downloads across browser and Android WebView.
 *
 * Uses anchor tag with data URI — works universally in both
 * desktop browsers and Android WebView without popup blockers.
 */
import * as XLSX from 'xlsx';

/**
 * Trigger a file download using an anchor tag.
 * Works in desktop Chrome/Firefox AND Android WebView.
 */
function triggerDownload(dataUri: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = dataUri;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Small delay before removing to ensure click registers
  setTimeout(() => document.body.removeChild(a), 200);
}

/**
 * Save a jsPDF document
 */
export function savePDF(doc: any, fileName: string): void {
  try {
    // Get PDF as blob URL first (standard approach)
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    triggerDownload(url, fileName);
    // Revoke after download starts
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch {
    // Fallback: use data URI directly
    const dataUri = doc.output('datauristring');
    triggerDownload(dataUri, fileName);
  }
}

/**
 * Save an XLSX workbook
 */
export function saveExcel(wb: XLSX.WorkBook, fileName: string): void {
  try {
    // Write as array buffer then create blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, fileName);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch {
    // Fallback: base64 data URI
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
    triggerDownload(dataUri, fileName);
  }
}
