import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { BatchFlowStatusComponent, BatchFlowStatus } from './batch-flow-status.component';
import { StepperComponent } from '../stepper/stepper.component';
import { BadgeComponent } from '../badge/badge';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { AlertComponent } from '../alert/alert.component';

describe('BatchFlowStatusComponent', () => {
  let fixture: ComponentFixture<BatchFlowStatusComponent>;
  let component: BatchFlowStatusComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchFlowStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchFlowStatusComponent);
    component = fixture.componentInstance;
  });

  it('maps each non-Rejected status to the correct stepper index', () => {
    const expected: Array<[BatchFlowStatus, number]> = [
      ['Draft', 0],
      ['Pending Approval', 1],
      ['Approved', 2],
      ['Disbursed', 3],
    ];

    for (const [status, index] of expected) {
      component.status = status;
      fixture.detectChanges();

      expect(component.currentStep).toBe(index);
      const stepper = fixture.debugElement.query(By.directive(StepperComponent));
      expect(stepper.componentInstance.currentStep).toBe(index);
    }
  });

  it('suppresses the stepper and shows a failed badge when Rejected', () => {
    component.status = 'Rejected';
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(StepperComponent))).toBeNull();
    const badge = fixture.debugElement.query(By.directive(BadgeComponent));
    expect(badge.componentInstance.variant).toBe('failed');
  });

  it('hides the progress bar for Draft, Pending Approval, and Rejected', () => {
    for (const status of ['Draft', 'Pending Approval', 'Rejected'] as const) {
      component.status = status;
      component.totalFarmers = 10;
      component.settledCount = 3;
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.directive(ProgressBarComponent))).toBeNull();
    }
  });

  it('shows the progress bar once Approved or Disbursed, with the correct percentage', () => {
    for (const status of ['Approved', 'Disbursed'] as const) {
      component.status = status;
      component.totalFarmers = 10;
      component.settledCount = 3;
      fixture.detectChanges();

      const bar = fixture.debugElement.query(By.directive(ProgressBarComponent));
      expect(bar).toBeTruthy();
      expect(bar.componentInstance.percentage).toBe(30);
    }
  });

  it('sets progress bar variant to warning when there are failures', () => {
    component.status = 'Approved';
    component.totalFarmers = 10;
    component.settledCount = 3;
    component.hasFailures = true;
    fixture.detectChanges();

    const bar = fixture.debugElement.query(By.directive(ProgressBarComponent));
    expect(bar.componentInstance.variant).toBe('warning');
  });

  it('sets progress bar variant to success at 100% with no failures', () => {
    component.status = 'Disbursed';
    component.totalFarmers = 10;
    component.settledCount = 10;
    component.hasFailures = false;
    fixture.detectChanges();

    const bar = fixture.debugElement.query(By.directive(ProgressBarComponent));
    expect(bar.componentInstance.variant).toBe('success');
  });

  it('sets progress bar variant to info when in progress with no failures', () => {
    component.status = 'Approved';
    component.totalFarmers = 10;
    component.settledCount = 3;
    component.hasFailures = false;
    fixture.detectChanges();

    const bar = fixture.debugElement.query(By.directive(ProgressBarComponent));
    expect(bar.componentInstance.variant).toBe('info');
  });

  it('renders the failure alert with the exact settled/total counts', () => {
    component.status = 'Approved';
    component.totalFarmers = 12;
    component.settledCount = 9;
    component.hasFailures = true;
    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.directive(AlertComponent));
    expect(alert.componentInstance.message).toBe('9 of 12 farmers paid — some failed, retry below.');
  });

  it('does not render the failure alert when there are no failures', () => {
    component.status = 'Approved';
    component.hasFailures = false;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(AlertComponent))).toBeNull();
  });
});
