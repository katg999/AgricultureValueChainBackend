import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetOtp } from './reset-otp';

describe('ResetOtp', () => {
  let component: ResetOtp;
  let fixture: ComponentFixture<ResetOtp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetOtp],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetOtp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
