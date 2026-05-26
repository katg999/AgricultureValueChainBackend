import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';

import { FarmerDeliveryComponent } from './farmer-delivery.component';
import { DeliveryService } from '../farmer-delivery.service';
import { DeliveryRecord, DeliveryRegistrationForm } from '../farmer-delivery.model';

describe('FarmerDeliveryComponent', () => {
  let component: FarmerDeliveryComponent;
  let fixture: ComponentFixture<FarmerDeliveryComponent>;
  let router: { navigate: jasmine.Spy };
  let deliveryService: {
    getById: jasmine.Spy;
    create: jasmine.Spy;
    update: jasmine.Spy;
  };

  const existingDelivery: DeliveryRecord = {
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
  };

  async function setup(path: string[], id?: string, foundDelivery: DeliveryRecord | undefined = existingDelivery): Promise<void> {
    router = { navigate: jasmine.createSpy('navigate') };
    deliveryService = {
      getById: jasmine.createSpy('getById').and.returnValue(foundDelivery),
      create: jasmine.createSpy('create').and.returnValue(existingDelivery),
      update: jasmine.createSpy('update').and.returnValue(existingDelivery),
    };

    await TestBed.configureTestingModule({
      imports: [FarmerDeliveryComponent],
      providers: [
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(id ? { id } : {}),
              url: path.map(segment => ({ path: segment })),
            },
          },
        },
        { provide: DeliveryService, useValue: deliveryService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setup(['farmer-delivery', 'create']);

    expect(component).toBeTruthy();
  });

  it('creates a delivery in create mode', async () => {
    await setup(['farmer-delivery', 'create']);
    const formValue: DeliveryRegistrationForm = {
      isActive: true,
      farmerName: 'Sarah Namuli',
      commodityCategory: 'beans',
      quantity: 100,
      unitOfMeasure: 'KG',
      estimatedValue: 300000,
      repaymentRule: 'deferred',
      notes: '',
    };

    component.deliveryForm.setValue(formValue);
    component.onSubmit();

    expect(deliveryService.create).toHaveBeenCalledWith(formValue);
    expect(router.navigate).toHaveBeenCalledWith(['/collections/delivery-list']);
  });

  it('loads existing data and updates a delivery in edit mode', async () => {
    await setup(['farmer-delivery', 'DEL-001', 'edit'], 'DEL-001');

    expect(component.mode).toBe('edit');
    expect(component.deliveryForm.value.farmerName).toBe('Amina Nakato');

    component.deliveryForm.patchValue({ farmerName: 'Amina Updated' });
    component.onSubmit();

    expect(deliveryService.update).toHaveBeenCalledWith(
      'DEL-001',
      jasmine.objectContaining({ farmerName: 'Amina Updated' })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/collections/delivery-list']);
  });

  it('disables the form and hides save action in view mode', async () => {
    await setup(['farmer-delivery', 'DEL-001'], 'DEL-001');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.mode).toBe('view');
    expect(component.deliveryForm.disabled).toBeTrue();
    expect(compiled.textContent).toContain('Edit delivery');
    expect(compiled.textContent).not.toContain('Save delivery');
  });

  it('navigates from view mode to edit mode', async () => {
    await setup(['farmer-delivery', 'DEL-001'], 'DEL-001');

    component.onEdit();

    expect(router.navigate).toHaveBeenCalledWith(['/collections/farmer-delivery', 'DEL-001', 'edit']);
  });

  it('redirects to the list when the route ID is invalid', async () => {
    await setup(['farmer-delivery', 'DEL-999'], 'DEL-999', undefined);

    expect(router.navigate).toHaveBeenCalledWith(['/collections/delivery-list']);
  });
});
