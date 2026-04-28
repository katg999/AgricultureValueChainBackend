import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionExpired } from './session-expired';

describe('SessionExpired', () => {
  let component: SessionExpired;
  let fixture: ComponentFixture<SessionExpired>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionExpired],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionExpired);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
