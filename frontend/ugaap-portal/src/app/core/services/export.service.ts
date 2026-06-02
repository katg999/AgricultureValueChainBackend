import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {

  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    if (!data.length) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Auto-fit column widths
    const keys = Object.keys(data[0]);
    ws['!cols'] = keys.map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length)) + 2
    }));

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  exportToPDF(
    data: any[],
    columns: ExportColumn[],
    fileName: string,
    title: string,
    subtitle: string = '',
    orientation: 'portrait' | 'landscape' = 'landscape'
  ): void {
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // Title block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(32, 11, 38);
    doc.text(`UGAAP - ${title}`, 14, 20);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.text(subtitle, 14, 29);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text(`Generated: ${today}`, 14, subtitle ? 36 : 28);

    // Table
    autoTable(doc, {
      head: [columns.map(c => c.label)],
      body: data.map(row => columns.map(c => String(row[c.key] ?? ''))),
      startY: subtitle ? 42 : 34,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4 },
      headStyles: {
        fillColor: [32, 11, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didDrawPage: (hookData) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          `UGAAP - Uganda Agrarian Portal | Page ${hookData.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
      }
    });

    doc.save(`${fileName}.pdf`);
  }

  exportToCSV(data: any[], fileName: string): void {
    if (!data.length) return;

    const headers = Object.keys(data[0]);
    const escape = (val: any): string => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => escape(row[h])).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  printReport(elementId: string): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>UGAAP Report</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      h1 { font-size: 18px; color: #200B26; margin-bottom: 4px; }
      p  { font-size: 12px; color: #6B7280; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { background: #200B26; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
      td { padding: 8px 10px; border-bottom: 1px solid #E5E7EB; }
      tr:nth-child(even) td { background: #F9FAFB; }
      @media print { body { margin: 0; } }
    </style>
  </head>
  <body>${el.innerHTML}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  }
}
