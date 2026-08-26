import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { EmployeeEditionComponent } from './employee-edition.component';

describe('EmployeeEditionComponent', () => {
  let component: EmployeeEditionComponent;
  let fixture: ComponentFixture<EmployeeEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeEditionComponent],
      // EmployeeEditionComponent extends EditingFormComponent and loads
      // department/job-title/employee lists for its selects — all go through HttpClient.
      // The template's *hasRole directive (gating the sensitive-fields fieldset) pulls in
      // AuthService, which injects @ngrx/store's Store — provideStore() is required for
      // that construction to succeed even though this test never dispatches anything.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
