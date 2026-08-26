import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { JobTitle } from '../interfaces/job-title';
import { JobTitleService } from '../services/job-title.service';

export const jobTitleResolver: ResolveFn<JobTitle | null> = (route) => {
  const service = inject(JobTitleService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
