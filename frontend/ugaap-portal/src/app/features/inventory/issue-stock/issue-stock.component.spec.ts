import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { IssueStockComponent } from './issue-stock.component';

describe('IssueStockComponent', () => {
  let component: IssueStockComponent;
  let fixture: ComponentFixture<IssueStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueStockComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(IssueStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
