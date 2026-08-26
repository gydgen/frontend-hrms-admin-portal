import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LeaveType } from '../interfaces/leave-type';
import { LeaveTypeService } from '../services/leave-type.service';

export const leaveTypeResolver: ResolveFn<LeaveType | null> = (route) => {
  const service = inject(LeaveTypeService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
