import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { FarmerApprovalComponent } from './farmer-approval.component';

describe('FarmerApprovalComponent', () => {
  let component: FarmerApprovalComponent;
  let fixture: ComponentFixture<FarmerApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerApprovalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
