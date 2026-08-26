import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { LeaveTypeListComponent } from './leave-type-list.component';

describe('LeaveTypeListComponent', () => {
  let component: LeaveTypeListComponent;
  let fixture: ComponentFixture<LeaveTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveTypeListComponent],
      // LeaveTypeListComponent extends PaginatedTableComponent, which injects HttpClient
      // (via LeaveTypeService -> GenericCollectionService) and fires a request on
      // construction — provideHttpClientTesting() intercepts it instead of hitting the
      // network. The template's *hasRole directive pulls in AuthService, which injects
      // @ngrx/store's Store — provideStore() is required for that construction to succeed
      // even though this test never dispatches anything.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
