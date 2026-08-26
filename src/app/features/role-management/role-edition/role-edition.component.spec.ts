import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';

import { RoleEditionComponent } from './role-edition.component';

describe('RoleEditionComponent', () => {
  let component: RoleEditionComponent;
  let fixture: ComponentFixture<RoleEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleEditionComponent],
      // RoleEditionComponent extends EditingFormComponent, which injects HttpClient (via
      // RoleService -> GenericCollectionService) — provideHttpClientTesting() intercepts
      // any request. The template's *hasRole directive (gating the permission matrix)
      // pulls in AuthService, which injects @ngrx/store's Store — provideStore() is
      // required for that construction to succeed even though this test never dispatches.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
