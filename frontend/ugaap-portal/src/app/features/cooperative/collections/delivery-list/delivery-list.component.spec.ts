// ─────────────────────────────────────────────────────────────────────────────
// delivery-list.component.spec.ts
//
// Unit tests for DeliveryListComponent.
// DeliveryService is mocked — list() now returns an Observable<DeliveryRecord[]>
// instead of the old BehaviorSubject-backed getDeliveriesStream().
// ─────────────────────────────────────────────────────────────────────────────

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router }       from '@angular/router';
import { of }           from 'rxjs';                  // Replaces BehaviorSubject for one-shot HTTP mock

import { DeliveryListComponent } from './delivery-list.component';
import { DeliveryService }       from '../farmer-delivery.service';
import { DeliveryRecord }        from '../farmer-delivery.model';

describe('DeliveryListComponent', () => {
  let component: DeliveryListComponent;
  let fixture:   ComponentFixture<DeliveryListComponent>;
  let router:    { navigate: jasmine.Spy };

  // ── Seed data ─────────────────────────────────────────────────────────────

  const deliveries: DeliveryRecord[] = [
    {
      id: 'DEL-001', isActive: true,
      farmerName: 'Amina Nakato', commodityCategory: 'maize',
      quantity: 250, unitOfMeasure: 'KG', estimatedValue: 450000,
      repaymentRule: 'standard', notes: 'High-quality grade A maize.',
      dateDelivered: '20 May 2026', status: 'Processed',
    },
    {
      id: 'DEL-002', isActive: true,
      farmerName: 'Peter Okello', commodityCategory: 'coffee',
      quantity: 150, unitOfMeasure: 'KG', estimatedValue: 1200000,
      repaymentRule: 'accelerated', notes: 'Arabica parchment coffee.',
      dateDelivered: '21 May 2026', status: 'Pending',
    },
  ];

  // ── Test setup ────────────────────────────────────────────────────────────

  beforeEach(async () => {
    router = { navigate: jasmine.createSpy('navigate') };

    await TestBed.configureTestingModule({
      imports: [DeliveryListComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: DeliveryService,
          useValue: {
            // list() now returns an Observable (mirrors HttpClient behaviour)
            list: () => of(deliveries),
          },
        },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(DeliveryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders all records from list()', async () => {
    await fixture.whenStable();
    expect(component.filteredDeliveries.length).toBe(2);
    expect(component.filteredDeliveries[0].farmerName).toBe('Amina Nakato');
  });

  it('filters by farmer name', async () => {
    component.searchControl.setValue('amina');
    await fixture.whenStable();
    expect(component.filteredDeliveries.length).toBe(1);
    expect(component.filteredDeliveries[0].id).toBe('DEL-001');
  });

  it('filters by delivery ID', async () => {
    component.searchControl.setValue('DEL-002');
    await fixture.whenStable();
    expect(component.filteredDeliveries.length).toBe(1);
    expect(component.filteredDeliveries[0].farmerName).toBe('Peter Okello');
  });

  it('filters by commodity category', async () => {
    component.categoryFilter.setValue('coffee');
    await fixture.whenStable();
    expect(component.filteredDeliveries.length).toBe(1);
    expect(component.filteredDeliveries[0].commodityCategory).toBe('coffee');
  });

  it('navigates correctly from list action buttons', () => {
    component.navigateToCreate();
    component.onView('DEL-001');
    component.onEdit('DEL-002');

    expect(router.navigate).toHaveBeenCalledWith(['/collections/farmer-delivery/create']);
    expect(router.navigate).toHaveBeenCalledWith(['/collections/farmer-delivery', 'DEL-001']);
    expect(router.navigate).toHaveBeenCalledWith(['/collections/farmer-delivery', 'DEL-002', 'edit']);
  });
});
