import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ModalComponent } from './modal.component';

@Component({
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="Test Modal"
      [confirmDisabled]="confirmDisabled"
      (closed)="closedCount = closedCount + 1"
      (confirmed)="confirmedCount = confirmedCount + 1">
      <p body class="projected-body">Projected body</p>
      <div *ngIf="useCustomFooter" footer class="projected-footer">
        <button type="button">Custom action</button>
      </div>
    </app-modal>
  `,
})
class ModalHostComponent {
  isOpen = true;
  confirmDisabled = false;
  useCustomFooter = false;
  closedCount = 0;
  confirmedCount = 0;
}

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalHostComponent>;
  let host: ModalHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one dialog with projected body content', () => {
    const dialogs = fixture.debugElement.queryAll(By.css('.modal-container'));
    const body = fixture.debugElement.query(By.css('.projected-body'));

    expect(dialogs.length).toBe(1);
    expect(body.nativeElement.textContent).toContain('Projected body');
  });

  it('emits closed from the close button, backdrop, and Escape key', () => {
    fixture.debugElement.query(By.css('.modal-close')).nativeElement.click();
    fixture.debugElement.query(By.css('.modal-backdrop')).triggerEventHandler('click', {
      target: fixture.debugElement.query(By.css('.modal-backdrop')).nativeElement,
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(host.closedCount).toBe(3);
  });

  it('emits confirmed only when the built-in confirm button is enabled', () => {
    fixture.debugElement.query(By.css('.btn--confirm')).nativeElement.click();
    expect(host.confirmedCount).toBe(1);

    host.confirmDisabled = true;
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.btn--confirm')).nativeElement.click();

    expect(host.confirmedCount).toBe(1);
  });

  it('hides the built-in footer buttons when custom footer content is projected', fakeAsync(() => {
    host.useCustomFooter = true;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.projected-footer'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.btn--confirm'))).toBeFalsy();
  }));
});
