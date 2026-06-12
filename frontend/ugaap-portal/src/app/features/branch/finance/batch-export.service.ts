import { Injectable } from '@angular/core';
import { BatchFarmerRecord, BatchRecord } from './batch.model';

/** Column headers that appear in the exported file. */
const CSV_HEADERS = [
  'Batch ID',
  'Batch Name',
  'Season',
  'Farmer ID',
  'Farmer Name',
  'Phone',
  'Commodity',
  'Gross Amount (UGX)',
  'Input Credit Deduction (UGX)',
  'Net Payable (UGX)',
  'Status',
  'Payment Method',
  // Mobile Money columns
  'MM Provider',
  'MM Account Name',
  // Bank Account columns
  'Bank Name',
  'Account Number',
  'Account Holder Name',
  'Date Added',
];

@Injectable({ providedIn: 'root' })
export class BatchExportService {

  /**
   * Generates a UTF-8 BOM-prefixed CSV for the given batch + farmer list
   * and triggers a browser download.
   */
  exportBatchFarmers(batch: BatchRecord, farmers: BatchFarmerRecord[]): void {
    const csv = this.buildCsv(batch, farmers);
    const filename = `${batch.id}_farmers_${this.dateTag()}.csv`;
    this.triggerDownload(csv, filename);
  }

  private buildCsv(batch: BatchRecord, farmers: BatchFarmerRecord[]): string {
    const rows = farmers.map(f => {
      const isMM   = f.payment?.method === 'mobile_money';
      const isBank = f.payment?.method === 'bank_account';

      return [
        batch.id,
        batch.batchName,
        batch.season,
        f.farmerId,
        f.farmerName,
        f.phone,
        f.commodity,
        f.grossAmount,
        f.deductions,
        f.netPayable,
        f.status,
        f.payment?.method === 'mobile_money' ? 'Mobile Money'
          : f.payment?.method === 'bank_account' ? 'Bank Account'
          : '',
        // Mobile Money
        isMM && f.payment?.method === 'mobile_money' ? f.payment.provider        : '',
        isMM && f.payment?.method === 'mobile_money' ? f.payment.mobileMoneyName : '',
        // Bank Account
        isBank && f.payment?.method === 'bank_account' ? f.payment.bankName          : '',
        isBank && f.payment?.method === 'bank_account' ? f.payment.accountNumber     : '',
        isBank && f.payment?.method === 'bank_account' ? f.payment.accountHolderName : '',
        this.formatDate(f.addedAt),
      ];
    });

    const lines = [CSV_HEADERS, ...rows]
      .map(row => row.map(cell => this.escapeCell(String(cell))).join(','));

    // UTF-8 BOM (﻿) ensures Excel opens the file with correct encoding.
    return '﻿' + lines.join('\r\n');
  }

  /** Wraps a cell in quotes if it contains a comma, quote, or newline. */
  private escapeCell(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private dateTag(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private triggerDownload(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
