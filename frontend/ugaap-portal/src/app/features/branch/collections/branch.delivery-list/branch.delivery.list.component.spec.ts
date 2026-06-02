import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';

import { BranchDeliveriesComponent } from './branch.delivery.list.component';
import { BranchDeliveryService } from '../branch.delivery.service';

describe('BranchDeliveriesComponent', () => {
  let component: BranchDeliveriesComponent;
  let fixture: ComponentFixture<BranchDeliveriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchDeliveriesComponent],
      providers: [
        BranchDeliveryService,
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchDeliveriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads branch deliveries', () => {
    expect(component.deliveries.length).toBeGreaterThan(0);
    expect(component.filteredDeliveries.length).toBe(component.deliveries.length);
  });
});
