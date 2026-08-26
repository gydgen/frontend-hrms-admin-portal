import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LeaveBalanceEditionComponent } from './leave-balance-edition.component';

describe('LeaveBalanceEditionComponent', () => {
  let component: LeaveBalanceEditionComponent;
  let fixture: ComponentFixture<LeaveBalanceEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveBalanceEditionComponent],
      // Injects HttpClient (via LeaveBalanceService) — provideHttpClientTesting()
      // intercepts any request instead of hitting the network or throwing a
      // NullInjectorError during `fixture.detectChanges()`.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveBalanceEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
