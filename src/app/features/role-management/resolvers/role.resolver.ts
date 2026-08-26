import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Role } from '../interfaces/role';
import { RoleService } from '../services/role.service';

export const roleResolver: ResolveFn<Role | null> = (route) => {
  const service = inject(RoleService);
  const id = route.paramMap.get('id');
  return id === 'add' ? of(null) : service.find(id!).pipe(catchError(() => of(null)));
};
