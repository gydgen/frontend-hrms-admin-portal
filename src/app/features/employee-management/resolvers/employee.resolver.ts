import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Employee } from '../interfaces/employee';
import { EmployeeService } from '../services/employee.service';

export const employeeResolver: ResolveFn<Employee | null> = (route) => {
  const service = inject(EmployeeService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
