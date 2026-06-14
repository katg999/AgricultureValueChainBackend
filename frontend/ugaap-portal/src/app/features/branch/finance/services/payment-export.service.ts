// PaymentExportService builds the bank bulk-payment file for a given batch.
// It maps our internal data model to the exact column structure the bank expects,
// then hands the rows to ExportService which handles the CSV download.
//
// The debit-side constants (cooperative's own bank account) are hardcoded here
// because they don't change per-transaction. In production they'd come from the
// cooperative's profile via TenantService or a settings API.

import { inject, Injectable } from '@angular/core';
import { ExportService } from '../../../../../core/services/export.service';
import { PaymentBatchService } from './payment-batch.service';
import { FarmerRecord, PaymentBatch, PaymentMethod } from '../models/batch.models';

// ── Cooperative-level debit constants ─────────────────────────────────────────
// These are the same for every row in the file — they identify who is sending the money.
const DEBIT_CUSTOMER_ID     = 'COOP-UG-001';
const DEBIT_ACCOUNT         = '9876543210';
const TRANSFER_CURRENCY     = 'UGX';
const BENEFICIARY_TYPE      = '01';   // 01 = Individual in Ugandan bank bulk payment specs
const PURPOSE_OF_PAYMENT    = 'SALA'; // SALA = Salary/wages (covers agricultural payments)

@Injectable({ providedIn: 'root' })
export class PaymentExportService {
  private readonly exportSvc  = inject(ExportService);
  private readonly batchSvc   = inject(PaymentBatchService);

  // Entry point — called from the batch list kebab menu.
  // Fetches the eligible farmers, builds one row per farmer, and triggers the download.
  exportBatchPaymentFile(batch: PaymentBatch): void {
    const farmers = this.batchSvc.getFarmersForBatch(batch.id);
    if (!farmers.length) return;

    const rows = farmers.map(f => this.buildRow(batch, f));

    // File name: "Payment_BATCH-001_Season_A_2024.csv" — safe for all OS file systems
    const safeSeason = batch.season.replace(/\s+/g, '_');
    this.exportSvc.exportToCSV(rows, `Payment_${batch.id}_${safeSeason}`);
  }

  // Builds one row object per farmer.
  // Object key = exact column header the bank file requires.
  // Object value = the data for that farmer/batch.
  private buildRow(batch: PaymentBatch, farmer: FarmerRecord): Record<string, string | number> {
    return {
      'Debit Customer ID':        DEBIT_CUSTOMER_ID,
      'Debit Account':            DEBIT_ACCOUNT,
      'Payment Amount':           farmer.netPayable,
      'Transfer Currency':        TRANSFER_CURRENCY,
      // Bank files usually want DD/MM/YYYY — our dates are stored as YYYY-MM-DD
      'Effective Date':           this.formatDate(batch.closingDate),
      'Beneficiary Type':         BENEFICIARY_TYPE,
      'Beneficiary Name':         farmer.fullName,
      'Beneficiary Account':      farmer.bankAccount,
      // MOB / EFT / CASH — maps our internal PaymentMethod to the bank's type code
      'Payment Type':             this.mapPaymentType(farmer.paymentMethod),
      'Bank Code':                farmer.bankCode,
      'Beneficiary Email ID':     farmer.email ?? '',
      // Description fields give the bank and the farmer context about what the payment is for
      'Payment Description 1':    batch.batchName,
      'Payment Description 2':    batch.season,
      'Payment Description 3':    farmer.commodity,
      'Payment Description 4':    '',
      'Debit Narrative':          batch.batchName,
      'Credit Narrative':         `Payment - ${farmer.commodity} delivery`,
      'Purpose of Payment Code':  PURPOSE_OF_PAYMENT,
      'Deal Reference Number':    batch.id,
      'Beneficiary Address 1':    farmer.address ?? '',
      'Beneficiary Address 2':    '',
      'Beneficiary Address 3':    '',
    };
  }

  // Converts YYYY-MM-DD (how we store dates) → DD/MM/YYYY (what the bank file expects)
  private formatDate(isoDate: string): string {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  // Record<PaymentMethod, string> = TypeScript enforces that every PaymentMethod
  // has a matching bank code — if we add a new PaymentMethod and forget to add it here,
  // TypeScript will error at compile time, not silently at runtime.
  private mapPaymentType(method: PaymentMethod): string {
    const map: Record<PaymentMethod, string> = {
      'Mobile Money':  'MOB',
      'Bank Transfer': 'EFT',
      'Cash':          'CASH',
    };
    return map[method];
  }
}
