import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchForm } from './batch-form';

describe('BatchForm', () => {
  let component: BatchForm;
  let fixture: ComponentFixture<BatchForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchForm],
    }).compileComponents();

    fixture = TestBed.createComponent(BatchForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
