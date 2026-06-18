// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { ActivatedRoute, convertToParamMap } from '@angular/router';
// import { vi } from 'vitest';

// import { FarmerDeliveriesComponent } from './farmer-delivery.component';
// import { BranchDeliveryService } from '../branch.delivery.service';
// import { FarmerDeliveryService } from '../farmer.delivery.service';

// describe('FarmerDeliveriesComponent', () => {
//   let component: FarmerDeliveriesComponent;
//   let fixture: ComponentFixture<FarmerDeliveriesComponent>;
//   let farmerService: FarmerDeliveryService;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [FarmerDeliveriesComponent],
//       providers: [
//         BranchDeliveryService,
//         FarmerDeliveryService,
//         {
//           provide: ActivatedRoute,
//           useValue: { snapshot: { paramMap: convertToParamMap({}) } },
//         },
//       ],
//     }).compileComponents();

//     fixture = TestBed.createComponent(FarmerDeliveriesComponent);
//     component = fixture.componentInstance;
//     farmerService = TestBed.inject(FarmerDeliveryService);
//     fixture.detectChanges();
//   });

//   afterEach(() => {
//     TestBed.resetTestingModule();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   it('loads branches and farmer deliveries', () => {
//     expect(component.branches.length).toBeGreaterThan(0);
//     expect(component.allFarmers.length).toBeGreaterThan(0);
//     expect(component.filteredFarmers.length).toBe(component.allFarmers.length);
//   });

//   it('creates a farmer delivery from the modal form', () => {
//     const addSpy = vi.spyOn(farmerService, 'add');

//     component.openNew();
//     component.form.setValue({
//       branchDeliveryId: 'BD-001',
//       farmerId: 'UG-F-00999',
//       farmerName: 'Sarah Namuli',
//       phone: '0772000999',
//       commodity: 'Maize',
//       volume: 100,
//       estimatedValue: 300000,
//       notes: '',
//       status: 'Pending',
//     });

//     component.submit();

//     expect(addSpy).toHaveBeenCalledWith({
//       branchDeliveryId: 'BD-001',
//       farmerId: 'UG-F-00999',
//       farmerName: 'Sarah Namuli',
//       phone: '0772000999',
//       commodity: 'Maize',
//       volume: 100,
//       estimatedValue: 300000,
//       notes: '',
//       status: 'Pending',
//     });
//     expect(component.showModal).toBe(false);
//   });
// });
