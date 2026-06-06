import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchProcessingComponent } from '../batch-processing/batch-processing';

describe('BatchProcessingComponent', () => {
  let component: BatchProcessingComponent;
  let fixture: ComponentFixture<BatchProcessingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchProcessingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchProcessingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('opens the create batch modal with a reset form', () => {
    component.batchForm.patchValue({
      batchName: 'Old batch',
      batchId: 'OLD-001',
      farmerName: 'Old Farmer',
      grossAmount: 1000,
      deductions: 100,
    });

    component.openModal();

    expect(component.isModalOpen).toBeTrue();
    expect(component.batchForm.get('batchName')?.value).toBeNull();
    expect(component.batchForm.get('netPayable')?.value).toBeNull();
  });

  it('recalculates net payable when gross amount or deductions change', () => {
    component.batchForm.patchValue({
      grossAmount: 500_000,
      deductions: 125_000,
    });

    expect(component.batchForm.get('netPayable')?.value).toBe(375_000);
  });

  it('prepends a pending batch and closes the modal on valid submit', () => {
    const initialCount = component.batches.length;
    component.openModal();
    component.batchForm.patchValue({
      batchName: 'Coffee Test Batch',
      batchId: 'BCH-TEST-001',
      farmerName: 'Test Farmer (F-00001)',
      grossAmount: 750_000,
      deductions: 50_000,
    });

    component.onSubmit();

    expect(component.batches.length).toBe(initialCount + 1);
    expect(component.batches[0]).toEqual(jasmine.objectContaining({
      id: 'BCH-TEST-001',
      batchName: 'Coffee Test Batch',
      farmerName: 'Test Farmer (F-00001)',
      grossAmount: 750_000,
      deductions: 50_000,
      netPayable: 700_000,
      status: 'pending',
    }));
    expect(component.isModalOpen).toBeFalse();
  });

  it('marks the form touched and does not add a row on invalid submit', () => {
    const initialCount = component.batches.length;

    component.onSubmit();

    expect(component.batches.length).toBe(initialCount);
    expect(component.batchForm.get('batchName')?.touched).toBeTrue();
  });
});
