import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockDisbursedComponent } from './stock-disbursed.component';

describe('StockDisbursedComponent', () => {
  let component: StockDisbursedComponent;
  let fixture: ComponentFixture<StockDisbursedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockDisbursedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockDisbursedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
