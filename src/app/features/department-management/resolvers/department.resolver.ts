import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Department } from '../interfaces/department';
import { DepartmentService } from '../services/department.service';

export const departmentResolver: ResolveFn<Department | null> = (route) => {
  const service = inject(DepartmentService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
