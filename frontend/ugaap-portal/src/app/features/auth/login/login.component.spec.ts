import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginComponent } from './login.componet';
// Note: This test is a placeholder and should be expanded with actual test cases for the LoginComponent.
describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
