import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpVerifyComponent } from './otp-verify.component';

describe('OtpVerify', () => {
  let component: OtpVerifyComponent;
  let fixture: ComponentFixture<OtpVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpVerifyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OtpVerifyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
