import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { LeaveBalance } from '../interfaces/leave-balance';
import { LeaveBalanceService } from '../services/leave-balance.service';

/**
 * There's no `GET /leave-balances/:id` — the only list endpoint is
 * `GET /leave-balances?employeeId=&year=`. The list screen passes both as query params
 * when navigating to a balance's adjust screen (see leave-balance-list.component.ts's
 * `adjustQueryParams()`), and this resolver re-fetches that same list to find the one
 * matching `:id` — one extra request, but avoids inventing an endpoint that doesn't exist.
 */
export const leaveBalanceResolver: ResolveFn<LeaveBalance | null> = (route) => {
  const service = inject(LeaveBalanceService);
  const id = route.paramMap.get('id');
  const employeeId = route.queryParamMap.get('employeeId');
  const year = Number(route.queryParamMap.get('year'));

  if (!id || !employeeId || !year) return of(null);

  return service.list(employeeId, year).pipe(
    map((balances) => balances.find((balance) => balance.id === id) ?? null),
    catchError(() => of(null)),
  );
};
