import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { DepartmentEditionComponent } from './department-edition.component';

describe('DepartmentEditionComponent', () => {
  let component: DepartmentEditionComponent;
  let fixture: ComponentFixture<DepartmentEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DepartmentEditionComponent],
      // DepartmentEditionComponent extends EditingFormComponent, which injects HttpClient
      // (via DepartmentService -> GenericCollectionService) — provideHttpClientTesting()
      // intercepts any request instead of hitting the network or throwing a
      // NullInjectorError during `fixture.detectChanges()`.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DepartmentEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
