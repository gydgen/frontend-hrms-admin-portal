import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { LeaveBalanceListComponent } from './leave-balance-list.component';

describe('LeaveBalanceListComponent', () => {
  let component: LeaveBalanceListComponent;
  let fixture: ComponentFixture<LeaveBalanceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveBalanceListComponent],
      // Loads employees and leave balances via HttpClient — provideHttpClientTesting()
      // intercepts those requests instead of hitting the network. The template's *hasRole
      // directive pulls in AuthService, which injects @ngrx/store's Store — provideStore()
      // is required for that construction to succeed even though this test never dispatches.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveBalanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
