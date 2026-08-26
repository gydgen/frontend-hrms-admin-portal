import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { EmployeeListComponent } from './employee-list.component';

describe('EmployeeListComponent', () => {
  let component: EmployeeListComponent;
  let fixture: ComponentFixture<EmployeeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeListComponent],
      // EmployeeListComponent extends PaginatedTableComponent and also loads a department
      // list for the departmentName() lookup — both go through HttpClient, so
      // provideHttpClientTesting() intercepts those requests instead of hitting the
      // network. The template's *hasRole directive pulls in AuthService, which injects
      // @ngrx/store's Store — provideStore() is required for that construction to succeed
      // even though this test never dispatches anything.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
