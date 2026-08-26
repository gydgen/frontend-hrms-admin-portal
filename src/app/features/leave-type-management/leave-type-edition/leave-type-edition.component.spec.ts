import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { LeaveTypeEditionComponent } from './leave-type-edition.component';

describe('LeaveTypeEditionComponent', () => {
  let component: LeaveTypeEditionComponent;
  let fixture: ComponentFixture<LeaveTypeEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveTypeEditionComponent],
      // LeaveTypeEditionComponent extends EditingFormComponent, which injects HttpClient
      // (via LeaveTypeService -> GenericCollectionService) — provideHttpClientTesting()
      // intercepts any request instead of hitting the network or throwing a
      // NullInjectorError during `fixture.detectChanges()`.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeaveTypeEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
