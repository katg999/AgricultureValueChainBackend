import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountLocked } from './account-locked';

describe('AccountLocked', () => {
  let component: AccountLocked;
  let fixture: ComponentFixture<AccountLocked>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLocked],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountLocked);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
