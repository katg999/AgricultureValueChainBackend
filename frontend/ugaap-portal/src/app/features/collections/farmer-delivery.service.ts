import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { DeliveryRecord, DeliveryRegistrationForm } from './farmer-delivery.model';

export type { DeliveryRecord, DeliveryRegistrationForm } from './farmer-delivery.model';

const DELIVERY_STORAGE_KEY = 'ugaap.collections.deliveries';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private readonly seedDeliveries: DeliveryRecord[] = [
    {
      id: 'DEL-001',
      isActive: true,
      farmerName: 'Amina Nakato',
      commodityCategory: 'maize', 
      quantity: 250,
      unitOfMeasure: 'KG',
      estimatedValue: 450000,
      repaymentRule: 'standard',
      notes: 'High-quality grade A maize.',
      dateDelivered: '20 May 2026',
      status: 'Processed',
    },
    {
      id: 'DEL-002',
      isActive: true,
      farmerName: 'Peter Okello',
      commodityCategory: 'coffee', 
      quantity: 150,
      unitOfMeasure: 'KG',
      estimatedValue: 1200000,
      repaymentRule: 'accelerated',
      notes: 'Arabica parchment coffee.',
      dateDelivered: '21 May 2026',
      status: 'Pending',
    },
  ];

  private deliveries: DeliveryRecord[] = this.loadDeliveries();
  private deliveries$ = new BehaviorSubject<DeliveryRecord[]>(this.getClonedDeliveries());

  getDeliveriesStream(): Observable<DeliveryRecord[]> {
    return this.deliveries$.asObservable();
  }

  list(): DeliveryRecord[] {
    return this.getClonedDeliveries();
  }

  getById(id: string): DeliveryRecord | undefined {
    const delivery = this.deliveries.find(item => item.id === id);
    return delivery ? { ...delivery } : undefined;
  }

  create(form: DeliveryRegistrationForm): DeliveryRecord {
    const id = this.createNextId();
    
    const newDelivery: DeliveryRecord = {
      ...form,
      id,
      dateDelivered: this.todayLabel(),
      status: 'Pending',
    };

    this.deliveries = [...this.deliveries, newDelivery];
    this.syncDeliveries();
    
    return { ...newDelivery };
  }

  update(id: string, form: DeliveryRegistrationForm): DeliveryRecord | undefined {
    const existingDelivery = this.deliveries.find(delivery => delivery.id === id);

    if (!existingDelivery) {
      return undefined;
    }

    const updatedDelivery: DeliveryRecord = {
      ...existingDelivery,
      ...form,
      id: existingDelivery.id,
      dateDelivered: existingDelivery.dateDelivered,
      status: existingDelivery.status,
    };

    this.deliveries = this.deliveries.map(delivery =>
      delivery.id === id ? updatedDelivery : delivery
    );
    this.syncDeliveries();

    return { ...updatedDelivery };
  }

  private createNextId(): string {
    const nextNumber = this.deliveries.reduce((highest, delivery) => {
      const match = /^DEL-(\d+)$/.exec(delivery.id);
      const numericId = match ? Number(match[1]) : 0;
      return Math.max(highest, numericId);
    }, 0) + 1;

    return `DEL-${String(nextNumber).padStart(3, '0')}`;
  }

  private syncDeliveries(): void {
    this.saveDeliveries();
    this.deliveries$.next(this.getClonedDeliveries());
  }

  private loadDeliveries(): DeliveryRecord[] {
    if (!this.canUseLocalStorage()) {
      return this.cloneRecords(this.seedDeliveries);
    }

    const storedDeliveries = localStorage.getItem(DELIVERY_STORAGE_KEY);

    if (!storedDeliveries) {
      return this.cloneRecords(this.seedDeliveries);
    }

    try {
      const parsedDeliveries = JSON.parse(storedDeliveries) as unknown;

      if (!Array.isArray(parsedDeliveries)) {
        return this.cloneRecords(this.seedDeliveries);
      }

      return parsedDeliveries
        .filter((delivery): delivery is DeliveryRecord => this.isDeliveryRecord(delivery))
        .map(delivery => ({ ...delivery }));
    } catch {
      return this.cloneRecords(this.seedDeliveries);
    }
  }

  private saveDeliveries(): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(this.deliveries));
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private isDeliveryRecord(delivery: unknown): delivery is DeliveryRecord {
    if (!delivery || typeof delivery !== 'object') {
      return false;
    }

    const candidate = delivery as Partial<DeliveryRecord>;

    return typeof candidate.id === 'string'
      && typeof candidate.farmerName === 'string'
      && typeof candidate.commodityCategory === 'string'
      && typeof candidate.quantity === 'number'
      && typeof candidate.unitOfMeasure === 'string'
      && typeof candidate.estimatedValue === 'number'
      && typeof candidate.repaymentRule === 'string'
      && typeof candidate.dateDelivered === 'string'
      && typeof candidate.status === 'string';
  }

  private todayLabel(): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }

  private getClonedDeliveries(): DeliveryRecord[] {
    return this.cloneRecords(this.deliveries);
  }

  private cloneRecords(deliveries: DeliveryRecord[]): DeliveryRecord[] {
    return deliveries.map(delivery => ({ ...delivery }));
  }
}
