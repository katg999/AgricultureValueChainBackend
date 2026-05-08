import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  SetNewPasswordComponent } from './set-new-password.component';

describe('SetNewPassword', () => {
  let component: SetNewPasswordComponent;
  let fixture: ComponentFixture<SetNewPasswordComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetNewPasswordComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SetNewPasswordComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
