import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../../shared/models/api-response';
import { environment } from '../../../../environments/environment';
import { LeaveBalance } from '../interfaces/leave-balance';

/**
 * Doesn't extend GenericCollectionService — `GET /leave-balances` isn't paginated (it
 * returns a flat `{ leaveBalances: [...] }` for one employee/year, lazily upserting a row
 * per active leave type) and there's no `GET /leave-balances/:id`, no create, no delete —
 * only list-by-employee-and-year and `PATCH :id` to adjust `allocatedDays`.
 */
@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  private readonly http = inject(HttpClient);

  list(employeeId: string, year: number): Observable<LeaveBalance[]> {
    const params = new HttpParams().set('employeeId', employeeId).set('year', year);
    return this.http
      .get<ApiResponse<{ leaveBalances: LeaveBalance[] }>>(`${environment.apiUrl}/leave-balances`, { params })
      .pipe(map((res) => res.data.leaveBalances));
  }

  adjust(id: string, allocatedDays: number): Observable<LeaveBalance> {
    return this.http
      .patch<ApiResponse<LeaveBalance>>(`${environment.apiUrl}/leave-balances/${id}`, { allocatedDays })
      .pipe(map((res) => res.data));
  }
}
