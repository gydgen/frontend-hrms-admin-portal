import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { DepartmentListComponent } from './department-list.component';

describe('DepartmentListComponent', () => {
  let component: DepartmentListComponent;
  let fixture: ComponentFixture<DepartmentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentListComponent],
      // DepartmentListComponent extends PaginatedTableComponent, which injects HttpClient
      // (via DepartmentService -> GenericCollectionService) and fires a request on
      // construction — provideHttpClientTesting() intercepts it instead of hitting the
      // network, so `fixture.detectChanges()` doesn't throw a NullInjectorError or make a
      // real HTTP call in the test run. The template's *hasRole directive pulls in
      // AuthService, which injects @ngrx/store's Store — provideStore() is required for
      // that construction to succeed even though this test never dispatches anything.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
