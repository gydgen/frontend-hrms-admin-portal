import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { JobTitleEditionComponent } from './job-title-edition.component';

describe('JobTitleEditionComponent', () => {
  let component: JobTitleEditionComponent;
  let fixture: ComponentFixture<JobTitleEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobTitleEditionComponent],
      // JobTitleEditionComponent extends EditingFormComponent and also loads a department
      // list for the departmentId select — both go through HttpClient, so
      // provideHttpClientTesting() intercepts those requests instead of hitting the network.
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(JobTitleEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
