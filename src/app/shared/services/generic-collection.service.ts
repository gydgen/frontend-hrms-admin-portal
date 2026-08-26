import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { PaginatedData } from '../models/paginated-data';
import { environment } from '../../../environments/environment';

/** Parameters accepted by `paginate()`/`list()`. `filters` are sent as extra query params (e.g. `departmentId`). */
export interface ListParams {
  page?: number;
  perPage?: number;
  search?: string;
  filters?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * Every `GET /{path}?page=&limit=&search=` list endpoint in backend-hrms wraps its array
 * under a resource-specific key (e.g. `departments`, `jobTitles`, `users`) alongside
 * `total`/`page`/`limit`/`pages` — see e.g. department.service.ts's `listDepartments`.
 */
interface ListEnvelope {
  total: number;
  page: number;
  limit: number;
  pages: number;
  [key: string]: unknown;
}

/**
 * Abstract base service providing standard CRUD and pagination operations for a REST
 * collection, matching backend-hrms's actual contract:
 *
 * - `GET  /{path}?page=&limit=&search=` → `{ data: { [listKey]: T[], total, page, limit, pages } }`
 * - `GET  /{path}/:id`                  → `{ data: T }`
 * - `POST /{path}`                      → `{ data: T }` (create)
 * - `PATCH /{path}/:id`                 → `{ data: T }` (update — not PUT)
 * - `DELETE /{path}/:id}`               → `{ data: null }`
 *
 * @template T
 */
export abstract class GenericCollectionService<T extends { id?: string }> {
  protected http: HttpClient = inject(HttpClient);

  /** The URL path segment used in all HTTP requests for this resource, e.g. 'departments'. */
  protected abstract path: string;

  /** The key the array is nested under in a list response, e.g. 'departments', 'jobTitles'. */
  protected abstract listKey: string;

  /** Fetches (almost) everything unpaginated — for dropdowns, selects, small reference lists. */
  list(params: ListParams = {}): Observable<T[]> {
    return this.paginate({ perPage: 1000, page: 1, ...params }).pipe(map((result) => result.data ?? []));
  }

  /** The real, server-paginated, searchable list call used by `PaginatedTableComponent`. */
  paginate(params: ListParams = {}): Observable<PaginatedData<T>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;

    let httpParams = new HttpParams().set('page', page).set('limit', perPage);
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    for (const [key, value] of Object.entries(params.filters ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<ApiResponse<ListEnvelope>>(`${environment.apiUrl}/${this.path}`, { params: httpParams }).pipe(
      map((res) => {
        const envelope = res.data;
        const data = (envelope[this.listKey] as T[] | undefined) ?? [];
        return {
          data,
          currentPage: envelope.page,
          lastPage: envelope.pages,
          total: envelope.total,
          perPage: envelope.limit,
        };
      }),
      // Deliberate design choice: a failed search/list degrades to an empty page instead of
      // propagating, so list pages never "crash" visibly on a bad filter. Use `http` directly
      // for a screen that must surface the raw error instead.
      catchError((err) => {
        console.error(`[GenericCollectionService] paginate failed for "${this.path}"`, err);
        return of<PaginatedData<T>>({ data: [], currentPage: 1, lastPage: 0, total: 0, perPage });
      }),
    );
  }

  find(id: string): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${environment.apiUrl}/${this.path}/${id}`)
      .pipe(map((res) => res.data));
  }

  /** POST if new (no id), PATCH if existing — matches backend-hrms's create/update verbs. */
  updateOrCreate(value: Partial<T>): Observable<T> {
    const { id, ...data } = value as { id?: string } & Record<string, unknown>;
    return id
      ? this.http
          .patch<ApiResponse<T>>(`${environment.apiUrl}/${this.path}/${id}`, data)
          .pipe(map((res) => res.data))
      : this.http.post<ApiResponse<T>>(`${environment.apiUrl}/${this.path}`, data).pipe(map((res) => res.data));
  }

  delete(id: string): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${environment.apiUrl}/${this.path}/${id}`)
      .pipe(map(() => undefined));
  }

  /** The standard way async-uniqueness validators check the backend (see core/validators). */
  exists(search: string): Observable<boolean> {
    return this.list({ search, perPage: 1 }).pipe(map((results) => results.length > 0));
  }
}
